const { google } = require('googleapis');
const { OAuth2 } = google.auth;

exports.oAuth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

exports.scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

exports.getValidTokenFromServer = async (refreshToken) => {
  const refreshedToken = await this.oAuth2Client.refreshToken(refreshToken);
  return refreshedToken.tokens;
};

exports.getRedirectUrl = () => {
  return new URL('/google-after-consent', process.env.ADMIN_CLIENT_APP_URL)
    .href;
};

exports.getAuthUrl = () => {
  return this.oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: this.scopes,
    prompt: 'consent',
    redirect_uri: this.getRedirectUrl(),
  });
};

exports.getGoogleToken = async (code) => {
  const data = await this.oAuth2Client.getToken({
    code,
    redirect_uri: this.getRedirectUrl(),
  });
  return data.tokens;
};
