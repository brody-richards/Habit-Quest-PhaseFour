require('dotenv').config();

// phase one setup
const express = require('express');
const https = require('https');
const fs = require('fs');
const http = require('http');

// mongoDB 
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo'); 

//parsing data
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); 

// helmet middleware
const helmet = require('helmet');

// passport authentication and google oAuth
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

//session management
const session = require('express-session'); 

// bringing data from other files
const { authMiddleware, ensureAdminUser, generateToken } = require('./middlewares/auth');
const User = require('./models/User');

const app = express();
const PORT_HTTP = 3000;
const PORT_HTTPS = 3443;



// ejs import
app.set('view engine', 'ejs');
app.set('views', './views');

// connect to mongoDB
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

// helmet middleware 
app.use(helmet({
    xFrameOptions: { action: "deny" },
    strictTransportSecurity: {
        maxAge: 31556952, // 1 year
        preload: true
    }
}));

// parsing data middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());



// secure session from lab5
app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/userAuth',
        collectionName: 'sessions'
    }),
    cookie: {
        httpOnly: true, // stop client side JS attack
        secure: process.env.NODE_ENV === 'production', // secure cookies
        sameSite: 'strict', // stop csrf attacks
        maxAge: 24 * 60 * 60 * 1000 // store cookie for one day
    }
}));



// initialize passport and session
app.use(passport.initialize());
app.use(passport.session()); 



// passport strategy from ABAC lab
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            console.log('Creating a new user...');
            user = new User({
                googleId: profile.id,
                username: profile.displayName,
                email: profile.emails[0]?.value,
                loginCount: 1,
                accountName: profile.displayName,
                accountEmail: 'test email',
                bio: 'test bio'
            });
        } else {
            console.log('User found, updating login count...');
            user.loginCount += 1;

            // when user logs in 3 times they promote to superuser. 
            if (user.loginCount > 30) {
                user.role = 'admin';
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



// serialize and deserialize function
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
    async (req, res) => {
        try {
            // Generate a JWT token using the generateToken function
            const token = generateToken(req.user);

            // Store the token in an HTTP-only cookie
            res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
            
            if (req.user.role === 'admin') {
                res.redirect('/admin');
            } else {
                res.redirect('/dashboard');
            }
        } catch (err) {
            console.error('Error generating token:', err.message);
            res.status(500).send('Internal Server Error');
        }
    });

app.get('/logout', (req, res) => {
    res.clearCookie('token'); // clear jwt cookie
    res.redirect('/');
});

// dashboard for admin users
app.get('/admin', authMiddleware, ensureAdminUser, (req, res) => {
    res.render('admindashboard', { user: req.user });
});

// profile for admin users
app.get('/admin/profile', authMiddleware, ensureAdminUser, (req, res) => {
    res.render('adminprofile', { user: req.user });
});

// profile for regular users
app.get('/profile', authMiddleware, (req, res) => {
    res.render('profile', { user: req.user });
});

//dashboard for reular users
app.get('/dashboard', authMiddleware, (req, res) => {
    res.render('dashboard', { user: req.user });
});


// send form information to mongo and update profile information including name, email, and bio
app.post('/profile/update', async (req, res) => {
    try {
        const { name, email, bio } = req.body; // take form data from profile.ejs form
        const userId = req.user.id;

        console.log('DATA RECCCEVED', {name, email, bio});

        const user = await User.findById(userId);
        if (user) {
            user.accountName = name || user.accountName;
            user.accountEmail = email || user.accountEmail;
            user.bio = bio || user.bio;

            await user.save(); // Save the updated user to the database
            res.status(200).json({ message: 'Habit Quest Profile updated', user });
        } else {
            res.status(404).json({ message: 'Habit Quest User NOT found' });
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// serve static files like for images and css
app.use('/static', express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.set('Cache-Control', 'max-age=86400'); // Cache CSS for 1 day
        } else if (path.endsWith('.jpg') || path.endsWith('.png')) {
            res.set('Cache-Control', 'max-age=2592000'); // Cache images for 30 days
        }
    }
}));

app.use(express.static('public'));

// HTTPS Configuration
const options = {
    key: fs.readFileSync('hidden/private-key.pem'),
    cert: fs.readFileSync('hidden/certificate.pem'),
};

http.createServer(app).listen(PORT_HTTP, () => {
    console.log(`HTTP Server running at http://localhost:${PORT_HTTP}`);
});

https.createServer(options, app).listen(PORT_HTTPS, () => {
    console.log(`HTTPS Server running at https://localhost:${PORT_HTTPS}`);
});

// Centralized Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('error');
});