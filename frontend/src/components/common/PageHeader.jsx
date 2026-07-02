import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const PageHeader = ({ title, icon: Icon, showBack = true, rightActions, children }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-surface/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-border flex flex-col transition-colors">
      <div className="px-4 py-4 md:px-6 flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          {showBack && (
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 text-text-secondary hover:bg-background rounded-full transition active:scale-95 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2">
            {Icon && <Icon className="w-6 h-6 text-primary" />}
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-background text-text-secondary transition"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {rightActions && rightActions}
        </div>
      </div>
      
      {children && (
        <div className="w-full">
          {children}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
