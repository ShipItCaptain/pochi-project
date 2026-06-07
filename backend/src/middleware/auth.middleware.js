const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const organizer = await prisma.organizer.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        phone_number: true,
        full_name: true,
        email: true,
        is_verified: true,
        subscription_plan: true,
        subscription_status: true,
        subscription_expires_at: true,
      },
    });

    if (!organizer) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    if (!organizer.is_verified) {
      return res.status(403).json({ error: 'Phone number not verified.' });
    }

    req.organizer = organizer;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    next(err);
  }
};

module.exports = { authenticate };
