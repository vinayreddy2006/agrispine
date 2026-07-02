import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Pages that don't need BottomNav or specific container logic
  const noNavRoutes = ['/', '/login', '/register', '/ai-chat'];
  const hideBottomNav = noNavRoutes.includes(location.pathname);
  const isFullScreenAI = location.pathname === '/ai-chat';

  const isMessages = location.pathname.startsWith('/messages');

  return (
    <div className="min-h-screen bg-agriBg font-sans text-gray-800">
      {/* 
        For non-auth pages (Landing, Login), we don't apply the max-w constraints here 
        because Landing has its own full-width sections. 
      */}
      {hideBottomNav ? (
        children
      ) : isMessages ? (
        <>
          <div className="w-full h-screen overflow-hidden">
            {children}
          </div>
        </>
      ) : (
        <>
          <div className="w-full pb-24">
            <div className="max-w-md mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl shadow-sm bg-agriBg dark:bg-slate-900 min-h-screen relative transition-colors duration-200">
              {children}
            </div>
          </div>
          <BottomNav />
        </>
      )}

      {/* Global AI Launcher */}
      {!hideBottomNav && !isFullScreenAI && (
        <button
          onClick={() => navigate("/ai-chat")}
          className="fixed bottom-24 right-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-full shadow-lg shadow-green-500/30 z-50 flex items-center justify-center transition-all hover:scale-105 group border border-green-400/30"
        >
          <Bot className="w-6 h-6 animate-pulse" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100 font-semibold ml-0 group-hover:ml-3">
            Ask GramSathi
          </span>
        </button>
      )}
    </div>
  );
};

export default AppLayout;
