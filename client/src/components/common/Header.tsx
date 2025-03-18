import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  UserIcon, 
  ArrowLeftOnRectangleIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/authSlice';

const Header: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-indigo-700' : '';
  };

  return (
    <header className="bg-indigo-600 shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="text-white text-xl font-bold mr-6">TaskMaster</Link>
            
            {user && (
              <nav className="hidden md:flex space-x-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium text-white ${isActive('/')}`}
                >
                  <div className="flex items-center">
                    <ChartBarIcon className="mr-1 h-5 w-5" /> Dashboard
                  </div>
                </Link>
                <Link
                  to="/tasks"
                  className={`px-3 py-2 rounded-md text-sm font-medium text-white ${isActive('/tasks')}`}
                >
                  <div className="flex items-center">
                    <ClipboardDocumentListIcon className="mr-1 h-5 w-5" /> Tasks
                  </div>
                </Link>
              </nav>
            )}
          </div>
          
          {user && (
            <div className="flex items-center">
              <div className="hidden md:flex items-center mr-4">
                <UserIcon className="text-white mr-2 h-5 w-5" />
                <span className="text-white font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100"
              >
                <ArrowLeftOnRectangleIcon className="mr-1 h-5 w-5" /> Logout
              </button>
            </div>
          )}
          
          {user && (
            <div className="md:hidden flex items-center">
              <button className="text-white">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;