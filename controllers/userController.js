import User from '../models/user.js';
import Appointment from '../models/appointment.js';
import Reservation from '../models/reservation.js';
import Video from '../models/video.js';
import validateUserInfo from '../helpers/validateUserInfo.js';
import { getSchedules } from '../helpers/userHeplers.js';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import fileUploadHelper from '../helpers/flileUploadHelper.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ['Teacher', 'TA', 'Co-op Manager', 'Coordinator'] },
    });
    if (!users) {
      return res.status(404).json({
        message: 'User not exist.',
      });
    }

    return res.status(200).json({
      users,
    });
  } catch (err) {
    console.log('error: ', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const getLoggedInUserData = async (req, res) => {
  const { userId } = req.userData;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User with provided ID does not exist.',
      });
    }

    const appointments = await Appointment.find({
      $or: [{ created_by: userId }, { target_user: userId }],
    });
    const reservations = await Reservation.find({
      $or: [{ created_by: userId }, { target_user: userId }],
    });
    const videos = await Video.find({ userId });

    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.AUTH_EXPIRESIN }
    );

    res.status(200).json({
      token,
      user: {
        ...user._doc,
        password: undefined,
      },
      appointments,
      reservations,
      videos,
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const updateUserInfo = async (req, res) => {
  const { userId } = req.userData;
  const { full_name, password, current_program, social, videos } = req.body;
  // validate form data
  const errorMsg = validateUserInfo(req.body);
  if (errorMsg) {
    return res.status(400).json({
      message: errorMsg,
    });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User with provided ID does not exist.',
      });
    }
    if (full_name) user.full_name = full_name;
    if (password) user.password = password;
    if (current_program) user.current_program = current_program;
    if (social) {
      const { discord, slack, linkedin } = social;
      if (discord) user.social.discord = discord;
      if (slack) user.social.slack = slack;
      if (linkedin) user.social.linkedin = linkedin;
    }

    let videoForResponse;
    if (videos) {
      const videosInDb = await Video.find({ userId });
      const deleteAndUpdatePromises = videosInDb.map((videoInDb) => {
        const existingVideo = videos.find(
          (videoInReq) => videoInReq._id === videoInDb._id
        );
        if (!existingVideo) {
          return Video.deleteOne({ _id: videoInDb._id });
        }
        videoInDb.title = existingVideo.title;
        return videoInDb.save();
      });
      const createPromises = videos.map((videoInReq) => {
        if (!videosInDb.find((videoInDb) => videoInReq._id === videoInDb._id)) {
          return Video.create({
            userId,
            title: videoInReq.title,
            url: videoInReq.url,
            likes: [],
          });
        }
      });
      const promiseResults = await Promise.all([
        ...deleteAndUpdatePromises,
        ...createPromises,
      ]);
      videoForResponse = promiseResults.filter((result) => {
        return !result.deletedCount;
      });
    }
    await user.save();

    return res.status(200).json({ user, videos: videoForResponse });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

export const updateUserPhoto = async (req, res) => {
  const { userId } = req.userData;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User with provided ID does not exist.',
      });
    }
    const result = await fileUploadHelper(req.file.filename, userId, 'users');
    user.photo = result.url;
    await user.save();

    return res.status(201).json({
      message: 'Photo was successfully updated.',
      user,
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

/**
 * get all appointments of specific user
 */
export const getAppointmentsOfUser = async (req, res) => {
  const { id } = req.params;
  try {
    const appointments = await getSchedules(id);
    res.status(200).send(appointments);
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

// get user information by id
export const getUserById = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const user = await User.findById(id);
    

    if(!user) {
      res.status(404).json({
        "message": "We are not able to find the person using id is " + id
      })
    }else{
      res.status(200).send(user);
    }
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

/**
 * post new appointment
 */
export const createNewAppointment = async (req, res) => {
  const { created_by, target_user, datetime } = req.body;
  try {
    const createdUser = await User.findById(created_by);
    const targetUser = await User.findById(target_user);

    if (!createdUser || !targetUser) {
      return res.status(404).json({
        message: 'User with provided ID does not exist.',
      });
    }

    const schedules = await getSchedules(created_by);
    // check if requested date and time is available
    const dateObj = new Date(datetime);
    const month = dateObj.getMonth() + 1;
    const date = dateObj.getDate();
    const formattedTime = moment(datetime).format('h:mm A');
    let targetScheduleOption = schedules
      .find((monthBlock) => monthBlock[0].month === month)
      ?.find((dateBlock) => dateBlock.date === date)
      ?.options.find((option) => {
        return option.time === formattedTime;
      });

    console.log('target', targetScheduleOption);
    if (!targetScheduleOption || !targetScheduleOption.isAvailable) {
      return res.status(400).json({
        message: 'Requested date or time not available.',
      });
    }
    const appointment = await Appointment.create({
      created_by,
      target_user,
      datetime,
      status: 'Pending',
    });

    res.status(201).json({
      message: 'Appointment is now created with status pending.',
      appointment,
    });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

/**
 * set appointment status to "Active"
 */
export const confirmAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: 'appointment not found' });
    appointment.status = 'Active';
    await appointment.save();
    return res
      .status(200)
      .json({ message: 'Appointment is now confirmed', appointment });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

/**
 * set appointment status to "Canceled"
 */
export const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: 'Appointment not found' });
    appointment.status = 'Canceled';
    await appointment.save();
    return res
      .status(200)
      .json({ message: 'Appointment is now canceled', appointment });
  } catch (err) {
    console.log('err:', err);
    return res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};

/**
 * manage likes of video
 */
export const manageLikeOfVideo = async (req, res) => {
  const { videoId } = req.params;
  const { userId } = req.userData;
  const { isLike } = req.query;

  try {
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        message: 'Video with provided ID does not exist.',
      });
    }

    if (isLike) video.likes.push(userId);
    else
      video.likes = video.likes.filter((id) => {
        id !== userId;
      });

    await video.save();

    return res.status(200).json({
      message: 'User successfully liked the video.',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Unexpected error occured. Please try again.',
    });
  }
};
