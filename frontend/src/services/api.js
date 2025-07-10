const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw error;
  }
  return response.json();
};

const fetchAPI = async (url, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const authAPI = {
  register: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },
  login: async (data) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return { data: await handleResponse(response) };
  },
};

export const characterAPI = {
  create: (data) => fetchAPI('/character/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(data => ({ data })),
  
  getMyCharacters: () => fetchAPI('/character/my-characters')
    .then(data => ({ data })),
  
  getCharacter: (id) => fetchAPI(`/character/${id}`)
    .then(data => ({ data })),
  
  updatePosition: (id, position) => fetchAPI(`/character/${id}/position`, {
    method: 'PUT',
    body: JSON.stringify(position),
  }).then(data => ({ data })),
  
  updateStats: (id, stats) => fetchAPI(`/character/${id}/stats`, {
    method: 'PUT',
    body: JSON.stringify(stats),
  }).then(data => ({ data })),
  
  getInventory: (id) => fetchAPI(`/character/${id}/inventory`)
    .then(data => ({ data })),
};

export const gameAPI = {
  combat: (data) => fetchAPI('/game/combat', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(data => ({ data })),
  
  useItem: (data) => fetchAPI('/game/use-item', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(data => ({ data })),
  
  loot: (data) => fetchAPI('/game/loot', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(data => ({ data })),
  
  specialAbility: (data) => fetchAPI('/game/special-ability', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(data => ({ data })),
};

export const dungeonAPI = {
  getFloor: (floor) => fetchAPI(`/dungeon/floor/${floor}`)
    .then(data => ({ data })),
  
  getProgress: (characterId) => fetchAPI(`/dungeon/progress/${characterId}`)
    .then(data => ({ data })),
  
  explore: (data) => fetchAPI('/dungeon/explore', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(data => ({ data })),
  
  getMonsters: () => fetchAPI('/dungeon/monsters')
    .then(data => ({ data })),
  
  getItems: () => fetchAPI('/dungeon/items')
    .then(data => ({ data })),
};

export default fetchAPI;