import Joi from 'joi';

const registerSchema = Joi.object({
  name: Joi.string().required().trim().min(2).max(50),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(8).max(30),
});

const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required(),
});

export { registerSchema, loginSchema };