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

// Define a custom request interface with user property
interface RequestWithUser extends Request {
  user: IUserDocument;
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

export const getProfile = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

export const updateProfile = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const updateData: IUserUpdate = {
      name: req.body.name
    };
        
    const userId = req.user._id;
    const updatedUser = await userService.updateUser(userId, updateData);
    
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
};