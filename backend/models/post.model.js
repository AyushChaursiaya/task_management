const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    trim: true,
  },
});

postSchema.index({ uploadDate: -1 });
postSchema.index({ userId: 1 });

module.exports = mongoose.model("Post", postSchema);