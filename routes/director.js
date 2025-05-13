import express from 'express';
import { ObjectId } from 'mongodb';
import { users, tournaments, matches, teams } from '../config/mongoCollections.js';
import {isAuthenticated, hasRole} from '../middleware/authMiddleware.js';

const router =express.Router();

router.get('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !=='TournamentDirector') {
    return res.redirect('/login');
  }
  res.sendFile('director.html', { root: 'public' });
});

router.get('/live-matches', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    const matchCollection =await matches();
    const tournamentCollection =await tournaments();
    const teamCollection =await teams();
    const directorId =req.session.user.id;
    const tournamentsList =await tournamentCollection.find({ directorId: new ObjectId(directorId) }).toArray();
    const tournamentIds =tournamentsList.map(t => t._id);
    const todayISO =new Date().toISOString().split('T')[0];
    const todayMatches =await matchCollection.find({
      scheduledTime: { $regex: `^${todayISO}` },
      tournamentId: { $in: tournamentIds }
    }).toArray();

    const enriched =await Promise.all(todayMatches.map(async match => {
      const teamA =await teamCollection.findOne({ _id: new ObjectId(match.teamA) });
      const teamB =await teamCollection.findOne({ _id: new ObjectId(match.teamB) });

      return {
        id: match._id,
        teamAName: teamA?.name || 'Team A',
        teamBName: teamB?.name || 'Team B',
        scheduledTime: match.scheduledTime,
        scoreA: match.scoreA || 0,
        scoreB: match.scoreB || 0
      };
    }));

    res.json(enriched);
  } catch (e) {
    console.error('Live match route error:', e);
    res.status(500).json({ error: 'Failed to load matches: ' + e.message });
  }
});

//get team roster for specific match
router.get('/match-roster/:matchId/:teamDesignation', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    const { matchId, teamDesignation } =req.params;
    
    if (!matchId || !ObjectId.isValid(matchId)) {
      return res.status(400).json({ error: 'Invalid match ID' });
    }
    
    if (teamDesignation !=='A' && teamDesignation !=='B') {
      return res.status(400).json({ error: 'Team designation must be A or B' });
    }
    
    const matchCollection =await matches();
    const teamCollection =await teams();
    const userCollection =await users();
    
    const match =await matchCollection.findOne({ _id: new ObjectId(matchId) });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const teamId =teamDesignation ==='A' ? match.teamA : match.teamB;
    //get team
    const team =await teamCollection.findOne({ _id: new ObjectId(teamId) });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    //get players
    const playerIds =team.players || [];
    //objectids to strings
    const playerObjectIds =playerIds.map(id => 
      id instanceof ObjectId ? id : new ObjectId(id)
    );
    
    const players =await userCollection.find({
      _id: { $in: playerObjectIds }
    }).toArray();
    const formattedPlayers =players.map(player => {
      let matchStats =null;
      if (match.playerStats) {
        const playerStat =match.playerStats.find(
          stat => stat.playerId.toString() ===player._id.toString()
        );
        if (playerStat) {
          matchStats ={
            kills: playerStat.kills || 0,
            digs: playerStat.digs || 0,
            blocks: playerStat.blocks || 0,
            assists: playerStat.assists || 0,
            aces: playerStat.aces || 0,
            errors: playerStat.errors || 0
          };
        }
      }
      return {
        id: player._id.toString(),
        name: player.name,
        number: player.jerseyNumber || '',
        matchStats
      };
    });
    res.json({
      teamId: teamId.toString(),
      teamName: team.name,
      roster: formattedPlayers
    });
  }
  catch (e) {
    console.error('Match roster route error:', e);
    res.status(500).json({ error: 'Failed to load team roster: ' + e.message });
  }
});

export default router;