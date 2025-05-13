import express from 'express';
import bcrypt from 'bcrypt';
import {createUser, getUserByEmail} from '../db/operations/users.js';

const router = express.Router();
//home account creaton routes
router.post('/register', async (req, res) => {
  try {
    const {role, name, email, password}= req.body;
    if (!role||!name||!email||!password) {
      return res.status(400).json({error: 'Missing fields'});
    }

    const existing = await getUserByEmail(email);
    if (existing) return res.status(400).json({error: 'Email already registered'});

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser({role, name, email, passwordHash});

    res.status(201).json({message: 'User registered', id: newUser._id});
  } 
  catch (e) {
    console.error(e);
    res.status(500).json({error: 'Internal server error'});
  }
});

router.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body;
    const user= await getUserByEmail(email);
    if (!user||!(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({error: 'Invalid credentials'});
    }

    req.session.user ={
      id: user._id,
      name: user.name,
      role: user.role
    };

    res.json({message: 'Login successful', user: req.session.user});
  } catch (e) {
    console.error(e);
    res.status(500).json({error: 'Login failed'});
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(e => {
    if (e) return res.status(500).json({error: 'Logout failed'});
    res.clearCookie('VolleyManagerSession');
    res.json({message: 'Logged out successfully'});
  });
});

export default router;
