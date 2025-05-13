import express from 'express';
import { matches, tournaments } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware.js';
import { createMatch } from '../db/operations/matches.js';

const router = express.Router();

router.get('/', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    const userId = new ObjectId(req.session.user.id);

    const tournamentCollection = await tournaments();
    const userTournaments = await tournamentCollection
      .find({ directorId: userId })
      .project({ _id: 1 })
      .toArray();

    const tournamentIds = userTournaments.map(t => t._id);

    const matchCollection = await matches();
    const userMatches = await matchCollection
      .find({ tournamentId: { $in: tournamentIds } })
      .toArray();

    res.json(userMatches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    console.log(req.body)
    const match = await createMatch(req.body);
    res.status(201).json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:matchId/report-score', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    const { matchId } = req.params;
    const { scoreA, scoreB, complexId } = req.body;

    const match = await reportMatchScore(matchId, scoreA, scoreB);
    await updateWinLoss(match.winner, match.teamA.equals(match.winner) ? match.teamB : match.teamA, complexId);

    req.app.get('io').emit('scoreUpdated', {
      matchId: match._id,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      winner: match.winner
    });

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:matchId/enter-stats', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    await enterPlayerStats(req.params.matchId, req.body.stats);
    res.json({ message: 'Stats saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
