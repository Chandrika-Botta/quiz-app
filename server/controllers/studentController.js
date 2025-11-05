const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const mongoose = require('mongoose');

/**
 * List quizzes that are currently available (based on startAt/endAt if set)
 */
exports.listAvailableQuizzes = async (req, res) => {
    try {
        const now = new Date();
        const quizzes = await Quiz.find({
            $or: [
                { startAt: null, endAt: null },
                { startAt: { $lte: now }, endAt: { $gte: now } },
                { startAt: null, endAt: { $gte: now } },
                { startAt: { $lte: now }, endAt: null }
            ]
        }).sort({ startAt: 1, createdAt: -1 });
        res.json(quizzes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getQuizQuestions = async (req, res) => {
    try {
        const quizId = req.params.id;
        if (!mongoose.isValidObjectId(quizId)) return res.status(400).json({ message: 'Invalid quiz id' });

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // check availability
        const now = new Date();
        if (quiz.startAt && now < quiz.startAt) return res.status(400).json({ message: 'Quiz not started yet' });
        if (quiz.endAt && now > quiz.endAt) return res.status(400).json({ message: 'Quiz ended' });

        // fetch questions but remove correctAnswer
        const questions = await Question.find({ quiz: quizId }).select('-correctAnswer -__v');
        // send quiz meta + questions
        res.json({ quiz: { id: quiz._id, title: quiz.title, durationMinutes: quiz.durationMinutes }, questions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Evaluates a student's answer against the correct answer for a question.
 * @param {Object} question - The Question object from the database
 * @param {any} submittedAnswer - The answer submitted by the student
 * @returns {Object} - { isCorrect: boolean, marks: number }
 */
function evaluateAnswer(question, submittedAnswer) {
    let isCorrect = false;
    let marks = 0;
    const correct = question.correctAnswer;
  
    if (!question || submittedAnswer == null) {
      return { isCorrect, marks };
    }
  
    switch (question.type) {
      case 'mcq':
      case 'tf':
        // convert both to lowercase strings for flexible comparison
        isCorrect =
          submittedAnswer.toString().trim().toLowerCase() ===
          correct.toString().trim().toLowerCase();
        marks = isCorrect ? question.marks : 0;
        break;
  
      case 'descriptive':
        if (typeof submittedAnswer === 'string' && typeof correct === 'string') {
          isCorrect =
            submittedAnswer.trim().toLowerCase() ===
            correct.trim().toLowerCase();
        }
        marks = isCorrect ? question.marks : 0;
        break;
  
      case 'image':
        // simple text description match
        if (typeof submittedAnswer === 'string' && typeof correct === 'string') {
          isCorrect =
            submittedAnswer.trim().toLowerCase() ===
            correct.trim().toLowerCase();
        }
        marks = isCorrect ? question.marks : 0;
        break;
  
      default:
        marks = 0;
    }
  
    return { isCorrect, marks };
  }
  


exports.submitAttempt = async (req, res) => {
    try {
        const quizId = req.params.id;
        const { answers } = req.body; // expects [{ question: questionId, answer: ... }, ...]
        if (!Array.isArray(answers)) return res.status(400).json({ message: 'Answers must be an array' });

        // load questions in attempt set for scoring
        const questionIds = answers.map(a => a.question);
        const questions = await Question.find({ _id: { $in: questionIds } });

        // Map for quick lookup
        const qmap = {};
        for (const q of questions) qmap[q._id.toString()] = q;

        let totalScore = 0;
        const answerRecords = [];

        for (const a of answers) {
            const q = qmap[a.question];
            if (!q) {
                // invalid question id, skip
                continue;
            }
            console.log('Checking:', {
                questionId: q._id.toString(),
                type: q.type,
                correctAnswer: q.correctAnswer,
                studentAnswer: a.answer
            });

            const evalRes = evaluateAnswer(q, a.answer);
            totalScore += evalRes.marks;

            answerRecords.push({
                question: q._id,
                answer: a.answer,
                correct: evalRes.isCorrect,
                marksAwarded: evalRes.marks
            });
        }

        const attempt = new Attempt({
            quiz: quizId,
            user: req.user._id,
            answers: answerRecords,
            totalScore,
            submittedAt: new Date()
        });
        await attempt.save();

        res.json({ attemptId: attempt._id, totalScore });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.myAttempts = async (req, res) => {
    try {
        const attempts = await Attempt.find({ user: req.user._id }).populate('quiz', 'title subject').sort({ submittedAt: -1 });
        res.json(attempts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.evaluateAnswer = evaluateAnswer;
