const jwt = require('jsonwebtoken');

// generate jwt token
const generateToken = (user) => {
    const payload = {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email
    };
    console.log('PAYLOADDDDD', payload);
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// verify jwt in cookies
const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token; // get token
    if (!token) {
        console.error('No token found in cookies'); 
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        console.error('Invalid token:', error.message);
        res.status(401).json({ message: "Token is not valid" });
    }
};

// adminUser verification
function ensureAdminUser(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access denied: Admin only.');
}

module.exports = { authMiddleware, ensureAdminUser, generateToken };