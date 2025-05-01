import { teams } from "../config/mongoCollections.js"
import { ObjectId } from "mongodb"; 
import { StringValidator, ArrayValidator } from "../helpers.js";

const exportedMethods = {
 async createTeam(Name, teamRepresentativeID, playerIDs) {

    Name = StringValidator(Name)
    teamRepresentativeID = StringValidator(teamRepresentativeID)
    playerIDs = ArrayValidator(playerIDs)

    let newTeam = {
        Name: Name,
        teamRepresentativeID: teamRepresentativeID,
        playerIDs: playerIDs
    }

    const teamsCollection = await teams();
    const insertInfo = await teamsCollection.insertOne(newTeam);

    if(!insertInfo.acknowledged || !insertInfo.toString()) {
        throw "Could not add team"
    }

    const newId = insertInfo.insertedId;

    const team = await teamsCollection.findOne({ _id: newId });
    return team;
}


}
export default exportedMethods;
