import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppSelector } from '@/store';
import { selectSidebarOpen } from '@/store/slices/appSlice';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const sidebarOpen = useAppSelector(selectSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className={`transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        <Header />
        
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-20" />
      )}
    </div>
  );
};