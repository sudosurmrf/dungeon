import { useEffect } from 'react';

const Controls = ({ onMove, onCombat, onInteraction, inCombat, currentMonster }) => {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (inCombat) {
        switch (e.key.toLowerCase()) {
          case 'a':
            onCombat('attack');
            break;
          case 'f':
            onCombat('flee');
            break;
        }
      } else {
        switch (e.key.toLowerCase()) {
          case 'w':
          case 'arrowup':
            onMove(0, -1);
            break;
          case 's':
          case 'arrowdown':
            onMove(0, 1);
            break;
          case 'a':
          case 'arrowleft':
            onMove(-1, 0);
            break;
          case 'd':
          case 'arrowright':
            onMove(1, 0);
            break;
          case 'enter':
            onInteraction();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onMove, onCombat, onInteraction, inCombat]);

  if (inCombat && currentMonster) {
    return (
      <div className="controls">
        <div>
          <h3>Combat!</h3>
          <div style={{ marginBottom: '15px' }}>
            <h4>{currentMonster.name}</h4>
            <div style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '4px', 
              padding: '5px',
              position: 'relative'
            }}>
              <div 
                style={{
                  width: `${(currentMonster.currentHp / currentMonster.hp) * 100}%`,
                  height: '20px',
                  backgroundColor: '#d73502',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }}
              />
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {currentMonster.currentHp}/{currentMonster.hp}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => onCombat('attack')}
            >
              Attack (A)
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => onCombat('flee')}
            >
              Flee (F)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="controls">
      <div className="direction-controls">
        <div></div>
        <button className="control-btn" onClick={() => onMove(0, -1)}>↑</button>
        <div></div>
        <button className="control-btn" onClick={() => onMove(-1, 0)}>←</button>
        <div></div>
        <button className="control-btn" onClick={() => onMove(1, 0)}>→</button>
        <div></div>
        <button className="control-btn" onClick={() => onMove(0, 1)}>↓</button>
        <div></div>
      </div>
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button 
          className="btn btn-primary"
          onClick={onInteraction}
        >
          Interact (Enter)
        </button>
      </div>
    </div>
  );
};

export default Controls;