// const socket = io();
// const scoreboard = document.getElementById('scoreboard');
// // Fetch initial list
// async function loadInitialMatches() {
//     const res = await fetch('/api/public/live-matches');
//     const matches = await res.json();
//     matches.forEach(renderMatch);
//   }
//   loadInitialMatches();
  
// function renderMatch(data) {
//   const id = `match-${data.matchId}`;
//   let matchDiv = document.getElementById(id);

//   const html = `
//     <h5>${data.teamA} vs ${data.teamB}</h5>
//     <p><strong>${data.scoreA}</strong> - <strong>${data.scoreB}</strong></p>
//     <small>Updated: ${new Date(data.timestamp).toLocaleTimeString()}</small>
//     <hr/>
//   `;

//   if (matchDiv) {
//     matchDiv.innerHTML = html;
//   } else {
//     matchDiv = document.createElement('div');
//     matchDiv.id = id;
//     matchDiv.innerHTML = html;
//     scoreboard.appendChild(matchDiv);
//   }
// }

// socket.on('broadcastScore', renderMatch);

// // Optional: message when no scores yet
// setTimeout(() => {
//   if (scoreboard.innerHTML === 'Loading live scores...') {
//     scoreboard.innerHTML = '<p>No scores received yet.</p>';
//   }
// }, 5000);

console.log('scoreboard.js loaded');
const socket = io();
const scoreboard = document.getElementById('scoreboard');

function renderMatch(data) {
  console.log('Rendering match:', data);
  const id = `match-${data.matchId}`;
  let matchDiv = document.getElementById(id);
  const html = `
    <h5>${data.teamA} vs ${data.teamB}</h5>
    <p><strong>${data.scoreA}</strong> - <strong>${data.scoreB}</strong></p>
    <small>Updated: ${new Date(data.timestamp).toLocaleTimeString()}</small>
    <hr/>
  `;
  if (matchDiv) {
    matchDiv.innerHTML = html;
  } else {
    matchDiv = document.createElement('div');
    matchDiv.id = id;
    matchDiv.innerHTML = html;
    scoreboard.appendChild(matchDiv);
  }
}

//get initial live matches
async function loadInitialMatches() {
  try {
    const res = await fetch('/api/public/live-matches');
    const matches = await res.json();
    matches.forEach(renderMatch);
  } catch (e) {
    console.error('Failed to load initial matches', e);
  }
}
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded');
  loadInitialMatches();
});

socket.on('broadcastScore', renderMatch);