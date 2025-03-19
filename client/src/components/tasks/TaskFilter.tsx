import React from 'react';
import { TaskStatus, TaskPriority, TaskQueryFilters } from '../../types';

interface TaskFilterProps {
  currentFilters: TaskQueryFilters;
  onFilterChange: (filters: Partial<TaskQueryFilters>) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ currentFilters, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={currentFilters.status || ''}
        onChange={(e) => onFilterChange({ status: e.target.value ? e.target.value as TaskStatus : undefined })}
        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Status</option> 
        <option value={TaskStatus.NOT_DONE}>Not Done</option>
        <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
        <option value={TaskStatus.DONE}>Done</option>
      </select>

      <select
        value={currentFilters.priority || ''}
        onChange={(e) => onFilterChange({ priority: e.target.value ? e.target.value as TaskPriority : undefined })}
        className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Priorities</option>
        <option value={TaskPriority.HIGH}>High</option>
        <option value={TaskPriority.MEDIUM}>Medium</option>
        <option value={TaskPriority.LOW}>Low</option>
      </select>
    </div>
  );
};

export default TaskFilter;
