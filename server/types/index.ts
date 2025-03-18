import { Document } from 'mongoose';

export interface IUserBase {
  name: string;
  email: string;
  password: string;
}

export interface IUserCreate extends IUserBase {}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserUpdate {
  name: string;
}

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IAuthResponse {
  user: Omit<IUserDocument, 'password'>;
  token: string;
}

export interface IErrorResponse {
  message: string;
  error?: any;
}