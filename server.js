const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const app = express();
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({ origin: origins, methods: ['POST', 'GET'] }));
app.use(express.json({ limit: '20kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || (err.name === 'ValidationError' ? 400 : err.type === 'entity.parse.failed' ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message: status === 500 ? 'Something went wrong on the server.' : err.message });
});
connectDB()
  .then(() => app.listen(process.env.PORT || 5000, () => console.log(`API on :${process.env.PORT || 5000}`)))
  .catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
