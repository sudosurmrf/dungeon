import { createContext, useContext, useState } from 'react';

const GameContext = createContext({});

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [dungeon, setDungeon] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [combatLog, setCombatLog] = useState([]);
  const [exploredTiles, setExploredTiles] = useState([]);

  const value = {
    currentCharacter,
    setCurrentCharacter,
    dungeon,
    setDungeon,
    inventory,
    setInventory,
    combatLog,
    setCombatLog,
    exploredTiles,
    setExploredTiles,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};