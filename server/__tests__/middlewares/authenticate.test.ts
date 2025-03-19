import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import config from '../../config/config';

jest.mock('jsonwebtoken');
jest.mock('../../models', () => ({
  User: {
    findById: jest.fn()
  }
}));
jest.mock('../../config/config', () => ({
  jwt: {
    secret: 'test-secret'
  }
}));

import { User } from '../../models';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUser = {
    _id: mockUserId,
    name: 'Test User',
    email: 'test@example.com'
  };
  
  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any
    };
    
    nextFunction = jest.fn();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const validToken = 'valid-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };
      
      const decodedToken = {
        userId: mockUserId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      };
      
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (User.findById as any).mockResolvedValue(mockUser);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith(validToken, config.jwt.secret);
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockRequest.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authorization token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic token123'
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authorization token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is empty', async () => {
      mockRequest.headers = {
        authorization: 'Bearer '
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authorization token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token verification fails', async () => {
      const invalidToken = 'invalid-token';
      mockRequest.headers = {
        authorization: `Bearer ${invalidToken}`
      };
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith(invalidToken, config.jwt.secret);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found', async () => {
      const validToken = 'valid-token';
      mockRequest.headers = {
        authorization: `Bearer ${validToken}`
      };
      
      const decodedToken = {
        userId: mockUserId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      };
      
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);
      (User.findById as any).mockResolvedValue(null);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verify).toHaveBeenCalledWith(validToken, config.jwt.secret);
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 500 when a server error occurs', async () => {
      mockRequest.headers = {};
      
      Object.defineProperty(mockRequest, 'headers', {
        get: () => {
          throw new Error('Unexpected server error');
        }
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication error' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});