// hashPassword.js (create this file temporarily)
const bcrypt = require('bcrypt');

async function hashMyPassword(password) {
    const saltRounds = 10; // The cost factor for hashing. Higher is slower but more secure.
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Hashed Password:', hashedPassword);
}

// Replace 'your_admin_password' with the password you want to use
hashMyPassword('777@Ashir');

// To run this: node hashPassword.js