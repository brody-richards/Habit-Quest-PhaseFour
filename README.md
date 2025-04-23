# HabitQuest
Project: Phase Three | Web Security | Habit Quest Web Application | Brody Richards

## Setup Instructions:

To configure the server, the following steps were taken:

1. Ensure all the correct files have been downloaded from the repo. Once downloaded, ensure the following node dependencies have been installed. 

  "dependencies": {
    "argon2:",
    "body-parser:",
    "connect-mongo:",
    "cookie-parser:",
    "csurf": ",
    "dotenv": ",
    "ejs": ",
    "express:",
    "express-session:",
    "express-validator:",
    "fs":,
    "helmet": "^8.1.0",
    "hsts": "^2.2.0",
    "https": "^1.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.13.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0"
  }

2. Ensure the correct environment variables have been downloaded from the .env file (this file has sensitive information, and is not available through the public repository on github).

3. Set up your web framework and general express setup, allowing you to host the files properly. 

4. Ensure you have mongo compass installed, and connect it to your database, allowing you to connect with your back end information. 

5. Ensure oAuth credentials and setup has been implemented correctly. 



# Part A - Threat Model

## Critical Assets of Habit Quest

### User Data
User data is the most critical asset of Habit Quest. The security of the clients and their personal information should always be the top priority. 

#### Google id
unique ID assigned to a google account

#### Username
Full name on google account

#### Email
Email on google account

#### loginCount
Number of times the users has logged into the application

#### accountName
Account name saved on profile from phase three (different from google username above)

#### accountEmail
Account email saved on profile from phase three (different from google email above)

#### bio
account bio saved on profile from phase three.


### Session Data
Jsonwebtoken – token generated after login with saved data from database. Data saved in this token include a payload of an id, role, username, email, accountEmail, accountName, and bio. 
Token is valid for 1hr after it is generated. 
Token is cleared when a user logs out of the application. 

### Databases
Mongodb – database used to save user data from schema. Sensitive data is encrypted when sent to databse, and decrypted when data is pulled for users to view.  

### Codebases and Infrastructure
The majority of the dependencies and libraries used in Habit Quest could be classified as third-party. Because of this, it’s crucial to keep these codebases updated regularly to mitigate potential security risks.  
Examples of these critical asset dependencies could include
-	Passport-google-oauth20
-	Connect-mongo
-	Jsonwebtoken



## How might hackers attack Habit Quest?


### SQL Injection
When a hacker targets the database of an application to try and get stored information. These targets happen when something like form fields have not been properly secured. In Habit Quest, this attack could happen in the profile update form field that is connected to the mongo database. These requests must be properly escaped, not allowing any SQL to be used inside these areas. 

### Cross-site scripting (XXS)
When an attacker injects malicious code into a website, altering the DOM and adding harmful elements. These attackers target sensitively stored information like cookies and personal information. These targets happen when information has not been sanitized or escaped properly. In Habit Quest, this attack could happen in the profile form fields if the data is not sanitized properly. 

### Cross-site request forgery (CSRF)
When attackers trick authenticated users into sending requests without their knowledge. These are often trusted application to the user where they are already logged in, and their guard is often down. In Habit Quest, these could be used when a cookie or token is stolen and used to impersonate that user. 


## STRIDE Framework

The STRIDE framework helped me identify the potential threats that Habit Quest was open to. The following are examples of the information that creating the stride framework helped mitigate. 

### Spoofing 
In Habit Quest, CSRF attacks could be used here, as attackers could be illegally accessing another users authentication information from cookies that have been stolen. Once logged in, they can steal users other personal information such as google id, email, and passwords. 

### Tampering
In Habit Quest, SQL injection attacks could be used in the form fields to pull data from the central database. 

### Repudiation
In Habit Quest, A user could log into  their profile, but later deny that they actually made this change without proper system logs, as they are trying to exploit the company. 

### Information Disclosure 
In Habit Quest, this type of threat could happen when user data is exposed, say in the API call to google, or poor session handling on the Habit Quest website. 

### Denial of Service
In Habit Quest, malicious hackers could use DOS attacks if they have gained access to database information, such as names, emails, and any other log in or personal information. 

### Elevation of Privilege 
In Habit Quest, this could happen if the wrong user is granted admin or superadmin access, for example, if the current issue with users being promoted to these roles after a certain amount of log in attempts. This could compromise other users and their information to malicious hackers. 


Habit Quests threat model has been submitted to Brightspace. 


# Part B and C - Test Your Application and Fix Vulnerabilities 

For testing Habit Quest, I will use node's built in npm audit BURP Suite, and manual testing.

## npm audit
After running npm audit, I received a report showing 2 low severity vulnerabilities related to the:
        
        cookie 0.7.0 package. 

The message I received was:
        "cookie accepts cookie name, path, and domain with out of bounds characters"

Since other packages and parts of Habit Quest rely on csurf, I ran ‘npm audit fix’. This upgraded the csfurf package to a newer version that uses upgraded and safer versions of cookies. This update resolved the outdated dependencies in Habit Quest, keeping everything up-to-date. 


