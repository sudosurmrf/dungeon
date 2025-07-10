const DungeonMap = ({ dungeon, character, exploredTiles }) => {
  const getTileContent = (tile) => {
    if (tile.x === character.position_x && tile.y === character.position_y) {
      return '🧙';
    }
    
    switch (tile.type) {
      case 'wall': return '⬛';
      case 'floor': return '';
      case 'stairs_up': return '⬆️';
      case 'stairs_down': return '⬇️';
      case 'chest': return tile.looted ? '' : '📦';
      case 'monster': return tile.defeated ? '' : '👹';
      default: return '';
    }
  };

  const getTileClass = (tile) => {
    const classes = ['map-tile'];
    classes.push(`tile-${tile.type}`);
    
    const tileKey = `${tile.x},${tile.y}`;
    if (exploredTiles.includes(tileKey)) {
      classes.push('tile-explored');
    } else {
      classes.push('tile-unexplored');
    }
    
    if (tile.x === character.position_x && tile.y === character.position_y) {
      classes.push('tile-current');
    }
    
    return classes.join(' ');
  };

  const visibleRange = 7;
  const startX = Math.max(0, character.position_x - visibleRange);
  const endX = Math.min(dungeon.width - 1, character.position_x + visibleRange);
  const startY = Math.max(0, character.position_y - visibleRange);
  const endY = Math.min(dungeon.height - 1, character.position_y + visibleRange);

  const visibleMap = [];
  for (let y = startY; y <= endY; y++) {
    const row = [];
    for (let x = startX; x <= endX; x++) {
      row.push(dungeon.map[y][x]);
    }
    visibleMap.push(row);
  }

  return (
    <div className="dungeon-map">
      <h2>Floor {dungeon.floor_number}</h2>
      <div 
        className="map-grid"
        style={{
          gridTemplateColumns: `repeat(${endX - startX + 1}, 30px)`,
          gridTemplateRows: `repeat(${endY - startY + 1}, 30px)`
        }}
      >
        {visibleMap.map((row, y) => 
          row.map((tile, x) => (
            <div
              key={`${tile.x}-${tile.y}`}
              className={getTileClass(tile)}
            >
              {getTileContent(tile)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DungeonMap;