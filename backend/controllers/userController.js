const pool = require('../models/db');

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, username, email FROM users WHERE id != $1 ORDER BY username ASC`, [req.user.id]);
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
