const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/users/search?email=... — search user by email (for adding members)
router.get('/search', auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ msg: 'Email query required.' });
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
});

module.exports = router;
