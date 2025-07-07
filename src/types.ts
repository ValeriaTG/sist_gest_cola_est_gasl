export interface Pump {
  id: string;
  number: number;
  status: PumpStatus;
  fuelType: string;
  estimatedTime: number;
  pricePerLiter: number;
}

export type PumpStatus = 'available' | 'occupied' | 'maintenance';

export interface QueueItem {
  id: string;
  customerName: string;
  fuelType: string;
  phoneNumber: string;
  email: string;
  arrivalTime: Date;
  estimatedWaitTime: number;
  status: 'waiting' | 'served' | 'cancelled';
  priority: 'normal' | 'high';
}

export interface Reservation {
  id: string;
  customerName: string;
  fuelType: string;
  phoneNumber: string;
  email: string;
  reservationTime: Date;
  estimatedLiters: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface PaymentData {
  amount: number;
  method: 'credit' | 'debit' | 'cash' | 'digital';
  cardNumber?: string;
  customerName: string;
  email: string;
}

export interface Revenue {
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface Analytics {
  averageWaitTime: number;
  customerSatisfaction: number;
  pumpEfficiency: number;
  dailyTransactions: number;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'customer';
  name: string;
}

export interface GasStation {
  id: string;
  name: string;
  location: string;
  pumps: Pump[];
  queue: QueueItem[];
  reservations: Reservation[];
  averageServiceTime: number;
  totalCustomersToday: number;
  peakHours: number[];
  revenue: Revenue;
  analytics: Analytics;
}