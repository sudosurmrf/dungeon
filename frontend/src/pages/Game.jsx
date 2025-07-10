import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { characterAPI, dungeonAPI, gameAPI } from '../services/api';
import { useGame } from '../context/GameContext';
import DungeonMap from '../components/DungeonMap';
import CharacterStats from '../components/CharacterStats';
import Inventory from '../components/Inventory';
import CombatLog from '../components/CombatLog';
import Controls from '../components/Controls';
import SpecialAbilities from '../components/SpecialAbilities';
import '../styles/Game.css';

const Game = () => {
  const { characterId } = useParams();
  const { 
    currentCharacter, 
    setCurrentCharacter,
    dungeon,
    setDungeon,
    inventory,
    setInventory,
    combatLog,
    setCombatLog,
    exploredTiles,
    setExploredTiles
  } = useGame();
  
  const [loading, setLoading] = useState(true);
  const [inCombat, setInCombat] = useState(false);
  const [currentMonster, setCurrentMonster] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    loadGameData();
  }, [characterId]);

  const loadGameData = async () => {
    try {
      const charResponse = await characterAPI.getCharacter(characterId);
      setCurrentCharacter(charResponse.data);
      
      const dungeonResponse = await dungeonAPI.getFloor(charResponse.data.current_floor);
      setDungeon(dungeonResponse.data);
      
      const inventoryResponse = await characterAPI.getInventory(characterId);
      setInventory(inventoryResponse.data);
      
      const progressResponse = await dungeonAPI.getProgress(characterId);
      if (progressResponse.data.length > 0) {
        const currentFloorProgress = progressResponse.data.find(
          p => p.floor_number === charResponse.data.current_floor
        );
        if (currentFloorProgress && currentFloorProgress.explored_tiles) {
          setExploredTiles(JSON.parse(currentFloorProgress.explored_tiles));
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load game data:', error);
      setLoading(false);
    }
  };

  const loadMonsterData = async (monsterId) => {
    try {
      const response = await dungeonAPI.getMonsters();
      return response.data.find(m => m.id === monsterId);
    } catch (error) {
      console.error('Failed to load monster data:', error);
      return null;
    }
  };

  const moveCharacter = async (dx, dy) => {
    if (!currentCharacter || !dungeon || inCombat) return;
    
    const newX = currentCharacter.position_x + dx;
    const newY = currentCharacter.position_y + dy;
    
    if (newX < 0 || newX >= dungeon.width || newY < 0 || newY >= dungeon.height) {
      return;
    }
    
    const tile = dungeon.map[newY][newX];
    if (tile.type === 'wall') {
      return;
    }
    
    try {
      await characterAPI.updatePosition(characterId, { x: newX, y: newY });
      setCurrentCharacter({ ...currentCharacter, position_x: newX, position_y: newY });
      
      await dungeonAPI.explore({
        characterId,
        dungeonId: dungeon.id,
        x: newX,
        y: newY
      });
      
      const tileKey = `${newX},${newY}`;
      if (!exploredTiles.includes(tileKey)) {
        setExploredTiles([...exploredTiles, tileKey]);
      }
      
      if (tile.type === 'monster' && !tile.defeated) {
        const monsterData = await loadMonsterData(tile.monsterId);
        setCurrentMonster({...monsterData, currentHp: monsterData.hp});
        setInCombat(true);
        addCombatLog(`Encountered a ${monsterData.name}!`);
      } else if (tile.type === 'chest' && !tile.looted) {
        addCombatLog(`Found a chest! Press Enter to open.`);
      } else if (tile.type === 'stairs_down') {
        addCombatLog(`Found stairs going down. Press Enter to descend.`);
      } else if (tile.type === 'stairs_up') {
        addCombatLog(`Found stairs going up. Press Enter to ascend.`);
      }
    } catch (error) {
      console.error('Failed to move character:', error);
    }
  };

  const handleCombat = async (action) => {
    if (!inCombat || !currentMonster) return;
    
    const tile = dungeon.map[currentCharacter.position_y][currentCharacter.position_x];
    if (tile.type !== 'monster') return;
    
    try {
      const response = await gameAPI.combat({
        characterId,
        monsterId: tile.monsterId,
        action,
        monsterHp: currentMonster.currentHp
      });
      
      const result = response.data;
      
      if (action === 'attack') {
        addCombatLog(`You dealt ${result.monsterDamage} damage to ${currentMonster.name}!`);
        addCombatLog(`${currentMonster.name} dealt ${result.characterDamage} damage to you!`);
        
        setCurrentMonster({
          ...currentMonster,
          currentHp: result.monsterHp
        });
        
        if (result.victory) {
          addCombatLog(`Victory! ${currentMonster.name} defeated!`);
          addCombatLog(`Gained ${result.experienceGained} EXP and ${result.goldGained} gold!`);
          if (result.levelUp) {
            addCombatLog(`Level up! You are now level ${result.level || currentCharacter.level + 1}!`);
          }
          tile.defeated = true;
          setInCombat(false);
          setCurrentMonster(null);
        } else if (result.defeat) {
          addCombatLog(`You have been defeated by ${currentMonster.name}!`);
          setGameOver(true);
          setInCombat(false);
        }
        
        setCurrentCharacter({
          ...currentCharacter,
          hp: result.characterHp,
          experience: currentCharacter.experience + (result.experienceGained || 0),
          gold: currentCharacter.gold + (result.goldGained || 0),
          level: result.levelUp ? (result.level || currentCharacter.level + 1) : currentCharacter.level,
          max_hp: result.levelUp ? currentCharacter.max_hp + 10 : currentCharacter.max_hp
        });
      } else if (action === 'flee') {
        addCombatLog(`You fled from combat!`);
        setInCombat(false);
        setCurrentMonster(null);
        moveCharacter(0, 1);
      }
    } catch (error) {
      console.error('Combat error:', error);
    }
  };

  const useItem = async (inventoryId) => {
    try {
      const response = await gameAPI.useItem({
        characterId,
        inventoryId
      });
      
      if (response.data.success) {
        const updates = response.data.updates;
        setCurrentCharacter({
          ...currentCharacter,
          ...updates
        });
        
        if (updates.hp) addCombatLog(`Restored ${updates.hp - currentCharacter.hp} HP!`);
        if (updates.mp) addCombatLog(`Restored ${updates.mp - currentCharacter.mp} MP!`);
        
        const updatedInventory = await characterAPI.getInventory(characterId);
        setInventory(updatedInventory.data);
      }
    } catch (error) {
      console.error('Failed to use item:', error);
    }
  };

  const addCombatLog = (message) => {
    setCombatLog(prev => [...prev, { message, timestamp: Date.now() }]);
  };

  const handleInteraction = async () => {
    if (!currentCharacter || !dungeon || inCombat) return;
    
    const tile = dungeon.map[currentCharacter.position_y][currentCharacter.position_x];
    
    if (tile.type === 'chest' && !tile.looted) {
      addCombatLog('You opened the chest and found a health potion!');
      await gameAPI.loot({
        characterId,
        itemId: 6, // Health potion ID
        quantity: 1
      });
      const updatedInventory = await characterAPI.getInventory(characterId);
      setInventory(updatedInventory.data);
      tile.looted = true;
    } else if (tile.type === 'stairs_down') {
      const newFloor = currentCharacter.current_floor + 1;
      addCombatLog(`Descending to floor ${newFloor}...`);
      
      await characterAPI.updateStats(characterId, { current_floor: newFloor });
      setCurrentCharacter({
        ...currentCharacter,
        current_floor: newFloor,
        position_x: 5,
        position_y: 5
      });
      
      const dungeonResponse = await dungeonAPI.getFloor(newFloor);
      setDungeon(dungeonResponse.data);
      setExploredTiles([]);
      
    } else if (tile.type === 'stairs_up' && currentCharacter.current_floor > 1) {
      const newFloor = currentCharacter.current_floor - 1;
      addCombatLog(`Ascending to floor ${newFloor}...`);
      
      await characterAPI.updateStats(characterId, { current_floor: newFloor });
      setCurrentCharacter({
        ...currentCharacter,
        current_floor: newFloor,
        position_x: 5,
        position_y: 5
      });
      
      const dungeonResponse = await dungeonAPI.getFloor(newFloor);
      setDungeon(dungeonResponse.data);
      setExploredTiles([]);
    }
  };

  const useSpecialAbility = async (abilityType) => {
    try {
      const response = await gameAPI.specialAbility({
        characterId,
        abilityType
      });
      
      const result = response.data;
      
      if (result.success) {
        addCombatLog(result.message);
        
        setCurrentCharacter({
          ...currentCharacter,
          ...result.updates
        });
        
        if (result.effect === 'charge' || result.effect === 'fireball' || result.effect === 'backstab' || result.effect === 'smite') {
          if (inCombat && currentMonster) {
            const newMonsterHp = Math.max(0, currentMonster.currentHp - result.damage);
            setCurrentMonster({
              ...currentMonster,
              currentHp: newMonsterHp
            });
            
            addCombatLog(`${currentMonster.name} takes ${result.damage} damage!`);
            
            if (newMonsterHp <= 0) {
              addCombatLog(`${currentMonster.name} is defeated!`);
              const tile = dungeon.map[currentCharacter.position_y][currentCharacter.position_x];
              tile.defeated = true;
              setInCombat(false);
              setCurrentMonster(null);
            }
          }
        }
      } else {
        addCombatLog(result.message || 'Ability failed!');
      }
    } catch (error) {
      console.error('Special ability error:', error);
      addCombatLog('Failed to use special ability!');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!currentCharacter || !dungeon) {
    return <div className="container">Failed to load game data</div>;
  }

  if (gameOver) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h1>Game Over</h1>
          <p>Your character has been defeated!</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.href = '/characters'}
          >
            Return to Characters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-main">
        <DungeonMap 
          dungeon={dungeon}
          character={currentCharacter}
          exploredTiles={exploredTiles}
        />
        <Controls 
          onMove={moveCharacter}
          onCombat={handleCombat}
          onInteraction={handleInteraction}
          inCombat={inCombat}
          currentMonster={currentMonster}
        />
      </div>
      
      <div className="game-sidebar">
        <CharacterStats character={currentCharacter} />
        <SpecialAbilities 
          character={currentCharacter}
          onUseAbility={useSpecialAbility}
          inCombat={inCombat}
        />
        <Inventory 
          items={inventory}
          onUseItem={useItem}
        />
        <CombatLog logs={combatLog} />
      </div>
    </div>
  );
};

export default Game;