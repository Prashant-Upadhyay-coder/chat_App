const pool = require('../models/db');

let onlineUsers = {};

function initSocket(io) {
  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (!userId) return;

    if (!onlineUsers[userId]) onlineUsers[userId] = [];
    onlineUsers[userId].push(socket.id);

    // Send or Reply to message
 socket.on('private_message', async ({ to, content, replyToId }) => {
  if (!to || !content) return;
  try {
    const insertResult = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, reply_to)
       VALUES ($1,$2,$3,$4)
       RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content, created_at AS "createdAt", seen, reply_to AS "replyTo"`,
      [userId, to, content, replyToId || null]
    );

    let saved = insertResult.rows[0];

    // fetch reply preview if it exists
    if (saved.replyTo) {
      const replyPreview = await pool.query(
        `SELECT rm.id, rm.content AS "replyContent", u.username AS "replySenderName"
         FROM messages rm
         JOIN users u ON rm.sender_id = u.id
         WHERE rm.id = $1`,
        [saved.replyTo]
      );

      if (replyPreview.rows.length) {
        saved.replyTo = {
          id: replyPreview.rows[0].id,
          content: replyPreview.rows[0].replyContent,
          senderName: replyPreview.rows[0].replySenderName,
        };
      } else {
        saved.replyTo = null;
      }
    } else {
      saved.replyTo = null;
    }

    // Emit to both sender & receiver
    [saved.receiverId, saved.senderId].forEach((uid) => {
      if (onlineUsers[uid])
        onlineUsers[uid].forEach((sid) => io.to(sid).emit('private_message', saved));
    });
  } catch (err) {
    console.error(err);
    socket.emit('error_message', { error: 'Could not save message' });
  }
});


    // Edit message
    socket.on('edit_message', async ({ messageId, content }) => {
      try {
        const result = await pool.query(
          `UPDATE messages 
           SET content=$1 
           WHERE id=$2 AND sender_id=$3 
           RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content`,
          [content, messageId, userId]
        );
        if (!result.rowCount) return;
        const updated = result.rows[0];

        [updated.receiverId, updated.senderId].forEach((uid) => {
          if (onlineUsers[uid])
            onlineUsers[uid].forEach((sid) => io.to(sid).emit('message_edited', updated));
        });
      } catch (err) {
        console.error(err);
      }
    });

    // Delete message (soft delete)
    socket.on('delete_message', async ({ messageId }) => {
      try {
        const result = await pool.query(
          `UPDATE messages 
           SET content='This message was deleted', deleted=true
           WHERE id=$1 AND sender_id=$2
           RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content`,
          [messageId, userId]
        );
        if (!result.rowCount) return;
        const deleted = result.rows[0];

        [deleted.receiverId, deleted.senderId].forEach((uid) => {
          if (onlineUsers[uid])
            onlineUsers[uid].forEach((sid) => io.to(sid).emit('message_deleted', deleted));
        });
      } catch (err) {
        console.error(err);
      }
    });

    // Mark message as seen
    socket.on('message_seen', async ({ messageId, to }) => {
      try {
        await pool.query(`UPDATE messages SET seen = true WHERE id = $1 AND receiver_id = $2`, [
          messageId,
          userId,
        ]);
        if (onlineUsers[to])
          onlineUsers[to].forEach((sid) => io.to(sid).emit('message_seen', { messageId }));
      } catch (err) {
        console.error(err);
      }
    });
// React to message
socket.on('react_message', async ({ messageId, reactionType }) => {
  try {
    const existing = await pool.query(
      `SELECT * FROM message_reactions WHERE message_id=$1 AND user_id=$2 AND reaction_type=$3`,
      [messageId, userId, reactionType]
    );

    let action = 'added';
    if (existing.rows.length) {
      await pool.query(`DELETE FROM message_reactions WHERE id=$1`, [existing.rows[0].id]);
      action = 'removed';
    } else {
      await pool.query(
        `INSERT INTO message_reactions (message_id, user_id, reaction_type) VALUES ($1,$2,$3)`,
        [messageId, userId, reactionType]
      );
    }

    // Fetch sender & receiver IDs
    const msg = await pool.query(
      `SELECT sender_id AS "senderId", receiver_id AS "receiverId" FROM messages WHERE id=$1`,
      [messageId]
    );

    if (!msg.rows.length) return;
    const { senderId, receiverId } = msg.rows[0];

    const reactionData = { messageId, userId, reactionType, action };

    [senderId, receiverId].forEach((uid) => {
      if (onlineUsers[uid])
        onlineUsers[uid].forEach((sid) => io.to(sid).emit('message_reaction', reactionData));
    });
  } catch (err) {
    console.error(err);
  }
});

    // Disconnect cleanup
    socket.on('disconnect', () => {
      onlineUsers[userId] = (onlineUsers[userId] || []).filter((s) => s !== socket.id);
      if (!onlineUsers[userId]?.length) delete onlineUsers[userId];
    });

  });
}

module.exports = initSocket;
