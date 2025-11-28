// app.js
require('dotenv').config();
const express = require('express');
const session = require('client-sessions');
const path = require('path');
const bcrypt = require('bcrypt');
const expressLayouts = require('express-ejs-layouts');

// Database connections
const sequelize = require('./db');
const Task = require('./models/task');
const { connectMongo } = require('./config/mongo');

// Middleware
const { requireLogin } = require('./middleware/auth');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Sessions
app.use(
  session({
    cookieName: 'session',
    secret: process.env.SESSION_SECRET || 'RandomSecret',
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 2 * 60 * 60 * 1000
  })
);

// Pass logged in user to EJS
app.use((req, res, next) => {
  if (req.session.user) {
    res.locals.user = req.session.user; 
  } else {
    res.locals.user = null;
  }
  next();
});

// Connect MongoDB
connectMongo()
  .then(() => {
    console.log('MongoDB connected successfully!');
    const User = require('./models/user');

    // ========== AUTH ROUTES ==========

    app.get('/register', (req, res) => {
      res.render('register', { error: null });
    });

    app.post('/register', async (req, res) => {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.render('register', { error: 'All fields required' });
      }

      const exists = await User.findOne({ email });
      if (exists) return res.render('register', { error: 'Email already exists' });

      const hash = await bcrypt.hash(password, 10);

      const user = new User({ username, email, password: hash });
      await user.save();

      res.redirect('/login');
    });

    app.get('/login', (req, res) => {
      res.render('login', { error: null });
    });

    app.post('/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.render('login', { error: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.render('login', { error: 'Invalid credentials' });

        // Store inside one user object
        req.session.user = {
          userId: user._id.toString(),
          username: user.username,
          email: user.email
        };

        res.redirect('/dashboard');
      } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'Login failed' });
      }
    });

    app.get('/logout', (req, res) => {
      req.session.reset();
      res.redirect('/login');
    });

    // ========== HOME ROUTE ==========

    app.get('/', (req, res) => {
      if (!req.session.user) return res.redirect('/login');
      res.redirect('/dashboard');
    });

    // ========== DASHBOARD ==========

    app.get('/dashboard', requireLogin, async (req, res) => {
      try {
        const tasks = await Task.findAll({
          where: { userId: req.session.user.userId }
        });

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === "completed").length;
        const pending = total - completed;

        res.render('dashboard', { total, completed, pending });
      } catch (err) {
        console.error('Dashboard error:', err);
        res.send("Dashboard error");
      }
    });

    // ========== TASK ROUTES ==========

    app.get('/tasks', requireLogin, async (req, res) => {
      const tasks = await Task.findAll({
        where: { userId: req.session.user.userId }
      });
      res.render('tasks', { tasks });
    });

    app.get('/tasks/add', requireLogin, (req, res) => {
      res.render('task_form', { 
        task: null, 
        action: "/tasks/add", 
        error: null 
      });
    });

    app.post('/tasks/add', requireLogin, async (req, res) => {
      const { title, description, dueDate, status } = req.body;

      if (!title.trim()) {
        return res.render('task_form', {
          task: null,
          action: "/tasks/add",
          error: "Title required"
        });
      }

      await Task.create({
        title,
        description,
        dueDate,
        status: status || "pending",
        userId: req.session.user.userId
      });

      res.redirect('/tasks');
    });

    app.get('/tasks/edit/:id', requireLogin, async (req, res) => {
      const task = await Task.findByPk(req.params.id);

      if (!task || task.userId !== req.session.user.userId) 
        return res.redirect('/tasks');

      res.render('task_form', {
        task,
        action: `/tasks/edit/${task.id}`,
        error: null
      });
    });

    app.post('/tasks/edit/:id', requireLogin, async (req, res) => {
      const { title, description, dueDate, status } = req.body;

      const task = await Task.findByPk(req.params.id);

      if (!task || task.userId !== req.session.user.userId) 
        return res.redirect('/tasks');

      await task.update({ title, description, dueDate, status });

      res.redirect('/tasks');
    });

    app.post('/tasks/delete/:id', requireLogin, async (req, res) => {
      const task = await Task.findByPk(req.params.id);

      if (task && task.userId === req.session.user.userId) {
        await Task.destroy({ where: { id: req.params.id } });
      }

      res.redirect('/tasks');
    });

    // ========== START SERVER ==========

    sequelize.sync().then(() => {
      const port = process.env.PORT || 3000;
      app.listen(port, () =>
        console.log(`Running at http://localhost:${port}`)
      );
    });

  })
  .catch(err => console.error("MongoDB error:", err));

