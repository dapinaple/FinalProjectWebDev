import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile('spectator.html', { root: './public' });
});

router.get('/results', (req, res) => {
  res.sendFile('scores.html', { root: './public' });
});

export default router;
