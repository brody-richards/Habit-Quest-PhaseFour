# HabitQuest
Project: Phase One | Web Security | Habit Quest Web Application | Brody Richards

Setup Instructions:

To configure the server, the following steps were taken:

1. First, I created a directory for my project. In my case, this was a folder called 'HabitQuest'.

2. After creating this folder, I navigated into it using the terminal and used 'npm init -y'. This initialized a new npm package in that folder.

3. Once that folder was initialized, I installed the node express packages required to set up my server, using the command 'npm install express https fs hsts'

4. After installing express, I created a javascript file that allowed me to write the code that runs the server.

5. In this file, I declared all the variables that were needed to run the server using Node.js and Express. This included declaring variables for express, https, fs, http, hsts, app, PORT_HTTP, and PORT_HTTPS. 

6. After defining these variables, I set up the routs for the Habit Quest web application to use, ensuring that all the routs were linked to their respective paths. For example, app.get('/habits') would return you to the habits page of my server. 

7. Finally, I created the HSTS middleware, set up the HTTPS server (including the certificate and private key), and started the server. 


SSL Configuration:

I used the OpenSSL setup method to configure HTTPS for my Habit Tracking Application. I chose this method because I was familiar with the process from our in-class lab. Through my research, I discovered that OpenSSL is one of the most popular choices on the market due to it being both free and open sourced. Using OpenSSL helps protect the integrity of our data and allows me to deploy a secure web server that can be trusted. Overall, I believe this was the correct method for this assignment, but in the future, I will familiarize myself with Let's Encrypt to better understand other options available in the industry.

When uploading these files to GitHub, I will be sure to put both the 'certificate.pem' and the 'private-key.pem' in a gitignore file, as to maintain the security of my server and not make that information public. I will also include the node_modules inside that gitignore file, so whomever looks at my repository isn't forced to download the massive amount of files on their machine. 


While Helmet automatically set many headers across my server, there were a few adjustments that I felt would help make it more secure. 

By default, the X-Frame-Options header is set to the value of 'sameorigin'. From research I leaned that this helps mitigate clickjacking attacks. Setting this value to 'deny' disables this option completely across your website, ensuring higher security from attacks. 

The Strict-Transport-Security header is automatically set to 'max-age=15552000; includeSubDomains;. From research, I learned this header tells the browser to use HTTPS over HTTP, as the former is much more secure. I changed the max-year to a value of 1 year, ensuring security over a longer period. I also changed the preload value to be true, ensuring that a users browser always attempts to preload from the HTTPS server on repeated visits. 

For all other security headers, I will use the default options set up when installing Helmet. 

The most challenging part of setting up HTTPS and Helmet was understanding all the header options, as well as the rational behind the default settings. In our lab we implemented Helmet, but did not focus on modifying specific headers. This assignment was a valuable learning experience in understanding how these headers contribute to server security. 


Caching Strategies:

/ (home)
Data on the home page is cached every 5 minutes. This is because the home page data does not change frequently, but still gives enough time for the user to make adjustments and save that information if necessary, mitigating the amount of server requests. 

/habits
Data on the habits page is cached every 1 minute. This is because this information can change frequently. For example, the user can enter a new habit they want to start, or update a tally of the habits they are continuing to use.This is also public to allow anyone to store the page information. 

/goals
Data on the goals page is cached every 15 minutes. This is because goals usually do not change as much as habits do. This still leaves enough time for goals to be saved in a 15 minute window, but odds are that the user will not change their monthly and yearly goals too often. This is also public to allow anyone to cache the page information. 

/profile
Data on the profile page is cached every 1 hour. This is because users are less likely to repeatedly change their profile information, such as name, birthday, and any other preferences. That being said, there is always an option for them to make those changes if needed. Private was also implemented onto this caching strategy, as user information should be cached by only those will authorized access to that information.

/posts 
Data on the post page is cached every 5 minutes. This is because posts can be updated often, but do not always have to be in real time. This would allow time for posts to be deleted if the user wanted, not slowing down the server in any way. This is also public to allow anyone to store the page's information. The 'stale-while-revalidate=86400' allows the cache to reuse a stale response. This means the cache is fresh for 7 days, but after that it becomes stale and it is allowed to reuse it for any requests the following day. 


Lessons learned:

There were many lessons learned throughout phase one of the assignment. 

Firstly, I was forced to understand exactly how these routs would be used in a real application. The lab was a bit confusing to me, so to actually create routs that followed specific paths like habits, goals, and profile was useful to practice. 

Secondly, I learned much more about helmet and the headers that are automatically set on installation. I was a bit confused on the assignment as to if we were actually supposed to alter the set headers, but I found a few ways that doing so would actually help me set up a more secure server. Helmet is one of the industry standards in server protection, so altering the pre-set headers was intimidating at first, but I learned a lot about the various types of attacks that could happen if these steps were not taken. 

Finally, it was interesting to get a better understanding of how caching is done across the web. I always knew this required some time to understand, but actually thinking through the different concepts was helpful to understand why different pages need different caching strategies, and how they can impact the overall website. 

Overall, this project provided me with valuable experience in setting up a secure web application, and I am looking forward to making more customizations to the website. 