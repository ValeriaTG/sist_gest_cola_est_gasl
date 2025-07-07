import React from 'react';
import { Users, Settings, Calendar, CreditCard, LogOut, Shield } from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  activeView: 'customer' | 'admin' | 'reservations' | 'payments';
  setActiveView: (view: 'customer' | 'admin' | 'reservations' | 'payments') => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeView, setActiveView, currentUser, onLogout }) => {
  const navItems = [
    { id: 'customer', label: 'Panel Cliente', icon: Users, public: true },
    { id: 'reservations', label: 'Reservas', icon: Calendar, public: true },
    { id: 'payments', label: 'Pagos', icon: CreditCard, public: true },
    { id: 'admin', label: 'Administración', icon: Settings, public: false },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-8 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isAccessible = item.public || currentUser;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  disabled={!isAccessible}
                  className={`flex items-center px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeView === item.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : isAccessible 
                        ? 'text-gray-600 hover:text-blue-600'
                        : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {item.label}
                  {!item.public && !currentUser && (
                    <Shield className="w-4 h-4 ml-2 text-gray-400" />
                  )}
                </button>
              );
            })}
          </div>

          {currentUser && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Shield className="w-4 h-4 mr-1" />
                <span>{currentUser.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;