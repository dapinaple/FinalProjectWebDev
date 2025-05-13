import express from 'express';
import {users, tournaments, matches} from '../config/mongoCollections.js';
import {ObjectId} from 'mongodb';

const router = express.Router();

router.get('/tournaments', async (req, res) => {
  try{
    const tournamentCol = await tournaments();
    const all = await tournamentCol.find({}, {projection: { name: 1, startDate: 1, endDate: 1}}).toArray();
    res.json(all);
  }
  catch(e){
    res.status(500).json({error: e.message});
  }
});

router.get('/tournaments/:id/matches', async (req, res) => {
  try{
    const matchCol = await matches();
    const matchList = await matchCol.find({tournamentId: new ObjectId(req.params.id)}).toArray();
    res.json(matchList);
  }
  catch(e){
    res.status(500).json({error: e.message});
  }
});

router.get('/players', async (req, res) =>{
  try {
    const userCol = await users();
    const allPlayers = await userCol.find({ role: 'Player' }, { projection: { name: 1, stats: 1 } }).toArray();
    res.json(allPlayers);
  }
  catch(e){
    res.status(500).json({error: e.message});
  }
});

router.get('/players/:id', async (req, res) => {
  try {
    const userCol = await users();
    const player = await userCol.findOne({ _id: new ObjectId(req.params.id)}, {projection: { name: 1, stats: 1, role: 1 }});
    if (!player|| player.role !=='Player') return res.status(404).json({error: 'Player not found'});
    res.json(player);
  }
  catch(e){
    res.status(500).json({error: e.message});
  }
});

export default router;
