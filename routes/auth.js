const express = require('express');
const argon2 = require('argon2');
const User = require('../models/User');
const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    try {
    const { username, password } = req.body;

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password);

    // Save user with hashed password
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

// Login Route
router.post('/login', async (req, res) => {
try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Verify password with Argon2
    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Login successful!" });
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

module.exports = router;