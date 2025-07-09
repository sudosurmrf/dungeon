const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

function generateDungeonMap(width, height, floor) {
  const map = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', x, y });
      } else if (Math.random() < 0.1) {
        row.push({ type: 'wall', x, y });
      } else if (Math.random() < 0.05 && floor > 1) {
        row.push({ type: 'stairs_up', x, y });
      } else if (Math.random() < 0.05) {
        row.push({ type: 'stairs_down', x, y });
      } else if (Math.random() < 0.03) {
        row.push({ type: 'chest', x, y, looted: false });
      } else if (Math.random() < 0.08) {
        row.push({ type: 'monster', x, y, monsterId: Math.floor(Math.random() * 3) + 1 });
      } else {
        row.push({ type: 'floor', x, y });
      }
    }
    map.push(row);
  }
  
  map[5][5] = { type: 'floor', x: 5, y: 5 };
  
  return map;
}

router.get('/floor/:floor', async (req, res) => {
  try {
    const { floor } = req.params;
    
    const result = await db.query(
      'SELECT * FROM dungeons WHERE floor_number = $1',
      [floor]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Floor not found' });
    }
    
    const dungeon = result.rows[0];
    const map = generateDungeonMap(dungeon.width, dungeon.height, parseInt(floor));
    
    res.json({
      ...dungeon,
      map
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/progress/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user.id;
    
    const charResult = await db.query(
      'SELECT current_floor FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const result = await db.query(
      `SELECT dp.*, d.floor_number, d.width, d.height 
       FROM dungeon_progress dp 
       JOIN dungeons d ON dp.dungeon_id = d.id 
       WHERE dp.character_id = $1 
       ORDER BY d.floor_number`,
      [characterId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/explore', async (req, res) => {
  try {
    const { characterId, dungeonId, x, y } = req.body;
    const userId = req.user.id;
    
    const charResult = await db.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const progressResult = await db.query(
      'SELECT * FROM dungeon_progress WHERE character_id = $1 AND dungeon_id = $2',
      [characterId, dungeonId]
    );
    
    let exploredTiles = [];
    if (progressResult.rows.length > 0) {
      exploredTiles = JSON.parse(progressResult.rows[0].explored_tiles || '[]');
    }
    
    const tileKey = `${x},${y}`;
    if (!exploredTiles.includes(tileKey)) {
      exploredTiles.push(tileKey);
    }
    
    if (progressResult.rows.length > 0) {
      await db.query(
        'UPDATE dungeon_progress SET explored_tiles = $1, updated_at = CURRENT_TIMESTAMP WHERE character_id = $2 AND dungeon_id = $3',
        [JSON.stringify(exploredTiles), characterId, dungeonId]
      );
    } else {
      await db.query(
        'INSERT INTO dungeon_progress (character_id, dungeon_id, explored_tiles) VALUES ($1, $2, $3)',
        [characterId, dungeonId, JSON.stringify(exploredTiles)]
      );
    }
    
    res.json({ exploredTiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/monsters', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM monsters ORDER BY level');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/items', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM items ORDER BY type, rarity');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;