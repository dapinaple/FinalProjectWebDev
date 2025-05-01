//Name: Ioannis Magkaniotis

import { users } from "../config/mongoCollections.js"
import { ObjectId } from "mongodb"; 
import { StringValidator, ArrayValidator } from "../helpers.js";

const exportedMethods = {
 async createUser(firstName, lastName, email, password, role, associatedComplexID, teamID, playerID) {

    firstName = StringValidator(firstName)
    lastName = StringValidator(lastName)
    email = StringValidator(email)
    password = StringValidator(password)
    role = StringValidator(role)
    associatedComplexID = StringValidator(associatedComplexID)
    teamID = StringValidator(teamID)
    playerID = StringValidator(playerID)


    let newUser = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        role: role,
        associatedComplexID: associatedComplexID,
        teamID: teamID,
        playerID: playerID
    }

    const usersCollection = await users();
    const insertInfo = await usersCollection.insertOne(newUser);

    if(!insertInfo.acknowledged || !insertInfo.toString()) {
        throw "Could not add user"
    }

    const newId = insertInfo.insertedId;

    const user = await usersCollection.findOne({ _id: newId });
    return user;
}


}
export default exportedMethods;
