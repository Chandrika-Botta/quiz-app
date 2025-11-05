const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');

exports.createQuiz = async (req, res) => {
  try {
    const { title, subject, durationMinutes, startAt, endAt } = req.body;
    if (!title || !durationMinutes) return res.status(400).json({ message: 'Title and duration required' });
    const quiz = new Quiz({
      title,
      subject,
      durationMinutes: Number(durationMinutes),
      startAt: startAt ? new Date(startAt) : null,
      endAt: endAt ? new Date(endAt) : null,
      createdBy: req.user._id
    });
    await quiz.save();
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addQuestion = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { type, text, options, correctAnswer, marks } = req.body;

    console.log("Type:", type);
    console.log("Text:", text);
    console.log("Options:", options);
    console.log("Correct Answer:", correctAnswer);
    console.log("Marks:", marks);
        // options may be JSON string -> parse
    let parsedOptions = [];
    if (options) {
      try { parsedOptions = typeof options === 'string' ? JSON.parse(options) : options; } catch (e) { parsedOptions = []; }
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const q = new Question({
      quiz: quizId,
      type,
      text: text || '',
      imagePath,
      options: parsedOptions,
      correctAnswer: correctAnswer ? JSON.parse(correctAnswer) : undefined,
      marks: marks ? Number(marks) : 1
    });

    // For simple flows, if correctAnswer undefined, leave it (admin can later set)
    await q.save();
    res.json(q);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.viewAttempts = async (req, res) => {
  try {
    const quizId = req.params.id;
    const attempts = await Attempt.find({ quiz: quizId }).populate('user', 'name email').sort({ submittedAt: -1 });
    res.json(attempts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a quiz
exports.updateQuiz = async (req, res) => {
    try {
      const { title, subject, durationMinutes, startAt, endAt } = req.body;
      const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id });
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  
      quiz.title = title || quiz.title;
      quiz.subject = subject || quiz.subject;
      quiz.durationMinutes = durationMinutes ? Number(durationMinutes) : quiz.durationMinutes;
      quiz.startAt = startAt ? new Date(startAt) : quiz.startAt;
      quiz.endAt = endAt ? new Date(endAt) : quiz.endAt;
  
      await quiz.save();
      res.json(quiz);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // Delete a quiz
  exports.deleteQuiz = async (req, res) => {
    try {
      const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
      if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  
      // Optional: delete all questions of this quiz
      await Question.deleteMany({ quiz: req.params.id });
  
      res.json({ message: 'Quiz deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // adminController.js
// adminController.js
exports.getStudentScores = async (req, res) => {
    try {
      const { subject, date } = req.query; // optional filters
  
      // Build query
      let query = {};
      if (subject) query['quiz.subject'] = subject;
  
      let attempts = await Attempt.find()
        .populate('user', 'name email')
        .populate('quiz', 'title subject durationMinutes')
        .sort({ totalScore: -1, submittedAt: -1 }); // sort by score descending
  
      // Filter by subject
      if (subject) {
        attempts = attempts.filter(a => a.quiz.subject === subject);
      }
  
      // Filter by date
      if (date) {
        attempts = attempts.filter(a => {
          const attemptDate = new Date(a.submittedAt).toLocaleDateString();
          return attemptDate === new Date(date).toLocaleDateString();
        });
      }
  
      res.json(attempts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  