## BURP Suite

Using Burp Suite Community Edition, I wanted to test different vulnerabilities in my application. 

From the ‘Proxy’ screen, I submitted a request using my browser to see the response. I took a common feature, a user updating their profile information. After submitting my request, I went to the ‘Repeater’ tab in Burp Suite to see my response. Here, I changed the value of the form to examples of different attacks:

### Repeater Testing

### XXS

        ‘name=<script>alert('XXS')</script>&email=be%40gmail.com&bio=hello+there’

To test the XXS vulnerabilities of my input form, I used an alert tag, which would pop up on the user’s screen once the request was submitted. When I looked on the dashboard to see, I was pleased to see that there was no pop-up, and the special characters had been properly escaped. I also tested the following: 

        name=brody+edward&email="><script>alert(document.cookie)</script>&bio=hello+there

Once again, the characters were properly escaped, and no alert occurred in the browser. 

## Intruder Testing 

Using the ‘Intruder’ screen, I was able to simulate a Sniper Attack by adding attack positions to all fields that could take it, including the cookie, name, email, bio, and connect.sid.

After firing 30 total attack requests using a mix of SQL injection and XXS attacks, the Habit Quest Application successfully stopped all attacks,

Out of the 30 attacks:

6 – 401 Errors – Unauthorized access. This means that my Habit Quest form and database successfully stopped these malicious attacks from executing.

24 – 200 Errors – Successful logs. I learned that this does not mean that the maliciously went through, but could also mean that the characters on the malicious input were properly escaped.

Before: - Helmet Middleware

        X-XSS-Protection: 0

This x-xss-protection header was set to 0 in my helmet settings. This was a feature that stopped pages from loading when they detected reflected cross-site scripting attacks. While modern browsers have mitigated this issues, there is always the chance that a Habit Quest user is using an old browser.

To fix this vulnerability, I will update the X-XSS-Protection header to

        xxsFilter: true,

This enables XXS filtering. Rather than sanitizing the page, the browser will prevent rendering from the page at all if an attack is detected.

Overall, the Sniper Test was a good way to test multiple malicious statements at once, and see exactly the holes where hackers could get into Habit Quest.


## Manual Fixes

Currently, Habit Quest counts the number of times a user has logged into the application, and after 30 logins, a regular user is promoted to an admin. This is a major security vulnurability, as giving access to anyone who meets these requirements could be detrimental to the company. 

### Before

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

### After

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
                }
                await user.save();
                console.log('User saved successfully:', user);
                return done(null, user);
            } catch (err) {
                console.error('Error in Google Strategy:', err);
                return done(err, null);
            }
        }));

Removing this else statement secured the application, and removed the possibility for regular users to change to admin users without proper authorization. This fix helps the developers feel more secure in their application, as they are in control of who can access the sensitive information of the company. 



# Part D - Ethical and Legal Considerations In Web Security

## Ethical Responsibilities of Security Professionals
When performing acts such as SQL injection and XSS attacks, I made sure to understand the ethical implications as I searched for vulnerabilities in my application. Testing my application locally through Burp Suite reassured me that there was no malicious intent behind my actions. Keeping everything within a secure environment and working on my own code allowed me to feel comfortable while attempting to attack the software.

## Legal Implications of Security Testing
Canada provides clear and concise information about its various cybersecurity laws, which would apply to Habit Quest.

For the private sector, the Personal Information Protection and Electronic Documents Act (PIPEDA) is federal legislation that protects the personal information of citizens when companies collect, use, and store their data. Organizations are responsible for their users’ personal information and must be transparent about how it is handled. For example, companies can only use personal information for the specific purpose it was collected and nothing else. This means they must clearly explain how data will be collected and used to avoid legal issues. This is particularly relevant to Habit Quest, as it handles users’ personal and sensitive information. It also handles their google information during sign in, meaning Habit Quest has to use that stored information without any malicious intent. 


# Lessons Learned
Overall, this was another difficult but insightful process in learning how to enhance a web application.

Creating the threat model was interesting—it gave me valuable insight into identifying a website’s vulnerabilities before even starting to code. Seeing the different types of attacks and potential entry points helped me better understand how to protect my web application and stop hackers before they can begin. Also, using the STRIDE model helped reiterate the concepts learned throughout the semester into a visual chart. Sometimes these concepts seem intimidating, so breaking it down into smaller parts helped my understanding of everything. 

Burp Suite came with a steep learning curve. I had to watch many tutorials online to grasp how it works, as the UI isn’t the most intuitive. However, once I understood the different sections and how they could be used to test the application, it became very insightful. I thought the different simulated attack options were interesting, even though the free version only allowed me to use the Sniper attack. In the future, I’d like to try out others like the Cluster Bomb to see additional ways my application might be vulnerable.

Overall, this semester has been one of the toughest classes I’ve ever taken, but also one of the most fulfilling. All the hours I put in paid off, as I can see the results in how much I’ve learned. I know this class will be valuable as I enter the industry, giving me an advantage over those who are not familiar with these concepts.
