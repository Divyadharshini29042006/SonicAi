import Joi from 'joi';

export const signupSchema = Joi.object({
  name: Joi.string().min(2).required().trim(),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(6).required(),
});

export const spotifyAuthSchema = Joi.object({
  code: Joi.string().required(),
});

export const googleAuthSchema = Joi.object({
  code: Joi.string().required(),
});
