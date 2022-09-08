import express from "express";
import User from "../models/user.js";
import Appointment from "../models/appointment.js";
import Reservation from "../models/reservation.js";
import decodeJWT from "../middleware/check_auth.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import upload from "../middleware/multer.js";
import cloudinary from "../config/cloudStorage.js";
import fs from "fs";

const router = express.Router();

router.get("/me", decodeJWT, async (req, res) => {
  const { userId } = req.userData;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "no such user",
      });
    }

    const appointments = await Appointment.find({ user_id: userId });
    const reservations = await Reservation.find({ user_id: userId });

    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.AUTH_EXPIRESIN }
    );

    res.status(200).json({
      token: token,
      user: user,
      appointments: appointments,
      reservations: reservations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

router.put("/information-update", decodeJWT, upload.single("photo"), async (req, res) => {
  const { userId } = req.userData;
  const { full_name, password, current_program,social } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "no such user",
      });
    }

    if (full_name) user.full_name = full_name;
    if (password) user.password = password;
    if (current_program) user.current_program = current_program;
    if (social) {
     
      const { discord, slack, linkedin } = social;

      if (discord) social.discord = discord;
      if (slack) social.slack = slack;
      if (linkedin) social.linkedin = linkedin;
      user.social = social;
    }

    await user.save();
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

router.post("/update-photo", decodeJWT, upload.single("photo"), async (req, res) => {
  const { userId } = req.userData;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "no such user",
      });
    }
    const result =  await cloudinary.uploader
    .upload(req.file.filename,
    {
        public_id: userId,
        folder: 'attendance/users',
        overwrite: true
      })
    console.log(result)

    fs.unlink(`${req.file.filename}`, (err) => {
        if (err) throw err;
        console.log("file successfully deleted");
    });
    user.photo = result.url;
    await user.save();

    return res.status(201).json({
      message: "user photo is updated successfully!!",
      user
    });

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
    
})

export default router;
