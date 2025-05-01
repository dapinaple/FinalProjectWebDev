import { players } from "../config/mongoCollections.js"
import { ObjectId } from "mongodb"; 
import { StringValidator } from "../helpers.js";

const exportedMethods = {
 async createPlayer(Name, email, teamID, Stats) {

    if(!Stats) throw "A parameter was not inputted"
    if(typeof(Stats) != 'object') throw "Stats is not an object"
    
    Name = StringValidator(Name)
    email = StringValidator(email)
    teamID = StringValidator(teamID)

    let newPlayer = {
       Name: Name,
       email: email,
       teamID: teamID,
       Stats: Stats
    }

    const playerCollection = await players();
    const insertInfo = await playerCollection.insertOne(newPlayer);

    if(!insertInfo.acknowledged || !insertInfo.toString()) {
        throw "Could not add player"
    }

    const newId = insertInfo.insertedId;

    const player = await playerCollection.findOne({ _id: newId });
    return player;
}


}
export default exportedMethods;
