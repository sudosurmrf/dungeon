const Inventory = ({ items, onUseItem }) => {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#888';
      case 'uncommon': return '#4a90e2';
      case 'rare': return '#9b59b6';
      case 'epic': return '#e74c3c';
      case 'legendary': return '#f39c12';
      default: return '#888';
    }
  };

  return (
    <div className="inventory">
      <h3>Inventory</h3>
      {items.length === 0 ? (
        <p>No items</p>
      ) : (
        items.map((item) => (
          <div
            key={item.inventory_id}
            className={`inventory-item ${item.equipped ? 'item-equipped' : ''}`}
            onClick={() => item.type === 'consumable' && onUseItem(item.inventory_id)}
            style={{ cursor: item.type === 'consumable' ? 'pointer' : 'default' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: getRarityColor(item.rarity) }}>
                {item.name}
              </span>
              {item.quantity > 1 && <span>x{item.quantity}</span>}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
              {item.type} - {item.rarity}
            </div>
            {item.attack_bonus > 0 && (
              <div style={{ fontSize: '12px', color: '#4a90e2' }}>
                +{item.attack_bonus} Attack
              </div>
            )}
            {item.defense_bonus > 0 && (
              <div style={{ fontSize: '12px', color: '#4a90e2' }}>
                +{item.defense_bonus} Defense
              </div>
            )}
            {item.hp_restore > 0 && (
              <div style={{ fontSize: '12px', color: '#4a90e2' }}>
                Restores {item.hp_restore} HP
              </div>
            )}
            {item.mp_restore > 0 && (
              <div style={{ fontSize: '12px', color: '#4a90e2' }}>
                Restores {item.mp_restore} MP
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Inventory;