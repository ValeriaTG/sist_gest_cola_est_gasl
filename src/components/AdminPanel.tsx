import React, { useState } from 'react';
import { Settings, Fuel, Clock, User, AlertCircle, CheckCircle, Play, Pause, Wrench, BarChart3, TrendingUp, Users, X } from 'lucide-react';
import { GasStation, PumpStatus, User as UserType } from '../types';

interface AdminPanelProps {
  gasStation: GasStation;
  onUpdatePumpStatus: (pumpId: string, status: PumpStatus, estimatedTime?: number) => void;
  onProcessNextCustomer: (pumpId: string) => void;
  onRemoveFromQueue: (customerId: string) => void;
  currentTime: Date;
  currentUser: UserType;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  gasStation,
  onUpdatePumpStatus,
  onProcessNextCustomer,
  onRemoveFromQueue,
  currentTime,
  currentUser,
}) => {
  const [selectedPump, setSelectedPump] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState(5);
  const [activeTab, setActiveTab] = useState<'pumps' | 'queue' | 'analytics'>('pumps');

  const handlePumpStatusChange = (pumpId: string, newStatus: PumpStatus) => {
    if (newStatus === 'occupied') {
      onUpdatePumpStatus(pumpId, newStatus, estimatedTime);
    } else {
      onUpdatePumpStatus(pumpId, newStatus);
    }
    
    if (newStatus === 'available') {
      onProcessNextCustomer(pumpId);
    }
  };

  const getStatusColor = (status: PumpStatus) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: PumpStatus) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';
      case 'maintenance': return 'Mantenimiento';
      default: return 'Desconocido';
    }
  };

  const getNextCustomerForPump = (pumpId: string) => {
    const pump = gasStation.pumps.find(p => p.id === pumpId);
    if (!pump) return null;
    
    return gasStation.queue.find(customer => 
      customer.fuelType === pump.fuelType && customer.status === 'waiting'
    );
  };

  const getPriorityColor = (priority: 'normal' | 'high') => {
    return priority === 'high' ? 'bg-red-100 border-red-300' : 'bg-gray-50 border-gray-200';
  };

  const tabs = [
    { id: 'pumps', label: 'Gestión de Bombas', icon: Settings },
    { id: 'queue', label: 'Cola de Clientes', icon: Users },
    { id: 'analytics', label: 'Analíticas', icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Panel de Administración</h2>
            <p className="text-blue-100">Bienvenido, {currentUser.name}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100">Última actualización</p>
            <p className="text-xl font-semibold">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Pump Management Tab */}
          {activeTab === 'pumps' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">Control de Bombas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gasStation.pumps.map((pump) => {
                  const nextCustomer = getNextCustomerForPump(pump.id);
                  return (
                    <div key={pump.id} className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">Bomba {pump.number}</h4>
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(pump.status)} animate-pulse`}></div>
                      </div>
                      
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Fuel className="w-4 h-4 mr-2" />
                          <span className="capitalize">{pump.fuelType} - ${pump.pricePerLiter}/L</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Estado: {getStatusText(pump.status)}</span>
                          {pump.status === 'occupied' && (
                            <span className="ml-2 text-orange-600 font-medium">
                              (~{pump.estimatedTime}m restantes)
                            </span>
                          )}
                        </div>
                      </div>

                      {nextCustomer && pump.status === 'available' && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center text-sm text-blue-800">
                            <User className="w-4 h-4 mr-2" />
                            <span className="font-medium">Siguiente: {nextCustomer.customerName}</span>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Prioridad: {nextCustomer.priority === 'high' ? 'Alta' : 'Normal'}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {pump.status === 'available' && (
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={estimatedTime}
                              onChange={(e) => setEstimatedTime(parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="1"
                              max="30"
                            />
                            <button
                              onClick={() => handlePumpStatusChange(pump.id, 'occupied')}
                              className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded hover:bg-yellow-600 transition-colors text-sm flex items-center justify-center"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Ocupar
                            </button>
                          </div>
                        )}
                        
                        {pump.status === 'occupied' && (
                          <button
                            onClick={() => handlePumpStatusChange(pump.id, 'available')}
                            className="w-full bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 transition-colors text-sm flex items-center justify-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Liberar
                          </button>
                        )}
                        
                        <button
                          onClick={() => handlePumpStatusChange(pump.id, 
                            pump.status === 'maintenance' ? 'available' : 'maintenance'
                          )}
                          className={`w-full py-2 px-3 rounded transition-colors text-sm flex items-center justify-center ${
                            pump.status === 'maintenance' 
                              ? 'bg-green-500 text-white hover:bg-green-600' 
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          <Wrench className="w-4 h-4 mr-1" />
                          {pump.status === 'maintenance' ? 'Fin Mantenimiento' : 'Mantenimiento'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Queue Management Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Gestión de Cola</h3>
                <div className="text-sm text-gray-600">
                  Total en cola: {gasStation.queue.filter(customer => customer.status === 'waiting').length}
                </div>
              </div>
              
              {gasStation.queue.filter(customer => customer.status === 'waiting').length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">No hay clientes en cola</p>
                  <p className="text-sm">Los nuevos clientes aparecerán aquí automáticamente</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gasStation.queue
                    .filter(customer => customer.status === 'waiting')
                    .map((customer, index) => (
                      <div key={customer.id} className={`rounded-lg p-4 border-2 ${getPriorityColor(customer.priority)}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center">
                              <span className="font-semibold text-lg">#{index + 1} - {customer.customerName}</span>
                              {customer.priority === 'high' && (
                                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                                  PRIORIDAD
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              📞 {customer.phoneNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                              ✉️ {customer.email}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveFromQueue(customer.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Remover de la cola"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Fuel className="w-4 h-4 mr-2" />
                            <span className="capitalize">{customer.fuelType}</span>
                          </div>
                          <div className="flex items-center text-orange-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>~{customer.estimatedWaitTime}m</span>
                          </div>
                          <div className="col-span-2 text-xs text-gray-500">
                            Llegada: {customer.arrivalTime.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800">Analíticas y Estadísticas</h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Tiempo Promedio</p>
                      <p className="text-2xl font-bold">{gasStation.analytics.averageWaitTime}m</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Satisfacción</p>
                      <p className="text-2xl font-bold">{gasStation.analytics.customerSatisfaction}/5</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Eficiencia</p>
                      <p className="text-2xl font-bold">{gasStation.analytics.pumpEfficiency}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Transacciones</p>
                      <p className="text-2xl font-bold">{gasStation.analytics.dailyTransactions}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Revenue Overview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Ingresos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ${gasStation.revenue.today.toFixed(2)}
                    </div>
                    <div className="text-gray-600">Hoy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      ${gasStation.revenue.thisWeek.toFixed(2)}
                    </div>
                    <div className="text-gray-600">Esta Semana</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      ${gasStation.revenue.thisMonth.toFixed(2)}
                    </div>
                    <div className="text-gray-600">Este Mes</div>
                  </div>
                </div>
              </div>

              {/* Pump Status Overview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Estado de Bombas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {gasStation.pumps.filter(p => p.status === 'available').length}
                    </div>
                    <div className="text-gray-600">Disponibles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {gasStation.pumps.filter(p => p.status === 'occupied').length}
                    </div>
                    <div className="text-gray-600">Ocupadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {gasStation.pumps.filter(p => p.status === 'maintenance').length}
                    </div>
                    <div className="text-gray-600">Mantenimiento</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;