//import { users } from '../../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

import { users, teams } from '../../config/mongoCollections.js';
import { validateString } from '../../helpers.js';

export async function createUser({ role, name, email, passwordHash }) {

  role = validateString(role)
  name = validateString(name)
  email = validateString(email)

  const userCollection = await users();
  const newUser = {
    role,
    name,
    email,
    passwordHash,
    stats: role === 'Player'
      ? { kills: 0, digs: 0, blocks: 0, assists: 0, aces: 0, errors: 0 }
      : undefined
  };

  const result = await userCollection.insertOne(newUser);
  const userId = result.insertedId;

  // Automatically create a team for TeamRep
  if (role === 'TeamRep') {
    const teamCollection = await teams();
    const teamName = `${name.split(' ')[0]}'s Team`;

    await teamCollection.insertOne({
      name: teamName,
      logoUrl: '', // or a default image URL
      repId: userId,
      players: []
    });
  }

  return { _id: userId, ...newUser };
}

// export async function createUser({ role, name, email, passwordHash }) {
//   const userCollection = await users();
//   const newUser = {
//     role,
//     name,
//     email,
//     passwordHash,
//     stats: {
//       kills: 0,
//       digs: 0,
//       blocks: 0,
//       assists: 0,
//       aces: 0,
//       errors: 0
//     }
//   };
//   const result = await userCollection.insertOne(newUser);
//   return { _id: result.insertedId, ...newUser };
// }

export async function getUserByEmail(email) {

  email = validateString(email)

  const userCollection = await users();
  return await userCollection.findOne({ email });
}

export async function getUserById(id) {

  id = validateString(id)

  const userCollection = await users();
  return await userCollection.findOne({ _id: new ObjectId(id) });
}
