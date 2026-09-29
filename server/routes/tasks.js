const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');

router.get('/', (req, res) => {
  const tasks = readDB('tasks.json');
  res.json({ success: true, data: tasks });
});

router.post('/', (req, res) => {
  const tasks = readDB('tasks.json');
  const newTask = {
    id: `TASK-${Date.now()}`,
    ...req.body,
    status: req.body.status || 'pending',
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  writeDB('tasks.json', tasks);
  res.status(201).json({ success: true, data: newTask });
});

router.put('/:id', (req, res) => {
  const tasks = readDB('tasks.json');
  const index = tasks.findIndex(t => String(t.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  tasks[index] = { ...tasks[index], ...req.body, updatedAt: new Date().toISOString() };
  writeDB('tasks.json', tasks);
  res.json({ success: true, data: tasks[index] });
});

router.delete('/:id', (req, res) => {
  let tasks = readDB('tasks.json');
  const index = tasks.findIndex(t => String(t.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  const removed = tasks.splice(index, 1)[0];
  writeDB('tasks.json', tasks);
  res.json({ success: true, data: removed });
});

module.exports = router;
