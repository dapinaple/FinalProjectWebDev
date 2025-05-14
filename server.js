import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';

import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { matches, users } from './config/mongoCollections.js'; 

import tournamentRoutes from './routes/tournaments.js';
import teamRoutes from './routes/teams.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import publicRoutes from './routes/public.js';
import complexRoutes from './routes/complexes.js';
//import spectatorRoutes from './routes/spectator.js';
import directorRoutes from './routes/director.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  name: 'VolleyManagerSession',
  secret: 'gaming',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

//api routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/complexes', complexRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/spectator', spectatorRoutes);

//html routes
app.get('/register', (req, res) => res.sendFile(path.resolve('public/register.html')));
app.get('/login', (req, res) => res.sendFile(path.resolve('public/login.html')));
app.get('/players', (req, res) => res.sendFile(path.resolve('public/players_list.html')));
app.get('/players/:id', (req, res) => res.sendFile(path.resolve('public/player_profile.html')));
app.get('/teams', (req, res) => res.sendFile(path.resolve('public/teams.html')));
app.get('/tournaments', (req, res) => res.sendFile(path.resolve('public/tournaments.html')));
app.get('/admin', (req, res) => res.sendFile(path.resolve('public/admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/director', (req, res) => res.sendFile(path.join(__dirname, 'public/director.html')));
app.get('/scoreboard', (req, res) => res.sendFile(path.join(__dirname, 'public/scoreboard.html')));

//socket setup
io.on('connection', socket => {
  console.log('Client connected');

  socket.on('scoreUpdate', async (data) => {
    console.log('Received score update:', data);
    try {
      const matchCol = await matches();
      const matchId = new ObjectId(data.matchId);

      const result = await matchCol.updateOne(
        { _id: matchId },
        { $set: { scoreA: data.scoreA, scoreB: data.scoreB } }
      );
      console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount);
      io.emit('broadcastScore', data);
    } 
    catch (err) {
      console.error('Failed to update match in DB:', err);
    }
  });

  socket.on('submitPlayerStats', async (data) => {
    try {
      const userCol = await users();
      const matchCol = await matches();
      const { matchId, statsByPlayerId } = data;
      console.log(`Processing stats for match ${matchId} with ${Object.keys(statsByPlayerId).length} players`);
      const statKeys = ['kills', 'digs', 'blocks', 'assists', 'aces', 'errors'];
      await matchCol.updateOne(
        { _id: new ObjectId(matchId) },
        { $set: { playerStats: [] } }
      );
      //each player stats
      for (const [playerId, playerStats] of Object.entries(statsByPlayerId)) {
        const hasStats = statKeys.some(key => Number(playerStats[key]) > 0);
        if (!hasStats) continue;
        //update cumulative stats
        await userCol.updateOne(
          { _id: new ObjectId(playerId) },{
            $inc: statKeys.reduce((acc, key) => {
              acc[`stats.${key}`] = Number(playerStats[key]) || 0;
              return acc;
            }, {})
          }
        );
        //match specific stats
        await matchCol.updateOne(
          { _id: new ObjectId(matchId) },
          {
            $push: {
              playerStats: {
                playerId: new ObjectId(playerId),
                ...statKeys.reduce((acc, key) => {
                  acc[key] = Number(playerStats[key]) || 0;
                  return acc;
                }, {})
              }
            },
            $set: { statsEntered: true }
          }
        );
      }

      console.log('Player stats updated for match', matchId);
      //send player stats updates
      io.emit('playerStatsUpdated', { 
        matchId: matchId,
        timestamp: new Date().toISOString()
      });
      
    } 
    catch (err) {
      console.error('Error processing player stats:', err);
    }
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
const P = process.env.PORT || 5000;
server.listen(P, () => console.log(`VolleyManager running at http://localhost:${P}`));