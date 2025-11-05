const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  type: { type: String, enum: ['mcq', 'tf', 'fitb', 'image'], required: true },
  text: { type: String }, // question text
  imagePath: { type: String, default: null }, // for image questions or supporting image
  options: [{ type: String }], // for mcq
  correctAnswer: mongoose.Schema.Types.Mixed, // string or array (for any type)
  marks: { type: Number, default: 1 }
});

module.exports = mongoose.model('Question', questionSchema);
