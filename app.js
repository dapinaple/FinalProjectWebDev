

import userData from "./data/users.js";
import complexData from "./data/complexes.js";
import playerData from "./data/players.js"
import tournamentData from "./data/tournaments.js"
import matchData from "./data/matches.js"
import teamData from "./data/teams.js"
import { dbConnection, closeConnection } from "./config/mongoConnection.js";

const db = await dbConnection();
await db.dropDatabase();

let user1 = undefined
let complex1 = undefined
let tournament1 = undefined
let teams1 = undefined
let players1 = undefined
let matches1 = undefined

try {
user1 = await userData.createUser(
    "John","Doe","john.doe@example.com","$2b$10$exampleHashedPassword","TournamentDirector","complex_id_456","team_id_789","player_id_321",
)

complex1 = await complexData.createComplex(
    "White Sands Volleyball Complex", "1421 Canal St, New Orleans, LA", "user_123", ["tournament_001", "tournament_002"]
)

tournament1 = await tournamentData.createTournament(
    "Hot Shots","complexID_001", "user_123", ["team_001", "team_002"], "4/14/2025 8:24 pm", "4/15/2025 1:00 am" ,["match_001", "match_002"]
)

teams1 = await teamData.createTeam(
    "Volley Ballers", "captain_001", ["player_001", "player_002"]
)

players1 = await playerData.createPlayer(
    "Esteban Schmitt", "eschmitt@gmail.com", "team_001", { Kills: 10, Digs:12,Blocks:3, Aces:0,Assists:22,Errors:3}
)

matches1 = await matchData.createMatch(
    "tournament_001","team_001","team_002","25","23","4/14/2025 12:00 pm","4/14/2025 12:30 pm"
)

}
catch(e) {
    console.log(e);
}


await closeConnection();
