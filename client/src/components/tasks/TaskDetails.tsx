import React from 'react';
import { format } from 'date-fns';
import { ClockIcon, ArrowPathIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Task, TaskStatus, TaskPriority } from '../../types';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ task, onClose }) => {
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return 'bg-green-100 text-green-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.NOT_DONE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Task Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{task.title}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority} Priority
              </span>
              {task.isRecurring && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
                  <ArrowPathIcon className="h-3 w-3 mr-1" /> {task.recurrencePattern}
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {task.dueDate && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Due Date</h4>
              <p className="text-gray-700 flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                {format(new Date(task.dueDate), 'PPP')}
              </p>
            </div>
          )}

          {task.isRecurring && task.nextRecurrence && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Next Recurrence</h4>
              <p className="text-gray-700">
                {format(new Date(task.nextRecurrence), 'PPP')}
              </p>
            </div>
          )}

          {Array.isArray(task.dependencies) && task.dependencies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Dependencies</h4>
              <ul className="list-disc pl-5 text-gray-700">
                {task.dependencies.map((dep: any) => (
                  <li key={typeof dep === 'string' ? dep : dep._id} className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {typeof dep === 'string' ? dep : dep.title}
                    {typeof dep !== 'string' && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dep.status)}`}>
                        {dep.status.replace('_', ' ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>Created: {format(new Date(task.createdAt), 'PPp')}</p>
            <p>Last Updated: {format(new Date(task.updatedAt), 'PPp')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;