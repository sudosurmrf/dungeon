import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { characterAPI } from '../services/api';

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    characterClass: 'warrior'
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const response = await characterAPI.getMyCharacters();
      setCharacters(response.data);
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await characterAPI.create(newCharacter);
      setShowCreate(false);
      setNewCharacter({ name: '', characterClass: 'warrior' });
      loadCharacters();
    } catch (error) {
      console.error('Failed to create character:', error);
    }
  };

  const selectCharacter = (characterId) => {
    navigate(`/game/${characterId}`);
  };

  return (
    <div className="container">
      <h1>My Characters</h1>
      
      <button 
        className="btn btn-primary" 
        onClick={() => setShowCreate(!showCreate)}
        style={{ marginBottom: '20px' }}
      >
        Create New Character
      </button>

      {showCreate && (
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Character Name"
                className="form-control"
                value={newCharacter.name}
                onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <select 
                className="form-control"
                value={newCharacter.characterClass}
                onChange={(e) => setNewCharacter({...newCharacter, characterClass: e.target.value})}
              >
                <option value="warrior">Warrior</option>
                <option value="mage">Mage</option>
                <option value="rogue">Rogue</option>
                <option value="cleric">Cleric</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary">Create</button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowCreate(false)}
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {characters.map(character => (
          <div 
            key={character.id}
            style={{
              backgroundColor: '#2a2a2a',
              padding: '20px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => selectCharacter(character.id)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
          >
            <h3>{character.name}</h3>
            <p>Class: {character.class}</p>
            <p>Level: {character.level}</p>
            <p>HP: {character.hp}/{character.max_hp}</p>
            <p>Floor: {character.current_floor}</p>
          </div>
        ))}
      </div>

      {characters.length === 0 && !showCreate && (
        <p style={{ textAlign: 'center', marginTop: '50px' }}>
          No characters yet. Create your first character to start playing!
        </p>
      )}
    </div>
  );
};

export default Characters;