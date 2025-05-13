import express from 'express';
import {createTournament, addTeamToTournament} from '../db/operations/tournaments.js';
import {tournaments, matches} from '../config/mongoCollections.js';
import {isAuthenticated, hasRole} from '../middleware/authMiddleware.js';
import {ObjectId} from 'mongodb';

const router = express.Router();

// router.get('/', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
//   try {
//     const tournamentCollection= await tournaments();
//     const list= await tournamentCollection
//       .find({directorId: new ObjectId(req.session.user.id)})
//       .toArray();
//     res.json(list);
//   }
//catch(e) {
//     res.status(500).json({error: e.message});
//   }
// });

router.get('/', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    const tournamentCollection= await tournaments();
    const list= await tournamentCollection
      .find({directorId: new ObjectId(req.session.user.id)})
      .toArray();
    res.json(list);
  }
  catch(e) {
    res.status(500).json({error: e.message});
  }
});


router.post('/', isAuthenticated, hasRole('TournamentDirector'), async (req, res) => {
  try {
    const {name, complexId, startDate, endDate}= req.body;
    if (!ObjectId.isValid(complexId)) {
      return res.status(400).json({error: 'Invalid complex ID'});
    }
    const tournament= await createTournament({
      name,
      complexId,
      startDate,
      endDate,
      directorId: req.session.user.id
    });
    res.status(201).json(tournament);
  }
  catch(e){
    res.status(500).json({error: e.message });
 }
});

router.delete('/:id', isAuthenticated, async (req, res)=> {
  try {
    const id= req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({error: 'Invalid tournament ID'});

    const tournamentCol= await tournaments();
    const tournament= await tournamentCol.findOne({_id: new ObjectId(id)});

    if (!tournament) return res.status(404).json({error: 'Tournament not found'});

    if (
      req.session.user.role=== 'ComplexOwner' ||
      req.session.user.role=== 'TournamentDirector'
    ) {
      const matchCol= await matches();
      await matchCol.deleteMany({tournamentId: new ObjectId(id)});

      
      const deletionResult= await tournamentCol.deleteOne({_id: new ObjectId(id)});
      if (deletionResult.deletedCount=== 0) {
        return res.status(500).json({error: 'Failed to delete tournament'});
      }
      return res.json({success: true, message: 'Tournament deleted'});
    }

    return res.status(403).json({error: 'Not authorized to delete this tournament'});
  } 
  catch(e) {
    res.status(500).json({error: e.message});
  }
});

router.post('/:tournamentId/add-team', isAuthenticated, hasRole('ComplexOwner', 'TournamentDirector'), async (req, res) => {
  try {
    const {tournamentId}= req.params;
    const {teamId}= req.body;
    const updated= await addTeamToTournament(tournamentId, teamId);
    res.json(updated);
  }
  catch(e) {
    res.status(500).json({error: e.message});
  }
});

export default router;
