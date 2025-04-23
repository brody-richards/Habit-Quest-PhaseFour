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

Google id – unique ID assigned to a google account
Username – full name on google account
Email – email on google account
loginCount – number of times the users has logged into the application
accountName – Account name saved on profile from phase three (different from google username above)
accountEmail – Account email saved on profile from phase three (different from google email above)
bio – account bio saved on profile from phase three.

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


#

