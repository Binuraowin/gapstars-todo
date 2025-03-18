import mongoose from 'mongoose';
import Task, { TaskStatus, RecurrencePattern } from '../models/task.model';
import { ITaskCreate, ITaskUpdate, ITaskQueryFilters, ITaskDocument } from '../types/tasks';

export class TaskService {
  /**
   * Get all tasks for a user with optional filters
   * @param userId User ID
   * @param filters Query filters
   * @returns Array of tasks
   */
  async getTasks(userId: string, filters: ITaskQueryFilters): Promise<ITaskDocument[]> {
    const { status, priority, search, sort = 'createdAt', order = 'desc' } = filters;
    
    const query: any = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const sortOptions: any = {};
    sortOptions[sort.toString()] = order === 'desc' ? -1 : 1;

    return Task.find(query)
    .sort(sortOptions)
    .populate('dependencies', 'title status') as unknown as ITaskDocument[];
}

  /**
   * Get a single task by ID
   * @param taskId Task ID
   * @param userId User ID
   * @returns Task document or null if not found
   */
  async getTaskById(taskId: string, userId: string): Promise<ITaskDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error('Invalid task ID');
    }

    return Task.findOne({ _id: taskId, userId })
    .populate('dependencies', 'title status') as unknown as ITaskDocument | null;
}

  /**
   * Create a new task
   * @param taskData Task data
   * @returns New task document
   */
  async createTask(taskData: ITaskCreate): Promise<ITaskDocument> {
    const userId = taskData.userId;

    if (taskData.dependencies && taskData.dependencies.length > 0) {
      for (const depId of taskData.dependencies) {
        if (!mongoose.Types.ObjectId.isValid(depId)) {
          throw new Error(`Invalid dependency ID: ${depId}`);
        }

        const dependencyExists = await Task.findOne({ _id: depId, userId });
        if (!dependencyExists) {
          throw new Error(`Dependency task not found: ${depId}`);
        }
      }
    }

    if (taskData.isRecurring && taskData.recurrencePattern) {
      taskData.lastRecurrence = new Date();
      taskData.nextRecurrence = this.calculateNextRecurrence(
        taskData.lastRecurrence,
        taskData.recurrencePattern
      );
    }

    return Task.create(taskData) as unknown as ITaskDocument;
  }

  /**
   * Update a task
   * @param taskId Task ID
   * @param userId User ID
   * @param updates Task updates
   * @returns Updated task
   */
  async updateTask(taskId: string, userId: string, updates: ITaskUpdate): Promise<ITaskDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error('Invalid task ID');
    }

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      throw new Error('Task not found');
    }

    if (updates.dependencies && updates.dependencies.length > 0) {
      if (updates.dependencies.some(depId => depId.toString() === taskId)) {
        throw new Error('A task cannot depend on itself');
      }

      for (const depId of updates.dependencies) {
        if (!mongoose.Types.ObjectId.isValid(depId)) {
          throw new Error(`Invalid dependency ID: ${depId}`);
        }

        const dependencyExists = await Task.findOne({ _id: depId, userId });
        if (!dependencyExists) {
          throw new Error(`Dependency task not found: ${depId}`);
        }
      }
    }

    if (updates.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
      const dependencies = await Task.find({
        _id: { $in: task.dependencies },
        status: { $ne: TaskStatus.DONE }
      });

      if (dependencies.length > 0) {
        const unfinishedDeps = dependencies.map(dep => dep.title).join(', ');
        throw new Error(`Cannot mark task as done. The following dependent tasks are not completed: ${unfinishedDeps}`);
      }
    }

    if (updates.isRecurring !== undefined || updates.recurrencePattern) {
      if (updates.isRecurring) {
        const recurrencePattern = updates.recurrencePattern || task.recurrencePattern;
        if (recurrencePattern && recurrencePattern !== RecurrencePattern.NONE) {
          updates.lastRecurrence = new Date();
          updates.nextRecurrence = this.calculateNextRecurrence(
            updates.lastRecurrence,
            recurrencePattern
          );
        }
      } else if (updates.isRecurring === false) {
        updates.recurrencePattern = RecurrencePattern.NONE;
        updates.nextRecurrence = undefined;
      }
    }


    return Task.findOneAndUpdate(
        { _id: taskId, userId },
        { $set: updates },
        { new: true, runValidators: true }
      ).populate('dependencies', 'title status') as unknown as ITaskDocument | null;
    }

  /**
   * Delete a task
   * @param taskId Task ID
   * @param userId User ID
   * @returns Success status
   */
  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      throw new Error('Invalid task ID');
    }

    const dependentTasks = await Task.find({ dependencies: taskId });
    if (dependentTasks.length > 0) {
      const dependentTaskTitles = dependentTasks.map(task => task.title).join(', ');
      throw new Error(`Cannot delete task. The following tasks depend on it: ${dependentTaskTitles}`);
    }

    const result = await Task.findOneAndDelete({ _id: taskId, userId });

    if (!result) {
      throw new Error('Task not found');
    }

    return true;
  }

  /**
   * Process recurring tasks
   */
  async processRecurringTasks(): Promise<void> {
    try {
      const now = new Date();

      const recurringTasks = await Task.find({
        isRecurring: true,
        nextRecurrence: { $lte: now },
      });
      
      for (const task of recurringTasks) {
        const newTaskData = {
          title: task.title,
          description: task.description,
          status: TaskStatus.NOT_DONE,
          priority: task.priority,
          isRecurring: task.isRecurring,
          recurrencePattern: task.recurrencePattern,
          dependencies: task.dependencies,
          userId: task.userId,
        };
        
        await Task.create(newTaskData);

        task.lastRecurrence = now;
        task.nextRecurrence = this.calculateNextRecurrence(
          now,
          task.recurrencePattern || RecurrencePattern.NONE
        );
        
        await task.save();
      }
    } catch (error) {
      console.error('Error processing recurring tasks:', error);
    }
  }

  /**
   * Calculate next recurrence date
   * @param fromDate Base date
   * @param pattern Recurrence pattern
   * @returns Next recurrence date
   */
  private calculateNextRecurrence(fromDate: Date, pattern: string): Date {
    const nextDate = new Date(fromDate);
    
    switch (pattern) {
      case RecurrencePattern.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RecurrencePattern.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurrencePattern.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        return nextDate;
    }
    
    return nextDate;
  }
}

export const taskService = new TaskService();