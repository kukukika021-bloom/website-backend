const QuizSubmission = require('../models/QuizSubmission');
const answerKey = require('../config/answerKey');
const ID = /^[0-9a-f-]{36}$/i;
const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
const ok = (doc, extra = {}) => ({ success: true, submissionId: doc.submissionId, score: doc.score, total: doc.totalQuestions, status: doc.status, ...extra });

function buildAnswers(raw) {
  const ids = Object.keys(answerKey);
  if (!Array.isArray(raw) || raw.length !== ids.length) throw bad('Please answer every question.');
  const seen = new Set();
  return raw.map((a) => {
    if (!a || !(a.questionId in answerKey) || seen.has(a.questionId)) throw bad('Unknown or duplicate question.');
    seen.add(a.questionId);
    if (!Number.isInteger(a.selectedIndex) || a.selectedIndex < 0 || a.selectedIndex > 9) throw bad('Invalid answer.');
    if (typeof a.question !== 'string' || typeof a.selectedOption !== 'string') throw bad('Invalid answer text.');
    return {
      questionId: a.questionId, question: a.question.slice(0, 300), selectedIndex: a.selectedIndex,
      selectedOption: a.selectedOption.slice(0, 200), isCorrect: a.selectedIndex === answerKey[a.questionId], // score decided here, never by the client
    };
  });
}

exports.submit = async (req, res, next) => {
  try {
    const { submissionId, stage } = req.body || {};
    if (typeof submissionId !== 'string' || !ID.test(submissionId)) throw bad('Invalid submission id.');

    if (stage === 'quiz') {
      const existing = await QuizSubmission.findOne({ submissionId });
      if (existing) return res.json(ok(existing, { duplicate: true }));
      const answers = buildAnswers(req.body.answers);
      try {
        const doc = await QuizSubmission.create({
          submissionId, answers, score: answers.filter((a) => a.isCorrect).length,
          totalQuestions: answers.length, quizCompletedAt: new Date(),
        });
        return res.status(201).json(ok(doc));
      } catch (e) {
        if (e.code === 11000) return res.json(ok(await QuizSubmission.findOne({ submissionId }), { duplicate: true }));
        throw e;
      }
    }

    if (stage === 'final') {
      const { yesClicked, noAttempts } = req.body;
      if (typeof yesClicked !== 'boolean') throw bad('yesClicked must be true or false.');
      if (!Number.isInteger(noAttempts) || noAttempts < 0 || noAttempts > 100000) throw bad('Invalid noAttempts.');
      const doc = await QuizSubmission.findOneAndUpdate(
        { submissionId, status: 'quiz_completed' },
        { yesClicked, noAttempts, gameCompletedAt: new Date(), status: 'completed' }, { new: true });
      if (doc) return res.json(ok(doc));
      const existing = await QuizSubmission.findOne({ submissionId });
      if (existing) return res.json(ok(existing, { duplicate: true }));
      return res.status(404).json({ success: false, message: 'Submission not found. Finish the quiz first.' });
    }
    throw bad('Invalid stage.');
  } catch (err) { next(err); }
};
