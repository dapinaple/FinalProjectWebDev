import express from 'express';
import {ObjectId} from 'mongodb';
import {users, complexes, tournaments} from '../config/mongoCollections.js';
import {isAuthenticated, hasRole} from '../middleware/authMiddleware.js';

const router = express.Router();

//get complexes
//Return all complexes owned by ComplexOwner
router.get('/', isAuthenticated, hasRole('ComplexOwner'), async (req, res) => {
  try {
    const complexCol = await complexes();
    const list = await complexCol.find({ownerId: new ObjectId(req.session.user.id)}).toArray();
    res.json(list);
  } 
  catch (e) {
    res.status(500).json({error: e.message});
  }
});

//get tournaments
//linked to this complex
router.get('/:id/tournaments', isAuthenticated, hasRole('ComplexOwner'), async (req, res) => {
  try {
    const tournamentCol = await tournaments();
    const list = await tournamentCol.find({complexId: new ObjectId(req.params.id)}).toArray();
    res.json(list);
  }
  catch (e) {
    res.status(500).json({error: e.message});
  }
});

//get complex name
router.get('/name/:name', isAuthenticated, async (req, res) => {
  try{
    const name = req.params.name;
    const complexCol = await complexes();
    const complex = await complexCol.findOne({name: { $regex: `^${name}$`, $options: 'i' }});
    if (!complex) return res.status(404).json({error: 'Complex not found'});
    res.json({ id: complex._id });
  }
  catch (e) {
    res.status(500).json({error: e.message});
  }
});

router.post('/create', isAuthenticated, hasRole('ComplexOwner'), async (req, res) => {
    try{
      const {name, address, directorEmail} = req.body;
      if (!name || !address) return res.status(400).json({ error: 'Name and address required' });
      const complexCol = await complexes();
      const userCol = await users();
      let directorId = null;
      if (directorEmail) {
        const director = await userCol.findOne({
          email: {$regex: `^${directorEmail}$`, $options: 'i'},
          role: 'TournamentDirector'
        });
  
        if (!director) return res.status(404).json({error: 'Director not found'});
        directorId = director._id;
  
        //associatedComplexId for director
        await userCol.updateOne({_id: directorId},
          {$set:{associatedComplexId: null}} // temporarily clear old
        );
      }
  
      const insert = await complexCol.insertOne({
        name,
        address,
        ownerId: new ObjectId(req.session.user.id),
        tournamentIds: []
      });
  
      const complexId = insert.insertedId;
  
      if (directorId) {
        await userCol.updateOne({_id: directorId },
          {$set:{associatedComplexId: complexId}}
        );
      }
      res.json({message: 'Complex created', complexId});
    }
    catch (e) {
      res.status(500).json({error: e.message});
    }
  });

  router.delete('/:id', isAuthenticated, hasRole('ComplexOwner'), async (req, res) => {
    try {
      const complexId =req.params.id;
      if (!ObjectId.isValid(complexId)) {
        return res.status(400).json({error: 'Invalid complex ID'});
      }
      const complexCol = await complexes();
      const userCol = await users();

      //ownership check
      const complex = await complexCol.findOne({ _id: new ObjectId(complexId) });
      if (!complex) {return res.status(404).json({ error: 'Complex not found' });}
      if (complex.ownerId.toString() !== req.session.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this complex' });
      }

      //TournamentDirector removed
      await userCol.updateMany(
        { associatedComplexId: new ObjectId(complexId) },
        { $set: { associatedComplexId: null } }
      );
      //complex delete
      const deletionResult = await complexCol.deleteOne({ _id: new ObjectId(complexId) });

      if (deletionResult.deletedCount === 0) {
        return res.status(500).json({ error: 'Failed to delete complex' });
      }
      res.json({ success: true, message: 'Complex deleted' });
    }
    catch(e) {
      res.status(500).json({error: e.message});
    }
  });
  
  // Publicly list all complexes (for dropdowns)
    router.get('/all-public', isAuthenticated, async (req, res) => {
        try {
        const complexCol=await complexes();
        const list =await complexCol.find({}, {projection:{name: 1}}).toArray();
        res.json(list);
        }
        catch(e) {
        res.status(500).json({error: e.message});
        }
    });
  
export default router;
