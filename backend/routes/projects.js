const router = require('express').Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');

// GET /api/projects — get all projects for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.id })
      .populate('members.user', 'name email')
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/projects/:id — get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('creator', 'name email');
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    const isMember = project.members.find(m => m.user._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ msg: 'Access denied' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/projects — create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ msg: 'Project name is required' });
    const project = new Project({
      name, description,
      creator: req.user.id,
      members: [{ user: req.user.id, role: 'admin' }]
    });
    await project.save();
    await project.populate('members.user', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/projects/:id/members — add member (admin only)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    const myRole = project.members.find(m => m.user.toString() === req.user.id);
    if (!myRole || myRole.role !== 'admin') return res.status(403).json({ msg: 'Admin access required' });

    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found with that email' });

    const already = project.members.find(m => m.user.toString() === user._id.toString());
    if (already) return res.status(400).json({ msg: 'User is already a member' });

    project.members.push({ user: user._id, role });
    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    const myRole = project.members.find(m => m.user.toString() === req.user.id);
    if (!myRole || myRole.role !== 'admin') return res.status(403).json({ msg: 'Admin access required' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    await project.populate('members.user', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/projects/:id — delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: 'Project not found' });
    const myRole = project.members.find(m => m.user.toString() === req.user.id);
    if (!myRole || myRole.role !== 'admin') return res.status(403).json({ msg: 'Admin access required' });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
