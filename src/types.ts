export type Role = 'customer' | 'merchant' | 'support' | 'admin' | 'rider';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  companyName?: string; // Only for merchant
  createdAt: string;
}

export type ShipmentStatus = 'Pending' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export interface ShipmentUpdate {
  id: string;
  timestamp: string;
  status: ShipmentStatus;
  location: string;
  description: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderEmail: string;
  receiverName: string;
  receiverEmail: string;
  receiverAddress: string;
  receiverPhone: string;
  status: ShipmentStatus;
  weight: number; // in kg
  price: number; // shipping fee
  paid: boolean;
  paymentMethod?: string;
  createdAt: string;
  estimatedDelivery: string;
  updates: ShipmentUpdate[];
  courierNotes?: string;
  merchantRef?: string; // Optional merchant reference ID
  deliveryHub?: string; // Delivery hub name
  assignedRiderId?: string | null;
  deliveryBatchId?: string | null;
  otp?: string; // 4-digit code generated for OTP delivery verification
  proofSignature?: string | null; // Base64 signature image
  proofPhoto?: string | null; // Simulated photo proof URL or placeholder
  proofType?: 'Signature' | 'Photo' | 'OTP' | 'None' | 'All';
  proofGps?: { lat: number; lng: number } | null;
  completedAt?: string | null;
  codCollected?: boolean; // For Cash On Delivery cash flow tracking
}

export interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string; // 'Bike' | 'Bicycle' | 'Covered Van'
  currentHub: string;
  status: 'Idle' | 'Delivering' | 'Offline';
  lat: number;
  lng: number;
}

export interface DeliveryBatch {
  id: string;
  batchCode: string;
  hub: string;
  riderId: string | null;
  shipmentIds: string[];
  status: 'Created' | 'In Transit' | 'Out for Delivery' | 'Completed';
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  userName: string;
  trackingNumber?: string;
  subject: string;
  message: string;
  status: 'Open' | 'Resolved';
  createdAt: string;
  replyMessage?: string;
  repliedAt?: string;
  repliedBy?: string;
  userRole?: string;
  companyName?: string;
}

export interface NotificationLog {
  id: string;
  email: string;
  subject: string;
  content: string;
  timestamp: string;
  trackingNumber: string;
  status: ShipmentStatus;
}
