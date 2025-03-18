import { describe, it, expect, jest, beforeEach, test } from '@jest/globals';
import { Request, Response } from 'express';
import { userService } from '../../services/userService';
import { register, login, getProfile, updateProfile } from '../../controllers/userController';
import { 
  IAuthResponse, 
  IUserDocument, 
  IUserCreate, 
  IUserLogin, 
  IUserUpdate 
} from '../../types/index';
import { Document } from 'mongoose';

// Define proper types for request with user property
interface RequestWithUser extends Request {
  user?: IUserDocument;
}

// Create a proper mock of the userService
jest.mock('../../services/userService', () => ({
  userService: {
    createUser: jest.fn(),
    loginUser: jest.fn(),
    updateUser: jest.fn(),
  },
}));

describe('User Controller', () => {
  // Setup mock request and response
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Partial<Response>;
  let responseObj: any = {};

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup response mock
    responseObj = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockResponse = responseObj;
  });

  describe('register', () => {
    test('should register a user successfully', async () => {
      // Arrange
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Create mock user that matches the expected IUserDocument structure
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        isEmailVerified: false,
        comparePassword: jest.fn(),
      } as unknown as Omit<IUserDocument, 'password'>;
      
      const expectedResult: IAuthResponse = {
        user: mockUser,
        token: 'some-jwt-token'
      };
      
      mockRequest = {
        body: userData
      };
      
      // Use type assertion with any to bypass TypeScript's type checking for the mock
      (userService.createUser as any).mockResolvedValue(expectedResult);

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    test('should handle email already in use error', async () => {
      // Arrange
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      const error = new Error('Email is already in use');
      
      mockRequest = {
        body: userData
      };
      
      // Use type assertion with any
      (userService.createUser as any).mockRejectedValue(error);

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email is already in use',
        error
      });
    });

    test('should handle generic server error', async () => {
      // Arrange
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const error = new Error('Database connection error');
      
      mockRequest = {
        body: userData
      };
      
      // Use type assertion with any
      (userService.createUser as any).mockRejectedValue(error);

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database connection error',
        error
      });
    });

    test('should handle non-Error exception', async () => {
      // Arrange
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      mockRequest = {
        body: userData
      };
      
      // Use type assertion with any
      (userService.createUser as any).mockRejectedValue('Some string error');

      // Act
      await register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error registering user',
        error: 'Some string error'
      });
    });
  });

  describe('login', () => {
    test('should login a user successfully', async () => {
      // Arrange
      const loginData: IUserLogin = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Create mock user that matches the expected IUserDocument structure
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        isEmailVerified: false,
        comparePassword: jest.fn(),
      } as unknown as Omit<IUserDocument, 'password'>;
      
      const expectedResult: IAuthResponse = {
        user: mockUser,
        token: 'some-jwt-token'
      };
      
      mockRequest = {
        body: loginData
      };
      
      // Use type assertion with any
      (userService.loginUser as any).mockResolvedValue(expectedResult);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    test('should handle invalid credentials', async () => {
      // Arrange
      const loginData: IUserLogin = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const error = new Error('Invalid email or password');
      
      mockRequest = {
        body: loginData
      };
      
      // Use type assertion with any
      (userService.loginUser as any).mockRejectedValue(error);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
        error
      });
    });

    test('should handle server error during login', async () => {
      // Arrange
      const loginData: IUserLogin = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const error = new Error('Database error');
      
      mockRequest = {
        body: loginData
      };
      
      // Use type assertion with any
      (userService.loginUser as any).mockRejectedValue(error);

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error',
        error
      });
    });
  });
});