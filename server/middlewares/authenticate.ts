import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import config from '../config/config';

interface IDecodedToken {
  userId: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Authorization token required' });
      return;
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as IDecodedToken;
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }
      
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Authentication error' });
  }
};