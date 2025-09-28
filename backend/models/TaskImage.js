const mongoose = require('mongoose');

const taskImageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  title: {
    type: String,
    trim: true
  }
});

// Indexes for faster queries
taskImageSchema.index({ uploadDate: -1 });
taskImageSchema.index({ userId: 1 });
taskImageSchema.index({ taskId: 1 });

module.exports = mongoose.model('TaskImage', taskImageSchema);
