const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const characterRoutes = require('./routes/character');
const dungeonRoutes = require('./routes/dungeon');

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/dungeon', dungeonRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Dungeon Crawler API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});