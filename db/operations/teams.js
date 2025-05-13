import { teams, users } from '../../config/mongoCollections.js';
import { ObjectId } from 'mongodb';


export async function getTeam(teamId) {
  const teamCollection = await teams();
  const res = await teamCollection.getOne({_id: new ObjectId(teamId)});
  if(!res) throw new Error('Cannot find team')
}

export async function createTeam({ name, teamRepresentativeID, repId }) {
  const teamCollection = await teams();
  const newTeam = {
    name,
    teamRepresentativeID,
    repId: new ObjectId(repId),
    players: []
  };
  const result = await teamCollection.insertOne(newTeam);
  return { _id: result.insertedId, ...newTeam };
}

// export async function addPlayerToTeam(teamId, playerId) {
//   const teamCollection = await teams();
//   const userCollection = await users();

//   const team = await teamCollection.findOne({ email: new ObjectId(teamId) });
//   const player = await userCollection.findOne({ email: playerId);

//   if (!team) throw new Error('Team not found');
//   if (!player) throw new Error('Player not found');

//   await teamCollection.updateOne(
//     { email: new ObjectId(teamId) },
//     { $addToSet: { players: new ObjectId(playerId) } }
//   );

//   await userCollection.updateOne(
//     { email: new ObjectId(playerId) },
//     { $set: { teamId: new ObjectId(teamId) } }
//   );

//   return await teamCollection.findOne({ _id: new ObjectId(teamId) });
// }

export async function addPlayerToTeam(teamId, email) {
  const teamCollection = await teams();
  const userCollection = await users();

  // Find player by case-insensitive email
  const player = await userCollection.findOne({
    email: { $regex: `^${email}$`, $options: 'i' },
    role: 'Player'
  });

  if (!player) throw new Error('Player not found');

  // Add player to team
  await teamCollection.updateOne(
    { _id: new ObjectId(teamId) },
    { $addToSet: { players: player._id } }
  );

  // Update player's teamId
  await userCollection.updateOne(
    { _id: player._id },
    { $set: { teamId: new ObjectId(teamId) } }
  );

  // Return updated team
  return await teamCollection.findOne({ _id: new ObjectId(teamId) });
}