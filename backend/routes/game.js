const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/combat', async (req, res) => {
  try {
    const { characterId, monsterId, action } = req.body;
    const userId = req.user.id;
    
    const charResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const character = charResult.rows[0];
    
    const monsterResult = await db.query(
      'SELECT * FROM monsters WHERE id = $1',
      [monsterId]
    );
    
    if (monsterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Monster not found' });
    }
    
    const monster = monsterResult.rows[0];
    
    let combatResult = {
      characterDamage: 0,
      monsterDamage: 0,
      characterHp: character.hp,
      victory: false,
      experienceGained: 0,
      goldGained: 0,
      levelUp: false
    };
    
    if (action === 'attack') {
      const characterAttack = character.strength + Math.floor(Math.random() * 10);
      const monsterDefense = monster.defense;
      combatResult.monsterDamage = Math.max(1, characterAttack - monsterDefense);
      
      const monsterAttack = monster.attack + Math.floor(Math.random() * 5);
      const characterDefense = character.defense;
      combatResult.characterDamage = Math.max(1, monsterAttack - characterDefense);
      
      combatResult.characterHp = character.hp - combatResult.characterDamage;
      
      if (combatResult.monsterDamage >= monster.hp) {
        combatResult.victory = true;
        combatResult.experienceGained = monster.experience_reward;
        combatResult.goldGained = monster.gold_reward;
        
        const newExperience = character.experience + combatResult.experienceGained;
        const newGold = character.gold + combatResult.goldGained;
        let newLevel = character.level;
        
        if (newExperience >= character.level * 100) {
          newLevel = character.level + 1;
          combatResult.levelUp = true;
        }
        
        await db.query(
          `UPDATE characters 
           SET hp = $1, experience = $2, gold = $3, level = $4 
           WHERE id = $5`,
          [combatResult.characterHp, newExperience, newGold, newLevel, characterId]
        );
        
        await db.query(
          `INSERT INTO combat_logs 
           (character_id, monster_id, damage_dealt, damage_received, outcome, experience_gained, gold_gained) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [characterId, monsterId, combatResult.monsterDamage, combatResult.characterDamage, 
           'victory', combatResult.experienceGained, combatResult.goldGained]
        );
      } else {
        await db.query(
          'UPDATE characters SET hp = $1 WHERE id = $2',
          [Math.max(0, combatResult.characterHp), characterId]
        );
      }
    }
    
    res.json(combatResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/use-item', async (req, res) => {
  try {
    const { characterId, inventoryId } = req.body;
    const userId = req.user.id;
    
    const charResult = await db.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const itemResult = await db.query(
      `SELECT i.*, it.* 
       FROM inventory i 
       JOIN items it ON i.item_id = it.id 
       WHERE i.id = $1 AND i.character_id = $2`,
      [inventoryId, characterId]
    );
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }
    
    const item = itemResult.rows[0];
    const character = charResult.rows[0];
    
    let updates = {};
    
    if (item.hp_restore > 0) {
      updates.hp = Math.min(character.max_hp, character.hp + item.hp_restore);
    }
    
    if (item.mp_restore > 0) {
      updates.mp = Math.min(character.max_mp, character.mp + item.mp_restore);
    }
    
    if (Object.keys(updates).length > 0) {
      const updateQuery = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const values = Object.values(updates);
      values.push(characterId);
      
      await db.query(
        `UPDATE characters SET ${updateQuery} WHERE id = $${values.length}`,
        values
      );
      
      if (item.quantity > 1) {
        await db.query(
          'UPDATE inventory SET quantity = quantity - 1 WHERE id = $1',
          [inventoryId]
        );
      } else {
        await db.query(
          'DELETE FROM inventory WHERE id = $1',
          [inventoryId]
        );
      }
    }
    
    res.json({ success: true, updates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/loot', async (req, res) => {
  try {
    const { characterId, itemId, quantity = 1 } = req.body;
    const userId = req.user.id;
    
    const charResult = await db.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const existingItem = await db.query(
      'SELECT id, quantity FROM inventory WHERE character_id = $1 AND item_id = $2',
      [characterId, itemId]
    );
    
    if (existingItem.rows.length > 0) {
      await db.query(
        'UPDATE inventory SET quantity = quantity + $1 WHERE id = $2',
        [quantity, existingItem.rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO inventory (character_id, item_id, quantity) VALUES ($1, $2, $3)',
        [characterId, itemId, quantity]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;