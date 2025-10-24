const pool = require('../models/db');

// Get messages (with reply preview)
exports.getMessages = async (req, res) => {
  const otherId = req.params.otherUserId;
  try {
   const result = await pool.query(
  `SELECT 
      m.id, m.sender_id AS "senderId", m.receiver_id AS "receiverId",
      m.content, m.reply_to AS "replyTo", m.created_at AS "createdAt", 
      m.seen, m.deleted,
      s.username AS "senderName", r.username AS "receiverName",
      rm.content AS "replyContent", rs.username AS "replySenderName",
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object('userId', mr.user_id, 'reaction', mr.reaction_type)
        ) FILTER (WHERE mr.id IS NOT NULL),
        '[]'
      ) AS reactions
  FROM messages m
  JOIN users s ON m.sender_id = s.id
  JOIN users r ON m.receiver_id = r.id
  LEFT JOIN messages rm ON m.reply_to = rm.id
  LEFT JOIN users rs ON rm.sender_id = rs.id
  LEFT JOIN message_reactions mr ON mr.message_id = m.id
  WHERE (m.sender_id=$1 AND m.receiver_id=$2) OR (m.sender_id=$2 AND m.receiver_id=$1)
  GROUP BY m.id, s.username, r.username, rm.content, rs.username
  ORDER BY m.created_at ASC`,
  [req.user.id, otherId]
);



  const messages = result.rows.map((m) => ({
  ...m,
  replyTo: m.replyTo
    ? { id: m.replyTo, content: m.replyContent, senderName: m.replySenderName }
    : null,
  reactions: m.reactions
}));

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  const { receiverId, content, replyTo, replyToId } = req.body;
  if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content required' });

  const replyRef = replyTo || replyToId || null;

  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, reply_to)
       VALUES ($1,$2,$3,$4)
       RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content, reply_to AS "replyTo", created_at AS "createdAt", seen`,
      [req.user.id, receiverId, content, replyRef]
    );

    res.json({ message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

// Edit message
exports.editMessage = async (req, res) => {
  const { messageId, content } = req.body;
  try {
    const result = await pool.query(
      `UPDATE messages SET content=$1 WHERE id=$2 AND sender_id=$3
       RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content, reply_to AS "replyTo", created_at AS "createdAt", seen`,
      [content, messageId, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Message not found' });

    res.json({ message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  const messageId = req.params.id;
  try {
    const result = await pool.query(
      `UPDATE messages SET content='This message was deleted', deleted=true
       WHERE id=$1 AND sender_id=$2
       RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content`,
      [messageId, req.user.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Message not found' });

    res.json({ message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

// Mark as seen
exports.markSeen = async (req, res) => {
  const otherUserId = req.body.otherUserId;
  if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' });

  try {
    await pool.query(
      `UPDATE messages SET seen = true WHERE sender_id=$1 AND receiver_id=$2 AND seen=false`,
      [otherUserId, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
// Add or remove reaction
exports.reactToMessage = async (req, res) => {
  const { messageId, reactionType } = req.body;
  const userId = req.user.id;

  if (!messageId || !reactionType)
    return res.status(400).json({ error: 'messageId and reactionType required' });

  try {
    const existing = await pool.query(
      `SELECT * FROM message_reactions WHERE message_id=$1 AND user_id=$2 AND reaction_type=$3`,
      [messageId, userId, reactionType]
    );

    if (existing.rows.length) {
      // Remove reaction
      await pool.query(`DELETE FROM message_reactions WHERE id=$1`, [existing.rows[0].id]);
      return res.json({ messageId, reactionType, removed: true });
    } else {
      // Add reaction
      await pool.query(
        `INSERT INTO message_reactions (message_id, user_id, reaction_type) VALUES ($1,$2,$3)`,
        [messageId, userId, reactionType]
      );
      return res.json({ messageId, reactionType, removed: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
