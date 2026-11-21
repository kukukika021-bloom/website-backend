const mongoose = require('mongoose');
const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true, trim: true },
  question: { type: String, required: true, maxlength: 300 },
  selectedIndex: { type: Number, required: true, min: 0, max: 9 },
  selectedOption: { type: String, required: true, maxlength: 200 },
  isCorrect: { type: Boolean, required: true },
}, { _id: false });

const quizSubmissionSchema = new mongoose.Schema({
  submissionId: { type: String, required: true, unique: true, match: /^[0-9a-f-]{36}$/i },
  answers: { type: [answerSchema], validate: [(a) => a.length > 0, 'answers required'] },
  score: { type: Number, required: true, min: 0 },
  totalQuestions: { type: Number, required: true, min: 1 },
  quizCompletedAt: { type: Date, required: true },
  yesClicked: { type: Boolean, default: false },
  noAttempts: { type: Number, default: 0, min: 0, max: 100000 },
  gameCompletedAt: { type: Date },
  // quiz_completed = quiz saved, love game not finished yet; completed = whole experience done
  status: { type: String, enum: ['quiz_completed', 'completed'], default: 'quiz_completed' },
}, { timestamps: true });

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);
