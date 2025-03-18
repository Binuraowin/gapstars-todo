import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchTasks, createTask, updateTask } from '../../store/taskSlice';
import { 
  Task, 
  TaskCreate,
  TaskUpdate, 
  TaskStatus, 
  TaskPriority, 
  RecurrencePattern 
} from '../../types';

interface TaskFormProps {
  task?: Task;
  onTaskSaved: () => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onTaskSaved, onCancel }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { tasks, loading } = useAppSelector(state => state.tasks);
  
  const availableDependencies = task 
    ? tasks.filter(t => t._id !== task._id && 
        !(typeof t.dependencies === 'object' && 
          t.dependencies.some(dep => 
            (typeof dep === 'string' && dep === task._id) || 
            (typeof dep === 'object' && dep._id === task._id)
          )
        )
      )
    : tasks;

  const formik = useFormik({
    initialValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || TaskStatus.NOT_DONE,
      priority: task?.priority || TaskPriority.MEDIUM,
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      isRecurring: task?.isRecurring || false,
      recurrencePattern: task?.recurrencePattern || RecurrencePattern.NONE,
      dependencies: task?.dependencies 
        ? Array.isArray(task.dependencies) 
          ? task.dependencies.map(dep => typeof dep === 'string' ? dep : dep._id)
          : []
        : []
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Title is required').max(100, 'Title cannot exceed 100 characters'),
      description: Yup.string().max(500, 'Description cannot exceed 500 characters'),
      status: Yup.string().oneOf(Object.values(TaskStatus), 'Invalid status'),
      priority: Yup.string().oneOf(Object.values(TaskPriority), 'Invalid priority'),
      dueDate: Yup.date().nullable(),
      isRecurring: Yup.boolean(),
      recurrencePattern: Yup.string().when('isRecurring', {
        is: (value: boolean) => value === true,
        then: () =>
          Yup.string()
            .oneOf(Object.values(RecurrencePattern).filter(p => p !== RecurrencePattern.NONE), 'Please select a recurrence pattern')
            .required('Recurrence pattern is required when task is recurring'),
        otherwise: () =>
          Yup.string().oneOf(Object.values(RecurrencePattern))
      } as any),
      dependencies: Yup.array().of(Yup.string())
    }),
    onSubmit: (values) => {
      setErrorMessage(null);
      
      const taskData = {
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || undefined,
        isRecurring: values.isRecurring,
        recurrencePattern: values.isRecurring ? values.recurrencePattern : RecurrencePattern.NONE,
        dependencies: values.dependencies.length > 0 ? values.dependencies : undefined
      };

      if (task) {
        dispatch(updateTask({ id: task._id, updates: taskData }))
          .unwrap()
          .then(() => {
            onTaskSaved();
          })
          .catch(error => {
            setErrorMessage(error.message || 'Error updating task');
          });
      } else {
        dispatch(createTask(taskData))
          .unwrap()
          .then(() => {
            onTaskSaved();
          })
          .catch(error => {
            setErrorMessage(error.message || 'Error creating task');
          });
      }
    }
  });

  useEffect(() => {
    if (tasks.length === 0) {
      dispatch(fetchTasks());
    }
  }, [dispatch, tasks.length]);

  useEffect(() => {
    if (!formik.values.isRecurring && formik.values.recurrencePattern !== RecurrencePattern.NONE) {
      formik.setFieldValue('recurrencePattern', RecurrencePattern.NONE);
    } else if (formik.values.isRecurring && formik.values.recurrencePattern === RecurrencePattern.NONE) {
      formik.setFieldValue('recurrencePattern', RecurrencePattern.DAILY);
    }
  }, [formik.values.isRecurring]);

  return (
    <form onSubmit={formik.handleSubmit}>
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {formik.touched.title && formik.errors.title ? (
            <div className="mt-1 text-sm text-red-600">{formik.errors.title}</div>
          ) : null}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {formik.touched.description && formik.errors.description ? (
            <div className="mt-1 text-sm text-red-600">{formik.errors.description}</div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={TaskStatus.NOT_DONE}>Not Done</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.DONE}>Done</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formik.values.priority}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={TaskPriority.LOW} >Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formik.values.dueDate}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                checked={formik.values.isRecurring}
                onChange={formik.handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                Recurring Task
              </label>
            </div>
          </div>

          {formik.values.isRecurring && (
            <div>
              <label htmlFor="recurrencePattern" className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence Pattern
              </label>
              <select
                id="recurrencePattern"
                name="recurrencePattern"
                value={formik.values.recurrencePattern}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={RecurrencePattern.DAILY}>Daily</option>
                <option value={RecurrencePattern.WEEKLY}>Weekly</option>
                <option value={RecurrencePattern.MONTHLY}>Monthly</option>
              </select>
              {formik.touched.recurrencePattern && formik.errors.recurrencePattern ? (
                <div className="mt-1 text-sm text-red-600">{formik.errors.recurrencePattern}</div>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="dependencies" className="block text-sm font-medium text-gray-700 mb-1">
            Dependencies (Tasks that must be completed before this one)
          </label>
          <select
            id="dependencies"
            name="dependencies"
            multiple
            value={formik.values.dependencies}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            size={3}
          >
            {availableDependencies.map((depTask: Task) => (
              <option key={depTask._id} value={depTask._id}>
                {depTask.title} ({depTask.status.replace('_', ' ')})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple tasks</p>
        </div>

        <div className="flex justify-end space-x-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid || loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
