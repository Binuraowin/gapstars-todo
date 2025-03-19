export enum TaskStatus {
    IN_PROGRESS = 'in_progress',
    DONE = 'done',
    NOT_DONE = 'not_done',
  }

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum RecurrencePattern {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}
  
  export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    userId: string;
    dueDate?: string;
    isRecurring: boolean;
    recurrencePattern?: RecurrencePattern;
    lastRecurrence?: string;
    nextRecurrence?: string;
    dependencies: Task[] | string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface TaskCreate {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    isRecurring?: boolean;
    recurrencePattern?: RecurrencePattern;
    dependencies?: string[];
  }
  
  export interface TaskUpdate {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    isRecurring?: boolean;
    recurrencePattern?: RecurrencePattern;
    dependencies?: string[];
  }
  
  export interface TaskQueryFilters {
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }
  
  export interface User {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    name: string;
    email: string;
    password: string;
  }
  
  export interface ApiError {
    message: string;
    error?: any;
  }