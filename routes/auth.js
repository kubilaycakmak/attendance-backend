import express, { response } from "express";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import dotenv from "dotenv";
dotenv.config();
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

router.post("/forget-password", async (req, res, next) => {
  try {
    let fetchUser;
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({
        message: "email doesn't exist.",
      });
    }
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          return res.status(400).json({
            message: "email for this user not exist",
          });
        }
        fetchUser = user;
      })
      .then(() => {
        const token = jwt.sign({ _id: fetchUser._id }, process.env.JWT_SECRET, {
          expiresIn: process.env.AUTH_EXPIRESIN,
        });

        const link = `${process.env.BASE_URL}/${token}`;

        sendEmail(email, "Password reset", link).then(() => {
          return res.status(200).json({
            message: "email successfully sent",
          });
        });
      });
  } catch (err) {
    console.log(err);
  }
});

router.get("/forget-password/:token", async (req, res, next) => {
  try {
    const { token } = req.params;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
        if (err) {
          console.log("the link is not working, please try again");
        }
        const { _id } = decodedToken;
        User.findById({ _id: _id }, (err, user) => {
          if (!err) {
            console.log("redirect to frontend");
            const { _id } = decodedToken;
            console.log(_id);
            res.redirect(`${process.env.FRONT_END_URL}/reset/${_id}/`);
          } else {
            return res
              .status(404)
              .json({ message: "there is no such an email" });
          }
        });
      });
    }
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Invalid credentials, please fill all inputs" });
  }
});

router.post("/new-password/:_id", async (req, res, next) => {
  try {
    const { _id } = req.params;
    const user = await User.findById({ _id: _id });
    if (!user) {
      return res.status(400).json({
        message: "user doesn't exist.",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const new_password = req.body.password;
    user.password = await bcrypt.hash(new_password, salt);
    await user.save();
    res.send("password reset successfully.");
    return res.status(200).json({
      message: "success",
    });
  } catch (error) {
    return res.status(400).json({
      message: "something went wrong",
    });
  }
});

export default router;
