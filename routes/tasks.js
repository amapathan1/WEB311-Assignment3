const express = require('express');
const Task = require('../models/Task'); // Capitalized
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// GET /tasks - list tasks
router.get('/', requireLogin, async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { userId: req.session.user.userId }, order: [['createdAt', 'DESC']] });
    res.render('tasks', { tasks });
  } catch (err) {
    console.error('Tasks list error:', err);
    res.render('tasks', { tasks: [] });
  }
});

// GET /tasks/add
router.get('/add', requireLogin, (req, res) => {
  res.render('task_form', { task: null, action: '/tasks/add', error: null });
});

// POST /tasks/add
router.post('/add', requireLogin, async (req, res) => {
  try {
    const { title, description, dueDate, status } = req.body;
    if (!title || title.trim() === '') return res.render('task_form', { task: null, action: '/tasks/add', error: 'Title is required' });

    await Task.create({
      title: title.trim(),
      description,
      dueDate: dueDate || null,
      status: status || 'pending',
      userId: req.session.user.userId
    });

    res.redirect('/tasks');
  } catch (err) {
    console.error('Create task error:', err);
    res.render('task_form', { task: null, action: '/tasks/add', error: 'Failed to add task' });
  }
});

// GET /tasks/edit/:id
router.get('/edit/:id', requireLogin, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task || task.userId !== req.session.user.userId) return res.redirect('/tasks');
    res.render('task_form', { task, action: `/tasks/edit/${task.id}`, error: null });
  } catch (err) {
    console.error('Edit form error:', err);
    res.redirect('/tasks');
  }
});

// POST /tasks/edit/:id
router.post('/edit/:id', requireLogin, async (req, res) => {
  try {
    const { title, description, dueDate, status } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task || task.userId !== req.session.user.userId) return res.redirect('/tasks');

    await task.update({ title: title.trim(), description, dueDate: dueDate || null, status });
    res.redirect('/tasks');
  } catch (err) {
    console.error('Edit submit error:', err);
    res.render('task_form', { task: { id: req.params.id, title, description, dueDate, status }, action: `/tasks/edit/${req.params.id}`, error: 'Failed to update task' });
  }
});

// POST /tasks/delete/:id
router.post('/delete/:id', requireLogin, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (task && task.userId === req.session.user.userId) {
      await Task.destroy({ where: { id: req.params.id } });
    }
    res.redirect('/tasks');
  } catch (err) {
    console.error('Delete error:', err);
    res.redirect('/tasks');
  }
});

// POST /tasks/status/:id (toggle)
router.post('/status/:id', requireLogin, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task || task.userId !== req.session.user.userId) return res.redirect('/tasks');

    task.status = task.status === 'pending' ? 'completed' : 'pending';
    await task.save();
    res.redirect('/tasks');
  } catch (err) {
    console.error('Status toggle error:', err);
    res.redirect('/tasks');
  }
});

module.exports = router;
