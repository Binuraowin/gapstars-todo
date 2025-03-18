import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile 
} from '../controllers/userController';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validateRequest';
import { registerSchema, loginSchema } from '../schemas/userSchema';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

router.use(authenticate);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

export default router;