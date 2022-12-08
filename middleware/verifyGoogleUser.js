import axios from 'axios';

const verifyGoogleMiddleware = async (req, res, next) => {
  try {
    const { email, accessToken } = req.body;
    const resFromGoogle = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${accessToken}`
    );
    if (email !== resFromGoogle.data.email) {
      return res.status(401).json({
        message: "requested email does't match with the one from google.",
      });
    }

    next();
  } catch (err) {
    console.log('error', err.response);
    if (err.response.data.error_description === 'Invalid Value') {
      return res
        .status(401)
        .json({ message: 'accessToken is invalid. User is not from google' });
    }

    return res.status(500).json(err);
  }
};

export default verifyGoogleMiddleware;
