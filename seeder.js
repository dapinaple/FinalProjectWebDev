// Seeder script (insert into your MongoDB init script or a dedicated seeder.js file)
import { dbConnection, closeConnection } from './config/mongoConnection.js';
import { users, complexes, teams, tournaments, matches } from './config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const hashPassword = async (plaintext) => {
  const bcrypt = await import('bcrypt');
  const saltRounds = 10;
  return bcrypt.default.hash(plaintext, saltRounds);
};

const createUser = async (role, firstName, lastName) => {
  const userCol = await users();
  const email = `${lastName}@gmail.com`;
  const passwordHash = await hashPassword(`${lastName}1234!`);
  const user = {
    role,
    name : firstName+lastName,
    email,
    passwordHash,
    stats: role === 'Player' ? { kills: 0, digs: 0, blocks: 0, assists: 0, aces: 0, errors: 0 } : undefined
  };
  const { insertedId } = await userCol.insertOne(user);
  return insertedId;
};

const randomStats = () => ({
  kills: Math.floor(Math.random() * 10),
  digs: Math.floor(Math.random() * 10),
  blocks: Math.floor(Math.random() * 10),
  assists: Math.floor(Math.random() * 10),
  aces: Math.floor(Math.random() * 5),
  errors: Math.floor(Math.random() * 5)
});

const runSeeder = async () => {
  const db = await dbConnection();
  await db.dropDatabase();

  const complexCol = await complexes();
  const complexNames = ['Schaefer', 'Walker', 'UCC', 'DeBaun', 'CPH', 'Canavan', 'ATC'];
  const favardinId = await createUser('ComplexOwner', 'Naramin', 'Favardin');

  const complexIds = [];
  for (const name of complexNames) {
    const { insertedId } = await complexCol.insertOne({ name, location: name, ownerId: favardinId });
    complexIds.push(insertedId);
  }

  const balziniId = await createUser('TournamentDirector', 'Tony', 'Balzini');

  const hillId = await createUser('TeamRep', 'Patrick', 'Hill');
  const teamCol = await teams();
  const hillTeamId = (await teamCol.insertOne({ name: 'Hill', repId: hillId, players: [] })).insertedId;
  const userCol = await users();

  const hillPlayers = ['Isabelle Villanueva', 'Zachary Rimshnick', 'Andrew Hing', 'Zain Bokhari', 'Jack Gibson', 'Shailja Maheshwari', 'Jacob Rosengarten', 'Alexander Jansiewicz'];
  const hillPlayerIds = [];
  for (const fullName of hillPlayers) {
    const [first, last] = fullName.split(' ');
    const playerId = await createUser('Player', first, last);
    hillPlayerIds.push(playerId);
    await teamCol.updateOne({ _id: hillTeamId }, { $push: { players: playerId } });
    await userCol.updateOne({ _id: playerId }, { $set: { teamId: hillTeamId } });
  }

  const haoId = await createUser('TeamRep', 'Shudong', 'Hao');
  const haoTeamId = (await teamCol.insertOne({ name: 'Hao', repId: haoId, players: [] })).insertedId;

  const haoPlayers = ['Matt Bernardon', 'Andrew Schomber', 'Marcos Traverso', 'Daniel Zamloot', 'Joseph DePalo', 'Josh Bernstein', 'Nick Mirigliani', 'Dean Zazzera', 'Ryan Monaghan'];
  const haoPlayerIds = [];
  for (const fullName of haoPlayers) {
    const [first, last] = fullName.split(' ');
    const playerId = await createUser('Player', first, last);
    haoPlayerIds.push(playerId);
    await teamCol.updateOne({ _id: haoTeamId }, { $push: { players: playerId } });
    await userCol.updateOne({ _id: playerId }, { $set: { teamId: haoTeamId } });
  }

  const kimId = await createUser('TournamentDirector', 'Samuel', 'Kim');
  const tournamentCol = await tournaments();
  const matchCol = await matches();
  const todayDate = new Date();
  const lastYearDate = new Date();
  lastYearDate.setFullYear(todayDate.getFullYear() - 1);
  const walkerComplexId = complexIds[1];

  const createTournamentWithMatch = async (name, date, isPast = false) => {
    const tournamentId = (await tournamentCol.insertOne({
      name,
      complexId: walkerComplexId,
      directorId: kimId,
      teams: [hillTeamId, haoTeamId],
      matches: [],
      startDate: date,
      endDate: date
    })).insertedId;

    const matchId = (await matchCol.insertOne({
      tournamentId,
      teamA: hillTeamId,
      teamB: haoTeamId,
      scoreA: Math.floor(Math.random() * 25),
      scoreB: Math.floor(Math.random() * 25),
      statsEntered: true,
      scheduledTime: date.toISOString(),
      playerStats: [...hillPlayerIds, ...haoPlayerIds].map(playerId => ({
        playerId,
        ...randomStats()
      }))
    })).insertedId;

    await tournamentCol.updateOne({ _id: tournamentId }, { $push: { matches: matchId } });
  };

  await createTournamentWithMatch('TA Takedown', todayDate);
  await createTournamentWithMatch('TA Takedown 2024', lastYearDate, true);

  console.log('Database seeded with test and past tournaments, matches, and stats.');
  await closeConnection();
};

runSeeder();
