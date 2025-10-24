const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../models/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const SALT_ROUNDS = 10;

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING id, username, email`,
      [username, email || null, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'username or email exists' });
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const result = await pool.query(`SELECT id, username, email, password_hash FROM users WHERE username = $1`, [username]);
    
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
  

    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
