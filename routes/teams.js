import express from 'express';
import{createTeam, addPlayerToTeam}from '../db/operations/teams.js';
import{isAuthenticated, hasRole}from '../middleware/authMiddleware.js';
import{ObjectId}from 'mongodb';
import{teams, users}from '../config/mongoCollections.js';
const router = express.Router();

router.get('/', async (req, res) =>{
  try{
    if (!req.session.user || req.session.user.role !== 'TeamRep'){
      return res.status(403).json({error: 'Forbidden'});
    }

    const teamCollection = await teams();
    const userCollection = await users();
    const team = await teamCollection.findOne({repId: new ObjectId(req.session.user.id)});

    if (!team) return res.status(404).json({error: 'No team found for this rep'});

    const playerList = await userCollection
      .find({_id:{$in: team.players}})
      .project({name: 1})
      .toArray();

    team.players = playerList;

    res.json([team]);
  }
  catch (e){
      res.status(500).json({error: e.message});
  }
});

router.post('/', isAuthenticated, hasRole('TeamRep'), async (req, res) =>{
  try{
    const team =await createTeam(req.body);
    res.status(201).json(team);
  }
  catch (e){
    res.status(500).json({error: e.message});
    }
  });

router.post('/:teamId/add-player', isAuthenticated, hasRole('TeamRep'), async (req, res) =>{
  try{
    const{teamId}= req.params;
    const{email}= req.body;

    if (!email) return res.status(400).json({error: 'Email is required'});
    if (!ObjectId.isValid(teamId)){
      return res.status(400).json({error: 'Invalid team ID format'});
    }
    const teamCollection = await teams();
    const userCollection = await users();

    const team = await teamCollection.findOne({_id: new ObjectId(teamId)});
    if (!team) return res.status(404).json({error: 'Team not found'});

    if (team.repId.toString() !== req.session.user.id){
      return res.status(403).json({error: 'Not authorized to modify this team'});
    }

    const player = await userCollection.findOne({
      email:{$regex: `^${email}$`, $options: 'i'},
      role: 'Player'
    });

    if (!player) return res.status(404).json({error: 'Player not found'});
    if (player.teamId){return res.status(400).json({error: 'Player is already assigned to a team'});}

    await teamCollection.updateOne(
      {_id: new ObjectId(teamId)},

      {$addToSet:{players: player._id}}
    );

    await userCollection.updateOne(
      {_id: player._id},
      {$set:{teamId: new ObjectId(teamId)}}
    );
    res.json({message: 'Player added to team'});
  }
  catch (e){
      console.error(e);
      res.status(500).json({error: e.message});
  }
});



router.get('/:id/stats', async (req, res) =>{
  try{
    const teamId = req.params.id;
    const userCollection = await users();
    const teamCollection = await teams();

    const team = await teamCollection.findOne({_id: new ObjectId(teamId)});
    if (!team){return res.status(404).json({error: 'Team not found'});}

    const players= await userCollection.find({teamId: new ObjectId(teamId)}).toArray();
    const totals={
      players: players.length,
      kills: 0,
      digs: 0,
      blocks: 0,
      assists: 0,
      aces: 0,
      errors: 0
    };

    players.forEach(p=>{
      const s= p.stats ||{};
      totals.kills += s.kills || 0;
      totals.digs += s.digs || 0;
      totals.blocks += s.blocks || 0;
      totals.assists += s.assists || 0;
      totals.aces += s.aces || 0;
      totals.errors += s.errors || 0;
    });
      console.log(totals);
      res.json(totals);
  }catch(e){
        res.status(500).json({error: 'Failed to compute team stats'});
  }

  
})


//deletes team
/*
router.delete('/:id', isAuthenticated, async (req, res) =>{
  try{
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({error: 'Invalid team ID'});

    const teamCol = await teams();
    const deletion = await teamCol.deleteOne({_id: new ObjectId(id)});

    if (deletion.deletedCount === 0) return res.status(404).json({error: 'Team not found or not deleted'});

    res.json({success: true});
}catch (e){
    res.status(500).json({error: e.message});
}
});
*/


router.delete('/:teamId/remove-player/:playerId', isAuthenticated, async (req, res) =>{
  
  try{
    const{teamId, playerId}= req.params;

    if (!ObjectId.isValid(teamId) || !ObjectId.isValid(playerId)){
      return res.status(400).json({error: 'Invalid team or player ID'});}

    const teamCol= await teams();
    const result= await teamCol.updateOne(
      {_id: new ObjectId(teamId)},
      {$pull:{players: new ObjectId(playerId)}}
    );
    if (result.modifiedCount=== 0){
      return res.status(404).json({error: 'Player not found or not removed'});
    }

    res.json({success: true});
  }catch (e){
      res.status(500).json({error: e.message});
  }
});



//     const team = await teamCollection.findOne({_id: new ObjectId(teamId)});
//     if (!team) return res.status(404).json({error: 'Team not found'});
//     if (team.repId.toString() !== req.session.user.id){
//       return res.status(403).json({error: 'Not authorized to modify this team'});
//     }

//     const player = await userCollection.findOne({
//       email:{$regex: `^${email}$`, $options: 'i'},
//       role: 'Player'
//});

//     if (!team) return res.status(404).json({error: 'Team not found'});
//     if (team.repId.toString() !== req.session.user.id){
//       return res.status(403).json({error: 'Not authorized to modify this team'});
//}

export default router;
