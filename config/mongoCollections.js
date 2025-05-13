import { dbConnection } from './mongoConnection.js';

const getCollectionFn = (collection) => {
  let _col = undefined;
  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
    }
    return _col;
  };
};

export const users = getCollectionFn('users');
export const teams = getCollectionFn('teams');
export const tournaments = getCollectionFn('tournaments');
export const matches = getCollectionFn('matches');
export const rankings = getCollectionFn('rankings');
export const complexes = getCollectionFn('complexes');
