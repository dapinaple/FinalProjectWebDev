import express from 'express';
import {createMatch, reportMatchScore, enterPlayerStats} from '../db/operations/matches.js';
import {updateWinLoss} from '../db/operations/rankings.js';
import {isAuthenticated, hasRole} from '../middleware/authMiddleware.js';
const router = express.Router();

router.get('/', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try{
    const MatchCollection = await matches();
    console.log(req.session.user.id)
    const list = await MatchCollection.find({ directorId: new ObjectId(req.session.user.id) }).toArray();
    res.json(list);
  }
  catch(e) {
    res.status(500).json({error: e.message});
  }
});

router.post('/', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    const match=await createMatch(req.body);
    res.status(201).json(match);
  }
  catch(e) {
    res.status(500).json({error: e.message});
  }
});

router.post('/:matchId/report-score', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    const {matchId} = req.params;
    const {scoreA, scoreB, complexId}= req.body;

    const match = await reportMatchScore(matchId, scoreA, scoreB);
    await updateWinLoss(match.winner, match.teamA.equals(match.winner) ? match.teamB : match.teamA, complexId);
    req.app.get('io').emit('scoreUpdated', {
      matchId: match._id,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      winner: match.winner
    });
    res.json(match);
  }
  catch(e){
    res.status(500).json({error: e.message});
  }
});

router.post('/:matchId/enter-stats', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    await enterPlayerStats(req.params.matchId, req.body.stats);
    res.json({message: 'Stats saved'});
  }
  catch (e){
    res.status(500).json({error: e.message});
  }
});

export default router;
