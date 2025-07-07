import React, { useState } from 'react';
import { Calendar, Clock, Fuel, User, Phone, Mail, DollarSign, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { GasStation, Reservation } from '../types';

interface ReservationPanelProps {
  gasStation: GasStation;
  onAddReservation: (reservation: Omit<Reservation, 'id' | 'status'>) => void;
  onConfirmReservation: (reservationId: string) => void;
  currentTime: Date;
}

const ReservationPanel: React.FC<ReservationPanelProps> = ({
  gasStation,
  onAddReservation,
  onConfirmReservation,
  currentTime,
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    fuelType: 'regular',
    reservationDate: '',
    reservationTime: '',
    estimatedLiters: 40,
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const fuelTypes = [
    { value: 'regular', label: 'Regular', price: 1.25, color: 'bg-blue-500' },
    { value: 'premium', label: 'Premium', price: 1.45, color: 'bg-purple-500' },
    { value: 'diesel', label: 'Diesel', price: 1.35, color: 'bg-green-500' },
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const reservationDateTime = new Date(`${formData.reservationDate}T${formData.reservationTime}`);
    const selectedFuel = fuelTypes.find(f => f.value === formData.fuelType);
    const totalAmount = formData.estimatedLiters * (selectedFuel?.price || 0);

    const reservation: Omit<Reservation, 'id' | 'status'> = {
      customerName: formData.customerName,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      fuelType: formData.fuelType,
      reservationTime: reservationDateTime,
      estimatedLiters: formData.estimatedLiters,
      totalAmount,
    };

    onAddReservation(reservation);
    
    setFormData({
      customerName: '',
      phoneNumber: '',
      email: '',
      fuelType: 'regular',
      reservationDate: '',
      reservationTime: '',
      estimatedLiters: 40,
    });
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7); // Máximo 7 días adelante
    return maxDate.toISOString().split('T')[0];
  };

  const calculateTotal = () => {
    const selectedFuel = fuelTypes.find(f => f.value === formData.fuelType);
    return formData.estimatedLiters * (selectedFuel?.price || 0);
  };

  const getAvailableSlots = (date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    
    if (selectedDate.toDateString() === today.toDateString()) {
      // Si es hoy, filtrar horarios pasados
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      
      return timeSlots.filter(slot => {
        const [hour, minute] = slot.split(':').map(Number);
        return hour > currentHour || (hour === currentHour && minute > currentMinute);
      });
    }
    
    return timeSlots;
  };

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800">¡Reserva creada exitosamente! Te enviaremos una confirmación por email.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reservation Form */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-blue-600" />
            Nueva Reserva
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                      checked={formData.fuelType === fuel.value}
                      onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
                      className="sr-only"
                    />
                    <div className={`flex items-center w-full p-4 rounded-lg border-2 transition-colors ${
                      formData.fuelType === fuel.value 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className={`w-4 h-4 rounded-full ${fuel.color} mr-3`}></div>
                      <div className="flex-1">
                        <span className="font-medium">{fuel.label}</span>
                        <span className="ml-2 text-gray-600">${fuel.price}/L</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Reserva
                </label>
                <input
                  type="date"
                  value={formData.reservationDate}
                  onChange={(e) => setFormData({...formData, reservationDate: e.target.value})}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Reserva
                </label>
                <select
                  value={formData.reservationTime}
                  onChange={(e) => setFormData({...formData, reservationTime: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar hora</option>
                  {formData.reservationDate && getAvailableSlots(formData.reservationDate).map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Litros Estimados
              </label>
              <input
                type="number"
                value={formData.estimatedLiters}
                onChange={(e) => setFormData({...formData, estimatedLiters: parseInt(e.target.value)})}
                min="10"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Total Estimado:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Crear Reserva
            </button>
          </form>
        </div>

        {/* Existing Reservations */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Clock className="w-6 h-6 mr-3 text-blue-600" />
            Reservas Activas
          </h2>
          
          {gasStation.reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay reservas activas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gasStation.reservations.map((reservation) => (
                <div key={reservation.id} className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{reservation.customerName}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Phone className="w-4 h-4 mr-1" />
                        <span>{reservation.phoneNumber}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {reservation.status === 'confirmed' ? 'Confirmada' :
                       reservation.status === 'pending' ? 'Pendiente' : 'Completada'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{reservation.reservationTime.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{reservation.reservationTime.toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Fuel className="w-4 h-4 mr-2" />
                      <span className="capitalize">{reservation.fuelType}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>${reservation.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {reservation.status === 'pending' && (
                    <button
                      onClick={() => onConfirmReservation(reservation.id)}
                      className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Confirmar Reserva
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Station Info */}
      <div className="bg-white rounded-xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Información de la Estación</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Ubicación</h3>
            <p className="text-gray-600 text-sm">{gasStation.location}</p>
          </div>
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Horarios</h3>
            <p className="text-gray-600 text-sm">24 horas, 7 días a la semana</p>
          </div>
          <div className="text-center">
            <Fuel className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Bombas Disponibles</h3>
            <p className="text-gray-600 text-sm">{gasStation.pumps.length} bombas activas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPanel;