import { compareSync } from 'bcrypt';
import { matches, tournaments, teams } from '../../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import { validateString, validateArray, validateInteger } from '../../helpers.js'

export async function getMatch(matchId) {

  matchId = validateString(matchId)

  const matchCollection = await matches();
  const res = await matchCollection.findOne({_id: new ObjectId(matchId)})
  if(!res) throw new Error('Match not found')
}

export async function createMatch({ tournamentId, teamA, teamB, scheduledTime }) {

  tournamentId = validateString(tournamentId)
  teamA = validateString(teamA)
  teamB = validateString(teamB)
  if(!scheduledTime) throw "scheduledTime not found"

  const tournamentCollection = await tournaments();
  const teamsCollection = await teams();

  const res = await tournamentCollection.findOne({_id: new ObjectId(tournamentId)});
  const match1 = await teamsCollection.findOne({_id: new ObjectId(teamA)})
  const match2 = await teamsCollection.findOne({_id: new ObjectId(teamB)})

  if(!res) throw new Error('Tournament not found')
  if(!match1) throw new Error('Team A is not found')
  if(!match2) throw new Error('Team B not found')

  const matchCollection = await matches();
  const newMatch = {
    tournamentId: new ObjectId(tournamentId),
    teamA: new ObjectId(teamA),
    teamB: new ObjectId(teamB),
    scoreA: 0,
    scoreB: 0,
    scheduledTime: scheduledTime
    //statsEntered: false,
    //playerStats: []
  };

  const result = await matchCollection.insertOne(newMatch);
  await tournamentCollection.updateOne(
    { _id: new ObjectId(tournamentId) },
    { $push: { matches: result.insertedId } }
  );

  return { _id: result.insertedId, ...newMatch };
}

export async function reportMatchScore(matchId, scoreA, scoreB) {

  matchId = validateString(matchId)
  scoreA = validateInteger(scoreA)
  scoreB = validateInteger(scoreB)

  const matchCollection = await matches();
  const match = await matchCollection.findOne({ _id: new ObjectId(matchId) });
  if (!match) throw new Error('Match not found');

  const winner = scoreA > scoreB ? match.teamA : match.teamB;

  await matchCollection.updateOne(
    { _id: new ObjectId(matchId) },
    {
      $set: {
        scoreA,
        scoreB,
        winner,
        statsEntered: true
      }
    }
  );

  return await matchCollection.findOne({ _id: new ObjectId(matchId) });
}

export async function enterPlayerStats(matchId, statsArray) {

  matchId = validateString(matchId)
  statsArray = validateArray(statsArray)

  const matchCollection = await matches();
  await matchCollection.updateOne(
    { _id: new ObjectId(matchId) },
    { $set: { playerStats: statsArray } }
  );
}

export const recordMatchScore = async (matchId, team1Score, team2Score) => {

  matchId = validateString(matchId)
  team1Score = validateInteger(team1Score)
  team2Score = validateInteger(team2Score)

  const matchCol = await matches();
  const updated = await matchCol.findOneAndUpdate(
    { _id: new ObjectId(matchId) },
    { $set: { team1Score, team2Score, winner: team1Score > team2Score ? 'team1' : 'team2' } },
    { returnDocument: 'after' }
  );
  return updated;
};

export const getMatchResults = async () => {
  const matchCol = await matches();
  return await matchCol.find({ team1Score: { $exists: true } }).toArray();
};
