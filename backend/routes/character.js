const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/create', async (req, res) => {
  try {
    const { name, characterClass } = req.body;
    const userId = req.user.id;
    
    const result = await db.query(
      `INSERT INTO characters (user_id, name, class) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userId, name, characterClass]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-characters', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/position', async (req, res) => {
  try {
    const { id } = req.params;
    const { x, y } = req.body;
    const userId = req.user.id;
    
    const result = await db.query(
      `UPDATE characters 
       SET position_x = $1, position_y = $2 
       WHERE id = $3 AND user_id = $4 
       RETURNING position_x, position_y`,
      [x, y, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { hp, mp, experience, level, gold } = req.body;
    const userId = req.user.id;
    
    const result = await db.query(
      `UPDATE characters 
       SET hp = COALESCE($1, hp), 
           mp = COALESCE($2, mp), 
           experience = COALESCE($3, experience), 
           level = COALESCE($4, level),
           gold = COALESCE($5, gold)
       WHERE id = $6 AND user_id = $7 
       RETURNING *`,
      [hp, mp, experience, level, gold, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const charCheck = await db.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (charCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const result = await db.query(
      `SELECT i.*, it.* 
       FROM inventory i 
       JOIN items it ON i.item_id = it.id 
       WHERE i.character_id = $1`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;