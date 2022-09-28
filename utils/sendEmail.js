import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

export const oauth2Client = new OAuth2(
  '173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com', // ClientID
  'OKXIYR14wBB_zumf30EC__iJ', // Client Secret
  'https://developers.google.com/oauthplayground' // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token:
    '1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w',
});

export const accessToken = oauth2Client.getAccessToken();

export const sendEmail = async (email, subject, link) => {
  try {
    const transporter = nodemailer.createTransport({
      // host: process.env.HOST,
      // service: process.env.SERVICE,
      // port: 587,
      // secure: true,
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'nodejsa@gmail.com',
        clientId:
          '173872994719-pvsnau5mbj47h0c6ea6ojrl7gjqq1908.apps.googleusercontent.com',
        clientSecret: 'OKXIYR14wBB_zumf30EC__iJ',
        refreshToken:
          '1//04T_nqlj9UVrVCgYIARAAGAQSNwF-L9IrGm-NOdEKBOakzMn1cbbCHgg2ivkad3Q_hMyBkSQen0b5ABfR8kPR18aOoqhRrSlPm9w',
        accessToken: accessToken,
      },
      // auth: {
      //   user: process.env.USER,
      //   pass: process.env.PASS,
      // },
    });
    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      html: `
      <h2>Hello</h2>
      <p>This is reset password email to ${email}</p>
      <a href=${link}>Click me</a>
      `,
    });
  } catch (error) {
    console.log(`${error} email not sent`);
  }
};
