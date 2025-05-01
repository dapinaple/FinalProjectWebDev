import { tournaments } from "../config/mongoCollections.js"
import { ObjectId } from "mongodb"; 
import { StringValidator, ArrayValidator } from "../helpers.js";

const exportedMethods = {
 async createTournament(Name, complexID, directorID, teamIds, startDate, EndDate, matchIds) {

    Name = StringValidator(Name)
    complexID = StringValidator(complexID)
    directorID = StringValidator(directorID)
    teamIds = ArrayValidator(teamIds)
    startDate = StringValidator(startDate)
    EndDate = StringValidator(EndDate)
    matchIds = ArrayValidator(matchIds)
    

    let newTournament = {
        Name: Name,
        complexID: complexID,
        directorID: directorID,
        teamIds: teamIds, 
        startDate: startDate,
        EndDate: EndDate,
        matchIds: matchIds
    }

    const tournamentsCollection = await tournaments();
    const insertInfo = await tournamentsCollection.insertOne(newTournament);

    if(!insertInfo.acknowledged || !insertInfo.toString()) {
        throw "Could not add tournament"
    }

    const newId = insertInfo.insertedId;

    const tournament = await tournamentsCollection.findOne({ _id: newId });
    return tournament;
}


}
export default exportedMethods;
