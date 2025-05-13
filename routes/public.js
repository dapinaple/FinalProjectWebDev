import express from 'express';
import {ObjectId} from 'mongodb';
import {matches, teams, users, tournaments } from '../config/mongoCollections.js';

const router= express.Router();
//get active matches
router.get('/active-matches', async (req, res)=> {
  try {
    const matchCollection= await matches();
    const teamCollection= await teams();
    //todays date
    const todayISO= new Date().toISOString().split('T')[0];
    const todayMatches= await matchCollection.find({
      scheduledTime: {$regex: `^${todayISO}` }
    }).toArray();
    //team names
    const enriched= await Promise.all(todayMatches.map(async match=> {
      const teamA= await teamCollection.findOne({_id: new ObjectId(match.teamA)});
      const teamB= await teamCollection.findOne({_id: new ObjectId(match.teamB)});
      return {
        id: match._id.toString(),
        teamAId: match.teamA.toString(),
        teamBId: match.teamB.toString(),
        teamAName: teamA?.name || 'Team A',
        teamBName: teamB?.name || 'Team B',
        scheduledTime: match.scheduledTime,
        scoreA: match.scoreA || 0,
        scoreB: match.scoreB || 0,
        statsEntered: match.statsEntered || false
      };
    }));
    
    res.json(enriched);
  } catch (e){
    console.error('Error fetching active matches:', e);
    res.status(500).json({error: 'Failed to fetch active matches' });
  }
});

//player statistics for specific match
router.get('/match-stats/:matchId', async (req, res)=> {
  try {
    const {matchId }= req.params;
    if (!matchId||!ObjectId.isValid(matchId)){
      return res.status(400).json({error: 'Invalid match ID'});
    }
    
    const matchCollection= await matches();
    const userCollection= await users();
    const match= await matchCollection.findOne({_id: new ObjectId(matchId)});
    if (!match){
      return res.status(404).json({error: 'Match not found' });
    }
    if (!match.playerStats || match.playerStats.length=== 0){
      return res.json({
        matchId: matchId,
        teamAId: match.teamA.toString(),
        teamBId: match.teamB.toString(),
        stats: []
      });
    }
    //names
    const formattedStats= await Promise.all(match.playerStats.map(async stat=> {
      const player= await userCollection.findOne({_id: stat.playerId });
      
      return {
        playerId: stat.playerId.toString(),
        teamId: player?.teamId?.toString()|| null,
        //name: 'Unknown Player',
        name: player.name,
        kills: stat.kills || 0,
        digs: stat.digs || 0,
        blocks: stat.blocks || 0,
        assists: stat.assists || 0,
        aces: stat.aces || 0,
        errors: stat.errors || 0
      };
    }));
    res.json({
      matchId: matchId,
      teamAId: match.teamA.toString(),
      teamBId: match.teamB.toString(),
      stats: formattedStats
    });
  } catch (e){
    console.error('Error fetching match stats:', e);
    res.status(500).json({error: 'Failed to fetch match statistics' });
  }
});

export default router;