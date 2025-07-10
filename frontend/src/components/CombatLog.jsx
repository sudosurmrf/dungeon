import { useEffect, useRef } from 'react';

const CombatLog = ({ logs }) => {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogClass = (message) => {
    if (message.includes('damage')) return 'log-damage';
    if (message.includes('Restored')) return 'log-heal';
    if (message.includes('EXP') || message.includes('gold')) return 'log-exp';
    return '';
  };

  return (
    <div className="combat-log">
      <h3>Combat Log</h3>
      <div className="log-entries">
        {logs.length === 0 ? (
          <p>No combat logs yet</p>
        ) : (
          logs.map((log, index) => (
            <div 
              key={`${log.timestamp}-${index}`} 
              className={`log-entry ${getLogClass(log.message)}`}
            >
              {log.message}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default CombatLog;