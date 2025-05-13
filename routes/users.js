import express from 'express';
import { users } from '../config/mongoCollections.js'; 

const router =express.Router();

router.get('/', async (req, res) => {
  try {
    const usersCollection =await users();
    const userList =await usersCollection.find({}, {projection: {passwordHash: 0}}).toArray();
    res.json(userList);
  }
  catch (e) {
    console.error(e.message);
    res.status(500).send('Server error');
  }
});

export default router;

