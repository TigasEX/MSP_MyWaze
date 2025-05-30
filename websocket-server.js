/**
 * MyWaze WebSocket Server
 * 
 * This server handles real-time communication for the MyWaze navigation application.
 * It provides the following functionality:
 * - User authentication and session management
 * - Real-time location sharing between users
 * - Vehicle management (CRUD operations)
 * - Route saving and retrieval
 * - User profile management
 * 
 * Features:
 * - WebSocket-based real-time communication
 * - Persistent data storage in JSON files
 * - Session management with duplicate login prevention
 * - Password hashing for security
 * - RESTful API endpoints for frontend integration
 * 
 * @version 1.0.0
 * @author André Gaspar - 59859, João Lima - 60350, Marisa Basílio - 54550, Pedro Afonso - 70357, Tiago Sequeira - 55354 - MSP 2024/2025 FCT Nova
 */

import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Create HTTP server for both WebSocket and REST API endpoints
const server = createServer();
const wss = new WebSocketServer({ server });

// File paths for persistent storage
const DATA_DIR = './server_data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ROUTES_FILE = path.join(DATA_DIR, 'routes.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Persistent user storage
let persistentUsers = new Map();
let userRoutes = new Map();

// Store connected users (WebSocket connections)
const connectedUsers = new Map();

// Store active user sessions (for preventing duplicate logins)
const activeSessions = new Map(); // Maps email -> { sessionId, userId, loginTime, lastActivity, wsConnection }

// Store user sessions by sessionId for quick lookup
const sessionsBySessionId = new Map(); // Maps sessionId -> email

// Car database (simplified version for server)
const carDatabase = [
  {
    brand: 'Toyota',
    models: [
      { name: 'Corolla', releaseYear: 1966, image: 'src/assets/car_images/toyota_corolla.jpg' },
      { name: 'Camry', releaseYear: 1982, image: 'src/assets/car_images/toyota_camry.jpg' },
      { name: 'Prius', releaseYear: 1997, image: 'src/assets/car_images/toyota_prius.jpg' },
      { name: 'RAV4', releaseYear: 1994, image: 'src/assets/car_images/toyota_rav4.jpg' }
    ]
  },
  {
    brand: 'BMW',
    models: [
      { name: '3 Series', releaseYear: 1975, image: 'src/assets/car_images/bmw_3_series.jpg' },
      { name: '5 Series', releaseYear: 1972, image: 'src/assets/car_images/bmw_5_series.jpg' },
      { name: 'X5', releaseYear: 1999, image: 'src/assets/car_images/bmw_x5.jpg' }
    ]
  },
  {
    brand: 'Mercedes-Benz',
    models: [
      { name: 'C-Class', releaseYear: 1993, image: 'src/assets/car_images/mercedes_benz_c_class.jpg' },
      { name: 'E-Class', releaseYear: 1953, image: 'src/assets/car_images/mercedes_benz_e_class.jpg' }
    ]
  },
  {
    brand: 'Audi',
    models: [
      { name: 'A4', releaseYear: 1994, image: 'src/assets/car_images/audi_a4.jpg' },
      { name: 'A6', releaseYear: 1994, image: 'src/assets/car_images/audi_a6.jpg' },
      { name: 'Q5', releaseYear: 2008, image: 'src/assets/car_images/audi_q5.jpg' }
    ]
  }
];

/**
 * ===== DATA PERSISTENCE FUNCTIONS =====
 */

/**
 * Load persistent user and route data from JSON files
 * Creates default user if no data exists
 */
function loadPersistentData() {
  try {
    // Load users
    if (fs.existsSync(USERS_FILE)) {
      const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      persistentUsers = new Map(usersData);
      console.log(`Loaded ${persistentUsers.size} persistent users`);
    } else {
      // Create default user
      const defaultUser = {
        id: 'user_default001',
        email: 'user@user',
        password: hashPassword('password'),
        name: 'DefaultUser123',
        username: 'DefaultUser123',
        registeredAt: Date.now(),
        vehicles: [
          {
            id: 'vehicle_001',
            name: 'My Corolla',
            brand: 'Toyota',
            model: 'Corolla',
            image: 'src/assets/car_images/toyota_corolla.jpg',
            isSelected: true
          }
        ],
        savedRoutes: []
      };
      persistentUsers.set('user@user', defaultUser);
      savePersistentData();
      console.log('Created default user: user@user / password');
    }

    // Load routes
    if (fs.existsSync(ROUTES_FILE)) {
      const routesData = JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf8'));
      userRoutes = new Map(routesData);
      console.log(`Loaded ${userRoutes.size} saved routes`);
    }
  } catch (error) {
    console.error('Error loading persistent data:', error);
  }
}

