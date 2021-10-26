'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const base64 = require('base-64');
const router = express.Router();
const Users = require('./models/users-model');


router.use(express.urlencoded({ extended: true }));

Users.beforeCreate(async user => {
  let encryptedPassword = await bcrypt.hash(user.password, 10);
  user.password = encryptedPassword;
  console.log('BEFORECREATE', user.password);
});


router.post('/signup', async (req, res) => {
    try {
      req.body.password = await bcrypt.hash(req.body.password, 10);
      const record = await Users.create(req.body);
      // console.log(record);
      res.status(200).json(record);
    } catch (e) {
      res.status(403).send('Error Creating User');
    }
});
  
router.post('/signin', async (req, res) => {
    /*
      req.headers.authorization is : "Basic sdkjdsljd="
      To get username and password from this, take the following steps:
        - Turn that string into an array by splitting on ' '
        - Pop off the last value
        - Decode that encoded string so it returns to user:pass
        - Split on ':' to turn it into an array
        - Pull username and password from that array
    */
  
    let basicHeaderParts = req.headers.authorization.split(' '); // ['Basic', 'sdkjdsljd=']
    let encodedString = basicHeaderParts.pop(); // sdkjdsljd=
    let decodedString = base64.decode(encodedString); // "username:password"
    let [username, password] = decodedString.split(':'); // username, password
  
    /*
      Now that we finally have username and password, let's see if it's valid
      1. Find the user in the database by username
      2. Compare the plaintext password we now have against the encrypted password in the db
         - bcrypt does this by re-encrypting the plaintext password and comparing THAT
      3. Either we're valid or we throw an error
    */
    try {
      const user = await Users.findOne({ where: { username: username } });
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        res.status(200).json(user);
      } else {
        throw new Error('Invalid User');
      }
    } catch (error) {
      res.status(403).send('Invalid Login');
    }
});
  
module.exports = router;