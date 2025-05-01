import { complexes, tournaments } from "../config/mongoCollections.js"
import { ObjectId } from "mongodb"; 
import { StringValidator, ArrayValidator } from "../helpers.js";

const exportedMethods = {
 async createComplex(Name, Address, ownerID, tournamentIds) {

    Name = StringValidator(Name)
    Address = StringValidator(Address)
    ownerID = StringValidator(ownerID)
    tournamentIds = ArrayValidator(tournamentIds)

    let newComplex = {
        Name: Name,
        Address: Address,
        ownerID: ownerID,
        tournamentIds: tournamentIds
    }

    const complexCollection = await complexes();
    const insertInfo = await complexCollection.insertOne(newComplex);

    if(!insertInfo.acknowledged || !insertInfo.toString()) {
        throw "Could not add complex"
    }

    const newId = insertInfo.insertedId;

    const complex = await complexCollection.findOne({ _id: newId });
    return complex;
}


}
export default exportedMethods;