/**
 * Save user and route data to persistent JSON files
 * Called after any data modification to ensure persistence
 */
function savePersistentData() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(persistentUsers.entries()), null, 2));
    fs.writeFileSync(ROUTES_FILE, JSON.stringify(Array.from(userRoutes.entries()), null, 2));
    console.log('Persistent data saved successfully');
  } catch (error) {
    console.error('Error saving persistent data:', error);
  }
}

/**
 * ===== SECURITY FUNCTIONS =====
 */

/**
 * Hash password using SHA-256 for secure storage
 * @param {string} password - Plain text password
 * @returns {string} Hashed password
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password against stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Stored hashed password
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

// Generate secure user ID
function generateSecureUserId() {
  return 'user_' + crypto.randomBytes(8).toString('hex');
}

// Generate secure session ID
function generateSessionId() {
  return 'session_' + crypto.randomBytes(12).toString('hex');
}

// Session management functions
function createSession(email, userId, wsConnection = null) {
  const sessionId = generateSessionId();
  activeSessions.set(email, {
    sessionId,
    userId,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    wsConnection
  });
  sessionsBySessionId.set(sessionId, email);
  return sessionId;
}

function isUserLoggedIn(email) {
  return activeSessions.has(email);
}

function getActiveSession(email) {
  return activeSessions.get(email);
}

function removeSession(email) {
  const session = activeSessions.get(email);
  if (session) {
    sessionsBySessionId.delete(session.sessionId);
    return activeSessions.delete(email);
  }
  return false;
}

function updateSessionActivity(email) {
  const session = activeSessions.get(email);
  if (session) {
    session.lastActivity = Date.now();
  }
}

function forceDisconnectSession(email, reason = 'Session terminated from another device') {
  const session = activeSessions.get(email);
  if (session && session.wsConnection) {
    // Send force disconnect message to the WebSocket connection
    if (session.wsConnection.readyState === WebSocket.OPEN) {
      session.wsConnection.send(JSON.stringify({
        type: 'force_disconnect',
        reason: reason,
        timestamp: Date.now()
      }));
      session.wsConnection.close(1000, reason);
    }
  }
  removeSession(email);
}

// Clean up inactive sessions (sessions inactive for more than 30 minutes)
function cleanupInactiveSessions() {
  const THIRTY_MINUTES = 30 * 60 * 1000;
  const now = Date.now();
  
  for (const [email, session] of activeSessions.entries()) {
    if (now - session.lastActivity > THIRTY_MINUTES) {
      console.log(`Cleaning up inactive session for user: ${email}`);
      activeSessions.delete(email);
    }
  }
}

// Run session cleanup every 5 minutes
setInterval(cleanupInactiveSessions, 5 * 60 * 1000);

// User authentication functions
function registerUser(email, password, name = null, username = null) {
  if (persistentUsers.has(email)) {
    throw new Error('User already exists');
  }

  const userId = generateSecureUserId();
  const user = {
    id: userId,
    email: email,
    password: hashPassword(password),
    name: name || generateUserName(),
    username: username || generateUserName(), // Add username field
    registeredAt: Date.now(),
    vehicles: [],
    savedRoutes: []
  };

  persistentUsers.set(email, user);
  savePersistentData();
  return user;
}

function loginUser(email, password, forceLogin = false) {
  const user = persistentUsers.get(email);
  if (!user || !verifyPassword(password, user.password)) {
    throw new Error('Invalid email or password');
  }
  
  // Check if user is already logged in
  if (isUserLoggedIn(email) && !forceLogin) {
    const session = getActiveSession(email);
    const error = new Error('User is already logged in');
    error.code = 'ALREADY_LOGGED_IN';
    error.session = {
      loginTime: session.loginTime,
      lastActivity: session.lastActivity
    };
    throw error;
  }
  
  // If force login is requested, remove existing session
  if (forceLogin && isUserLoggedIn(email)) {
    forceDisconnectSession(email, 'Session terminated: Login from another device');
    console.log(`Force login: disconnected existing session for ${email}`);
  }
  
  // Create new session
  const sessionId = createSession(email, user.id);
  console.log(`User logged in: ${email} (Session: ${sessionId})`);
  
  return { ...user, sessionId };
}

function addVehicleToUser(email, vehicle) {
  const user = persistentUsers.get(email);
  if (!user) {
    throw new Error('User not found');
  }

  const vehicleWithId = {
    id: 'vehicle_' + crypto.randomBytes(6).toString('hex'),
    ...vehicle,
    addedAt: Date.now()
  };

  user.vehicles.push(vehicleWithId);
  savePersistentData();
  return vehicleWithId;
}

function removeVehicleFromUser(email, vehicleId) {
  const user = persistentUsers.get(email);
  if (!user) {
    throw new Error('User not found');
  }

  user.vehicles = user.vehicles.filter(v => v.id !== vehicleId);
  savePersistentData();
  return true;
}

function selectVehicleForUser(email, vehicleId) {
  const user = persistentUsers.get(email);
  if (!user) {
    throw new Error('User not found');
  }

  // Unselect all vehicles first
  user.vehicles.forEach(v => v.isSelected = false);
  
  // Select the specified vehicle
  const vehicle = user.vehicles.find(v => v.id === vehicleId);
  if (vehicle) {
    vehicle.isSelected = true;
  }
  
  savePersistentData();
  return vehicle;
}

function saveRouteForUser(email, routeData) {
  const user = persistentUsers.get(email);
  if (!user) {
    throw new Error('User not found');
  }

  const route = {
    id: 'route_' + crypto.randomBytes(8).toString('hex'),
    ...routeData,
    savedAt: Date.now()
  };

  user.savedRoutes.push(route);
  savePersistentData();
  return route;
}

function getUserRoutes(email) {
  const user = persistentUsers.get(email);
  return user ? user.savedRoutes : [];
}

function deleteUserRoute(email, routeId) {
  const user = persistentUsers.get(email);
  if (!user) {
    throw new Error('User not found');
  }

  user.savedRoutes = user.savedRoutes.filter(r => r.id !== routeId);
  savePersistentData();
  return true;
}

function updateUserUsername(email, newUsername) {
  const user = persistentUsers.get(email);
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!newUsername || newUsername.trim() === '') {
    throw new Error('Username cannot be empty');
  }
  
  user.username = newUsername.trim();
  savePersistentData();
  return user;
}

// Generate random user name
function generateUserName() {
  const adjectives = ['Swift', 'Fast', 'Quick', 'Speedy', 'Rapid', 'Lightning', 'Turbo', 'Zoom', 'Flash', 'Rocket'];
  const nouns = ['Driver', 'Rider', 'Navigator', 'Traveler', 'Explorer', 'Cruiser', 'Racer', 'Pilot', 'Wanderer', 'Voyager'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Broadcast message to all connected users except sender
function broadcast(senderId, message) {
  const messageStr = JSON.stringify(message);
  connectedUsers.forEach((user, userId) => {
    if (userId !== senderId && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(messageStr);
    }
  });
}

// Send message to all connected users including sender
function broadcastToAll(message) {
  const messageStr = JSON.stringify(message);
  connectedUsers.forEach((user) => {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(messageStr);
    }
  });
}

// Send current users list to a specific user
function sendUsersList(userId) {
  const user = connectedUsers.get(userId);
  if (!user || user.ws.readyState !== WebSocket.OPEN) return;

  const usersList = Array.from(connectedUsers.entries()).map(([id, userData]) => ({
    id: id,
    name: userData.name,
    position: userData.position,
    lastUpdate: userData.lastUpdate,
    isOnline: userData.ws.readyState === WebSocket.OPEN
  }));

  user.ws.send(JSON.stringify({
    type: 'users_list',
    users: usersList
  }));
}

// HTTP request handlers
function handleUserRegistration(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email, password, name, username } = JSON.parse(body);
      const user = registerUser(email, password, name, username);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          vehicles: user.vehicles,
          savedRoutes: user.savedRoutes
        }
      }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleUserLogin(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email, password, forceLogin = false } = JSON.parse(body);
      const user = loginUser(email, password, forceLogin);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          vehicles: user.vehicles,
          savedRoutes: user.savedRoutes,
          sessionId: user.sessionId
        }
      }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      
      if (error.code === 'ALREADY_LOGGED_IN') {
        res.writeHead(409); // Conflict status code
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message,
          code: 'ALREADY_LOGGED_IN',
          session: error.session
        }));
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    }
  });
}

function handleGetUserData(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email } = JSON.parse(body);
      const user = persistentUsers.get(email);
      
      if (!user) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'User not found' }));
        return;
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          vehicles: user.vehicles,
          savedRoutes: user.savedRoutes
        }
      }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleAddVehicle(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email, vehicle } = JSON.parse(body);
      const newVehicle = addVehicleToUser(email, vehicle);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, vehicle: newVehicle }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleRemoveVehicle(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email, vehicleId } = JSON.parse(body);
      removeVehicleFromUser(email, vehicleId);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleSelectVehicle(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email, vehicleId } = JSON.parse(body);
      const vehicle = selectVehicleForUser(email, vehicleId);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, vehicle }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleSaveRoute(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email, routeData } = JSON.parse(body);
      const route = saveRouteForUser(email, routeData);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, route }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleGetRoutes(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email } = JSON.parse(body);
      const routes = getUserRoutes(email);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, routes }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleDeleteRoute(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email, routeId } = JSON.parse(body);
      deleteUserRoute(email, routeId);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleUserLogout(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email } = JSON.parse(body);
      
      if (removeSession(email)) {
        console.log(`User logged out: ${email}`);
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: 'Successfully logged out'
        }));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'No active session found'
        }));
      }
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

function handleUpdateUsername(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const { email, username } = JSON.parse(body);
      const user = updateUserUsername(email, username);
      
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          vehicles: user.vehicles,
          savedRoutes: user.savedRoutes
        }
      }));
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: error.message }));
    }
  });
}

// Add HTTP routes for user management
server.on('request', (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/status') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        connectedUsers: connectedUsers.size,
        registeredUsers: persistentUsers.size,
        totalRoutes: Array.from(persistentUsers.values()).reduce((total, user) => total + user.savedRoutes.length, 0),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }));
    } else if (pathname === '/api/register' && req.method === 'POST') {
      handleUserRegistration(req, res);
    } else if (pathname === '/api/login' && req.method === 'POST') {
      handleUserLogin(req, res);
    } else if (pathname === '/api/logout' && req.method === 'POST') {
      handleUserLogout(req, res);
    } else if (pathname === '/api/user-data' && req.method === 'POST') {
      handleGetUserData(req, res);
    } else if (pathname === '/api/add-vehicle' && req.method === 'POST') {
      handleAddVehicle(req, res);
    } else if (pathname === '/api/remove-vehicle' && req.method === 'POST') {
      handleRemoveVehicle(req, res);
    } else if (pathname === '/api/select-vehicle' && req.method === 'POST') {
      handleSelectVehicle(req, res);
    } else if (pathname === '/api/save-route' && req.method === 'POST') {
      handleSaveRoute(req, res);
    } else if (pathname === '/api/get-routes' && req.method === 'POST') {
      handleGetRoutes(req, res);
    } else if (pathname === '/api/delete-route' && req.method === 'POST') {
      handleDeleteRoute(req, res);
    } else if (pathname === '/api/logout' && req.method === 'POST') {
      handleUserLogout(req, res);
    } else if (pathname === '/api/update-username' && req.method === 'POST') {
      handleUpdateUsername(req, res);
    } else if (pathname === '/api/car-database' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify(carDatabase));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('HTTP request error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  const userId = generateSecureUserId();
  // Use a default username - will be replaced with real username after authentication
  const userName = 'New User';
  
  console.log(`New user connected: ${userId} (${userName})`);
  
  // Store user data
  connectedUsers.set(userId, {
    ws: ws,
    name: userName,
    position: null,
    lastUpdate: Date.now(),
    connectedAt: Date.now(),
    isAuthenticated: false,
    email: null,
    authenticatedUserId: null
  });

  // Send welcome message with user ID
  ws.send(JSON.stringify({
    type: 'welcome',
    userId: userId,
    userName: userName,
    message: 'Connected to MyWaze location sharing service'
  }));

  // Send current users list to new user
  sendUsersList(userId);

  // Notify other users about new connection
  broadcast(userId, {
    type: 'user_connected',
    userId: userId,
    userName: userName,
    timestamp: Date.now()
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'authenticate':
          // Authenticate user with sessionId or email
          const { sessionId, email } = data;
          let userSession = null;
          let authenticatedEmail = null;
          
          if (sessionId) {
            authenticatedEmail = sessionsBySessionId.get(sessionId);
            if (authenticatedEmail) {
              userSession = activeSessions.get(authenticatedEmail);
            }
          } else if (email) {
            userSession = activeSessions.get(email);
            authenticatedEmail = email;
          }
          
          if (userSession && authenticatedEmail) {
            // Update the session with WebSocket connection
            userSession.wsConnection = ws;
            updateSessionActivity(authenticatedEmail);
            
            // Update connected user with authenticated data
            const authenticatedUser = persistentUsers.get(authenticatedEmail);
            if (authenticatedUser) {
              const connectedUser = connectedUsers.get(userId);
              if (connectedUser) {
                connectedUser.email = authenticatedEmail;
                connectedUser.name = authenticatedUser.username || authenticatedUser.name;
                connectedUser.isAuthenticated = true;
                connectedUser.authenticatedUserId = authenticatedUser.id;
                userName = connectedUser.name; // Update userName variable
              }
              
              console.log(`User authenticated via WebSocket: ${authenticatedEmail} (${connectedUser.name})`);
              
              // Notify all users about the updated username
              broadcast(userId, {
                type: 'user_updated',
                userId: userId,
                userName: connectedUser.name,
                message: 'User name updated',
                timestamp: Date.now()
              });
              
              // Send updated users list to everyone
              connectedUsers.forEach((user, id) => {
                sendUsersList(id);
              });
              
              ws.send(JSON.stringify({
                type: 'authentication_success',
                userId: userId,
                userName: connectedUser.name,
                authenticatedEmail: authenticatedEmail,
                message: 'Successfully authenticated'
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'authentication_failed',
              message: 'Invalid session or user not logged in'
            }));
          }
          break;

        case 'location_update':
          const user = connectedUsers.get(userId);
          if (!user) break;

          // Update session activity if user is authenticated
          if (user.isAuthenticated && user.email) {
            updateSessionActivity(user.email);
          }

          const oldPosition = user.position;
          const newPosition = {
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy || null,
            timestamp: data.timestamp || Date.now()
          };

          // Check if location changed significantly (minimum 10 meters threshold)
          let shouldBroadcast = !oldPosition;
          if (oldPosition) {
            const distance = calculateDistance(
              oldPosition.lat, oldPosition.lng,
              newPosition.lat, newPosition.lng
            ) * 1000; // Convert to meters
            
            shouldBroadcast = distance >= 10; // 10 meters threshold
          }

          // Update user position
          user.position = newPosition;
          user.lastUpdate = Date.now();

          if (shouldBroadcast) {
            console.log(`Broadcasting location update for ${user.name}: ${newPosition.lat}, ${newPosition.lng}`);
            
            // Broadcast location update to other users
            broadcast(userId, {
              type: 'user_location_update',
              userId: userId,
              userName: user.name,
              position: newPosition,
              timestamp: Date.now()
            });
          }

          // Send confirmation back to sender
          ws.send(JSON.stringify({
            type: 'location_update_ack',
            success: true,
            broadcasted: shouldBroadcast,
            timestamp: Date.now()
          }));
          break;

        case 'get_users':
          sendUsersList(userId);
          break;

        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now()
          }));
          break;

        default:
          const connectedUser = connectedUsers.get(userId);
          const currentUserName = connectedUser ? connectedUser.name : userName;
          console.log(`Unknown message type from ${currentUserName}:`, data.type);
      }
    } catch (error) {
      const connectedUser = connectedUsers.get(userId);
      const currentUserName = connectedUser ? connectedUser.name : userName;
      console.error(`Error processing message from ${currentUserName}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    const connectedUser = connectedUsers.get(userId);
    const currentUserName = connectedUser ? connectedUser.name : userName;
    
    console.log(`User disconnected: ${userId} (${currentUserName})`);
    
    // Clean up session if user was authenticated
    if (connectedUser && connectedUser.isAuthenticated && connectedUser.email) {
      const session = activeSessions.get(connectedUser.email);
      if (session && session.wsConnection === ws) {
        // Clear the WebSocket connection from the session but keep the session active
        session.wsConnection = null;
        console.log(`Cleared WebSocket connection for authenticated user: ${connectedUser.email}`);
      }
    }
    
    // Remove user from connected users
    connectedUsers.delete(userId);
    
    // Notify other users about disconnection
    broadcast(userId, {
      type: 'user_disconnected',
      userId: userId,
      userName: currentUserName,
      timestamp: Date.now()
    });
  });

  ws.on('error', (error) => {
    const connectedUser = connectedUsers.get(userId);
    const currentUserName = connectedUser ? connectedUser.name : userName;
    console.error(`WebSocket error for ${currentUserName}:`, error);
  });
});

// Cleanup inactive connections every 30 seconds
setInterval(() => {
  const now = Date.now();
  const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

  connectedUsers.forEach((user, userId) => {
    if (user.ws.readyState !== WebSocket.OPEN || (now - user.lastUpdate) > inactiveThreshold) {
      console.log(`Removing inactive user: ${userId}`);
      user.ws.terminate();
      connectedUsers.delete(userId);
    }
  });
}, 30000);

// Initialize data and start server
loadPersistentData();

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚗 MyWaze WebSocket Server running on port ${PORT}`);
  console.log(`📊 Status endpoint: http://localhost:${PORT}/status`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`👤 Default user: user@user / password`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down WebSocket server...');
  savePersistentData();
  
  // Close all connections
  connectedUsers.forEach((user) => {
    user.ws.close(1000, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});