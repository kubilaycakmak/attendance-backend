import express from 'express';
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import  verifyGoogleMiddleware from "../middleware/verify_google_user.js"

const router = express.Router();

router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    User.findOne({ email: req.body.email })
      .then((user1) => {
        if (user1) {
          return res.status(401).json({
            message: "User Already Exist!",
          });
        }
        user1 = new User(req.body);
        user1.save().then((result) => {
          if (!result) {
            return res.status(500).json({
              message: "Error when creating user",
            });
          }
          res.status(201).json({
            message: "User created!",
            result: result,
          });
        });
      })
      .catch((err) => {
        res.status(500).json({
          error: err,
        });
      });
  });
});

router.post("/login", (req, res, next) => {
  let fetchedUser;
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed no such user",
        });
      }
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then((result) => {
      if (!result) {
        if (res.status === 403) {
          return res.status(403).json({
            message: "Auth failed incorrect password",
          });
        }
      }
      const token = jwt.sign(
        { email: fetchedUser.email, userId: fetchedUser._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.AUTH_EXPIRESIN }
      );
      res.status(200).json({
        token: token,
        expiresIn: process.env.AUTH_EXPIRESIN,
        userId: fetchedUser._id,
        username: fetchedUser.username,
        email: fetchedUser.email,
        type: fetchedUser.type,
      });
    })
    .catch((e) => {
      console.log(e);
    });
});


router.post("/google-signup",verifyGoogleMiddleware, async (req, res) => {

  const creatingUser = req.body;
  const { email, password } = creatingUser;
  
  try {
    if ( !email || !password) {
      return res.status(400).json({
            message:"please fill the required field"
          })
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await User.findOne({ email: email });

      if(existingUser){
        return res.status(400).json({
          message: "User Already Exist!"
        })
      }
    
    const user = await User.create({...creatingUser,password: hashedPassword})
    if (!user) {
      return res.status(500).json({
        message: "Error when creating user"
      });
    }
    res.status(201).json({
      message: "User created!",
      result: user
    }); 
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err
    });
  }
})

router.post("/google-login",verifyGoogleMiddleware, async (req,res) => {
  
  try {
    const { email} = req.body;
    
    const user = await User.findOne({email})
    if(!user){
      return res.status(401).json({
        message: "Auth failed no such user"
      })
    }
      
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.AUTH_EXPIRESIN }
    );
    res.status(200).json({
      token: token,
      expiresIn: process.env.AUTH_EXPIRESIN,
      user
    });  
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err
    });
  }
})

router.post("/set-password", async (req, res) => {
  const { email, currentPassword, newPassword } = req.body; 
  
  try {
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
            message:"please fill the required inputs"
          })
    }
    const user = await User.findOne({email,password:currentPassword})
    if(!user){
      return res.status(400).json({
        message: "No such user"
      })
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(201).json({
      message: "Password is successfuly updated!",
      result:user
    }); 
    
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err
    });
  }

})


router.post("/forget-password", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        message: "user with given email doesn't exist.",
      });
    }
    return res.status(200).json({
      // send an email to user with expireable link : nodemailer
      email: user.email,
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/new-password", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        message: "user with given email doesn't exist.",
      });
    }
    const new_password = req.body.password;
    // const confirm_password = req.body.password;
    user.password = new_password;
    // hash the password
    user.save();
    return res.status(200).json({
      message: "success",
    });
  } catch (error) {
    console.log(error);
  }
});

export default router;
