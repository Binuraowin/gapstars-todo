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

// Define a custom request interface with user property
interface RequestWithUser extends Request {
  user: {
    _id: string;
    [key: string]: any;
  };
}

// Mock the taskService
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
  // Setup mock request and response
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Partial<Response>;
  let responseObj: any = {};
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup response mock
    responseObj = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockResponse = responseObj;
    
    // Setup default request with user
    mockRequest = {
      user: { _id: userId },
      query: {},
      body: {},
      params: {}
    };
  });

  describe('getTasks', () => {
    test('should return tasks successfully', async () => {
      // Arrange
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
      
      // Use 'any' type to avoid TypeScript errors
      (taskService.getTasks as any).mockResolvedValue(mockTasks);

      // Act
      await getTasks(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(taskService.getTasks).toHaveBeenCalledWith(userId, expect.anything());
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
    });

    test('should handle error when fetching tasks', async () => {
      // Arrange
      const error = new Error('Database error');
      // Use 'any' type to avoid TypeScript errors
      (taskService.getTasks as any).mockRejectedValue(error);

      // Act
      await getTasks(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching tasks',
        error
      });
    });
  });

  describe('getTask', () => {
    test('should return task by id successfully', async () => {
      // Arrange
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
      
      // Use 'any' type to avoid TypeScript errors
      (taskService.getTaskById as any).mockResolvedValue(mockTask);

      // Act
      await getTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(taskService.getTaskById).toHaveBeenCalledWith(taskId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
    });

    test('should return 404 when task is not found', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      // Use 'any' type to avoid TypeScript errors
      (taskService.getTaskById as any).mockResolvedValue(null);

      // Act
      await getTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(taskService.getTaskById).toHaveBeenCalledWith(taskId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Task not found'
      });
    });

    test('should return 400 when task id is invalid', async () => {
      // Arrange
      const taskId = 'invalid-id';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Invalid task ID');
      // Use 'any' type to avoid TypeScript errors
      (taskService.getTaskById as any).mockRejectedValue(error);

      // Act
      await getTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(taskService.getTaskById).toHaveBeenCalledWith(taskId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid task ID'
      });
    });

    test('should handle server error', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Database error');
      // Use 'any' type to avoid TypeScript errors
      (taskService.getTaskById as any).mockRejectedValue(error);

      // Act
      await getTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error fetching task',
        error
      });
    });
  });

  describe('createTask', () => {
    test('should create a new task successfully', async () => {
      // Arrange
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
      
      // Use 'any' type to avoid TypeScript errors
      (taskService.createTask as any).mockResolvedValue(createdTask);

      // Act
      await createTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(taskService.createTask).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdTask);
    });

    test('should return 400 when invalid dependency is provided', async () => {
      // Arrange
      mockRequest.body = {
        title: 'New Task',
        dependencies: ['invalid-id']
      };
      
      const error = new Error('Invalid dependency ID: invalid-id');
      // Use 'any' type to avoid TypeScript errors
      (taskService.createTask as any).mockRejectedValue(error);

      // Act
      await createTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid dependency ID: invalid-id'
      });
    });

    test('should handle server error', async () => {
      // Arrange
      mockRequest.body = { title: 'New Task' };
      
      const error = new Error('Database error');
      // Use 'any' type to avoid TypeScript errors
      (taskService.createTask as any).mockRejectedValue(error);

      // Act
      await createTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating task',
        error
      });
    });
  });

  describe('updateTask', () => {
    test('should update task successfully', async () => {
      // Arrange
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
      
      // Use 'any' type to avoid TypeScript errors
      (taskService.updateTask as any).mockResolvedValue(updatedTask);

      // Act
      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(taskService.updateTask).toHaveBeenCalledWith(taskId, userId, updateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedTask);
    });

    test('should return 400 when task id is invalid', async () => {
      // Arrange
      const taskId = 'invalid-id';
      mockRequest.params = { id: taskId };
      mockRequest.body = { title: 'Updated Task' };
      
      const error = new Error('Invalid task ID');
      // Use 'any' type to avoid TypeScript errors
      (taskService.updateTask as any).mockRejectedValue(error);

      // Act
      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid task ID'
      });
    });

    test('should return 404 when task is not found', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      mockRequest.body = { title: 'Updated Task' };
      
      const error = new Error('Task not found');
      // Use 'any' type to avoid TypeScript errors
      (taskService.updateTask as any).mockRejectedValue(error);

      // Act
      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Task not found'
      });
    });

    test('should return 400 when trying to mark task as done with unfinished dependencies', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      mockRequest.body = { status: TaskStatus.DONE };
      
      const error = new Error('Cannot mark task as done. The following dependent tasks are not completed: Task A, Task B');
      // Use 'any' type to avoid TypeScript errors
      (taskService.updateTask as any).mockRejectedValue(error);

      // Act
      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Cannot mark task as done. The following dependent tasks are not completed: Task A, Task B'
      });
    });

    test('should handle server error', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      mockRequest.body = { title: 'Updated Task' };
      
      const error = new Error('Database error');
      // Use 'any' type to avoid TypeScript errors
      (taskService.updateTask as any).mockRejectedValue(error);

      // Act
      await updateTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error updating task',
        error
      });
    });
  });

  describe('deleteTask', () => {
    test('should delete task successfully', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      // Use 'any' type to avoid TypeScript errors
      (taskService.deleteTask as any).mockResolvedValue(true);

      // Act
      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(taskService.deleteTask).toHaveBeenCalledWith(taskId, userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Task deleted successfully'
      });
    });

    test('should return 400 when task id is invalid', async () => {
      // Arrange
      const taskId = 'invalid-id';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Invalid task ID');
      // Use 'any' type to avoid TypeScript errors
      (taskService.deleteTask as any).mockRejectedValue(error);

      // Act
      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid task ID'
      });
    });

    test('should return 404 when task is not found', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Task not found');
      // Use 'any' type to avoid TypeScript errors
      (taskService.deleteTask as any).mockRejectedValue(error);

      // Act
      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Task not found'
      });
    });

    test('should return 400 when task has dependent tasks', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Cannot delete task. The following tasks depend on it: Task A, Task B');
      // Use 'any' type to avoid TypeScript errors
      (taskService.deleteTask as any).mockRejectedValue(error);

      // Act
      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Cannot delete task. The following tasks depend on it: Task A, Task B'
      });
    });

    test('should handle server error', async () => {
      // Arrange
      const taskId = '507f1f77bcf86cd799439012';
      mockRequest.params = { id: taskId };
      
      const error = new Error('Database error');
      // Use 'any' type to avoid TypeScript errors
      (taskService.deleteTask as any).mockRejectedValue(error);

      // Act
      await deleteTask(mockRequest as RequestWithUser, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error deleting task',
        error
      });
    });
  });

  describe('processRecurringTasks', () => {
    test('should process recurring tasks successfully', async () => {
      // Arrange
      // Use 'any' type to avoid TypeScript errors
      (taskService.processRecurringTasks as any).mockResolvedValue(undefined);

      // Act
      await processRecurringTasks();

      // Assert
      expect(taskService.processRecurringTasks).toHaveBeenCalled();
    });
  });
});