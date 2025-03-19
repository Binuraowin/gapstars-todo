import { describe, it, expect, jest, beforeEach, test } from '@jest/globals';
import { Request, Response } from 'express';
import { userService } from '../../services/userService';
import { register, login, getProfile } from '../../controllers/userController';
import { 
  IAuthResponse, 
  IUserDocument, 
  IUserCreate, 
  IUserLogin, 
  IUserUpdate 
} from '../../types/index';
import { Document } from 'mongoose';

interface RequestWithUser extends Request {
  user?: IUserDocument;
}

jest.mock('../../services/userService', () => ({
  userService: {
    createUser: jest.fn(),
    loginUser: jest.fn(),
    updateUser: jest.fn(),
  },
}));

describe('User Controller', () => {
  let mockRequest: Partial<RequestWithUser>;
  let mockResponse: Partial<Response>;
  let responseObj: any = {};

  beforeEach(() => {
    jest.clearAllMocks();
    
    responseObj = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockResponse = responseObj;
  });

  describe('register', () => {
    test('should register a user successfully', async () => {
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
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
      
      (userService.createUser as any).mockResolvedValue(expectedResult);

      await register(mockRequest as Request, mockResponse as Response);

      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    test('should handle email already in use error', async () => {
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      const error = new Error('Email is already in use');
      
      mockRequest = {
        body: userData
      };
      
      (userService.createUser as any).mockRejectedValue(error);

      await register(mockRequest as Request, mockResponse as Response);

      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Email is already in use',
        error
      });
    });

    test('should handle generic server error', async () => {
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const error = new Error('Database connection error');
      
      mockRequest = {
        body: userData
      };
      
      (userService.createUser as any).mockRejectedValue(error);

      await register(mockRequest as Request, mockResponse as Response);

      expect(userService.createUser).toHaveBeenCalledWith(userData);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database connection error',
        error
      });
    });

    test('should handle non-Error exception', async () => {
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      mockRequest = {
        body: userData
      };
      
      (userService.createUser as any).mockRejectedValue('Some string error');

      await register(mockRequest as Request, mockResponse as Response);

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
      const loginData: IUserLogin = {
        email: 'test@example.com',
        password: 'password123'
      };
      
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
      
      (userService.loginUser as any).mockResolvedValue(expectedResult);

      await login(mockRequest as Request, mockResponse as Response);

      expect(userService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    test('should handle invalid credentials', async () => {
      const loginData: IUserLogin = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      const error = new Error('Invalid email or password');
      
      mockRequest = {
        body: loginData
      };
      
      (userService.loginUser as any).mockRejectedValue(error);

      await login(mockRequest as Request, mockResponse as Response);

      expect(userService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid email or password',
        error
      });
    });

    test('should handle server error during login', async () => {
      const loginData: IUserLogin = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const error = new Error('Database error');
      
      mockRequest = {
        body: loginData
      };
      
      (userService.loginUser as any).mockRejectedValue(error);

      await login(mockRequest as Request, mockResponse as Response);

      expect(userService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error',
        error
      });
    });
  });

  describe('getProfile', () => {
    test('should return user profile when authenticated', async () => {
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        isEmailVerified: true
      };
      
      mockRequest = {
        user: mockUser as any
      };
  
      await getProfile(mockRequest as Request, mockResponse as Response);
  
      expect(responseObj.status).toHaveBeenCalledWith(200);
      expect(responseObj.json).toHaveBeenCalledWith(mockUser);
    });
  
    test('should return 401 when user is not authenticated', async () => {
      mockRequest = {};
  
      await getProfile(mockRequest as Request, mockResponse as Response);
  
      expect(responseObj.status).toHaveBeenCalledWith(401);
      expect(responseObj.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });
});