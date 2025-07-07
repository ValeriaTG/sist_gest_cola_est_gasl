import React, { useState } from 'react';
import { CreditCard, DollarSign, Smartphone, Banknote, CheckCircle, AlertCircle, Lock, TrendingUp } from 'lucide-react';
import { GasStation, PaymentData } from '../types';

interface PaymentPanelProps {
  gasStation: GasStation;
  onProcessPayment: (paymentData: PaymentData) => Promise<boolean>;
  currentTime: Date;
}

const PaymentPanel: React.FC<PaymentPanelProps> = ({
  gasStation,
  onProcessPayment,
  currentTime,
}) => {
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 50.00,
    method: 'credit',
    customerName: '',
    email: '',
    cardNumber: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'error' | null>(null);

  const paymentMethods = [
    { value: 'credit', label: 'Tarjeta de Crédito', icon: CreditCard, color: 'bg-blue-500' },
    { value: 'debit', label: 'Tarjeta de Débito', icon: CreditCard, color: 'bg-green-500' },
    { value: 'digital', label: 'Pago Digital', icon: Smartphone, color: 'bg-purple-500' },
    { value: 'cash', label: 'Efectivo', icon: Banknote, color: 'bg-yellow-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentResult(null);

    try {
      const success = await onProcessPayment(paymentData);
      setPaymentResult(success ? 'success' : 'error');
      
      if (success) {
        setPaymentData({
          amount: 50.00,
          method: 'credit',
          customerName: '',
          email: '',
          cardNumber: '',
        });
      }
    } catch (error) {
      setPaymentResult('error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPaymentResult(null), 5000);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentData({...paymentData, cardNumber: formatted});
  };

  return (
    <div className="space-y-8">
      {/* Payment Result */}
      {paymentResult && (
        <div className={`rounded-lg p-4 flex items-center ${
          paymentResult === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {paymentResult === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          )}
          <span className={paymentResult === 'success' ? 'text-green-800' : 'text-red-800'}>
            {paymentResult === 'success' 
              ? '¡Pago procesado exitosamente!' 
              : 'Error al procesar el pago. Intenta nuevamente.'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Form */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <CreditCard className="w-6 h-6 mr-3 text-blue-600" />
            Procesar Pago
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto a Pagar
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label key={method.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={paymentData.method === method.value}
                        onChange={(e) => setPaymentData({...paymentData, method: e.target.value as any})}
                        className="sr-only"
                      />
                      <div className={`flex items-center w-full p-4 rounded-lg border-2 transition-colors ${
                        paymentData.method === method.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className={`w-8 h-8 rounded-full ${method.color} flex items-center justify-center mr-3`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-sm">{method.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={paymentData.customerName}
                  onChange={(e) => setPaymentData({...paymentData, customerName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={paymentData.email}
                  onChange={(e) => setPaymentData({...paymentData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="cliente@email.com"
                  required
                />
              </div>
            </div>

            {(paymentData.method === 'credit' || paymentData.method === 'debit') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Número de Tarjeta
                </label>
                <input
                  type="text"
                  value={paymentData.cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Información encriptada y segura
                </p>
              </div>
            )}

            {paymentData.method === 'digital' && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Smartphone className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-800">Pago Digital</span>
                </div>
                <p className="text-sm text-purple-700">
                  Escanea el código QR con tu app de pago preferida o usa tu billetera digital.
                </p>
              </div>
            )}

            {paymentData.method === 'cash' && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Banknote className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-yellow-800">Pago en Efectivo</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Paga directamente en la caja de la estación de servicio.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Procesando...' : `Pagar $${paymentData.amount.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Revenue Dashboard */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
            Dashboard de Ingresos
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Ingresos de Hoy</p>
                  <p className="text-3xl font-bold">${gasStation.revenue.today.toFixed(2)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Esta Semana</p>
                    <p className="text-xl font-bold text-blue-800">
                      ${gasStation.revenue.thisWeek.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Este Mes</p>
                    <p className="text-xl font-bold text-purple-800">
                      ${gasStation.revenue.thisMonth.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Payment Methods Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Métodos de Pago Populares</h3>
              <div className="space-y-3">
                {paymentMethods.map((method, index) => {
                  const Icon = method.icon;
                  const percentage = [45, 30, 15, 10][index]; // Datos simulados
                  return (
                    <div key={method.value} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full ${method.color} flex items-center justify-center mr-3`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{method.label}</span>
                          <span className="text-sm text-gray-600">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${method.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Transacciones Recientes</h3>
              <div className="space-y-3">
                {[
                  { amount: 45.50, method: 'credit', time: '14:30' },
                  { amount: 62.75, method: 'digital', time: '14:15' },
                  { amount: 38.20, method: 'debit', time: '14:00' },
                  { amount: 55.00, method: 'cash', time: '13:45' },
                ].map((transaction, index) => {
                  const method = paymentMethods.find(m => m.value === transaction.method);
                  const Icon = method?.icon || CreditCard;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full ${method?.color} flex items-center justify-center mr-3`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium">${transaction.amount.toFixed(2)}</span>
                      </div>
                      <span className="text-sm text-gray-600">{transaction.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPanel;