import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-gray-800 text-white py-4 text-center text-sm">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} TaskMaster. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;