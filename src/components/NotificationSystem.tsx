import React from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface NotificationSystemProps {
  notifications: string[];
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications }) => {
  const getNotificationIcon = (message: string) => {
    if (message.includes('exitosamente') || message.includes('disponible') || message.includes('confirmada')) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (message.includes('Error') || message.includes('error')) {
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
    return <Info className="w-4 h-4 text-blue-600" />;
  };

  const getNotificationStyle = (message: string) => {
    if (message.includes('exitosamente') || message.includes('disponible') || message.includes('confirmada')) {
      return 'bg-green-500 border-green-600';
    }
    if (message.includes('Error') || message.includes('error')) {
      return 'bg-red-500 border-red-600';
    }
    return 'bg-blue-500 border-blue-600';
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className={`${getNotificationStyle(notification)} text-white px-4 py-3 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out animate-slide-in`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {getNotificationIcon(notification)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;