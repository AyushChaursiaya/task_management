const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  let token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  if (token.startsWith('Bearer ')) {
    token = token.replace('Bearer ', '');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id');
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
