import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateRequest } from '../../middlewares/validateRequest';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  
  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn() as any
    };
    
    nextFunction = jest.fn();
  });

  describe('validateRequest', () => {
    it('should call next() when validation passes', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });
      
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      const validateMiddleware = validateRequest(schema);
      validateMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    it('should return 400 when validation fails', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });
      
      mockRequest.body = {
        name: 'Test User'
      };
      
      const validateMiddleware = validateRequest(schema);
      validateMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: expect.stringContaining('"email" is required') 
      });
    });
    
    it('should return multiple error messages when multiple fields fail validation', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().integer().min(18).required()
      });
      
      mockRequest.body = {
        email: 'invalid-email'
      };
      
      const validateMiddleware = validateRequest(schema);
      validateMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: expect.stringMatching(/\"name\".*\"email\".*\"age\"/) 
      });
    });
    
    it('should reject unknown fields when using a schema with unknown: false', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      }).unknown(false);
      
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        unknownField: 'some value'
      };
      
      const validateMiddleware = validateRequest(schema);
      validateMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: expect.stringContaining('"unknownField" is not allowed') 
      });
    });
    
    it('should pass validation with unknown fields if schema allows it', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      }).unknown(true);
      
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        unknownField: 'some value'
      };
      
      const validateMiddleware = validateRequest(schema);
      validateMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    it('should properly validate different data types', () => {
      const schema = Joi.object({
        id: Joi.number().integer().required(),
        isActive: Joi.boolean().required(),
        tags: Joi.array().items(Joi.string()).required()
      });
      
      mockRequest.body = {
        id: 123,
        isActive: true,
        tags: ['tag1', 'tag2']
      };
      
      const validateMiddleware = validateRequest(schema);
      validateMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    it('should validate nested objects', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          contact: Joi.object({
            email: Joi.string().email().required()
          }).required()
        }).required()
      });
      
      mockRequest.body = {
        user: {
          name: 'Test User',
          contact: {
            email: 'test@example.com'
          }
        }
      };
      
      const validateMiddleware = validateRequest(schema);
      validateMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
    
    it('should fail validation for nested objects with errors', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          contact: Joi.object({
            email: Joi.string().email().required()
          }).required()
        }).required()
      });
      
      mockRequest.body = {
        user: {
          name: 'Test User',
          contact: {
            email: 'invalid-email'
          }
        }
      };
      
      const validateMiddleware = validateRequest(schema);
      validateMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
      
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: expect.stringContaining('"user.contact.email" must be a valid email') 
      });
    });
  });
});