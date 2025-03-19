import { Request, Response } from 'express';
import { userService } from '../services/userService';
import {
   IUserCreate,
   IUserLogin,
   IUserUpdate,
   IErrorResponse,
   IAuthResponse,
   IUserDocument
} from '../types/index';

interface RequestWithUser extends Request {
    user: {
      _id: string;
      [key: string]: any;
    };
  }

export const register = async (req: Request, res: Response<IAuthResponse | IErrorResponse>): Promise<void> => {
  try {
    const userData: IUserCreate = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    };
    
    const result = await userService.createUser(userData);
    res.status(201).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error registering user';
    res.status(error instanceof Error && error.message === 'Email is already in use' ? 400 : 500)
      .json({ message: errorMessage, error });
  }
};

export const login = async (req: Request, res: Response<IAuthResponse | IErrorResponse>): Promise<void> => {
  try {
    const loginData: IUserLogin = {
      email: req.body.email,
      password: req.body.password
    };
    
    const result = await userService.loginUser(loginData);
    res.status(200).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error logging in';
    res.status(error instanceof Error && error.message === 'Invalid email or password' ? 401 : 500)
      .json({ message: errorMessage, error });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching profile', error });
    }
  };