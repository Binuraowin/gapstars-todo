import mongoose, { Document } from 'mongoose';
import { TaskStatus, TaskPriority, RecurrencePattern } from '../models/task.model';

export interface ITaskBase {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  dependencies?: mongoose.Types.ObjectId[] | string[];
}

export interface ITaskCreate extends ITaskBase {
  userId: string;
  lastRecurrence?: Date;
  nextRecurrence?: Date;
}

export interface ITaskUpdate extends Partial<ITaskBase> {
  lastRecurrence?: Date;
  nextRecurrence?: Date | null;
}

export interface ITaskDocument extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  lastRecurrence?: Date;
  nextRecurrence?: Date;
  dependencies: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITaskQueryFilters {
  status?: string;
  priority?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}