import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { TaskService } from '../../services/taskService';
import { TaskStatus, TaskPriority, RecurrencePattern } from '../../models/task.model';
import { 
  ITaskCreate, 
  ITaskUpdate, 
  ITaskQueryFilters 
} from '../../types/tasks';

jest.mock('../../models/task.model', () => {
  return {
    __esModule: true,
    default: {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
    },
    TaskStatus: {
      NOT_DONE: 'not_done',
      IN_PROGRESS: 'in_progress',
      DONE: 'done'
    },
    TaskPriority: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high'
    },
    RecurrencePattern: {
      NONE: 'none',
      DAILY: 'daily',
      WEEKLY: 'weekly',
      MONTHLY: 'monthly'
    }
  };
});

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn()
    }
  }
}));

import Task from '../../models/task.model';

describe('TaskService', () => {
  let taskService: TaskService;
  const userId = '507f1f77bcf86cd799439011';
  
  beforeEach(() => {
    taskService = new TaskService();
    jest.clearAllMocks();
    
    (mongoose.Types.ObjectId.isValid as any).mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getTasks', () => {
    it('should get all tasks for a user', async () => {
      const filters: ITaskQueryFilters = {
        sort: 'createdAt',
        order: 'desc'
      };
      
      const mockTasks = [
        {
          _id: '507f1f77bcf86cd799439021',
          title: 'Task 1',
          status: TaskStatus.NOT_DONE,
          userId
        },
        {
          _id: '507f1f77bcf86cd799439022',
          title: 'Task 2',
          status: TaskStatus.IN_PROGRESS,
          userId
        }
      ];
      
      const mockTaskQuery = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn()
      };
      
      (Task.find as any).mockReturnValue(mockTaskQuery);
      (mockTaskQuery.populate as any).mockResolvedValue(mockTasks);

      const result = await taskService.getTasks(userId, filters);

      expect(Task.find).toHaveBeenCalledWith({ userId });
      expect(mockTaskQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockTaskQuery.populate).toHaveBeenCalledWith('dependencies', 'title status');
      expect(result).toEqual(mockTasks);
    });

    it('should apply filters correctly', async () => {
      const filters: ITaskQueryFilters = {
        status: TaskStatus.NOT_DONE,
        priority: TaskPriority.HIGH,
        search: 'test',
        sort: 'priority',
        order: 'asc'
      };
      
      const mockTasks = [
        {
          _id: '507f1f77bcf86cd799439021',
          title: 'Test Task 1',
          status: TaskStatus.NOT_DONE,
          priority: TaskPriority.HIGH,
          userId
        }
      ];
      
      const mockTaskQuery = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn()
      };
      
      (Task.find as any).mockReturnValue(mockTaskQuery);
      (mockTaskQuery.populate as any).mockResolvedValue(mockTasks);

      const result = await taskService.getTasks(userId, filters);

      expect(Task.find).toHaveBeenCalledWith({
        userId,
        status: TaskStatus.NOT_DONE,
        priority: TaskPriority.HIGH,
        title: { $regex: 'test', $options: 'i' }
      });
      expect(mockTaskQuery.sort).toHaveBeenCalledWith({ priority: 1 });
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getTaskById', () => {
    it('should get a task by ID', async () => {
      const taskId = '507f1f77bcf86cd799439021';
      
      const mockTask = {
        _id: taskId,
        title: 'Task 1',
        status: TaskStatus.NOT_DONE,
        userId
      };
      
      const mockTaskQuery = {
        populate: jest.fn()
      };
      
      (Task.findOne as any).mockReturnValue(mockTaskQuery);
      (mockTaskQuery.populate as any).mockResolvedValue(mockTask);

      const result = await taskService.getTaskById(taskId, userId);

      expect(Task.findOne).toHaveBeenCalledWith({ _id: taskId, userId });
      expect(mockTaskQuery.populate).toHaveBeenCalledWith('dependencies', 'title status');
      expect(result).toEqual(mockTask);
    });

    it('should throw an error if task ID is invalid', async () => {
      const invalidTaskId = 'invalid-id';
      
      (mongoose.Types.ObjectId.isValid as any).mockReturnValue(false);

      await expect(taskService.getTaskById(invalidTaskId, userId))
        .rejects
        .toThrow('Invalid task ID');
      
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidTaskId);
      expect(Task.findOne).not.toHaveBeenCalled();
    });

    it('should return null if task is not found', async () => {
      const taskId = '507f1f77bcf86cd799439099';
      
      const mockTaskQuery = {
        populate: jest.fn()
      };
      
      (Task.findOne as any).mockReturnValue(mockTaskQuery);
      (mockTaskQuery.populate as any).mockResolvedValue(null);

      const result = await taskService.getTaskById(taskId, userId);

      expect(Task.findOne).toHaveBeenCalledWith({ _id: taskId, userId });
      expect(result).toBeNull();
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const taskData: ITaskCreate = {
        title: 'New Task',
        description: 'Task description',
        status: TaskStatus.NOT_DONE,
        priority: TaskPriority.MEDIUM,
        isRecurring: false,
        userId
      };
      
      const createdTask = {
        _id: '507f1f77bcf86cd799439031',
        ...taskData
      };
      
      (Task.create as any).mockResolvedValue(createdTask);

      const result = await taskService.createTask(taskData);

      expect(Task.create).toHaveBeenCalledWith(taskData);
      expect(result).toEqual(createdTask);
    });

    it('should validate dependency IDs', async () => {
        const taskData: ITaskCreate = {
          title: 'New Task',
          description: 'Task description',
          status: TaskStatus.NOT_DONE,
          priority: TaskPriority.MEDIUM,
          dependencies: ['507f1f77bcf86cd799439021', 'invalid-id'],
          isRecurring: false,
          userId
        };
        
        (mongoose.Types.ObjectId.isValid as any)
          .mockImplementation((id: string) => id !== 'invalid-id');
        
        (Task.findOne as any).mockImplementation((query: { _id: string, userId: string }) => {
          if (query._id === '507f1f77bcf86cd799439021') {
            return Promise.resolve({ _id: query._id });
          }
          return Promise.resolve(null);
        });
      
        await expect(taskService.createTask(taskData))
          .rejects
          .toThrow('Invalid dependency ID: invalid-id');
        
        expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('507f1f77bcf86cd799439021');
        expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('invalid-id');
        
        expect(Task.findOne).toHaveBeenCalledWith({ 
          _id: '507f1f77bcf86cd799439021', 
          userId 
        });
      });
    it('should validate that dependency tasks exist', async () => {
      const dependencyId = '507f1f77bcf86cd799439021';
      const taskData: ITaskCreate = {
        title: 'New Task',
        description: 'Task description',
        status: TaskStatus.NOT_DONE,
        priority: TaskPriority.MEDIUM,
        dependencies: [dependencyId],
        isRecurring: false,
        userId
      };
      
      (Task.findOne as any).mockResolvedValueOnce(null);

      await expect(taskService.createTask(taskData))
        .rejects
        .toThrow(`Dependency task not found: ${dependencyId}`);
      
      expect(Task.findOne).toHaveBeenCalledWith({ _id: dependencyId, userId });
      expect(Task.create).not.toHaveBeenCalled();
    });

    it('should set recurrence dates for recurring tasks', async () => {
      const now = new Date('2023-01-01T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);
      
      const taskData: ITaskCreate = {
        title: 'Recurring Task',
        description: 'Daily task',
        status: TaskStatus.NOT_DONE,
        priority: TaskPriority.MEDIUM,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.DAILY,
        userId
      };
      
      (Task.create as any).mockImplementation((data: any) => {
        return Promise.resolve(data);
      });

      await taskService.createTask(taskData);

      expect(Task.create).toHaveBeenCalled();
      
      const createCall = (Task.create as any).mock.calls[0][0];
      expect(createCall).toHaveProperty('lastRecurrence');
      expect(createCall).toHaveProperty('nextRecurrence');
      
      jest.useRealTimers();
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const taskId = '507f1f77bcf86cd799439021';
      const updateData: ITaskUpdate = {
        title: 'Updated Task',
        description: 'Updated description'
      };
      
      const existingTask = {
        _id: taskId,
        title: 'Original Task',
        description: 'Original description',
        status: TaskStatus.NOT_DONE,
        dependencies: [],
        userId
      };
      
      const updatedTask = {
        ...existingTask,
        ...updateData
      };
      
      (Task.findOne as any).mockResolvedValue(existingTask);
      
      const mockUpdatedTaskQuery = {
        populate: jest.fn()
      };
      
      (Task.findOneAndUpdate as any).mockReturnValue(mockUpdatedTaskQuery);
      (mockUpdatedTaskQuery.populate as any).mockResolvedValue(updatedTask);

      const result = await taskService.updateTask(taskId, userId, updateData);

      expect(Task.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: taskId, userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(updatedTask);
    });

    it('should throw an error if task ID is invalid', async () => {
      const invalidTaskId = 'invalid-id';
      const updateData: ITaskUpdate = {
        title: 'Updated Task'
      };
      
      (mongoose.Types.ObjectId.isValid as any).mockReturnValue(false);

      await expect(taskService.updateTask(invalidTaskId, userId, updateData))
        .rejects
        .toThrow('Invalid task ID');
      
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidTaskId);
      expect(Task.findOne).not.toHaveBeenCalled();
      expect(Task.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw an error if task is not found', async () => {
      const taskId = '507f1f77bcf86cd799439099';
      const updateData: ITaskUpdate = {
        title: 'Updated Task'
      };
      
      (Task.findOne as any).mockResolvedValue(null);

      await expect(taskService.updateTask(taskId, userId, updateData))
        .rejects
        .toThrow('Task not found');
      
      expect(Task.findOne).toHaveBeenCalledWith({ _id: taskId, userId });
      expect(Task.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should check dependencies are completed when marking task as done', async () => {
      const taskId = '507f1f77bcf86cd799439021';
      const updateData: ITaskUpdate = {
        status: TaskStatus.DONE
      };
      
      const existingTask = {
        _id: taskId,
        title: 'Task with dependencies',
        status: TaskStatus.IN_PROGRESS,
        dependencies: ['507f1f77bcf86cd799439022', '507f1f77bcf86cd799439023'],
        userId
      };
      
      const unfinishedDependencies = [
        { _id: '507f1f77bcf86cd799439022', title: 'Dependency 1', status: TaskStatus.IN_PROGRESS },
        { _id: '507f1f77bcf86cd799439023', title: 'Dependency 2', status: TaskStatus.NOT_DONE }
      ];
      
      (Task.findOne as any).mockResolvedValue(existingTask);
      (Task.find as any).mockResolvedValue(unfinishedDependencies);

      await expect(taskService.updateTask(taskId, userId, updateData))
        .rejects
        .toThrow('Cannot mark task as done. The following dependent tasks are not completed: Dependency 1, Dependency 2');
      
      expect(Task.find).toHaveBeenCalledWith({
        _id: { $in: existingTask.dependencies },
        status: { $ne: TaskStatus.DONE }
      });
      expect(Task.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskId = '507f1f77bcf86cd799439021';
      
      const existingTask = {
        _id: taskId,
        title: 'Task to delete',
        userId
      };
      
      (Task.find as any).mockResolvedValue([]);
      (Task.findOneAndDelete as any).mockResolvedValue(existingTask);

      const result = await taskService.deleteTask(taskId, userId);

      expect(Task.find).toHaveBeenCalledWith({ dependencies: taskId });
      expect(Task.findOneAndDelete).toHaveBeenCalledWith({ _id: taskId, userId });
      expect(result).toBe(true);
    });

    it('should throw an error if task ID is invalid', async () => {
      const invalidTaskId = 'invalid-id';
      
      (mongoose.Types.ObjectId.isValid as any).mockReturnValue(false);

      await expect(taskService.deleteTask(invalidTaskId, userId))
        .rejects
        .toThrow('Invalid task ID');
      
      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith(invalidTaskId);
      expect(Task.findOneAndDelete).not.toHaveBeenCalled();
    });

    it('should throw an error if task is not found', async () => {
      const taskId = '507f1f77bcf86cd799439099';
      
      (Task.find as any).mockResolvedValue([]);
      (Task.findOneAndDelete as any).mockResolvedValue(null);

      await expect(taskService.deleteTask(taskId, userId))
        .rejects
        .toThrow('Task not found');
      
      expect(Task.findOneAndDelete).toHaveBeenCalledWith({ _id: taskId, userId });
    });

    it('should throw an error if task has dependent tasks', async () => {
      const taskId = '507f1f77bcf86cd799439021';
      
      const dependentTasks = [
        { _id: '507f1f77bcf86cd799439022', title: 'Dependent Task 1' },
        { _id: '507f1f77bcf86cd799439023', title: 'Dependent Task 2' }
      ];
      
      (Task.find as any).mockResolvedValue(dependentTasks);

      await expect(taskService.deleteTask(taskId, userId))
        .rejects
        .toThrow('Cannot delete task. The following tasks depend on it: Dependent Task 1, Dependent Task 2');
      
      expect(Task.find).toHaveBeenCalledWith({ dependencies: taskId });
      expect(Task.findOneAndDelete).not.toHaveBeenCalled();
    });
  });

  describe('processRecurringTasks', () => {
    it('should process recurring tasks', async () => {
      const now = new Date('2023-01-01T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);
      
      const mockSave = jest.fn();
      (mockSave as any).mockResolvedValue(true);
      
      const recurringTasks = [
        {
          _id: '507f1f77bcf86cd799439031',
          title: 'Daily Task',
          description: 'Repeat daily',
          status: TaskStatus.DONE,
          priority: TaskPriority.HIGH,
          isRecurring: true,
          recurrencePattern: RecurrencePattern.DAILY,
          dependencies: [],
          userId: '507f1f77bcf86cd799439011',
          lastRecurrence: new Date('2022-12-31T12:00:00Z'),
          nextRecurrence: new Date('2023-01-01T12:00:00Z'),
          save: mockSave
        }
      ];
      
      (Task.find as any).mockResolvedValue(recurringTasks);
      (Task.create as any).mockResolvedValue({});

      await taskService.processRecurringTasks();

      expect(Task.find).toHaveBeenCalledWith({
        isRecurring: true,
        nextRecurrence: { $lte: now }
      });
      
      expect(Task.create).toHaveBeenCalledTimes(1);
      
      expect(mockSave).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('should handle errors during processing', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Database error');
      
      (Task.find as any).mockRejectedValue(error);

      await taskService.processRecurringTasks();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing recurring tasks:',
        error
      );
      
      consoleSpy.mockRestore();
    });
  });
});