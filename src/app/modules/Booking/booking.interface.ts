import { Types } from 'mongoose';

export type TBookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Failed';
export type TPaymentStatus = 'Unpaid' | 'Authorized' | 'Captured' | 'Cancelled';

export interface TBooking {
  user?: Types.ObjectId; // রেজিস্টার্ড ইউজার হলে
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  hotelInfo: {
    hotelId: string;
    hotelName: string;
    city: string;
  };
  roomInfo: {
    roomTypeCode: string;
    rateBasisId: string;
    roomName: string;
    mealPlan: string;
  };
  checkIn: string;
  checkOut: string;
  adults: number;
  totalAmount: number;
  currency: string;
  paymentIntentId: string; // Stripe ID
  supplierReference?: string; // WebBeds ID
  status: TBookingStatus;
  paymentStatus: TPaymentStatus;
}