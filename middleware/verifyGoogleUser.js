import axios from 'axios';

const verifyGoogleMiddleware = async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    const {
      data: { email, id, name, picture },
    } = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo?fields=id,email,name,picture',
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      }
    );
    req.userData = { email, id, name, picture };
    next();
  } catch (err) {
    console.log('error:!!', err.response?.data);
    if (err.response.data) {
      return res
        .status(401)
        .json({ message: 'accessToken is invalid. User is not from google' });
    }

    return res.status(500).json(err);
  }
};

export default verifyGoogleMiddleware;
