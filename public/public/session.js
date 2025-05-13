(async () => {
    const response = await fetch('/api/auth/session').catch(() => null);
    const session = response && response.ok ? await response.json() : null;
  
    const role = session?.user?.role;
    console.log('role', role);
  
    // Highlight tab
    document.querySelectorAll('.nav-link').forEach(link => {
      const isMatch = window.location.pathname === new URL(link.href).pathname;
      if (isMatch) link.classList.add('active-link');
    });
  
    // Restrict tabs
    const navLinks = {
      players: ['Player'],
      teams: ['TeamRep'],
      tournaments: ['TournamentDirector'],
      admin: ['ComplexOwner']
    };
  
    Object.entries(navLinks).forEach(([id, roles]) => {
      const link = document.querySelector(`.nav-link[href="/${id}"]`);
      if (link && (!role || !roles.includes(role))) {
        link.style.display = 'none';
      }
    });
  
    // redirect
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const allowed = {
      Player: ['players'],
      TeamRep: ['teams'],
      TournamentDirector: ['tournaments'],
      ComplexOwner: ['admin']
    };
  
    const alwaysAllowed = ['', 'login', 'register', 'scoreboard'];
    const isAllowed = alwaysAllowed.includes(path) || allowed[role]?.includes(path);
  
    if (!isAllowed) {
      window.location.href = '/?error=unauthorized';
    }
   })();