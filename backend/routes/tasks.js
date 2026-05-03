const router = require('express').Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper: check project membership
async function getProjectRole(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const m = project.members.find(m => m.user.toString() === userId);
  return m ? m.role : null;
}

// GET /api/tasks/project/:projectId — all tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const role = await getProjectRole(req.params.projectId, req.user.id);
    if (!role) return res.status(403).json({ msg: 'Access denied' });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/tasks/stats/:projectId — dashboard stats
router.get('/stats/:projectId', auth, async (req, res) => {
  try {
    const role = await getProjectRole(req.params.projectId, req.user.id);
    if (!role) return res.status(403).json({ msg: 'Access denied' });

    const tasks = await Task.find({ project: req.params.projectId }).populate('assignedTo', 'name');
    const now = new Date();

    // Tasks per user
    const perUser = {};
    tasks.forEach(t => {
      if (t.assignedTo) {
        const key = t.assignedTo.name;
        perUser[key] = (perUser[key] || 0) + 1;
      }
    });

    res.json({
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      perUser,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/tasks — create task (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, projectId, assignedTo } = req.body;
    if (!title || !projectId) return res.status(400).json({ msg: 'Title and projectId are required' });

    const role = await getProjectRole(projectId, req.user.id);
    if (!role) return res.status(403).json({ msg: 'Access denied' });
    if (role !== 'admin') return res.status(403).json({ msg: 'Only admins can create tasks' });

    const task = new Task({
      title, description, dueDate, priority,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user.id
    });
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    const role = await getProjectRole(task.project, req.user.id);
    if (!role) return res.status(403).json({ msg: 'Access denied' });

    // Members can only update status of their own tasks
    if (role === 'member') {
      if (task.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'You can only update tasks assigned to you' });
      }
      const { status } = req.body;
      task.status = status || task.status;
    } else {
      // Admin can update everything
      const { title, description, dueDate, priority, status, assignedTo } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority) task.priority = priority;
      if (status) task.status = status;
      if (assignedTo !== undefined) task.assignedTo = assignedTo;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/tasks/:id — delete task (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    const role = await getProjectRole(task.project, req.user.id);
    if (role !== 'admin') return res.status(403).json({ msg: 'Admin access required' });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
