import mongoose, { Document, Schema } from 'mongoose';

export enum TaskStatus {
  DONE = 'done',
  NOT_DONE = 'not_done',
  IN_PROGRESS = 'in_progress',
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

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  lastRecurrence?: Date;
  nextRecurrence?: Date;
  dependencies?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  userId: mongoose.Types.ObjectId;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.NOT_DONE,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    dueDate: {
      type: Date,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      type: String,
      enum: Object.values(RecurrencePattern),
      default: RecurrencePattern.NONE,
    },
    lastRecurrence: {
      type: Date,
    },
    nextRecurrence: {
      type: Date,
    },
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ userId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ isRecurring: 1 });

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;