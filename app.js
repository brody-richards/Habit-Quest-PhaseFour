require('dotenv').config();

// phase one setup
const express = require('express');
const https = require('https');
const fs = require('fs');
const http = require('http');
const hsts = require('hsts');
const path = require('path');

// DB connetion
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// middlware
const helmet = require('helmet');

// session
const session = require('express-session');

// google oAuth
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// schema
const User = require('./models/User');

// roles
const { ensureAuthenticated, ensureSuperUser } = require('./middlewares/auth');

const app = express();
const PORT_HTTP = 3000;
const PORT_HTTPS = 3443;

// connection to mongo
(async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/userAuth', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("MongoDB connected to UserAuth!");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1); 
    }
})();

// Helmet for securing HTTP headers
app.use(helmet({
    xFrameOptions: { action: "deny" },
    strictTransportSecurity: {
        maxAge: 31556952, // 1 year
        preload: true
    }
}));

// MIDDLEWARE -  for parsing request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// session config
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production
}));


// initialize passport and session
app.use(passport.initialize());
app.use(passport.session());



// passport google aOuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google profile received:', profile);

        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            console.log('Creating a new user...');
            user = new User({
                googleId: profile.id,
                username: profile.displayName,
                loginCount: 1
            });
        } else {
            console.log('User found, updating login count...');
            user.loginCount += 1;

            // Promote to 'superuser' if login count exceeds threshold
            if (user.loginCount > 3) {
                user.role = 'superuser';
            }
        }
        await user.save();
        console.log('User saved successfully:', user);
        return done(null, user);
    } catch (err) {
        console.error('Error in Google Strategy:', err);
        return done(err, null);
    }
}));

// serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// routes
app.get('/', (req, res) => {
    res.send('<h1>Welcome to Habit Quest!</h1><a href="/auth/google">Login with Google</a>');
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/dashboard');
    });

app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.send(`Welcome ${req.user.username}! Role: ${req.user.role} <a href="/logout">Logout</a>`);
});

app.get('/super-dashboard', ensureSuperUser, (req, res) => {
    res.send('<h1>Welcome to the Super User Dashboard!</h1><a href="/logout">Logout</a>');
});

app.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// static file serving
app.use('/static', express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.set('Cache-Control', 'max-age=86400'); // Cache CSS for 1 day
        } else if (path.endsWith('.jpg') || path.endsWith('.png')) {
            res.set('Cache-Control', 'max-age=2592000'); // Cache images for 30 days
        }
    }
}));

// HTTPS Configuration
const hstsOptions = {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
};

http.createServer(app).listen(PORT_HTTP, () => {
    console.log(`HTTP Server running at http://localhost:${PORT_HTTP}`);
});

const options = {
    key: fs.readFileSync('hidden/private-key.pem'),
    cert: fs.readFileSync('hidden/certificate.pem'),
};

https.createServer(options, app).listen(PORT_HTTPS, () => {
    console.log(`HTTPS Server running at https://localhost:${PORT_HTTPS}`);
});

// error handleing 
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});