const SpecialAbilities = ({ character, onUseAbility, inCombat }) => {
  const getAbilities = () => {
    switch (character.class) {
      case 'warrior':
        return [
          {
            name: 'Rage',
            type: 'rage',
            cost: 20,
            description: 'Double attack for 3 turns',
            icon: '🔥',
            cooldown: 0
          },
          {
            name: 'Charge',
            type: 'charge',
            cost: 15,
            description: 'Massive damage attack',
            icon: '⚡',
            cooldown: 0
          }
        ];
      case 'mage':
        return [
          {
            name: 'Fireball',
            type: 'fireball',
            cost: 25,
            description: 'Magical damage spell',
            icon: '🔥',
            cooldown: 0
          },
          {
            name: 'Heal',
            type: 'heal',
            cost: 20,
            description: 'Restore HP',
            icon: '💚',
            cooldown: 0
          }
        ];
      case 'rogue':
        return [
          {
            name: 'Backstab',
            type: 'backstab',
            cost: 15,
            description: 'Critical damage attack',
            icon: '🗡️',
            cooldown: 0
          },
          {
            name: 'Stealth',
            type: 'stealth',
            cost: 10,
            description: 'Next attack is critical',
            icon: '👤',
            cooldown: 0
          }
        ];
      case 'cleric':
        return [
          {
            name: 'Divine Light',
            type: 'divine_light',
            cost: 30,
            description: 'Powerful heal + cleanse',
            icon: '✨',
            cooldown: 0
          },
          {
            name: 'Smite',
            type: 'smite',
            cost: 20,
            description: 'Divine punishment',
            icon: '⚡',
            cooldown: 0
          }
        ];
      default:
        return [];
    }
  };

  const abilities = getAbilities();

  return (
    <div className="special-abilities">
      <h3>Special Abilities</h3>
      <div className="abilities-grid">
        {abilities.map((ability) => (
          <div
            key={ability.type}
            className={`ability-card ${character.mp < ability.cost ? 'disabled' : ''}`}
            onClick={() => character.mp >= ability.cost && onUseAbility(ability.type)}
            title={ability.description}
          >
            <div className="ability-icon">{ability.icon}</div>
            <div className="ability-name">{ability.name}</div>
            <div className="ability-cost">{ability.cost} MP</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialAbilities;