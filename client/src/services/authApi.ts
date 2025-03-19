import { apiClient } from './apiClient';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/users/login', credentials);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/users/register', data);
  },

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/users/profile');
  },
};