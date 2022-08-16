import express from 'express';
import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {

    User.findOne({email:req.body.email}).then(user1=>{
      if(user1){
        return res.status(401).json({
          message: "User Already Exist!"
        })
      }

      user.save().then(result => {
        if(!result){
          return res.status(500).json({
            message: "Error when creating user"
          })
        }
        res.status(201).json({
          message: "User created!",
          result: result
        });
      })
    })   
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
  })
});

router.post("/login", (req, res, next) => {
  let fetchedUser;
  User.findOne({email:req.body.email}).then(user=>{
    if(!user){
      return res.status(401).json({
        message: "Auth failed no such user"
      })
    }
    fetchedUser=user;
    return bcrypt.compare(req.body.password, user.password);
  }).then(result=>{
    if(!result){
      return res.status(401).json({
        message: "Auth failed inccorect password"
      })
    }
    const token = jwt.sign(
      { email: fetchedUser.email, userId: fetchedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.AUTH_EXPIRESIN }
    );
    res.status(200).json({
      token: token,
      expiresIn: process.env.AUTH_EXPIRESIN,
      userId: fetchedUser._id
    });
  })
  .catch(e=>{
    console.log(e)
  })
});

export default router