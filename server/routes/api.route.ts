import express from 'express';
import taskRoutes from './task.route';
import userRoutes from './user.route';

const router = express.Router();

router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

export default router;