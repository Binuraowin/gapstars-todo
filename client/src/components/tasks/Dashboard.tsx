import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchTasks } from '../../store/taskSlice';
import { 
  ClockIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { Task, TaskStatus, TaskPriority } from '../../types';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, loading } = useAppSelector(state => state.tasks);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const stats = useMemo(() => {
    if (!tasks.length) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task: Task) => task.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter((task: Task) => task.status === TaskStatus.IN_PROGRESS).length;
    const notDoneTasks = tasks.filter((task: Task) => task.status === TaskStatus.NOT_DONE).length;
    const highPriorityTasks = tasks.filter((task: Task) => task.priority === TaskPriority.HIGH).length;
    const dueSoon = tasks.filter((task: Task) => {
      if (!task.dueDate || task.status === TaskStatus.DONE) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    }).length;
    const overdue = tasks.filter((task: Task) => {
      if (!task.dueDate || task.status === TaskStatus.DONE) return false;
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      return dueDate < today;
    }).length;
    const recurringTasks = tasks.filter((task: Task) => task.isRecurring).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      notDoneTasks,
      highPriorityTasks,
      dueSoon,
      overdue,
      recurringTasks,
      completionRate
    };
  }, [tasks]);

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a: Task, b: Task) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
      .slice(0, 5);
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-medium text-gray-500">Total Tasks</h2>
                <p className="text-3xl font-bold">{stats.totalTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full" 
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">{stats.completionRate}% completed</span>
                <span className="text-xs text-gray-500">{stats.completedTasks}/{stats.totalTasks}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-medium text-gray-500">Task Status</h2>
                <p className="text-lg font-bold mt-2">
                  <span className="text-green-600">{stats.completedTasks} Done</span>
                </p>
                <p className="text-lg font-bold">
                  <span className="text-blue-600">{stats.inProgressTasks} In Progress</span>
                </p>
                <p className="text-lg font-bold">
                  <span className="text-gray-600">{stats.notDoneTasks} Not Started</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ArrowPathIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-medium text-gray-500">Due Soon/Overdue</h2>
                <p className="text-lg font-bold mt-2">
                  <span className="text-yellow-600">{stats.dueSoon} Due Soon</span>
                </p>
                <p className="text-lg font-bold">
                  <span className="text-red-600">{stats.overdue} Overdue</span>
                </p>
                <p className="text-lg font-bold">
                  <span className="text-purple-600">{stats.recurringTasks} Recurring</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-medium text-gray-500">High Priority</h2>
                <p className="text-3xl font-bold">{stats.highPriorityTasks}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round((stats.highPriorityTasks / stats.totalTasks) * 100)}% of all tasks
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentTasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {recentTasks.map((task: Task) => (
              <li key={task._id} className="py-3">
                <div className="flex items-center">
                  {task.status === TaskStatus.DONE ? (
                    <CheckCircleIcon className="text-green-500 mr-3 h-5 w-5" />
                  ) : task.status === TaskStatus.IN_PROGRESS ? (
                    <ArrowPathIcon className="text-blue-500 mr-3 h-5 w-5" />
                  ) : (
                    <ClockIcon className="text-gray-500 mr-3 h-5 w-5" />
                  )}
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-gray-500">
                      {task.status.replace('_', ' ')} • Last updated: {new Date(task.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent tasks.</p>
        )}
        <div className="mt-4">
          <Link to="/tasks" className="text-indigo-600 hover:text-indigo-800 font-medium">
            View all tasks →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;