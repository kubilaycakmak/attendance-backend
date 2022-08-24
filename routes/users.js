import express from 'express';
import User from '../models/user.js';
import Appointment from '../models/appointment.js';
import Reservation from '../models/reservation.js';
import decodeJWT from '../middleware/check_auth.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get("/me",decodeJWT, async (req, res) => {
    const { userId } = req.userData;
    try {
        const user = await User.findById(userId);
            if(!user){
                return res.status(400).json({
                  message: "no such user"
                })
            }
        
        const appointments = await Appointment.find({user_id: userId });
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
            reservations: reservations
        });
        // res.status(200).json(user)
        
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
})

router.put("/information-update",decodeJWT ,async (req,res) => {
    const { userId } = req.userData;
    const { username, full_name, password, email, role, current_program, photo, social } = req.body.user
    
    try {
        const user = await User.findById(userId);
        if(!user){
            return res.status(400).json({
              message: "no such user"
            })
        }
        user.username = username;
        user.full_name = full_name;
        user.password = password;
        user.email = email;
        user.role = role;
        user.current_program = current_program;
        user.photo = photo;
        user.social = social;

        await user.save();
        console.log(user)
        
        return res.status(200).json(user);

    } catch (err) {
        console.error(err);
        res.status(500).json(err);

    }
})

// router.post ("/create-appointment/:user_id", async (req, res) => {
//     const { user_id } = req.params;
//     try {
//         const appointment = await Appointment.find({ user_id });
//     } catch (err) {
        
//     }
// })



// router.put("/appointment-update/:user_id", async (req, res) => {
//     const { user_id } = req.params;
//     try {
//         const appointment = await Appointment.find({ user_id });
//     } catch (err) {
        
//     }
// })

// router.put("/reservation-update/:user_id", async (req, res) => {
//     const { user_id } = req.params;
//     try {
        

//     } catch (err) {
        
//     }

// })

export default router;
