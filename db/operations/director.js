import { validateString } from "../../helpers";

async function loadLiveMatches() {
    try {
      const res = await fetch('/director/live-matches');
      const matches = await res.json();
  
      const container = document.getElementById('live-matches');
      container.innerHTML = '';
  
      if (matches.length === 0) {
        container.textContent = 'No live matches today.';
        return;
      }
  
      matches.forEach(match => {
        const div = document.createElement('div');
        div.innerHTML = `
          <h3>${match.team1Name} vs ${match.team2Name}</h3>
          <p>${new Date(match.date).toLocaleString()}</p>
          <form onsubmit="submitScore(event, '${match.id}')">
            <input type="number" name="team1" placeholder="${match.team1Name} score" required />
            <input type="number" name="team2" placeholder="${match.team2Name} score" required />
            <button type="submit">Submit</button>
          </form>
          <hr/>
        `;
        container.appendChild(div);
      });
    } catch (e) {
      document.getElementById('live-matches').textContent = 'Error loading matches.';
      console.error(e);
    }
  }
  
  async function submitScore(e, matchId) {

    matchId = validateString(matchId)

    e.preventDefault();
    const form = e.target;
    const team1 = parseInt(form.team1.value);
    const team2 = parseInt(form.team2.value);
  
    const res = await fetch(`/api/submit-score/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team1, team2 })
    });
  
    if (res.ok) {
      alert('Score updated!');
      loadLiveMatches();
    } else {
      alert('Failed to update score.');
    }
  }
  
  
  // Call it once on page load
  window.addEventListener('DOMContentLoaded', loadLiveMatches);
  