import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      // Optional: absent for OAuth-only accounts
    },
    provider: {
      type: String,
      enum: ['email', 'spotify', 'google'],
      default: 'email',
    },
    spotifyId: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
