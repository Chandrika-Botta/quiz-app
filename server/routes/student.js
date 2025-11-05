const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const studentController = require('../controllers/studentController');
const Attempt = require('../models/Attempt'); // ✅ Correct model name
const Question = require('../models/Question');

router.use(auth);

// Existing routes
router.get('/quizzes', studentController.listAvailableQuizzes);
router.get('/quiz/:id/questions', studentController.getQuizQuestions);
router.post('/quiz/:id/submit', studentController.submitAttempt);
router.get('/attempts', studentController.myAttempts);

router.get('/progress', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('User ID:', userId);

    // Fetch all attempts of this student
    const results = await Attempt.find({ user: userId })
      .populate('quiz', 'title')
      .sort({ submittedAt: -1 });

    console.log('Results:', results);

    // Compute progress
    const progressData = await Promise.all(
      results.map(async (r) => {
        // Fetch all questions for this quiz
        const quizQuestions = await Question.find({ quiz: r.quiz._id }, 'marks');
        const totalPossibleMarks = quizQuestions.reduce(
          (sum, q) => sum + (q.marks || 0),
          0
        );

        return {
          title: r.quiz?.title || 'Untitled Quiz',
          attemptDate: r.submittedAt,
          score: r.totalScore,
          totalMarks: totalPossibleMarks,
        };
      })
    );

    res.json(progressData);
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ message: 'Server error while fetching progress' });
  }
});



module.exports = router;
