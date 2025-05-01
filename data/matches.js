import { matches } from "../config/mongoCollections.js"
import { ObjectId } from "mongodb"; 
import { StringValidator, ArrayValidator } from "../helpers.js";

const exportedMethods = {
 async createMatch(tournamentID, team1ID, team2ID, scoreteam1, scoreteam2, timestart, timeend) {

    tournamentID = StringValidator(tournamentID)
    team1ID = StringValidator(team1ID)
    team2ID = StringValidator(team2ID)
    scoreteam1 = StringValidator(scoreteam1)
    scoreteam2 = StringValidator(scoreteam2)
    timestart = StringValidator(timestart)
    timeend = StringValidator(timeend)

    let newMatch = {
        tournamentID: tournamentID,
        team1ID: team1ID,
        team2ID: team2ID, 
        scoreteam1: scoreteam1,
        scoreteam2: scoreteam2,
        timestart: timestart,
        timeend: timeend
    }

    const matchCollection = await matches();
    const insertInfo = await matchCollection.insertOne(newMatch);

    if(!insertInfo.acknowledged || !insertInfo.toString()) {
        throw "Could not add match"
    }

    const newId = insertInfo.insertedId;

    const match = await matchCollection.findOne({ _id: newId });
    return match;
}


}
export default exportedMethods;
