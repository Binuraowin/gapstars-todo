import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { UserService } from '../../services/userService';
import config from '../../config/config';
import { 
  IUserCreate, 
  IUserLogin, 
  IUserUpdate, 
  IUserDocument
} from '../../types/index';

jest.mock('jsonwebtoken');
jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));
jest.mock('../../config/config', () => ({
  jwt: {
    secret: 'test-secret',
    accessExpirationMinutes: 30
  }
}));

import { User } from '../../models';

describe('UserService', () => {
  let userService: UserService;
  
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUserData = {
    _id: mockUserId,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    isEmailVerified: false,
    comparePassword: jest.fn()
  };
  
  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockToken = 'mock-jwt-token';
      
      const mockUser = {
        ...mockUserData,
        comparePassword: jest.fn()
      };
      
      (User.findOne as any).mockResolvedValue(null);
      (User.create as any).mockResolvedValue(mockUser);
      (jwt.sign as any).mockReturnValue(mockToken);

      const result = await userService.createUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        config.jwt.secret,
        { expiresIn: `${config.jwt.accessExpirationMinutes}m` }
      );
      expect(result).toEqual({
        user: mockUser,
        token: mockToken
      });
    });

    it('should throw an error if email is already in use', async () => {
      const userData: IUserCreate = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      const mockUser = {
        ...mockUserData,
        comparePassword: jest.fn()
      };
      
      (User.findOne as any).mockResolvedValue(mockUser);

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email is already in use');
      
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully with valid credentials', async () => {
      const loginData: IUserLogin = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockToken = 'mock-jwt-token';
      
      const mockComparePassword = jest.fn();
      (mockComparePassword as any).mockResolvedValue(true);
      
      const mockUser = {
        ...mockUserData,
        comparePassword: mockComparePassword
      };
      
      (User.findOne as any).mockResolvedValue(mockUser);
      (jwt.sign as any).mockReturnValue(mockToken);

      const result = await userService.loginUser(loginData);

      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockComparePassword).toHaveBeenCalledWith(loginData.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId },
        config.jwt.secret,
        { expiresIn: `${config.jwt.accessExpirationMinutes}m` }
      );
      expect(result).toEqual({
        user: mockUser,
        token: mockToken
      });
    });

    it('should throw an error if user is not found', async () => {
      const loginData: IUserLogin = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      (User.findOne as any).mockResolvedValue(null);

      await expect(userService.loginUser(loginData))
        .rejects
        .toThrow('Invalid email or password');
      
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
    });

    it('should throw an error if password is invalid', async () => {
      const loginData: IUserLogin = {
        email: 'test@example.com',
        password: 'wrongPassword'
      };
      
      const mockComparePassword = jest.fn();
      (mockComparePassword as any).mockResolvedValue(false);
      
      const mockUser = {
        ...mockUserData,
        comparePassword: mockComparePassword
      };
      
      (User.findOne as any).mockResolvedValue(mockUser);

      await expect(userService.loginUser(loginData))
        .rejects
        .toThrow('Invalid email or password');
      
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockComparePassword).toHaveBeenCalledWith(loginData.password);
    });
  });

  describe('getUserById', () => {
    it('should return a user when valid ID is provided', async () => {
      const userId = mockUserId;
      
      const mockUser = {
        ...mockUserData,
        comparePassword: jest.fn()
      };
      
      (User.findById as any).mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      
      (User.findById as any).mockResolvedValue(null);

      const result = await userService.getUserById(nonExistentUserId);

      expect(User.findById).toHaveBeenCalledWith(nonExistentUserId);
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user profile successfully', async () => {
      const userId = mockUserId;
      const updateData: IUserUpdate = {
        name: 'Updated Name'
      };
      
      const updatedUser = {
        ...mockUserData,
        name: 'Updated Name',
        comparePassword: jest.fn()
      };
      
      (User.findByIdAndUpdate as any).mockResolvedValue(updatedUser);

      const result = await userService.updateUser(userId, updateData);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toEqual(updatedUser);
    });

    it('should return null when user is not found', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const updateData: IUserUpdate = {
        name: 'Updated Name'
      };
      
      (User.findByIdAndUpdate as any).mockResolvedValue(null);

      const result = await userService.updateUser(nonExistentUserId, updateData);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        nonExistentUserId,
        updateData,
        { new: true, runValidators: true }
      );
      expect(result).toBeNull();
    });
  });
});