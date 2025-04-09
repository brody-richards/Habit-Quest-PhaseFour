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


## Input Validation Techniques

For the input validation on Habit Quest, I used the express-validator library, which can be installed through Node. I chose this library after watching a thorough video on how to implement it in an Express application. It took many hours to fully understand the concept, but once I did, I integrated it into the /profile/update route of my express application. 

Using online resources, including article and the documentation, i was able to figure out how to ensure that my form only accepts safe and expected data. 


The following fields appear in my app.js file using the express-validator library:

    app.post('/profile/update'),
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

### Name
-Ensures that the field exists, has a minimum length of 3, and a maximum length of 50 characters.

### Email
-Ensures that the field exists, follows a valid email format, and is normalized before submission. 

### Bio
-Ensures that the field exists, is no longer than 500 characters, and contains no special characters (only letters, spaces, and numbers).

Overall, while it took time to understand, the express-validator library was a good tool for ensuring that only correct data was passed on to the database, as well as used throughout the website. 



## Output Encoding Methods

For output encoding, I used EJS files to ensure that the data displayed on the screen was safe for the user. I applied this technique throughout the different pages of the website, used mostly on the dashboard, where users can view their updated information such as their name, email, and bio. This method helped prevent common attacks like XXS and SQL injection. 

Here is an example of the EJS template used on the user dashboard page. 

        <h1>User Dashboard.</h1>
        <p class="dashHead">Welcome to your dashboard, <%= user.name %>.</p>
        <p><strong>Your access is:</strong> Regular.
        <p><strong>Your role is:</strong> <%= user.role %></p>
        <p><strong>Your name is:</strong> <%= user.name %></p>
        <p><strong>Your email is:</strong> <%= user.accountEmail %>.</p>
        <p><strong>Your bio is:</strong> <%= user.bio %></p>

Using EJS tags properly helps escape certain content, such as a <script></script> tag. Instead of executing JS on the page, it renders potentially harmful code as plain text. This prevents malicious scripts from being injected and executed in the browser. 

Specifically, the '<%= %>' syntax helps escape and safely prints user information, ensuring that no unwanted or unexpected functionalities take place. 

Overall, using EJS was an effective way to help secure Habit Quest, helping ensure that only safe data is rendered to the user. 



## Encryption Techniques Used

For encryption, cipher functions were created to ensure that the data being sent and stored in the database in encrypted, while the data being retrieved and displayed properly is decrypted. Building on Ash's github example, I implemented two functions into my code to support this functionality. 

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

These functions were then passed into my database during the update process:

        if (user)
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

I used the encrypt function when storing information and sending it to the database, and the decrypt function when retrieving that data and displaying it to the user. 

the shift variable, which was used as part of the encryption function, is stored in my .env file to ensure that no user could access or see this sensitive information.

In the future, I plan to implement libraries such as Crypto to further strengthen the security of my website.



## Third-Party Library Dependency Management

In terms of third-party dependency management, I drew inspiration from the example provided in Ash's GitHub repository.

This setup ensures that Node's audit feature runs automatically once a week, identifying any vulnerabilities in outdated libraries and dependencies. By choosing to automate this process, potential issues can be detected and address without the need from the developer to find it themselves. 

This file can be found in the .github/workflows path. 



## Lessons Learned

Overall, this was once again quite a challenging assignment for me. I can see myself getting more comfortable with Node, but I know I still have a long way to go.

One area that improved for me during this phase was the need to consult documentation rather than trying to find a specific answer in a YouTube video or online article. I've found that there are often so may bugs or issues that can arise, and trying to find an exact solution isn't always the best path forward. After Ash's great lecture on breaking down a problem into smaller parts and trying to understand the logic before writing code, I was able to slow down and not get overwhelmed so quickly. 

Starting small and building up features was an effective approach for me during this assignment. After watching a YouTube tutorial on express-validator for example, I referred to the documentation to get an idea of where to start. I first checked these docs to see how to set a minimum number of characters. From there, I worked my way forward to achieve the other goals. This technique was a big improvement compared to phase two, where I found myself getting overwhelmed and lost very quickly. 

Overall, while this phase still required weeks of research, I am proud of the results I achieved. 

Also, I should note that all the resources I used have been included in an attribution document submitted to Brightspace. 