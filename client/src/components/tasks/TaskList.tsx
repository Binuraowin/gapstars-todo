import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchTasks, clearTaskError } from '../../store/taskSlice';
import { 
  ArrowsUpDownIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';
import { Task, TaskStatus, TaskPriority, TaskQueryFilters } from '../../types';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import TaskFilter from './TaskFilter';

const TaskList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, loading, error } = useAppSelector(state => state.tasks);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<TaskQueryFilters>({
    sort: 'createdAt',
    order: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm) {
        setFilters(prev => ({ ...prev, search: searchTerm }));
      } else {
        setFilters(prev => {
          const { search, ...rest } = prev;
          return rest;
        });
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    dispatch(fetchTasks(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearTaskError());
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: string) => {
    if (filters.sort !== field) return <ArrowsUpDownIcon className="ml-1 h-4 w-4" />;
    return filters.order === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />;
  };

  const handleFilterChange = (newFilters: Partial<TaskQueryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleTaskCreated = () => {
    dispatch(fetchTasks(filters));
    setShowAddForm(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      
      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md">
          Error: {error}
        </div>
      )}
      
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="mr-2 h-5 w-5" /> Add New Task
        </button>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
          </div>
          
          <TaskFilter 
            currentFilters={filters} 
            onFilterChange={handleFilterChange} 
          />
        </div>
      </div>
      
      {showAddForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-md shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
          <TaskForm onTaskSaved={handleTaskCreated} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <div className="grid grid-cols-12 gap-2 p-4 font-semibold bg-gray-50 border-b">
            <div className="col-span-5 sm:col-span-6 flex items-center cursor-pointer" onClick={() => handleSort('title')}>
              Title {getSortIcon('title')}
            </div>
            <div className="col-span-3 sm:col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('priority')}>
              Priority {getSortIcon('priority')}
            </div>
            <div className="col-span-3 sm:col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('status')}>
              Status {getSortIcon('status')}
            </div>
            <div className="col-span-1 sm:col-span-2 text-right">
              Actions
            </div>
          </div>
          
          <ul>
            {tasks.map((task: Task) => (
              <TaskItem 
                key={task._id} 
                task={task} 
                onTaskUpdated={() => dispatch(fetchTasks(filters))} 
              />
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500">No tasks found. Create your first task!</p>
        </div>
      )}
    </div>
  );
};

export default TaskList;