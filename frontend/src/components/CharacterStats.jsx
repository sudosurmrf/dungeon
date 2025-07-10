const CharacterStats = ({ character }) => {
  const hpPercent = (character.hp / character.max_hp) * 100;
  const mpPercent = (character.mp / character.max_mp) * 100;
  const expPercent = (character.experience % 100) / 100 * 100;

  return (
    <div className="character-stats">
      <div className="stats-header">
        <h3>{character.name}</h3>
        <p>{character.class} - Level {character.level}</p>
      </div>
      
      <div className="stat-bars">
        <div className="stat-bar">
          <div 
            className="stat-bar-fill stat-bar-hp"
            style={{ width: `${hpPercent}%` }}
          />
          <span className="stat-bar-text">
            HP: {character.hp}/{character.max_hp}
          </span>
        </div>
        
        <div className="stat-bar">
          <div 
            className="stat-bar-fill stat-bar-mp"
            style={{ width: `${mpPercent}%` }}
          />
          <span className="stat-bar-text">
            MP: {character.mp}/{character.max_mp}
          </span>
        </div>
        
        <div className="stat-bar">
          <div 
            className="stat-bar-fill stat-bar-exp"
            style={{ width: `${expPercent}%` }}
          />
          <span className="stat-bar-text">
            EXP: {character.experience % 100}/100
          </span>
        </div>
      </div>
      
      <div className="stat-info">
        <div className="stat-item">
          <span>Strength</span>
          <span>{character.strength}</span>
        </div>
        <div className="stat-item">
          <span>Defense</span>
          <span>{character.defense}</span>
        </div>
        <div className="stat-item">
          <span>Magic</span>
          <span>{character.magic}</span>
        </div>
        <div className="stat-item">
          <span>Agility</span>
          <span>{character.agility}</span>
        </div>
        <div className="stat-item">
          <span>Gold</span>
          <span>{character.gold}</span>
        </div>
        <div className="stat-item">
          <span>Floor</span>
          <span>{character.current_floor}</span>
        </div>
      </div>
    </div>
  );
};

export default CharacterStats;