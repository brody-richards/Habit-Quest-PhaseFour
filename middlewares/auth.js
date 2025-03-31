const jwt = require('jsonwebtoken');

// Middleware to verify JWT tokens
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// Middleware to ensure the user is a superuser
function ensureSuperUser(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'superuser') {
        return next();
    }
    res.status(403).send('Access denied: Super Users only.');
}

// Export all middleware functions
module.exports = { authMiddleware, ensureAuthenticated, ensureSuperUser };