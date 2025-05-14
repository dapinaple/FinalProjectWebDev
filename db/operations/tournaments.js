import { tournaments } from '../../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import { validateString } from '../../helpers.js';

// export async function createTournament({ name, complexId, directorId, startDate, endDate }) {
//   const tournamentCollection = await tournaments();
//   const newTournament = {
//     name,
//     complexId: new ObjectId(complexId),
//     directorId: new ObjectId(directorId),
//     teams: [],
//     matches: [],
//     startDate: new Date(startDate),
//     endDate: new Date(endDate)
//   };
//   const result = await tournamentCollection.insertOne(newTournament);
//   return { _id: result.insertedId, ...newTournament };
// }
// export async function createTournament({ name, complexId, directorId, startDate, endDate }) {
//   if (!ObjectId.isValid(complexId)) throw new Error('Invalid complexId format');
//   if (!ObjectId.isValid(directorId)) throw new Error('Invalid directorId format');

//   const tournamentCollection = await tournaments();
//   const newTournament = {
//     name,
//     complexId: new ObjectId(complexId),
//     directorId: new ObjectId(directorId),
//     teams: [],
//     matches: [],
//     startDate: new Date(startDate),
//     endDate: new Date(endDate)
//   };
//   const result = await tournamentCollection.insertOne(newTournament);
//   return { _id: result.insertedId, ...newTournament };
// }
export async function createTournament({ name, complexId, directorId, startDate, endDate }) {
  if (!ObjectId.isValid(complexId)) throw new Error('Invalid complexId');
  if (!ObjectId.isValid(directorId)) throw new Error('Invalid directorId');

  name = validateString(name)
  complexId = validateString(complexId)
  directorId = validateString(directorId)

  const tournamentCollection = await tournaments();

 
  const duplicate = await tournamentCollection.findOne({
    name,
    complexId: new ObjectId(complexId),
    startDate: new Date(startDate)
  });

  if (duplicate) throw new Error('A tournament with this name and start date already exists in that complex.');

  const newTournament = {
    name,
    complexId: new ObjectId(complexId),
    directorId: new ObjectId(directorId),
    teams: [],
    matches: [],
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  };

  const result = await tournamentCollection.insertOne(newTournament);
  return { _id: result.insertedId, ...newTournament };
}


export async function addTeamToTournament(tournamentId, teamId) {

  tournamentId = validateString(tournamentId)
  teamId = validateString(teamId)

  const tournamentCollection = await tournaments();
  await tournamentCollection.updateOne(
    { _id: new ObjectId(tournamentId) },
    { $addToSet: { teams: new ObjectId(teamId) } }
  );
  return await tournamentCollection.findOne({ _id: new ObjectId(tournamentId) });
}
