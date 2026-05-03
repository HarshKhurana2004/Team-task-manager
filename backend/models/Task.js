const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Task title is required'], trim: true },
  description: { type: String, trim: true, default: '' },
  dueDate:     { type: Date },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status:      { type: String, enum: ['todo', 'inprogress', 'done'], default: 'todo' },
  project:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
