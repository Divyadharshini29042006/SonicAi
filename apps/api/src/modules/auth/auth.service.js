import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './auth.model.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Hash the refresh token before storing it
  const salt = await bcrypt.genSalt(12);
  const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

  user.refreshTokenHash = refreshTokenHash;
  await user.save();

  // Strip password and refresh token hash for response security
  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.refreshTokenHash;

  return {
    accessToken,
    refreshToken,
    user: userObj,
  };
};

export const signup = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({
    name,
    email: email.toLowerCase(),
    passwordHash,
    provider: 'email',
  });

  return generateTokens(user);
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  return generateTokens(user);
};

export const loginWithSpotify = async ({ spotifyProfile }) => {
  const { id: spotifyId, displayName, email, images } = spotifyProfile;
  const avatarUrl = images && images.length > 0 ? images[0].url : null;

  let user = await User.findOne({ spotifyId });

  if (!user) {
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (user) {
      user.spotifyId = spotifyId;
      if (!user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
    } else {
      user = new User({
        name: displayName || email || 'Spotify User',
        email: email ? email.toLowerCase() : `${spotifyId}@spotify.sonicai.internal`,
        provider: 'spotify',
        spotifyId,
        avatarUrl,
      });
    }
  }

  return generateTokens(user);
};

export const refreshSession = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.refreshTokenHash) {
    throw new AppError('Session not found or expired', 401);
  }

  const isMatched = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!isMatched) {
    throw new AppError('Invalid session token', 401);
  }

  return generateTokens(user);
};

export const logout = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokenHash = null;
    await user.save();
  }
};
