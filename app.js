const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('client-sessions');

const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const { requireLogin } = require('./middleware/auth');
const Task = require('./models/task');

const app = express();

// View engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sessions
app.use(
  session({
    cookieName: 'session',
    secret: process.env.SESSION_SECRET || 'AnyRandomSecret',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
  })
);

// expose logged-in user to all views
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/tasks', tasksRoutes);

// Dashboard route
app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { userId: req.session.user.userId } });
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    res.render('dashboard', { total, completed, pending });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('dashboard', { total: 0, completed: 0, pending: 0 });
  }
});

// Root
app.get('/', (req, res) => {
  if (req.session?.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

module.exports = app;
