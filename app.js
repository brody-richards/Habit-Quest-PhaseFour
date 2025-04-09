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

// express validator 
const { check, validationResult } = require('express-validator');

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
    },
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "https://cdn.jsdelivr.net"],
            "style-src": ["'self'", "https://cdn.jsdelivr.net"],
            "font-src": ["'self'", "https://cdn.jsdelivr.net"],
        },
    },
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


  // ENCRYPT FUNCTION - FROM ASH'S GITHUB AND LAB

function caesarEncrypt(text, shift = 1) {
    if (!text || text.length <= 0) {
        console.error("Provide an input string");
        return;
    }
    // split the input string and iterate through it
    return text
        .split("")
        .map((char, index) => {
                // get the current character code
                let code = char.charCodeAt();
                // set a new variable for the encrypted character
                let encryptedChar;
                // if the character is uppercase, apply the shift to the charCode and use modulus to wrap
        if (code >= 65 && code <= 90) {
            encryptedChar = String.fromCharCode(
                ((((code - 65 + shift) % 26) + 26) % 26) + 65
        );
        } else if (code >= 97 && code <= 122) {
            encryptedChar = String.fromCharCode(
                ((((code - 97 + shift) % 26) + 26) % 26) + 97
        );
        } else {
            encryptedChar = char;
        }
            // return the encrypted version
            return encryptedChar;
    })
        .join("");
}
module.exports = caesarEncrypt;


// DECRYPT FUNCTION - FROM ASH'S GITHUB AND LAB

function caesarDecrypt(text, shift) {
    return text
        .split("")
        .map((char, index) => {
            // get the current character code
            let code = char.charCodeAt();
            // set a new variable for the encrypted character
            let encryptedChar;
            // if the character is uppercase, apply the shift to the charCode and use modulus to wrap
        if (code >= 65 && code <= 90) {
            encryptedChar = String.fromCharCode(
            ((((code - 65 - shift) % 26) + 26) % 26) + 65
        );
        } else if (code >= 97 && code <= 122) {
            encryptedChar = String.fromCharCode(
                ((((code - 97 - shift) % 26) + 26) % 26) + 97
        );
        } else {
            encryptedChar = char;
        }
        // return the encrypted version
        return encryptedChar;
    })
        .join("");
}
module.exports = caesarDecrypt;


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

// profile for regular users
app.get('/profileupdate', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const shift = parseInt(process.env.SHIFT, 10);

        // Decrypt the email and bio
        const name = user.accountName;
        const decryptedEmail = caesarDecrypt(user.accountEmail, shift);
        const decryptedBio = caesarDecrypt(user.bio, shift);

        return res.render('profileupdate', {
            user: {
                name,
                accountEmail: decryptedEmail, 
                bio: decryptedBio 
            }
        });
    } catch (err) {
        console.error('Error:', err);
    }
});

//dashboard for regular users
app.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const shift = parseInt(process.env.SHIFT, 10);

        const role = user.role;
        const name = user.accountName;
        const decryptedEmail = caesarDecrypt(user.accountEmail, shift);
        const decryptedBio = caesarDecrypt(user.bio, shift);

        return res.render('dashboard', {
            user: {
                role,
                name,
                accountEmail: decryptedEmail, 
                bio: decryptedBio 
            }
        });
    } catch (err) {
        console.error('Error rendering dashboard:', err);
        res.status(500).send('Internal server error');
    }
});



// --------------- FROM YOUTUBE VIDEO | Express-validation test

// const urlencodedParser = bodyParser.urlencoded({ extended: false });

// app.get('/test', authMiddleware,(req,res) => {
//     res.render('test')
// })

// app.get('/testsuccess', authMiddleware, (req, res) => {
//     res.render('testsuccess', { user: req.user });
// });

// app.post('/test', urlencodedParser, [
//     check('name','Name must be between 3-50 alphabetic characters.')
//         .exists()
//         .isLength({min: 3}),
//     check('email','Email format is not valid.')
//         .exists()
//         .isEmail()
//         .normalizeEmail(),
//     check('bio','Bio cannot be longer than 500 characters and/or contain special characters.')
//         .exists()
//         .isLength({max:500})
// ], authMiddleware,(req,res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         // return res.status(422).jsonp(errors.array())
//         const alert = errors.array();
//         res.render('test', {
//             alert
//         });
//     } else {
//         res.render('testsuccess')
//     }
//     // res.json(req.body);
// })

// test

// send form information to mongo and update profile information including name, email, and bio
app.post('/profile/update', [
    check('name','Name must be between 3-50 alphabetic characters.')
        .exists()
        .isLength({min: 3, max:50}),
    check('email','Email format is not valid.')
        .exists()
        .isEmail()
        .normalizeEmail(),
    check('bio','Bio cannot be longer than 500 characters and/or contain special characters.')
        .exists()
        .isLength({max:500})
        .matches(/^[A-Za-z0-9 ]+$/),
], authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId); // moved here

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array()); // Log validation errors
        const alert = errors.array();
        return res.render('profileupdate', {
            alert,
            user // try to pass user even if error if form is not valid
        });
    }

    try {
        const { name, email, bio } = req.body; // take form data from profile.ejs form

        console.log('DATA RECEIVED', {name, email, bio});

        shift = parseInt(process.env.SHIFT, 10);
        // console.log('Shift:', shift, typeof shift);

        if (user) {
            // const { ciphertext, tag } = encryptSymmetric(key, plaintext);
            user.accountName = name || user.accountName;

            if (email) {
                const encryptedEmail = caesarEncrypt(email, shift);
                user.accountEmail = encryptedEmail;
            }
            // user.accountEmail = email || user.accountEmail;
            if (bio) {
                const encryptedBio = caesarEncrypt(bio, shift);
                user.bio = encryptedBio;
            }
            // user.bio = bio || user.bio;

            await user.save(); // Save the updated user to the database

            const savedMessage = [{msg: 'Profile Updated Successfully'}]

            const decryptedEmail = caesarDecrypt(user.accountEmail, shift);
            const decryptedBio = caesarDecrypt(user.bio, shift);
            user.accountEmail = decryptedEmail;
            user.bio = decryptedBio;
            
            return res.render('profileupdate', {
                savedMessage,
                user: {
                    name,
                    accountEmail: decryptedEmail, 
                    bio: decryptedBio
                }
            });
        }
    } catch (err) {
        console.error('error:', err);
    }
});

// // send form information to mongo and update profile information including name, email, and bio

// UPDATE INFO CODE WITHOUT VALIDATION AND ENCRYPTION


// app.post('/profile/update', async (req, res) => {
//     try {
//         const { name, email, bio } = req.body; // take form data from profile.ejs form
//         const userId = req.user.id;

//         console.log('DATA RECEIVED', {name, email, bio});

//         const user = await User.findById(userId);
//         if (user) {
//             user.accountName = name || user.accountName;
//             user.accountEmail = email || user.accountEmail;
//             user.bio = bio || user.bio;

//             await user.save(); // Save the updated user to the database
//             res.status(200).json({ message: 'Habit Quest Profile updated', user });
//         } else {
//             res.status(404).json({ message: 'Habit Quest User NOT found' });
//         }
//     } catch (err) {
//         console.error('Error updating profile:', err);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

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