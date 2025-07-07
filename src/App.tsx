import React, { useState, useEffect } from 'react';
import { Clock, Fuel, Users, Calendar, Bell, BarChart3, Settings, CheckCircle, CreditCard, MapPin, Smartphone, Shield } from 'lucide-react';
import CustomerPanel from './components/CustomerPanel';
import AdminPanel from './components/AdminPanel';
import PaymentPanel from './components/PaymentPanel';
import ReservationPanel from './components/ReservationPanel';
import Navigation from './components/Navigation';
import LoginPanel from './components/LoginPanel';
import NotificationSystem from './components/NotificationSystem';
import { GasStation, QueueItem, PumpStatus, Reservation, PaymentData, User } from './types';

function App() {
  const [activeView, setActiveView] = useState<'customer' | 'admin' | 'reservations' | 'payments'>('customer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  
  const [gasStation, setGasStation] = useState<GasStation>({
    id: '1',
    name: 'Estación Central Premium',
    location: 'Av. Principal 123, Ciudad',
    pumps: [
      { id: '1', number: 1, status: 'available', fuelType: 'regular', estimatedTime: 0, pricePerLiter: 1.25 },
      { id: '2', number: 2, status: 'occupied', fuelType: 'premium', estimatedTime: 5, pricePerLiter: 1.45 },
      { id: '3', number: 3, status: 'available', fuelType: 'diesel', estimatedTime: 0, pricePerLiter: 1.35 },
      { id: '4', number: 4, status: 'maintenance', fuelType: 'regular', estimatedTime: 0, pricePerLiter: 1.25 },
      { id: '5', number: 5, status: 'available', fuelType: 'premium', estimatedTime: 0, pricePerLiter: 1.45 },
      { id: '6', number: 6, status: 'occupied', fuelType: 'diesel', estimatedTime: 8, pricePerLiter: 1.35 },
    ],
    queue: [
      { id: '1', customerName: 'Juan Pérez', fuelType: 'regular', arrivalTime: new Date(), estimatedWaitTime: 3, status: 'waiting', phoneNumber: '+1234567890', email: 'juan@email.com', priority: 'normal' },
      { id: '2', customerName: 'María García', fuelType: 'premium', arrivalTime: new Date(Date.now() - 120000), estimatedWaitTime: 5, status: 'waiting', phoneNumber: '+1234567891', email: 'maria@email.com', priority: 'high' },
      { id: '3', customerName: 'Carlos López', fuelType: 'diesel', arrivalTime: new Date(Date.now() - 180000), estimatedWaitTime: 2, status: 'waiting', phoneNumber: '+1234567892', email: 'carlos@email.com', priority: 'normal' },
    ],
    reservations: [
      { id: '1', customerName: 'Ana Rodríguez', fuelType: 'premium', reservationTime: new Date(Date.now() + 3600000), phoneNumber: '+1234567893', email: 'ana@email.com', status: 'confirmed', estimatedLiters: 40, totalAmount: 58.00 },
      { id: '2', customerName: 'Pedro Martínez', fuelType: 'diesel', reservationTime: new Date(Date.now() + 7200000), phoneNumber: '+1234567894', email: 'pedro@email.com', status: 'pending', estimatedLiters: 50, totalAmount: 67.50 },
    ],
    averageServiceTime: 4,
    totalCustomersToday: 147,
    peakHours: [8, 12, 18],
    revenue: {
      today: 2847.50,
      thisWeek: 18234.75,
      thisMonth: 76543.20
    },
    analytics: {
      averageWaitTime: 6.5,
      customerSatisfaction: 4.2,
      pumpEfficiency: 87,
      dailyTransactions: 156
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateRealTimeData();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const updateRealTimeData = () => {
    setGasStation(prev => ({
      ...prev,
      pumps: prev.pumps.map(pump => {
        if (pump.status === 'occupied' && pump.estimatedTime > 0) {
          const newTime = Math.max(0, pump.estimatedTime - 1);
          if (newTime === 0) {
            addNotification(`Bomba ${pump.number} ahora está disponible`);
          }
          return { ...pump, estimatedTime: newTime };
        }
        return pump;
      }),
      queue: prev.queue.map(customer => {
        if (customer.status === 'waiting' && customer.estimatedWaitTime > 0) {
          return { ...customer, estimatedWaitTime: Math.max(0, customer.estimatedWaitTime - 1) };
        }
        return customer;
      })
    }));
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  const handleLogin = (username: string, password: string): boolean => {
    if (username === 'admin' && password === '1234') {
      setCurrentUser({
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'Administrador del Sistema'
      });
      setShowLogin(false);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('customer');
  };

  const handleViewChange = (view: 'customer' | 'admin' | 'reservations' | 'payments') => {
    if (view === 'admin' && !currentUser) {
      setShowLogin(true);
      return;
    }
    setActiveView(view);
  };

  const addToQueue = (customerName: string, fuelType: string, phoneNumber: string, email: string, priority: 'normal' | 'high' = 'normal') => {
    const newQueueItem: QueueItem = {
      id: Date.now().toString(),
      customerName,
      fuelType,
      phoneNumber,
      email,
      arrivalTime: new Date(),
      estimatedWaitTime: calculateEstimatedWaitTime(fuelType),
      status: 'waiting',
      priority,
    };

    setGasStation(prev => ({
      ...prev,
      queue: [...prev.queue, newQueueItem].sort((a, b) => {
        if (a.priority === 'high' && b.priority === 'normal') return -1;
        if (a.priority === 'normal' && b.priority === 'high') return 1;
        return a.arrivalTime.getTime() - b.arrivalTime.getTime();
      }),
    }));

    addNotification(`${customerName} se ha unido a la cola para ${fuelType}`);
    
    // Simular envío de SMS/Email
    setTimeout(() => {
      addNotification(`SMS enviado a ${phoneNumber}: Tu posición en cola es ${getQueuePosition(newQueueItem.id)}`);
    }, 1000);
  };

  const getQueuePosition = (customerId: string): number => {
    return gasStation.queue.findIndex(customer => customer.id === customerId) + 1;
  };

  const addReservation = (reservation: Omit<Reservation, 'id' | 'status'>) => {
    const newReservation: Reservation = {
      ...reservation,
      id: Date.now().toString(),
      status: 'pending',
    };

    setGasStation(prev => ({
      ...prev,
      reservations: [...prev.reservations, newReservation],
    }));

    addNotification(`Reserva creada para ${reservation.customerName} a las ${reservation.reservationTime.toLocaleTimeString()}`);
    
    // Simular confirmación automática por email
    setTimeout(() => {
      addNotification(`Email de confirmación enviado a ${reservation.email}`);
    }, 2000);
  };

  const processPayment = (paymentData: PaymentData) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.05; // 95% de éxito
        if (success) {
          setGasStation(prev => ({
            ...prev,
            revenue: {
              ...prev.revenue,
              today: prev.revenue.today + paymentData.amount
            },
            analytics: {
              ...prev.analytics,
              dailyTransactions: prev.analytics.dailyTransactions + 1
            }
          }));
          addNotification(`Pago de $${paymentData.amount} procesado exitosamente`);
        } else {
          addNotification(`Error en el pago de $${paymentData.amount} - Intente nuevamente`);
        }
        resolve(success);
      }, 2000);
    });
  };

  const calculateEstimatedWaitTime = (fuelType: string): number => {
    const availablePumps = gasStation.pumps.filter(pump => 
      pump.status === 'available' && pump.fuelType === fuelType
    );
    
    if (availablePumps.length > 0) {
      return 0;
    }

    const occupiedPumps = gasStation.pumps.filter(pump => 
      pump.status === 'occupied' && pump.fuelType === fuelType
    );
    
    if (occupiedPumps.length > 0) {
      return Math.min(...occupiedPumps.map(pump => pump.estimatedTime));
    }

    const waitingCustomers = gasStation.queue.filter(customer => 
      customer.fuelType === fuelType && customer.status === 'waiting'
    ).length;

    return waitingCustomers * gasStation.averageServiceTime;
  };

  const updatePumpStatus = (pumpId: string, status: PumpStatus, estimatedTime?: number) => {
    setGasStation(prev => ({
      ...prev,
      pumps: prev.pumps.map(pump =>
        pump.id === pumpId 
          ? { ...pump, status, estimatedTime: estimatedTime || 0 }
          : pump
      ),
    }));

    const pump = gasStation.pumps.find(p => p.id === pumpId);
    if (pump) {
      addNotification(`Bomba ${pump.number} cambió a estado: ${status}`);
    }
  };

  const processNextCustomer = (pumpId: string) => {
    const pump = gasStation.pumps.find(p => p.id === pumpId);
    if (!pump) return;

    const nextCustomer = gasStation.queue.find(customer => 
      customer.fuelType === pump.fuelType && customer.status === 'waiting'
    );

    if (nextCustomer) {
      setGasStation(prev => ({
        ...prev,
        queue: prev.queue.map(customer =>
          customer.id === nextCustomer.id
            ? { ...customer, status: 'served' }
            : customer
        ),
        totalCustomersToday: prev.totalCustomersToday + 1
      }));
      
      addNotification(`${nextCustomer.customerName} está siendo atendido en la bomba ${pump.number}`);
      
      // Simular notificación al cliente
      setTimeout(() => {
        addNotification(`SMS enviado a ${nextCustomer.phoneNumber}: Es su turno en la bomba ${pump.number}`);
      }, 1000);
    }
  };

  const getAvailablePumps = (fuelType: string) => {
    return gasStation.pumps.filter(pump => 
      pump.status === 'available' && pump.fuelType === fuelType
    ).length;
  };

  const getWaitingCustomers = (fuelType: string) => {
    return gasStation.queue.filter(customer => 
      customer.fuelType === fuelType && customer.status === 'waiting'
    ).length;
  };

  const confirmReservation = (reservationId: string) => {
    setGasStation(prev => ({
      ...prev,
      reservations: prev.reservations.map(reservation =>
        reservation.id === reservationId
          ? { ...reservation, status: 'confirmed' }
          : reservation
      )
    }));

    const reservation = gasStation.reservations.find(r => r.id === reservationId);
    if (reservation) {
      addNotification(`Reserva confirmada para ${reservation.customerName}`);
    }
  };

  const removeFromQueue = (customerId: string) => {
    setGasStation(prev => ({
      ...prev,
      queue: prev.queue.filter(customer => customer.id !== customerId)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {showLogin && (
        <LoginPanel 
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      <Navigation 
        activeView={activeView} 
        setActiveView={handleViewChange}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      <NotificationSystem notifications={notifications} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Fuel className="w-12 h-12 text-blue-600 mr-3" />
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{gasStation.name}</h1>
              <div className="flex items-center justify-center text-gray-600 mt-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{gasStation.location}</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-lg">Sistema Inteligente de Gestión de Colas y Reservas</p>
          <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>Última actualización: {currentTime.toLocaleTimeString()}</span>
          </div>
          {currentUser && (
            <div className="flex items-center justify-center mt-2 text-sm text-blue-600">
              <Shield className="w-4 h-4 mr-1" />
              <span>Conectado como: {currentUser.name}</span>
            </div>
          )}
        </div>

        {/* Real-time Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bombas Disponibles</p>
                <p className="text-2xl font-bold text-green-600">
                  {gasStation.pumps.filter(pump => pump.status === 'available').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Cola</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {gasStation.queue.filter(customer => customer.status === 'waiting').length}
                </p>
              </div>
              <Users className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reservas Activas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {gasStation.reservations.filter(r => r.status === 'confirmed').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clientes Hoy</p>
                <p className="text-2xl font-bold text-purple-600">{gasStation.totalCustomersToday}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-emerald-500 transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-emerald-600">${gasStation.revenue.today.toFixed(2)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeView === 'customer' && (
          <CustomerPanel 
            gasStation={gasStation}
            onAddToQueue={addToQueue}
            getAvailablePumps={getAvailablePumps}
            getWaitingCustomers={getWaitingCustomers}
            currentTime={currentTime}
          />
        )}
        
        {activeView === 'admin' && currentUser && (
          <AdminPanel 
            gasStation={gasStation}
            onUpdatePumpStatus={updatePumpStatus}
            onProcessNextCustomer={processNextCustomer}
            onRemoveFromQueue={removeFromQueue}
            currentTime={currentTime}
            currentUser={currentUser}
          />
        )}
        
        {activeView === 'reservations' && (
          <ReservationPanel 
            gasStation={gasStation}
            onAddReservation={addReservation}
            onConfirmReservation={confirmReservation}
            currentTime={currentTime}
          />
        )}
        
        {activeView === 'payments' && (
          <PaymentPanel 
            gasStation={gasStation}
            onProcessPayment={processPayment}
            currentTime={currentTime}
          />
        )}
      </div>

      {/* Mobile App Promotion */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <Smartphone className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">¡Descarga nuestra App Móvil!</h3>
          <p className="text-blue-100 mb-4">Gestiona tus reservas y pagos desde tu teléfono</p>
          <div className="flex justify-center space-x-4">
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              App Store
            </button>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Google Play
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Fuel className="w-8 h-8 mr-2" />
            <span className="text-xl font-bold">Sistema de Gestión Inteligente</span>
          </div>
          <p className="text-gray-400 mb-4">Optimizando el flujo de combustible con tecnología avanzada</p>
          <div className="flex justify-center space-x-6 text-sm">
            <span>© 2024 Estación Central Premium</span>
            <span>•</span>
            <span>Soporte 24/7</span>
            <span>•</span>
            <span>Tecnología IoT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;