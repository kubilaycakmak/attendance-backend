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


router.post("/google-signup", async (req, res, next) => {

  // google gives us like this.
      /*{
        "email": "sata34.yu.7878@gmail.com",
        "familyName": "Satake",
        "givenName": "Yuya",
        "googleId": "109365793155475552621",
        "imageUrl": "https://lh3.googleusercontent.com/a-/AFdZucqViaCqMgayeWhZv31daOZSLJLWiRqYktC6f0du=s96-c",
        "name": "Yuya Satake"
        }

        user models is like this,
        {
            username:String, // emailを使用する
            full_name:String,
            password:String,
            email:String,
            type:String,
            created_at: String,
            profile_icture: String,
            used_google_account: Boolean,
        }

        frontend developer post request with that like this
        data = (responese from google)
        {
         {
            username: data.email,
            full_name:data.name,
            password:data.googleId,
            email,
            type:String, ??
            created_at: String,
            used_google_account: true,
            profile_picture: data.imageUrl
        }
        
        }
            
*/
  try {
    const creatingUser = req.body;
    const hash = await bcrypt.hash(creatingUser.password, 10);
    const existingUser = await User.findOne({ email: creatingUser.email });

      if(existingUser){
        return res.status(401).json({
          message: "User Already Exist!"
        })
      }
    
    const user = await User.create({...creatingUser,password: hash})
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

router.post("/google-login", async (req,res) => {
 
  try {
    const loginUser = req.body;

    const fetchedUser = await User.findOne({email:loginUser.email})
    if(!fetchedUser){
      return res.status(401).json({
        message: "Auth failed no such user"
      })
    }
      
    const result = await bcrypt.compare(loginUser.password, fetchedUser.password);

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
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err
    });
  }
})




export default router