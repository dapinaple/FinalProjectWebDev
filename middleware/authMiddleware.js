export function isAuthenticated(req, res, next) {
    if (req.session.user) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized - Please log in' });
    }
  }
  
  export function hasRole(...roles) {
    return (req, res, next) => {
      if (req.session.user && roles.includes(req.session.user.role)) {
        next();
      } else {
        res.status(403).json({ error: 'Forbidden - Access denied' });
      }
    };
  }
  