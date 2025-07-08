import React, { useState } from 'react';
import { Calendar, Clock, Fuel, Phone, User, AlertCircle, CheckCircle, Mail, Smartphone, QrCode } from 'lucide-react';
import { GasStation } from '../types';

interface CustomerPanelProps {
  gasStation: GasStation;
  onAddToQueue: (customerName: string, fuelType: string, phoneNumber: string, email: string) => void;
  getAvailablePumps: (fuelType: string) => number;
  getWaitingCustomers: (fuelType: string) => number;
  currentTime: Date;
  onNavigateToReservations?: () => void;
}

const CustomerPanel: React.FC<CustomerPanelProps> = ({
  gasStation,
  onAddToQueue,
  getAvailablePumps,
  getWaitingCustomers,
  currentTime,
  onNavigateToReservations,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedFuelType, setSelectedFuelType] = useState('regular');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim() && phoneNumber.trim() && email.trim()) {
      onAddToQueue(customerName, selectedFuelType, phoneNumber, email);
      setCustomerName('');
      setPhoneNumber('');
      setEmail('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const fuelTypes = [
    { value: 'regular', label: 'Regular', color: 'bg-blue-500', price: 1.25 },
    { value: 'premium', label: 'Premium', color: 'bg-purple-500', price: 1.45 },
    { value: 'diesel', label: 'Diesel', color: 'bg-green-500', price: 1.35 },
  ];

  const getEstimatedWaitTime = (fuelType: string) => {
    const availablePumps = getAvailablePumps(fuelType);
    if (availablePumps > 0) return 0;
    
    const waitingCustomers = getWaitingCustomers(fuelType);
    return waitingCustomers * gasStation.averageServiceTime;
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center mb-4">
            <Smartphone className="w-8 h-8 mr-3" />
            <h3 className="text-lg font-semibold">App Móvil</h3>
          </div>
          <p className="text-blue-100 mb-4">Descarga nuestra app para una experiencia más rápida</p>
          <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Descargar
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center mb-4">
            <QrCode className="w-8 h-8 mr-3" />
            <h3 className="text-lg font-semibold">Pago Rápido</h3>
          </div>
          <p className="text-purple-100 mb-4">Escanea y paga directamente desde tu vehículo</p>
          <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Escanear QR
          </button>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center mb-4">
            <Calendar className="w-8 h-8 mr-3" />
            <h3 className="text-lg font-semibold">Reservar</h3>
          </div>
          <p className="text-green-100 mb-4">Programa tu visita y evita las colas</p>
          <button 
            onClick={onNavigateToReservations}
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Hacer Reserva
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800">¡Te has unido a la cola exitosamente! Recibirás una notificación cuando sea tu turno.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Queue Form */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-blue-600" />
            Unirse a la Cola
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nombre Completo
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa tu nombre"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Número de Teléfono
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: +1234567890"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Fuel className="w-4 h-4 inline mr-2" />
                Tipo de Combustible
              </label>
              <div className="grid grid-cols-1 gap-3">
                {fuelTypes.map((fuel) => (
                  <label key={fuel.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="fuelType"
                      value={fuel.value}
                      checked={selectedFuelType === fuel.value}
                      onChange={(e) => setSelectedFuelType(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`flex items-center w-full p-4 rounded-lg border-2 transition-colors ${
                      selectedFuelType === fuel.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full ${fuel.color} mr-3`}></div>
                      <div className="flex-1">
                        <span className="font-medium">{fuel.label}</span>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <span className="mr-3">
                            ${fuel.price}/L
                          </span>
                          <span className="mr-3">
                            Bombas disponibles: {getAvailablePumps(fuel.value)}
                          </span>
                          <span>
                            Tiempo estimado: {getEstimatedWaitTime(fuel.value)}m
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Unirse a la Cola
            </button>
          </form>
        </div>

        {/* Real-time Status */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-3 text-blue-600" />
            Estado en Tiempo Real
          </h2>

          {/* Pump Status */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Estado de las Bombas</h3>
            <div className="grid grid-cols-2 gap-4">
              {gasStation.pumps.map((pump) => (
                <div key={pump.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Bomba {pump.number}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      pump.status === 'available' ? 'bg-green-100 text-green-800' :
                      pump.status === 'occupied' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {pump.status === 'available' ? 'Disponible' :
                       pump.status === 'occupied' ? 'Ocupada' : 'Mantenimiento'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Fuel className="w-4 h-4 mr-1" />
                    <span className="capitalize">{pump.fuelType}</span>
                    {pump.status === 'occupied' && (
                      <span className="ml-2 text-orange-600">
                        ~{pump.estimatedTime}m
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Queue Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Cola Actual</h3>
            {gasStation.queue.filter(customer => customer.status === 'waiting').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No hay clientes en cola</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gasStation.queue
                  .filter(customer => customer.status === 'waiting')
                  .map((customer, index) => (
                    <div key={customer.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">#{index + 1} - {customer.customerName}</span>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Fuel className="w-4 h-4 mr-1" />
                            <span className="capitalize">{customer.fuelType}</span>
                            <span className="mx-2">•</span>
                            <Clock className="w-4 h-4 mr-1" />
                            <span>~{customer.estimatedWaitTime}m</span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          Llegada: {customer.arrivalTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Live Updates */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Actualizaciones en Tiempo Real
            </h3>
            <div className="text-sm text-blue-700">
              <p className="mb-2">• Sistema actualizado cada 5 segundos</p>
              <p className="mb-2">• Notificaciones automáticas por SMS y email</p>
              <p>• Tiempo estimado basado en datos históricos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPanel;