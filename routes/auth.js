const express = require('express');
const argon2 = require('argon2');
const User = require('../models/User');
const router = express.Router();

const jwt = require('jsonwebtoken');

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { username, password, role = 'user' } = req.body;
        const hashedPassword = await argon2.hash(password);

    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
});

// Login Route
// Login Route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
            if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await argon2.verify(user.password, password);
            if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

      // Generate JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,  // Store the secret in the .env file
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: "Login successful!", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;