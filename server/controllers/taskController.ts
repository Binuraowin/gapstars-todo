import { Request, Response } from 'express';
import { taskService } from '../services/taskService';
import { ITaskUpdate, ITaskQueryFilters } from '../types/tasks';

interface RequestWithUser extends Request {
  user: {
    _id: string;
    [key: string]: any;
  };
}

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as RequestWithUser).user._id;
    const filters: ITaskQueryFilters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      search: req.query.search as string,
      sort: req.query.sort as string || 'createdAt',
      order: (req.query.order as 'asc' | 'desc') || 'desc'
    };

    const tasks = await taskService.getTasks(userId, filters);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user._id;

    try {
      const task = await taskService.getTaskById(id, userId);
      
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }
      
      res.status(200).json(task);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid task ID') {
        res.status(400).json({ message: error.message });
        return;
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as RequestWithUser).user._id;
    const taskData = {
      ...req.body,
      userId,
    };

    try {
      const newTask = await taskService.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof Error && 
        (error.message.includes('Invalid dependency ID') || 
         error.message.includes('Dependency task not found'))) {
        res.status(400).json({ message: error.message });
        return;
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user._id;
    const updates: ITaskUpdate = req.body;

    try {
      const updatedTask = await taskService.updateTask(id, userId, updates);
      res.status(200).json(updatedTask);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid task ID') {
          res.status(400).json({ message: error.message });
          return;
        } else if (error.message === 'Task not found') {
          res.status(404).json({ message: error.message });
          return;
        } else if (
          error.message.includes('Cannot mark task as done') ||
          error.message.includes('Invalid dependency ID') ||
          error.message.includes('Dependency task not found') ||
          error.message.includes('A task cannot depend on itself')
        ) {
          res.status(400).json({ message: error.message });
          return;
        }
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as RequestWithUser).user._id;

    try {
      await taskService.deleteTask(id, userId);
      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid task ID') {
          res.status(400).json({ message: error.message });
          return;
        } else if (error.message === 'Task not found') {
          res.status(404).json({ message: error.message });
          return;
        } else if (error.message.includes('Cannot delete task')) {
          res.status(400).json({ message: error.message });
          return;
        }
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
};

export const processRecurringTasks = async (): Promise<void> => {
  await taskService.processRecurringTasks();
};