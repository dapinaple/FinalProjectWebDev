import { rankings } from '../../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import { validateString } from '../../helpers.js';

export async function getOrCreateRanking(teamId, complexId) {

  teamId = validateString(teamId)
  complexId = validateString(complexId)

  const rankingCollection = await rankings();
  let ranking = await rankingCollection.findOne({
    teamId: new ObjectId(teamId),
    complexId: new ObjectId(complexId)
  });

  if (!ranking) {
    ranking = {
      teamId: new ObjectId(teamId),
      complexId: new ObjectId(complexId),
      winLossRatio: 0,
      statAverages: {}
    };
    await rankingCollection.insertOne(ranking);
  }

  return ranking;
}

export async function updateWinLoss(winnerTeamId, loserTeamId, complexId) {

  winnerTeamId = validateString(winnerTeamId)
  loserTeamId = validateString(loserTeamId)
  complexId = validateString(complexId)

  const rankingCollection = await rankings();
  await rankingCollection.updateOne(
    { teamId: new ObjectId(winnerTeamId), complexId: new ObjectId(complexId) },
    { $inc: { winLossRatio: 1 } },
    { upsert: true }
  );

  await rankingCollection.updateOne(
    { teamId: new ObjectId(loserTeamId), complexId: new ObjectId(complexId) },
    { $inc: { winLossRatio: -1 } },
    { upsert: true }
  );
}
