const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const Task = require('../models/Task');
const TaskImage = require('../models/TaskImage'); 
const mongoose = require('mongoose');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') || 
      file.mimetype === 'application/pdf'  
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only images or PDFs allowed!'), false);
    }
  }
}).single('attachment');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const tasksWithAttachments = await Promise.all(tasks.map(async (task) => {
      const attachments = await TaskImage.find({ taskId: task._id }).select('-data');
      return { ...task.toObject(), attachments };
    }));
    res.json(tasksWithAttachments);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

router.post('/', authMiddleware, upload, async (req, res) => {
  const { title, status, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });

  try {
    const task = new Task({
      title,
      status: status || 'pending',
      description,
      userId: req.user.id
    });
    await task.save();

    if (req.file) {
      const taskImage = new TaskImage({
        filename: `${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
        userId: req.user.id,
        taskId: task._id,
        title: req.body.attachmentTitle || '',
        description: req.body.attachmentDescription || ''
      });
      await taskImage.save();
    }

    res.status(201).json(task);
  } catch (err) {
    console.error('Error creating task:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file ? {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });
    res.status(500).json({ message: 'Server error while creating task', error: err.message });
  }
});

router.put('/:id', authMiddleware, upload, async (req, res) => {
  const { id } = req.params;
  const { title, status, description, attachmentId } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await Task.findOne({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (title) task.title = title;
    if (status) task.status = status;
    if (description) task.description = description;

    await task.save();

    if (req.file && attachmentId) {
      const taskImage = await TaskImage.findOne({ _id: attachmentId, taskId: id, userId: req.user.id });
      if (!taskImage) return res.status(404).json({ message: 'Attachment not found' });

      taskImage.filename = `${Date.now()}_${req.file.originalname}`;
      taskImage.originalName = req.file.originalname;
      taskImage.mimetype = req.file.mimetype;
      taskImage.size = req.file.size;
      taskImage.data = req.file.buffer;
      taskImage.title = req.body.attachmentTitle || taskImage.title;
      taskImage.description = req.body.attachmentDescription || taskImage.description;

      await taskImage.save();
    } else if (req.file) {
      const taskImage = new TaskImage({
        filename: `${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
        userId: req.user.id,
        taskId: task._id,
        title: req.body.attachmentTitle || '',
        description: req.body.attachmentDescription || ''
      });
      await taskImage.save();
    }

    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Server error while updating task' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid task ID' });
  }

  try {
    const task = await Task.findOne({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await Task.deleteOne({ _id: id, userId: req.user.id });
    await TaskImage.deleteMany({ taskId: id });

    res.json({ message: 'Task and attachments deleted', taskId: id });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

router.get('/:id/attachments', authMiddleware, async (req, res) => {
  try {
    const attachments = await TaskImage.find({ 
      taskId: req.params.id, 
      userId: req.user.id 
    }).select('-data');


    if (!attachments || attachments.length === 0) {
      return res.status(404).json({ message: 'Attachments not found' });
    }
    res.json(attachments.map(att => ({
      _id: att._id,
      filename: att.filename,
      originalName: att.originalName,
      mimetype: att.mimetype,
      size: att.size,
      uploadDate: att.uploadDate,
      title: att.title,
      description: att.description
    })));
  } catch (err) {
    console.error('Error fetching attachments:', err);
    res.status(500).json({ message: 'Server error while fetching attachments' });
  }
});

router.get('/attachment/:attachmentId', authMiddleware, async (req, res) => {
  try {
    const attachment = await TaskImage.findOne({ 
      _id: req.params.attachmentId, 
      userId: req.user.id 
    });
    if (!attachment || !attachment.data) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    res.set({
      'Content-Type': attachment.mimetype,
      'Content-Length': attachment.data.length
    });
    res.send(attachment.data);
  } catch (err) {
    console.error('Error fetching attachment:', err);
    res.status(500).json({ message: 'Server error while fetching attachment' });
  }
});

module.exports = router;