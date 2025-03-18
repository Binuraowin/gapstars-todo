import jwt from 'jsonwebtoken';
import { User } from '../models';
import config from '../config/config';
import { 
  IUserCreate, 
  IUserLogin, 
  IUserUpdate, 
  IUserDocument, 
  IAuthResponse 
} from '../types/index';
import mongoose from 'mongoose'; 

export class UserService {
  /**
   * Create a new user
   * @param userData User data to create
   * @returns New user and auth token
   */
  async createUser(userData: IUserCreate): Promise<IAuthResponse> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email is already in use');
    }

    const newUser = await User.create(userData);

    const token = this.generateToken((newUser._id as mongoose.Types.ObjectId).toString());

    return {
      user: newUser,
      token,
    };
  }

  /**
   * Authenticate user with email and password
   * @param loginData Login credentials
   * @returns User and auth token
   */
  async loginUser(loginData: IUserLogin): Promise<IAuthResponse> {
    const user = await User.findOne({ email: loginData.email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await user.comparePassword(loginData.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken((user._id as mongoose.Types.ObjectId).toString());

    return {
      user,
      token,
    };
  }

  /**
   * Get user by ID
   * @param userId User ID
   * @returns User document
   */
  async getUserById(userId: string): Promise<IUserDocument | null> {
    return User.findById(userId);
  }

  /**
   * Update user profile
   * @param userId User ID
   * @param updateData Data to update
   * @returns Updated user
   */
  async updateUser(userId: string, updateData: IUserUpdate): Promise<IUserDocument | null> {
    return User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Generate JWT token for user
   * @param userId User ID
   * @returns JWT token
   */
  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: `${config.jwt.accessExpirationMinutes}m` }
    );
  }
}

export const userService = new UserService();