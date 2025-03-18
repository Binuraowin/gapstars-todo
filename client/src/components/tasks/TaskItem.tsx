import React, { useState } from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { deleteTask, updateTask } from '../../store/taskSlice';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  ClockIcon, 
  EyeIcon 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Task, TaskStatus, TaskPriority } from '../../types';
import TaskForm from './TaskForm';
import TaskDetails from './TaskDetails';

interface TaskItemProps {
  task: Task;
  onTaskUpdated: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onTaskUpdated }) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const dispatch = useAppDispatch();

  const handleDeleteTask = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task._id))
        .unwrap()
        .then(() => {
          onTaskUpdated();
        })
        .catch(error => {
          console.error("Error deleting task:", error);
        });
    }
  };

  const handleMarkDone = () => {
    dispatch(updateTask({ id: task._id, updates: { status: TaskStatus.DONE } }))
      .unwrap()
      .then(() => {
        onTaskUpdated();
      })
      .catch(error => {
        console.error("Error updating task:", error);
      });
  };

  const handleMarkInProgress = () => {
    dispatch(updateTask({ id: task._id, updates: { status: TaskStatus.IN_PROGRESS } }))
      .unwrap()
      .then(() => {
        onTaskUpdated();
      })
      .catch(error => {
        console.error("Error updating task:", error);
      });
  };

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

  const getStatusBadge = (status: TaskStatus) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    const colorClasses = getStatusColor(status);
    return <span className={`${baseClasses} ${colorClasses}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <>
      <li className="border-b border-gray-200 hover:bg-gray-50">
        <div className="grid grid-cols-12 gap-2 p-4 items-center">
          <div className="col-span-5 sm:col-span-6">
            <div className="flex items-center">
              <div className="ml-2">
                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                {task.isRecurring && (
                  <div className="text-xs text-gray-500 flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" /> Recurring: {task.recurrencePattern?.toLowerCase()}
                  </div>
                )}
                {task.dueDate && (
                  <div className="text-xs text-gray-500">
                    Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-span-3 sm:col-span-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          <div className="col-span-3 sm:col-span-2">
            {getStatusBadge(task.status)}
          </div>
          <div className="col-span-1 sm:col-span-2 flex justify-end space-x-2">
            <button
              onClick={() => setShowDetails(true)}
              className="text-gray-500 hover:text-indigo-600"
              title="View details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowEditForm(true)}
              className="text-gray-500 hover:text-blue-600"
              title="Edit task"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            {task.status !== TaskStatus.DONE ? (
              <button
                onClick={handleMarkDone}
                className="text-gray-500 hover:text-green-600"
                title="Mark as done"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleMarkInProgress}
                className="text-gray-500 hover:text-yellow-600"
                title="Mark as in progress"
              >
                <ClockIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleDeleteTask}
              className="text-gray-500 hover:text-red-600"
              title="Delete task"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </li>

      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
            <TaskForm
              task={task}
              onTaskSaved={() => {
                setShowEditForm(false);
                onTaskUpdated();
              }}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}

      {showDetails && (
        <TaskDetails
          task={task}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

export default TaskItem;