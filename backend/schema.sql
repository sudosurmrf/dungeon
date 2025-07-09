-- Drop existing tables if they exist
DROP TABLE IF EXISTS combat_logs CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS dungeon_progress CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS monsters CASCADE;
DROP TABLE IF EXISTS dungeons CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Characters table
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    class VARCHAR(20) NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    hp INTEGER DEFAULT 100,
    max_hp INTEGER DEFAULT 100,
    mp INTEGER DEFAULT 50,
    max_mp INTEGER DEFAULT 50,
    strength INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 10,
    magic INTEGER DEFAULT 10,
    agility INTEGER DEFAULT 10,
    gold INTEGER DEFAULT 0,
    current_floor INTEGER DEFAULT 1,
    position_x INTEGER DEFAULT 5,
    position_y INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Items table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- weapon, armor, potion, etc.
    rarity VARCHAR(20) DEFAULT 'common',
    attack_bonus INTEGER DEFAULT 0,
    defense_bonus INTEGER DEFAULT 0,
    hp_restore INTEGER DEFAULT 0,
    mp_restore INTEGER DEFAULT 0,
    value INTEGER DEFAULT 10,
    description TEXT
);

-- Inventory table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    quantity INTEGER DEFAULT 1,
    equipped BOOLEAN DEFAULT false,
    slot VARCHAR(20) -- weapon, armor, accessory
);

-- Monsters table
CREATE TABLE monsters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    level INTEGER DEFAULT 1,
    hp INTEGER DEFAULT 50,
    attack INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,
    experience_reward INTEGER DEFAULT 10,
    gold_reward INTEGER DEFAULT 5,
    description TEXT
);

-- Dungeons table
CREATE TABLE dungeons (
    id SERIAL PRIMARY KEY,
    floor_number INTEGER NOT NULL,
    width INTEGER DEFAULT 20,
    height INTEGER DEFAULT 20,
    difficulty VARCHAR(20) DEFAULT 'normal',
    theme VARCHAR(50) DEFAULT 'stone'
);

-- Dungeon progress table
CREATE TABLE dungeon_progress (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    dungeon_id INTEGER REFERENCES dungeons(id),
    explored_tiles TEXT, -- JSON array of explored coordinates
    monsters_defeated TEXT, -- JSON array of defeated monster positions
    items_collected TEXT, -- JSON array of collected item positions
    completed BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Combat logs table
CREATE TABLE combat_logs (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    monster_id INTEGER REFERENCES monsters(id),
    damage_dealt INTEGER,
    damage_received INTEGER,
    outcome VARCHAR(20), -- victory, defeat, fled
    experience_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    items_gained TEXT, -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some initial data
INSERT INTO items (name, type, rarity, attack_bonus, defense_bonus, hp_restore, mp_restore, value, description) VALUES
('Rusty Sword', 'weapon', 'common', 5, 0, 0, 0, 50, 'A worn but serviceable blade'),
('Iron Sword', 'weapon', 'common', 10, 0, 0, 0, 100, 'A standard iron sword'),
('Steel Sword', 'weapon', 'uncommon', 15, 0, 0, 0, 250, 'A well-forged steel blade'),
('Leather Armor', 'armor', 'common', 0, 5, 0, 0, 75, 'Basic leather protection'),
('Chain Mail', 'armor', 'uncommon', 0, 10, 0, 0, 200, 'Interlocking metal rings'),
('Health Potion', 'consumable', 'common', 0, 0, 50, 0, 25, 'Restores 50 HP'),
('Mana Potion', 'consumable', 'common', 0, 0, 0, 25, 30, 'Restores 25 MP'),
('Elixir', 'consumable', 'rare', 0, 0, 100, 50, 100, 'Fully restores HP and MP');

INSERT INTO monsters (name, type, level, hp, attack, defense, experience_reward, gold_reward, description) VALUES
('Slime', 'slime', 1, 30, 8, 3, 10, 5, 'A gelatinous creature'),
('Goblin', 'humanoid', 1, 40, 12, 5, 15, 10, 'A small, mischievous humanoid'),
('Wolf', 'beast', 2, 50, 15, 7, 20, 15, 'A fierce predator'),
('Skeleton', 'undead', 2, 45, 14, 8, 25, 12, 'Animated bones'),
('Orc', 'humanoid', 3, 80, 20, 10, 40, 25, 'A brutish warrior'),
('Dark Knight', 'humanoid', 4, 120, 25, 15, 60, 40, 'A corrupted warrior'),
('Dragon', 'dragon', 5, 200, 35, 20, 100, 100, 'A mighty dragon');

INSERT INTO dungeons (floor_number, width, height, difficulty, theme) VALUES
(1, 20, 20, 'easy', 'stone'),
(2, 25, 25, 'normal', 'cave'),
(3, 25, 25, 'normal', 'ruins'),
(4, 30, 30, 'hard', 'fortress'),
(5, 30, 30, 'boss', 'dragon_lair');