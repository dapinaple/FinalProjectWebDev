const socket = io();

//player/team data avoid extra calls
const cache = {
  rosters: {} //store team rosters by team id
};

async function loadLiveMatches() {
  try {
    const res = await fetch('/api/director/live-matches');
    const matches = await res.json();
    const container = document.getElementById('live-matches');
    container.innerHTML = '';
    
    if (matches.length === 0) {
      container.innerHTML = '<p>No live matches scheduled today.</p>';
      return;
    }
    
    //for match
    for (const match of matches) {
      await createMatchElement(match, container);
    }
  } catch (e) {
    console.error('Error loading matches:', e);
    document.getElementById('live-matches').innerHTML = '<p>Error loading matches.</p>';
  }
}

async function createMatchElement(match, container) {
  const template = document.getElementById('match-template');
  const matchElement = template.content.cloneNode(true);
  const matchContainer = matchElement.querySelector('.match-container');
  matchContainer.dataset.matchId = match.id;
  const teamElements = matchElement.querySelectorAll('.team-a-name');
  teamElements.forEach(el => el.textContent = match.teamAName);
  
  const teamBElements = matchElement.querySelectorAll('.team-b-name');
  teamBElements.forEach(el => el.textContent = match.teamBName);
  matchElement.querySelector('.match-title').textContent = `${match.teamAName} vs ${match.teamBName}`;
  matchElement.querySelector('.match-time').textContent = new Date(match.scheduledTime).toLocaleString();
  matchElement.querySelector('input[name="scoreA"]').value = match.scoreA || 0;
  matchElement.querySelector('input[name="scoreB"]').value = match.scoreB || 0;
  
  //score update button
  const scoreButton = matchElement.querySelector('.score-button');
  scoreButton.addEventListener('click', ()=> updateScore(match.id));
  //stats submission
  const statsButton = matchElement.querySelector('.stats-button');
  statsButton.addEventListener('click', ()=> submitPlayerStats(match.id));
  container.appendChild(matchElement);
  //team rosters
  await Promise.all([
    loadTeamRoster(match.id, 'A'),
    loadTeamRoster(match.id, 'B')
  ]);
}

async function loadTeamRoster(matchId, teamDesignation) {
  try {
    //team roster from api
    const res = await fetch(`/api/director/match-roster/${matchId}/${teamDesignation}`);
    const players = await res.json();
    
    //cache
    const teamId = players.teamId;
    if (teamId) {
      cache.rosters[teamId] = players.roster;
    }
    //container for teams players
    const matchElement = document.querySelector(`.match-container[data-match-id="${matchId}"]`);
    const rosterContainer = matchElement.querySelector(`.player-list-${teamDesignation.toLowerCase()}`);
    rosterContainer.innerHTML = '';
    //if no player
    if (!players.roster || players.roster.length === 0) {
      rosterContainer.innerHTML = '<p>No players found for this team.</p>';
      return;
    }
    
    //stat inputs for each player
    const playerTemplate = document.getElementById('player-stat-template');
    players.roster.forEach(player => {
      const playerElement = playerTemplate.content.cloneNode(true);
      const playerRow = playerElement.querySelector('.player-stat-row');
      playerRow.dataset.playerId = player.id;
      //playerRow.querySelector('.player-name').textContent = player.name;
      console.log(player);
      playerRow.querySelector('.player-name').textContent = player.name;
      if (player.matchStats) {
        playerRow.querySelector('input[name="kills"]').value = player.matchStats.kills || 0;
        playerRow.querySelector('input[name="digs"]').value = player.matchStats.digs || 0;
        playerRow.querySelector('input[name="blocks"]').value = player.matchStats.blocks || 0;
        playerRow.querySelector('input[name="assists"]').value = player.matchStats.assists || 0;
        playerRow.querySelector('input[name="aces"]').value = player.matchStats.aces || 0;
        playerRow.querySelector('input[name="errors"]').value = player.matchStats.errors || 0;
      }
      
      rosterContainer.appendChild(playerElement);
    });
    
  } catch (e) {
    console.error(`Error loading team ${teamDesignation} roster for match ${matchId}:`, e);
    const matchElement = document.querySelector(`.match-container[data-match-id="${matchId}"]`);
    const rosterContainer = matchElement.querySelector(`.player-list-${teamDesignation.toLowerCase()}`);
    rosterContainer.innerHTML = '<p>Error loading player roster.</p>';
  }
}

function updateScore(matchId) {
  const matchElement = document.querySelector(`.match-container[data-match-id="${matchId}"]`);
  const scoreA = parseInt(matchElement.querySelector('input[name="scoreA"]').value) || 0;
  const scoreB = parseInt(matchElement.querySelector('input[name="scoreB"]').value) || 0;
  
  const teamAName = matchElement.querySelector('.team-a-name').textContent;
  const teamBName = matchElement.querySelector('.team-b-name').textContent;
  
  socket.emit('scoreUpdate', {
    matchId: matchId,
    teamA: teamAName,
    teamB: teamBName,
    scoreA,
    scoreB,
    timestamp: new Date().toISOString()
  });
  alert(`Score updated: ${teamAName} ${scoreA} - ${scoreB} ${teamBName}`);
}

function submitPlayerStats(matchId) {
  const matchElement = document.querySelector(`.match-container[data-match-id="${matchId}"]`);
  const playerRows = matchElement.querySelectorAll('.player-stat-row');
  const statsByPlayerId = {};
  playerRows.forEach(row => {
    const playerId = row.dataset.playerId;
    
    statsByPlayerId[playerId] = {
      kills: parseInt(row.querySelector('input[name="kills"]').value) || 0,
      digs: parseInt(row.querySelector('input[name="digs"]').value) || 0,
      blocks: parseInt(row.querySelector('input[name="blocks"]').value) || 0,
      assists: parseInt(row.querySelector('input[name="assists"]').value) || 0,
      aces: parseInt(row.querySelector('input[name="aces"]').value) || 0,
      errors: parseInt(row.querySelector('input[name="errors"]').value) || 0
    };
  });
  //stats to the server
  socket.emit('submitPlayerStats', {
    matchId: matchId,
    statsByPlayerId: statsByPlayerId
  });
  //success message
  const savedMessage = matchElement.querySelector('.stats-saved');
  savedMessage.style.display = 'inline';
  setTimeout(()=> {
    savedMessage.style.display = 'none';
  }, 3000);
}
socket.on('connect', ()=> {
  console.log('Connected to WebSocket server');
});

socket.on('broadcastScore', (data)=> {
  //update score
  const matchElement = document.querySelector(`.match-container[data-match-id="${data.matchId}"]`);
  if (matchElement) {
    matchElement.querySelector('input[name="scoreA"]').value = data.scoreA;
    matchElement.querySelector('input[name="scoreB"]').value = data.scoreB;
  }
});
window.addEventListener('DOMContentLoaded', loadLiveMatches);