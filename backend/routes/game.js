const express = require('express');
const {client} = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/combat', async (req, res) => {
  try {
    const { characterId, monsterId, action, monsterHp } = req.body;
    const userId = req.user.id;
    
    const charResult = await client.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const character = charResult.rows[0];
    
    const monsterResult = await client.query(
      'SELECT * FROM monsters WHERE id = $1',
      [monsterId]
    );
    
    if (monsterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Monster not found' });
    }
    
    const monster = monsterResult.rows[0];
    const currentMonsterHp = monsterHp !== undefined ? monsterHp : monster.hp;
    
    let combatResult = {
      characterDamage: 0,
      monsterDamage: 0,
      characterHp: character.hp,
      monsterHp: currentMonsterHp,
      victory: false,
      defeat: false,
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
      
      combatResult.monsterHp = Math.max(0, currentMonsterHp - combatResult.monsterDamage);
      combatResult.characterHp = Math.max(0, character.hp - combatResult.characterDamage);
      
      if (combatResult.monsterHp <= 0) {
        combatResult.victory = true;
        combatResult.experienceGained = monster.experience_reward;
        combatResult.goldGained = monster.gold_reward;
        
        const newExperience = character.experience + combatResult.experienceGained;
        const newGold = character.gold + combatResult.goldGained;
        let newLevel = character.level;
        let newMaxHp = character.max_hp;
        
        if (newExperience >= character.level * 100) {
          newLevel = character.level + 1;
          newMaxHp = character.max_hp + 10;
          combatResult.levelUp = true;
        }
        
        await client.query(
          `UPDATE characters 
           SET hp = $1, experience = $2, gold = $3, level = $4, max_hp = $5 
           WHERE id = $6`,
          [combatResult.characterHp, newExperience, newGold, newLevel, newMaxHp, characterId]
        );
        
        await client.query(
          `INSERT INTO combat_logs 
           (character_id, monster_id, damage_dealt, damage_received, outcome, experience_gained, gold_gained) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [characterId, monsterId, combatResult.monsterDamage, combatResult.characterDamage, 
           'victory', combatResult.experienceGained, combatResult.goldGained]
        );
      } else if (combatResult.characterHp <= 0) {
        combatResult.defeat = true;
        await client.query(
          'UPDATE characters SET hp = 0 WHERE id = $1',
          [characterId]
        );
        
        await client.query(
          `INSERT INTO combat_logs 
           (character_id, monster_id, damage_dealt, damage_received, outcome, experience_gained, gold_gained) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [characterId, monsterId, combatResult.monsterDamage, combatResult.characterDamage, 
           'defeat', 0, 0]
        );
      } else {
        await client.query(
          'UPDATE characters SET hp = $1 WHERE id = $2',
          [combatResult.characterHp, characterId]
        );
      }
    } else if (action === 'flee') {
      combatResult.fled = true;
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
    
    const charResult = await client.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const itemResult = await client.query(
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
      
      await client.query(
        `UPDATE characters SET ${updateQuery} WHERE id = $${values.length}`,
        values
      );
      
      if (item.quantity > 1) {
        await client.query(
          'UPDATE inventory SET quantity = quantity - 1 WHERE id = $1',
          [inventoryId]
        );
      } else {
        await client.query(
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
    
    const charResult = await client.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const existingItem = await client.query(
      'SELECT id, quantity FROM inventory WHERE character_id = $1 AND item_id = $2',
      [characterId, itemId]
    );
    
    if (existingItem.rows.length > 0) {
      await client.query(
        'UPDATE inventory SET quantity = quantity + $1 WHERE id = $2',
        [quantity, existingItem.rows[0].id]
      );
    } else {
      await client.query(
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

router.post('/special-ability', async (req, res) => {
  try {
    const { characterId, abilityType, targetId } = req.body;
    const userId = req.user.id;
    
    const charResult = await client.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (charResult.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const character = charResult.rows[0];
    let result = { success: false, message: '', updates: {} };
    
    switch (character.class) {
      case 'warrior':
        if (abilityType === 'rage' && character.mp >= 20) {
          result = {
            success: true,
            message: 'Warrior enters a rage! Attack doubled for next 3 turns!',
            updates: { mp: character.mp - 20 },
            effect: 'rage',
            duration: 3
          };
        } else if (abilityType === 'charge' && character.mp >= 15) {
          result = {
            success: true,
            message: 'Warrior charges forward dealing massive damage!',
            updates: { mp: character.mp - 15 },
            effect: 'charge',
            damage: character.strength * 2
          };
        }
        break;
        
      case 'mage':
        if (abilityType === 'fireball' && character.mp >= 25) {
          result = {
            success: true,
            message: 'Mage casts Fireball dealing magical damage!',
            updates: { mp: character.mp - 25 },
            effect: 'fireball',
            damage: character.magic * 2
          };
        } else if (abilityType === 'heal' && character.mp >= 20) {
          const healAmount = Math.min(character.magic * 3, character.max_hp - character.hp);
          result = {
            success: true,
            message: `Mage casts Heal restoring ${healAmount} HP!`,
            updates: { 
              mp: character.mp - 20,
              hp: character.hp + healAmount
            },
            effect: 'heal',
            healAmount
          };
        }
        break;
        
      case 'rogue':
        if (abilityType === 'backstab' && character.mp >= 15) {
          result = {
            success: true,
            message: 'Rogue performs a critical backstab!',
            updates: { mp: character.mp - 15 },
            effect: 'backstab',
            damage: character.agility * 2,
            critical: true
          };
        } else if (abilityType === 'stealth' && character.mp >= 10) {
          result = {
            success: true,
            message: 'Rogue becomes invisible! Next attack will be a critical hit!',
            updates: { mp: character.mp - 10 },
            effect: 'stealth',
            duration: 2
          };
        }
        break;
        
      case 'cleric':
        if (abilityType === 'divine_light' && character.mp >= 30) {
          const healAmount = Math.min(character.magic * 4, character.max_hp - character.hp);
          result = {
            success: true,
            message: `Cleric channels Divine Light restoring ${healAmount} HP and cleansing all debuffs!`,
            updates: { 
              mp: character.mp - 30,
              hp: character.hp + healAmount
            },
            effect: 'divine_light',
            healAmount
          };
        } else if (abilityType === 'smite' && character.mp >= 20) {
          result = {
            success: true,
            message: 'Cleric calls down divine punishment!',
            updates: { mp: character.mp - 20 },
            effect: 'smite',
            damage: (character.magic + character.strength) * 1.5
          };
        }
        break;
        
      default:
        result = { success: false, message: 'Unknown class' };
    }
    
    if (result.success && result.updates) {
      const updateFields = Object.keys(result.updates)
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');
      
      const values = Object.values(result.updates);
      values.push(characterId);
      
      await client.query(
        `UPDATE characters SET ${updateFields} WHERE id = $${values.length}`,
        values
      );
    }
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;