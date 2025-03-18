import { apiClient } from './apiClient';
import { Task, TaskCreate, TaskUpdate, TaskQueryFilters } from '../types';

export const taskApi = {
  async getTasks(filters?: TaskQueryFilters): Promise<Task[]> {
    let queryString = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      
      queryString = `?${params.toString()}`;
    }
    
    return apiClient.get<Task[]>(`/tasks${queryString}`);
  },

  async getTask(id: string): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`);
  },

  async createTask(task: TaskCreate): Promise<Task> {
    return apiClient.post<Task>('/tasks', task);
  },

  async updateTask(id: string, updates: TaskUpdate): Promise<Task> {
    return apiClient.patch<Task>(`/tasks/${id}`, updates);
  },

  async deleteTask(id: string): Promise<void> {
    return apiClient.delete<void>(`/tasks/${id}`);
  }
};