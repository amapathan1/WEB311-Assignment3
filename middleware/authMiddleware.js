// middleware/auth.js

// require logged-in user
module.exports.requireLogin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.userId) {
    return next();
  }
  return res.redirect('/login');
};

// prevent logged-in users from visiting login/register
module.exports.preventLoggedInAccess = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.userId) {
    return res.redirect('/dashboard');
  }
  next();
};
