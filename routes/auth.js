const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Capitalized
const { preventLoggedInAccess } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// GET /register
router.get('/register', preventLoggedInAccess, (req, res) => {
  res.render('register', { error: null });
});

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.render('register', { error: 'All fields are required' });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.render('register', { error: 'Username or email already exists' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ username, email, password: hash });
    await user.save();

    // Set session
    req.session.user = { userId: user._id.toString(), username: user.username, email: user.email };
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Register error:', err);
    return res.render('register', { error: 'Registration failed' });
  }
});

// GET /login
router.get('/login', preventLoggedInAccess, (req, res) => {
  res.render('login', { error: null });
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.render('login', { error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.render('login', { error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: 'Invalid credentials' });

    req.session.user = { userId: user._id.toString(), username: user.username, email: user.email };
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    return res.render('login', { error: 'Login failed' });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/login');
});

module.exports = router;
