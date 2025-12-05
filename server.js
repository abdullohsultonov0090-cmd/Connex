const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {OAuth2Client} = require('google-auth-library');

const USERS_FILE = path.join(__dirname, 'users.json');

async function readUsers(){
  try{
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){
    if(e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeUsers(users){
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function normalizeUserForClient(u){
  return { id: u.id, name: u.name, email: u.email, provider: u.provider, avatarUrl: u.avatarUrl || '' };
}

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request logger to help debug routing issues (prints method + url)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret_change_me';
// If behind a proxy (ngrok, Heroku) trust proxy so secure cookies work
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
const cookieSecure = process.env.NODE_ENV === 'production';
// create session middleware instance so we can share it with socket.io
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: cookieSecure }
});
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

// Create HTTP server and attach socket.io for real-time online users
const httpServer = http.createServer(app);
const io = new Server(httpServer, { 
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Share session middleware with socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Online users map (store user ids with their socket count)
const onlineUsers = new Map();

io.on('connection', (socket) => {
  try{
    const req = socket.request;
    const sess = req.session;
    // If user is authenticated via passport, req.session.passport contains user id
    const passportUser = sess && sess.passport && sess.passport.user;
    
    if(passportUser){
      const currentCount = onlineUsers.get(passportUser) || 0;
      onlineUsers.set(passportUser, currentCount + 1);
      
      console.log(`User ${passportUser} connected. Online users: ${onlineUsers.size}`);
      io.emit('online-count', { count: onlineUsers.size });
    } else {
      // Emit count even for unauthenticated users
      io.emit('online-count', { count: onlineUsers.size });
    }

    socket.on('disconnect', () => {
      if(passportUser){
        const currentCount = onlineUsers.get(passportUser) || 0;
        if(currentCount <= 1){
          onlineUsers.delete(passportUser);
        } else {
          onlineUsers.set(passportUser, currentCount - 1);
        }
        console.log(`User ${passportUser} disconnected. Online users: ${onlineUsers.size}`);
        io.emit('online-count', { count: onlineUsers.size });
      }
    });
  }catch(e){ console.error('Socket connection error', e); }
});

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try{
    const users = await readUsers();
    const u = users.find(x => x.id === id);
    done(null, u || null);
  }catch(e){ done(e); }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try{
    const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
    const users = await readUsers();
    let user = users.find(u => u.email && email && u.email.toLowerCase() === email.toLowerCase());

    if(!user){
      user = {
        id: 'u' + Date.now(),
        name: profile.displayName || (email ? email.split('@')[0] : 'GoogleUser'),
        email: email,
        passwordHash: null,
        provider: 'google',
        avatarUrl: (profile.photos && profile.photos[0] && profile.photos[0].value) || ''
      };
      users.push(user);
      await writeUsers(users);
    }
    return done(null, user);
  }catch(e){
    return done(e);
  }
}));

// Warn if Google OAuth env vars missing (helpful for developers)
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Warning: GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET not set. Google OAuth will not work until these are configured.');
}

// Register (local)
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if(!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  try{
    const users = await readUsers();
    const exists = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if(exists) return res.status(409).json({ message: 'User already exists' });
    const hash = await bcrypt.hash(password, 12);
    const user = { id: 'u' + Date.now(), name, email, passwordHash: hash, provider: 'local', avatarUrl: '' };
    users.push(user);
    await writeUsers(users);
    req.login(user, (err) => {
      if(err) return res.status(500).json({ message: 'Failed to create session' });
      return res.json({ user: normalizeUserForClient(user) });
    });
  }catch(e){
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login (local)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if(!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try{
    const users = await readUsers();
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase() && u.provider === 'local');
    if(!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if(!ok) return res.status(401).json({ message: 'Invalid credentials' });
    req.login(user, (err) => {
      if(err) return res.status(500).json({ message: 'Failed to create session' });
      return res.json({ user: normalizeUserForClient(user) });
    });
  }catch(e){
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
app.get('/api/logout', (req, res) => {
  req.logout(() => {});
  if(req.session) req.session.destroy(() => {});
  res.json({ success: true });
});

// Return current user (if any)
app.get('/api/user', (req, res) => {
  if(req.isAuthenticated && req.isAuthenticated()){
    return res.json({ user: normalizeUserForClient(req.user) });
  }
  return res.json({ user: null });
});

// Google OAuth routes
    console.log('Registering /auth/google route');
    app.get('/auth/google', (req, res, next) => {
      console.log('Incoming request to /auth/google, invoking passport.authenticate');
      return passport.authenticate('google', { scope: ['profile','email'] })(req, res, next);
    });

    // Diagnostic route to list registered routes (helpful for debugging 404s)
    app.get('/debug/routes', (req, res) => {
      try{
        const routes = [];
        app._router.stack.forEach(layer => {
          if(layer.route && layer.route.path){
            routes.push({ path: layer.route.path, methods: Object.keys(layer.route.methods) });
          }
        });
        res.json({ routes });
      }catch(e){
        res.status(500).json({ error: String(e) });
      }
    });

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/?google=fail' }), (req, res) => {
  // success: redirect to frontend which will call /api/user
  // On success, redirect to a protected page. The frontend can call /api/user to get profile.
  res.redirect('/protected');
});

// Middleware to protect routes
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated && req.isAuthenticated()) return next();
  return res.redirect('/');
}

// Serve protected page only to authenticated users
app.get('/protected', ensureAuthenticated, (req, res) => {
  // Serve a simple protected HTML page (file must exist in project)
  res.sendFile(path.join(__dirname, 'protected.html'));
});

// Optional: Verify Google ID token sent from client (if you use client-side token flow)
// POST { idToken: '...' } -> verifies token and returns user info
app.post('/api/verify-token', async (req, res) => {
  const { idToken } = req.body || {};
  if(!idToken) return res.status(400).json({ error: 'idToken required' });
  try{
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if(!clientId) return res.status(500).json({ error: 'Server not configured with GOOGLE_CLIENT_ID' });
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    // payload contains: email, name, picture, sub (google id)
    return res.json({ user: { id: payload.sub, email: payload.email, name: payload.name, picture: payload.picture } });
  }catch(e){
    console.error('ID token verification failed', e);
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Serve static files (your existing index.html etc.)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Auth server running on http://localhost:${PORT}`));

/**
 * Notes for developers:
 * - Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in env vars before using Google Sign-In.
 * - For local HTTPS testing use ngrok or mkcert and set GOOGLE_CALLBACK_URL to the HTTPS URL.
 */
