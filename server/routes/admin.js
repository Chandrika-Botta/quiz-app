const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminCheck = require('../middleware/adminCheck');
const multer = require('multer');
const path = require('path');
const Question = require('../models/Question');

const adminController = require('../controllers/adminController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// all admin routes require auth + admin role
router.use(auth, adminCheck);

// create a quiz
router.post('/quizzes', adminController.createQuiz);

// list quizzes of admin
router.get('/quizzes', adminController.listQuizzes);

// Get all questions for a quiz
router.get('/quizzes/:id/questions', async (req, res) => {
    try {
      const questions = await Question.find({ quiz: req.params.id });
      res.json(questions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Failed to fetch questions' });
    }
  });
  
// add question to quiz (supports image upload field named 'image')
router.post('/quizzes/:id/questions', upload.single('image'), adminController.addQuestion);

// view attempts for quiz
router.get('/quizzes/:id/attempts', adminController.viewAttempts);

// Edit a quiz
router.put('/quizzes/:id', adminController.updateQuiz);

// Delete a quiz
router.delete('/quizzes/:id', adminController.deleteQuiz);
router.get('/student-scores', adminController.getStudentScores);



module.exports = router;
