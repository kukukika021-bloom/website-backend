const router = require('express').Router();
const { submit } = require('../controllers/quizController');
router.post('/submit', submit);
module.exports = router;
