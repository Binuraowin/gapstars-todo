import Joi from 'joi';
import { TaskStatus, TaskPriority, RecurrencePattern } from '../models/task.model';

const createTaskSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().trim().max(500),
  status: Joi.string().valid(...Object.values(TaskStatus)),
  priority: Joi.string().valid(...Object.values(TaskPriority)),
  dueDate: Joi.date().iso(),
  isRecurring: Joi.boolean(),
  recurrencePattern: Joi.string().valid(...Object.values(RecurrencePattern)),
  dependencies: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100),
  description: Joi.string().trim().max(500),
  status: Joi.string().valid(...Object.values(TaskStatus)),
  priority: Joi.string().valid(...Object.values(TaskPriority)),
  dueDate: Joi.date().iso(),
  isRecurring: Joi.boolean(),
  recurrencePattern: Joi.string().valid(...Object.values(RecurrencePattern)),
  dependencies: Joi.array().items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)),
}).min(1);

export { createTaskSchema, updateTaskSchema };