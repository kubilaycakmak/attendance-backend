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
import moment from "moment";

const router = express.Router();
// router.use()

router.get("/me", decodeJWT, async (req, res) => {
  const { userId } = req.userData;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
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

router.put(
  "/information-update",
  decodeJWT,
  upload.single("photo"),
  async (req, res) => {
    const { userId } = req.userData;
    const { full_name, password, current_program, social } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
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
  }
);

router.post(
  "/update-photo",
  decodeJWT,
  upload.single("photo"),
  async (req, res) => {
    const { userId } = req.userData;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: "no such user",
        });
      }
      const result = await cloudinary.uploader.upload(req.file.filename, {
        public_id: userId,
        folder: "attendance/users",
        overwrite: true,
      });
      console.log(result);

      fs.unlink(`${req.file.filename}`, (err) => {
        if (err) throw err;
        console.log("file successfully deleted");
      });
      user.photo = result.url;
      await user.save();

      return res.status(201).json({
        message: "user photo is updated successfully!!",
        user,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json(err);
    }
  }
);

router.get("/:id/appointments", async (req, res) => {
  const { id } = req.params;
  console.log("here");
  try {
    /*
     */
    // find all appointments
    const appointments = await Appointment.find({ created_by: id }); // [{date: 1663109366731 }]
    console.log("appointments: ", appointments);
    const duration = 60 * 60 * 1000;
    const availabilityStart = 9;
    const availabilityEnd = 17;
    // create initial date objects array
    const allMonthsDates = [
      [
        {
          month: 1,
          date: 1,
          options: [],
        },
        // { month: 1, date: 31, options: [] },
      ],
      // [
      //   { month: 2, date: 1, options: [] },
      //   { month: 2, date: 28, options: [] },
      // ],
    ];

    const options = []; // [9, 10, 11, ...]
    for (let i = availabilityStart; i < availabilityEnd; i++) {
      options.push({
        time: moment(i, ["HH"]).format("h:mm A"),
        isAvailable: false,
      });
    }
    const modifiedAllMonthsDates = allMonthsDates.map((month) => {
      return month.map((dateObj) => {
        const individualOptions = [...options];

        //1月1日のappoitment全部取ってくる
        const appintmentsForTheDay = appointments.filter((appointment) => {
          return (
            new Date(appointment.date).getMonth() + 1 === dateObj,
            month && new Date(appointment.date).getDate() === dateObj.date
          );
        });

        console.log("appintmentsFortheDay", appintmentsForTheDay);
        // extract hours from date timestamp - Ex) [1, 4, ... 12、,4,4]
        const startHours = appintmentsForTheDay.map((appointment) =>
          moment(new Date(appointment.date).getHours(), ["HH"]).format("h:mm A")
        );
        console.log("startHours", startHours);

        // exclude time options that are already booked
        const excludedIndividualOptions = individualOptions.map((option) => {
          return {
            ...option,
            isAvailable: !startHours.includes(option.time),
          };
        });

        return {
          ...dateObj,
          options: [...excludedIndividualOptions],
        };
      });
    });
    res.status(200).send(modifiedAllMonthsDates);
  } catch (err) {
    console.error("error", err);
  }
});

router.post("/appointment", async (req, res) => {
  const { created_by, target_user, date } = req.body;
  try {
    const createdUser = await User.findById(created_by);
    const targetUser = await User.findById(target_user);

    if (!createdUser || !targetUser) {
      return res.status(404).json({
        message: "no such user",
      });
    }

    const appointment = await Appointment.create({
      created_by,
      target_user,
      date,
      status: "Pending",
    });

    res.status(201).json({
      message: "appointment is now created with status pending",
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

router.put("/apointment/confirm", async (req, res) => {
  try {
    const appintment = await Appointment.findById(created_by);
    if (!appintment) res.status(404).json({ message: "appointment not found" });
    appintment.status = "Active";
    await appintment.save();
    res.status();
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

router.put("appintment/cancel", async (req, res) => {
  try {
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

export default router;
