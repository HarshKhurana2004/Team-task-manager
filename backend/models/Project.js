const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name:        { type: String, required: [true, 'Project name is required'], trim: true },
  description: { type: String, trim: true, default: '' },
  creator:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' }
  }],
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
