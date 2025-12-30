import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Sign In
      </button>
    );
  }

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const getInitials = (name: string | undefined, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const getRoleColor = (roles: string[]) => {
    if (roles.includes('ADMIN')) return 'bg-red-500';
    if (roles.includes('DESIGNER')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.fullName || user.username}
            className="w-8 h-8 rounded-full border-2 border-gray-200"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getRoleColor(user.roles)}`}
          >
            {getInitials(user.fullName, user.email)}
          </div>
        )}
        <span className="text-sm text-gray-700 hidden md:inline">
          {user.fullName || user.username}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {user.fullName || user.username}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    role === 'ADMIN'
                      ? 'bg-red-100 text-red-800'
                      : role === 'DESIGNER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to profile/settings when implemented
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile Settings
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
