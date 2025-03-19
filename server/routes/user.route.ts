import express from 'express';
import { 
  register, 
  login,
  getProfile, 
} from '../controllers/userController';
import { validateRequest } from '../middlewares/validateRequest';
import { registerSchema, loginSchema } from '../schemas/userSchema';
import { authenticate } from '../middlewares/authenticate';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

router.get('/profile', authenticate, getProfile);

export default router;