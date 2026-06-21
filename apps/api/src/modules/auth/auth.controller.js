import asyncHandler from '../../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import {
  signup as authSignup,
  login as authLogin,
  loginWithSpotify,
  refreshSession,
  logout as authLogout,
} from './auth.service.js';

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authSignup({ name, email, password });
  setRefreshTokenCookie(res, result.refreshToken);
  return successResponse(res, { accessToken: result.accessToken, user: result.user }, 'User signup successful', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authLogin({ email, password });
  setRefreshTokenCookie(res, result.refreshToken);
  return successResponse(res, { accessToken: result.accessToken, user: result.user }, 'User login successful');
});

export const spotifyAuth = asyncHandler(async (req, res) => {
  const { code } = req.body;

  // =========================================================================
  // PLACEHOLDER: Exchange OAuth Code with Spotify's Endpoints
  // =========================================================================
  // To complete this in the future:
  // 1. Send POST to https://accounts.spotify.com/api/token using client credentials
  //    exchanging the 'code' and 'redirect_uri' for accessToken & refreshToken.
  // 2. Query GET https://api.spotify.com/v1/me with the access token to fetch user profile.
  //
  // Since Spotify developer API client secrets are not configured yet,
  // we mock a returned Spotify profile using the supplied code.
  const mockSpotifyProfile = {
    id: `mock_spotify_id_${code.substring(0, 10)}`,
    displayName: 'Mock Spotify User',
    email: 'mockspotify@sonicai.com',
    images: [{ url: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41' }],
  };
  // =========================================================================

  const result = await loginWithSpotify({ spotifyProfile: mockSpotifyProfile });
  setRefreshTokenCookie(res, result.refreshToken);
  return successResponse(res, { accessToken: result.accessToken, user: result.user }, 'Spotify authentication successful');
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return errorResponse(res, 'Refresh token cookie missing', 401);
  }

  const result = await refreshSession(refreshToken);
  setRefreshTokenCookie(res, result.refreshToken);
  return successResponse(res, { accessToken: result.accessToken, user: result.user }, 'Session token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await authLogout(userId);
  clearRefreshTokenCookie(res);
  return successResponse(res, null, 'User logged out successfully');
});
