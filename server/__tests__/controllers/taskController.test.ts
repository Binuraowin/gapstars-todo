import { describe, it, expect, jest, beforeEach, test } from '@jest/globals';
import { Request, Response } from 'express';
import { taskService } from '../../services/taskService';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  processRecurringTasks
} from '../../controllers/taskController';
import {
  ITaskDocument,
  ITaskQueryFilters,
  ITaskCreate,
  ITaskUpdate
} from '../../types/tasks';
import { TaskStatus, TaskPriority, RecurrencePattern } from '../../models/task.model';
import mongoose from 'mongoose';

interface RequestWithUser extends Request {
  user: {
    _id: string;
    [key: string]: any;
  };
}

jest.mock('../../services/taskService', () => ({
  taskService: {
    getTasks: jest.fn(),
    getTaskById: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    processRecurringTasks: jest.fn()
  }
}));

describe('Task Controller', () => {
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Partial<Response>;
  let responseObj: any = {};
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
    
    responseObj = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockResponse = responseObj;

    mockRequest = {
      user: { _id: userId },
      query: {},
      body: {},
      params: {}
    };
  });

  describe('getTasks', () => {
    test('should return tasks successfully', async () => {
      const filters: ITaskQueryFilters = {
        status: TaskStatus.NOT_DONE,
        sort: 'createdAt',
        order: 'desc'
      };
      
      mockRequest.query = {
        status: TaskStatus.NOT_DONE,
        sort: 'createdAt',
        order: 'desc'
      };
      
      const mockTasks = [
        {
          _id: '507f1f77bcf86cd799439012',
          title: 'Task 1',
          status: TaskStatus.NOT_DONE,
          priority: TaskPriority.MEDIUM,
          isRecurring: false,
          userId: userId,
          dependencies: []
        },
        {
          _id: '507f1f77bcf86cd799439013',
          title: 'Task 2',
          status: TaskStatus.NOT_DONE,
          priority: TaskPriority.HIGH,
          isRecurring: false,
          userId: userId,
          dependencies: []
        }
      ];

      (taskService.getTasks as any).mockResolvedValue(mockTasks);

      await getTasks(mockRequest as RequestWithUser, mockResponse as Response);

      expect(taskService.getTasks).toHaveBeenCalledWith(userId, expect.anything());
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should handle error when fetching tasks', async () => {
      const error = new Error('Database error');
      (taskService.getTasks as any).mockRejectedValue(error);

      await getTasks(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching tasks',
        error
      });
    });
  });

  describe('getTask', () => {
    test('should return task by id successfully', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const mockTask = {
        _id: taskId,
        title: 'Task 1',
        status: TaskStatus.NOT_DONE,
        priority: TaskPriority.MEDIUM,
        isRecurring: false,
        userId: userId,
        dependencies: []
      };

      (taskService.getTaskById as any).mockResolvedValue(mockTask);

      await getTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(taskService.getTaskById).toHaveBeenCalledWith(taskId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
    });

    test('should return 404 when task is not found', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };

      (taskService.getTaskById as any).mockResolvedValue(null);
      await getTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(taskService.getTaskById).toHaveBeenCalledWith(taskId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Task not found'
      });
    });

    test('should return 400 when task id is invalid', async () => {
      const taskId = 'invalid-id';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Invalid task ID');
      (taskService.getTaskById as any).mockRejectedValue(error);

      await getTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(taskService.getTaskById).toHaveBeenCalledWith(taskId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid task ID'
      });
    });

    test('should handle server error', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Database error');
      (taskService.getTaskById as any).mockRejectedValue(error);

      await getTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching task',
        error
      });
    });
  });

  describe('createTask', () => {
    test('should create a new task successfully', async () => {
      const taskData: ITaskCreate = {
        title: 'New Task',
        description: 'Task description',
        status: TaskStatus.NOT_DONE,
        priority: TaskPriority.HIGH,
        isRecurring: false,
        userId: userId
      };
      
      mockRequest.body = {
        title: 'New Task',
        description: 'Task description',
        status: TaskStatus.NOT_DONE,
        priority: TaskPriority.HIGH,
        isRecurring: false
      };
      
      const createdTask = {
        _id: '507f1f77bcf86cd799439014',
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      (taskService.createTask as any).mockResolvedValue(createdTask);

      await createTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(taskService.createTask).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdTask);
    });

    test('should return 400 when invalid dependency is provided', async () => {
      mockRequest.body = {
        title: 'New Task',
        dependencies: ['invalid-id']
      };
      
      const error = new Error('Invalid dependency ID: invalid-id');
      (taskService.createTask as any).mockRejectedValue(error);

      await createTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid dependency ID: invalid-id'
      });
    });

    test('should handle server error', async () => {
      mockRequest.body = { title: 'New Task' };
      
      const error = new Error('Database error');
      (taskService.createTask as any).mockRejectedValue(error);

      await createTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating task',
        error
      });
    });
  });

  describe('updateTask', () => {
    test('should update task successfully', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const updateData: ITaskUpdate = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS
      };
      
      mockRequest.body = updateData;
      
      const updatedTask = {
        _id: taskId,
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        isRecurring: false,
        userId: userId
      };
      
      (taskService.updateTask as any).mockResolvedValue(updatedTask);

      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(taskService.updateTask).toHaveBeenCalledWith(taskId, userId, updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedTask);
    });

    test('should return 400 when task id is invalid', async () => {
      const taskId = 'invalid-id';
      mockRequest.params = { id: taskId };
      mockRequest.body = { title: 'Updated Task' };
      
      const error = new Error('Invalid task ID');
      (taskService.updateTask as any).mockRejectedValue(error);

      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid task ID'
      });
    });

    test('should return 404 when task is not found', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      mockRequest.body = { title: 'Updated Task' };
      
      const error = new Error('Task not found');
      (taskService.updateTask as any).mockRejectedValue(error);

      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Task not found'
      });
    });

    test('should return 400 when trying to mark task as done with unfinished dependencies', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      mockRequest.body = { status: TaskStatus.DONE };
      
      const error = new Error('Cannot mark task as done. The following dependent tasks are not completed: Task A, Task B');
      (taskService.updateTask as any).mockRejectedValue(error);

      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Cannot mark task as done. The following dependent tasks are not completed: Task A, Task B'
      });
    });

    test('should handle server error', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      mockRequest.body = { title: 'Updated Task' };
      
      const error = new Error('Database error');
      (taskService.updateTask as any).mockRejectedValue(error);

      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error updating task',
        error
      });
    });
  });

  describe('deleteTask', () => {
    test('should delete task successfully', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      (taskService.deleteTask as any).mockResolvedValue(true);

      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(taskService.deleteTask).toHaveBeenCalledWith(taskId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Task deleted successfully'
      });
    });

    test('should return 400 when task id is invalid', async () => {
      const taskId = 'invalid-id';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Invalid task ID');
      (taskService.deleteTask as any).mockRejectedValue(error);

      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid task ID'
      });
    });

    test('should return 404 when task is not found', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Task not found');
      (taskService.deleteTask as any).mockRejectedValue(error);

      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Task not found'
      });
    });

    test('should return 400 when task has dependent tasks', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Cannot delete task. The following tasks depend on it: Task A, Task B');
      (taskService.deleteTask as any).mockRejectedValue(error);

      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Cannot delete task. The following tasks depend on it: Task A, Task B'
      });
    });

    test('should handle server error', async () => {
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Database error');
      (taskService.deleteTask as any).mockRejectedValue(error);

      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error deleting task',
        error
      });
    });
  });

  describe('processRecurringTasks', () => {
    test('should process recurring tasks successfully', async () => {
      (taskService.processRecurringTasks as any).mockResolvedValue(undefined);

      await processRecurringTasks();

      expect(taskService.processRecurringTasks).toHaveBeenCalled();
    });
  });
});