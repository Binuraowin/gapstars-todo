import express from 'express';
import { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../controllers/taskController';
import { authenticate } from '../middlewares/authenticate';
import { validateRequest } from '../middlewares/validateRequest';
import { createTaskSchema, updateTaskSchema } from '../schemas/taskSchema';

const router = express.Router();

router.use(authenticate);

router.get('/', getTasks);

router.get('/:id', getTask);

router.post('/', validateRequest(createTaskSchema), createTask);

router.patch('/:id', validateRequest(updateTaskSchema), updateTask);

router.delete('/:id', deleteTask);

export default router;