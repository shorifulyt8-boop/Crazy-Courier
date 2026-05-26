import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shipment, 
  SupportTicket, 
  Role, 
  ShipmentStatus, 
  NotificationLog,
  Rider,
  DeliveryBatch
} from './types.js';
import TrackingWidget from './components/TrackingWidget.tsx';
import PaymentGateway from './components/PaymentGateway.tsx';
import NotificationLogList from './components/NotificationLogList.tsx';
import { 
  Truck, 
  Search, 
  User as UserIcon, 
  Lock, 
  Package, 
  PlusCircle, 
  Clock, 
  History, 
  ShieldCheck, 
  UserCheck, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Phone, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  Send,
  Sliders,
  DollarSign,
  Briefcase,
  SlidersHorizontal,
  Mail,
  Menu,
  X,
  CreditCard,
  Bell,
  ChevronDown,
  LogOut,
  Printer,
  Calendar,
  FileText,
  LayoutDashboard,
  Copy,
  Scan
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

const BarcodeSVG = ({ value }: { value: string }) => {
  const bars: boolean[] = [];
  const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = 0; i < 40; i++) {
    bars.push((hash + i) % 3 !== 0 && (hash + i * 7) % 5 !== 0);
  }
  return (
    <svg className="w-full h-12 text-slate-950" viewBox="0 0 120 40" preserveAspectRatio="none">
      <g fill="currentColor">
        {bars.map((bar, index) => (
          bar && (
            <rect 
              key={index} 
              x={index * 3} 
              y="0" 
              width={(index % 4 === 0 ? 2 : 1.2)} 
              height="40" 
            />
          )
        ))}
      </g>
    </svg>
  );
};

export default function App() {
  // Session / Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('courier_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation and UI state
  const [currentTab, setCurrentTab] = useState<'home' | 'dashboard' | 'history' | 'notifications' | 'support' | 'admin' | 'profile'>(() => {
    const saved = localStorage.getItem('courier_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (user.role === 'admin') return 'admin';
        return 'dashboard';
      } catch (e) {
        return 'home';
      }
    }
    return 'home';
  });
  const [adminSubTab, setAdminSubTab] = useState<'dashboard' | 'riders' | 'users' | 'settings'>('dashboard');
  
  // Rider Creation States
  const [riderCreateEmail, setRiderCreateEmail] = useState('');
  const [riderCreateName, setRiderCreateName] = useState('');
  const [riderCreatePassword, setRiderCreatePassword] = useState('');
  const [riderCreatePhone, setRiderCreatePhone] = useState('');
  const [riderCreateLoading, setRiderCreateLoading] = useState(false);

  const handleAdminCreateRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setRiderCreateLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'rider',
          email: riderCreateEmail,
          name: riderCreateName,
          password: riderCreatePassword,
          phone: riderCreatePhone
        })
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Failed to create rider account', 'error');
      } else {
        addToast(`Rider ${data.user.name} created successfully!`, 'success');
        setRiderCreateEmail('');
        setRiderCreateName('');
        setRiderCreatePassword('');
        setRiderCreatePhone('');
        fetchAdminUsers();
      }
    } catch (err) {
      addToast('Network error while creating rider', 'error');
    } finally {
      setRiderCreateLoading(false);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  // Auth Form inputs
  const [authRole, setAuthRole] = useState<Role>('customer');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Global / Role-based state variables
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<(User & { password?: string })[]>([]);
  
  // Public Quick Tracking search input
  const [trackingSearchNumber, setTrackingSearchNumber] = useState('');
  const [publicSearchedShipment, setPublicSearchedShipment] = useState<Shipment | null>(null);
  const [publicSearchError, setPublicSearchError] = useState('');
  const [publicSearchLoading, setPublicSearchLoading] = useState(false);

  // Active feature contexts
  const [activePaymentShipment, setActivePaymentShipment] = useState<Shipment | null>(null);
  
  // Create Courier Shipment Form State
  const [newShipmentSenderName, setNewShipmentSenderName] = useState('');
  const [newShipmentSenderEmail, setNewShipmentSenderEmail] = useState('');
  const [newShipmentReceiverName, setNewShipmentReceiverName] = useState('');
  const [newShipmentReceiverEmail, setNewShipmentReceiverEmail] = useState('');
  const [newShipmentReceiverPhone, setNewShipmentReceiverPhone] = useState('');
  const [newShipmentReceiverAddress, setNewShipmentReceiverAddress] = useState('');
  const [newShipmentWeight, setNewShipmentWeight] = useState(2.0);
  const [newShipmentCourierNotes, setNewShipmentCourierNotes] = useState('');
  const [prepayShipping, setPrepayShipping] = useState(false);
  const [merchantRef, setMerchantRef] = useState('');
  const [shipmentCreateError, setShipmentCreateError] = useState('');
  const [shipmentCreateSuccess, setShipmentCreateSuccess] = useState('');
  const [shipmentCreateLoading, setShipmentCreateLoading] = useState(false);

  // Support Ticket Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketTrackingNumber, setTicketTrackingNumber] = useState('');
  const [ticketCreateSuccess, setTicketCreateSuccess] = useState('');
  const [ticketCreateError, setTicketCreateError] = useState('');

  // Support Agent Action State
  const [activeReplyTicketId, setActiveReplyTicketId] = useState<string | null>(null);
  const [replyMessageContent, setReplyMessageContent] = useState('');

  // Support/Admin Update shipment status modal
  const [activeUpdateShipmentId, setActiveUpdateShipmentId] = useState<string | null>(null);
  const [updateStatusVal, setUpdateStatusVal] = useState<ShipmentStatus>('In Transit');
  const [updateStatusLocation, setUpdateStatusLocation] = useState('');
  const [updateStatusDescription, setUpdateStatusDescription] = useState('');

  // Admin Control Settings State
  const [supportPasswordInput, setSupportPasswordInput] = useState('support99');
  const [adminSettingsSuccess, setAdminSettingsSuccess] = useState('');
  const [adminSettingsError, setAdminSettingsError] = useState('');

  // Profile Edit State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Merchant popup modal and print system states
  const [isMerchantShipModalOpen, setIsMerchantShipModalOpen] = useState(false);
  const [printedShipment, setPrintedShipment] = useState<any | null>(null);

  // Merchant shipment creation inputs
  const [merchantReceiverName, setMerchantReceiverName] = useState('');
  const [merchantReceiverEmail, setMerchantReceiverEmail] = useState('');
  const [merchantReceiverPhone, setMerchantReceiverPhone] = useState('');
  const [merchantReceiverAddress, setMerchantReceiverAddress] = useState('');
  const [merchantDeliveryHub, setMerchantDeliveryHub] = useState('');
  const [merchantWeight, setMerchantWeight] = useState(2.0);
  const [merchantCourierNotes, setMerchantCourierNotes] = useState('');
  const [merchantPrepayShipping, setMerchantPrepayShipping] = useState(true);
  const [merchantRefId, setMerchantRefId] = useState('');
  const [merchantShipError, setMerchantShipError] = useState('');
  const [merchantShipLoading, setMerchantShipLoading] = useState(false);

  // --- Advanced Logistics & Multi-User Dispatch States ---
  const [riders, setRiders] = useState<Rider[]>([]);
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [isDispatching, setIsDispatching] = useState(false);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Billing ledger states
  const [billingSummary, setBillingSummary] = useState<any>(null);
  const [merchantLedger, setMerchantLedger] = useState<any[]>([]);
  const [merchantPayouts, setMerchantPayouts] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);

  // Active Payout Request Form
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bKash');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  // Interactive Batching Scheduling tool states
  const [batchHub, setBatchHub] = useState('Dhaka Central Hub');
  const [batchRiderId, setBatchRiderId] = useState('');
  const [selectedBatchShipments, setSelectedBatchShipments] = useState<string[]>([]);
  const [batchSubmitLoading, setBatchSubmitLoading] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');
  const [batchErrorMsg, setBatchErrorMsg] = useState('');

  // CSV Bulk Importer state
  const [bulkCSV, setBulkCSV] = useState('');
  const [bulkImportSuccess, setBulkImportSuccess] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  // electronic Proof of Delivery (ePOD) Signature and Canvas states
  const [proofShipmentId, setProofShipmentId] = useState<string | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [ePODProofType, setEPODProofType] = useState<'Signature' | 'Photo' | 'OTP'>('Signature');
  const [ePODOTPInput, setEPODOTPInput] = useState('');
  const [ePODSignatureImage, setEPODSignatureImage] = useState<string | null>(null);
  const [ePODPhotoText, setEPODPhotoText] = useState('Delivered at client front porch safe drop-box with confirmation.');
  const [ePODLoading, setEPODLoading] = useState(false);
  const [ePODError, setEPODError] = useState('');

  // Live GPS Map Progress tracking simulations
  const [activeGeoTrackingId, setActiveGeoTrackingId] = useState<string | null>(null);
  const [gpsSimProgress, setGpsSimProgress] = useState(0);
  const [gpsSimSpeed, setGpsSimSpeed] = useState(0);
  const [gpsSimTraffic, setGpsSimTraffic] = useState('Normal load');
  const [gpsSimTimer, setGpsSimTimer] = useState<any>(null);

  // Crazy Courier Courier lookalike merchant dashboard state
  const [merchantSubView, setMerchantSubView] = useState<'dashboard' | 'add-parcel' | 'consignments' | 'fraud-check' | 'add-fund' | 'pickup' | 'pricing' | 'bulk-import' | 'payouts' | 'support' | 'tracking'>('dashboard');
  const [fraudCheckPhone, setFraudCheckPhone] = useState('');
  const [fraudCheckedResult, setFraudCheckedResult] = useState<{
    status: 'Safe' | 'Medium Risk' | 'High Warning';
    ratio: string;
    completed: number;
    cancelled: number;
    notes: string;
  } | null>(null);
  
  // Custom Fund state
  const [fundAmountInput, setFundAmountInput] = useState('');
  const [fundMethod, setFundMethod] = useState('bKash');
  const [fundReference, setFundReference] = useState('');
  const [fundSuccessMsg, setFundSuccessMsg] = useState('');

  // Pickup Request state
  const [pickupAddressInput, setPickupAddressInput] = useState('');
  const [pickupTimeInput, setPickupTimeInput] = useState('');
  const [pickupNotesInput, setPickupNotesInput] = useState('');
  const [pickupSuccessMsg, setPickupSuccessMsg] = useState('');

  // Pricing calculator state
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcLocation, setCalcLocation] = useState<'inside' | 'outside'>('inside');
  const [calcCod, setCalcCod] = useState(100);

  // Search input state for consignment search in merchant top header
  const [merchantTopSearch, setMerchantTopSearch] = useState('');
  
  // Dashboard Barcode Scanner & Search
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const renderToasts = () => {
    if (toasts.length === 0) return null;
    return (
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full" id="global-toasts-portal">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-lg border text-white flex items-center justify-between gap-3 animate-slide-in-up transition-all duration-300 ${
              toast.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500' 
                : toast.type === 'error'
                ? 'bg-rose-600 border-rose-500' 
                : 'bg-indigo-600 border-indigo-505'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
              {toast.type === 'info' && <HelpCircle className="w-5 h-5 shrink-0" />}
              <span className="text-[12.5px] font-semibold leading-normal">{toast.message}</span>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-white/80 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Synchronize dynamic dashboards regularly
  useEffect(() => {
    if (currentUser) {
      fetchUserShipments();
      fetchSupportTickets();
      if (currentUser.role === 'admin') {
        fetchAdminUsers();
      }
      if (currentUser.role === 'admin' || currentUser.role === 'support' || currentUser.role === 'rider') {
        fetchRiders();
        fetchBatches();
      }
      if (currentUser.role === 'merchant') {
        fetchMerchantBilling();
      }
      setProfileName(currentUser.name);
      setProfilePhone(currentUser.phone || '');
    } else {
      setShipments([]);
      setSupportTickets([]);
      setAdminUsers([]);
      setRiders([]);
      setBatches([]);
      setBillingSummary(null);
      setMerchantLedger([]);
      setMerchantPayouts([]);
    }
  }, [currentUser]);

  const fetchRiders = async () => {
    setRidersLoading(true);
    try {
      const res = await fetch('/api/riders');
      if (res.ok) {
        const data = await res.json();
        setRiders(data);
      } else {
        addToast('Failed to fetch rider profile logs.', 'error');
      }
    } catch (err) {
      console.error("Failed fetching rider profiles telemetry:", err);
      addToast('Network error while retrieving rider profiles.', 'error');
    } finally {
      setRidersLoading(false);
    }
  };

  const fetchBatches = async () => {
    setBatchesLoading(true);
    try {
      const res = await fetch('/api/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      } else {
        addToast('Failed to retrieve shipping batches.', 'error');
      }
    } catch (err) {
      console.error("Failed fetching logistics batches:", err);
      addToast('Network error while fetching logistics cargo batches.', 'error');
    } finally {
      setBatchesLoading(false);
    }
  };

  const fetchMerchantBilling = async () => {
    if (!currentUser) return;
    setBillingLoading(true);
    try {
      const res = await fetch(`/api/merchant/billing?email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setBillingSummary(data.summary);
        setMerchantLedger(data.ledger);
        setMerchantPayouts(data.payouts);
      } else {
        addToast('Failed to retrieve billing summary data.', 'error');
      }
    } catch (err) {
      console.error("Accounting database ledger reading failed:", err);
      addToast('Network error while retrieving ledger accounts.', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchUserShipments = async () => {
    if (!currentUser) return;
    setShipmentsLoading(true);
    try {
      const res = await fetch(`/api/shipments?email=${encodeURIComponent(currentUser.email)}&role=${currentUser.role}`);
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
      } else {
        addToast('Failed to retrieve user shipments.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while retrieving shipments.', 'error');
    } finally {
      setShipmentsLoading(false);
    }
  };

  const fetchSupportTickets = async () => {
    if (!currentUser) return;
    setTicketsLoading(true);
    try {
      const url = currentUser.role === 'support' || currentUser.role === 'admin'
        ? '/api/support/tickets'
        : `/api/support/tickets?email=${encodeURIComponent(currentUser.email)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSupportTickets(data);
      } else {
        addToast('Failed to sync support ticket history.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while retrieving helpdesk support tickets.', 'error');
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
      } else {
        addToast('Failed to load user credentials checklist.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network connection protocol failed for admin user query.', 'error');
    }
  };

  // --- Advanced Logistics Action Callbacks ---

  // 1. SMART AUTO DISPATCH
  const triggerAutoDispatch = async () => {
    setIsDispatching(true);
    setDispatchLogs([]);
    try {
      const res = await fetch('/api/dispatch/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchLogs(data.logs || []);
        addToast('Smart Auto Dispatch completed successfully!', 'success');
        fetchUserShipments();
        fetchRiders();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.error || 'Failed to dispatch matching auto protocol.', 'error');
      }
    } catch (err) {
      setDispatchLogs(prev => [...prev, '✗ Protocol communication timeout during matching processing.']);
      addToast('Network request timeout during dispatch processing.', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  // 2. CREATE DELIVERY BATCH (ব্যাচ ডেলিভারি)
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchErrorMsg('');
    setBatchSuccessMsg('');
    if (selectedBatchShipments.length === 0) {
      const errMsg = 'Please select at least one parcel checkbox to create a cargo shipment batch.';
      setBatchErrorMsg(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    setBatchSubmitLoading(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hub: batchHub,
          riderId: batchRiderId || null,
          shipmentIds: selectedBatchShipments
        })
      });
      const data = await res.json();
      if (res.ok) {
        const succMsg = `✓ Batch ${data.batchCode} generated and scheduled with ${selectedBatchShipments.length} parcels successfully!`;
        setBatchSuccessMsg(succMsg);
        addToast(`Batch ${data.batchCode} generated successfully!`, 'success');
        setSelectedBatchShipments([]);
        fetchBatches();
        fetchRiders();
        fetchUserShipments();
      } else {
        setBatchErrorMsg(data.error || 'Failed generating batch.');
        addToast(data.error || 'Failed generating batch.', 'error');
      }
    } catch (err) {
      setBatchErrorMsg('Connection timeout to routing engines.');
      addToast('Network connection timeout during batch creation.', 'error');
    } finally {
      setBatchSubmitLoading(false);
    }
  };

  // 3. BULK CSV IMPORT (Spreadsheet bulk order load)
  const handleBulkCSVImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkImportError('');
    setBulkImportSuccess('');
    if (!bulkCSV.trim()) {
      const errMsg = 'CSV datasheet can not be empty.';
      setBulkImportError(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    setBulkImportLoading(true);

    // Parsing logic
    const lines = bulkCSV.split('\n').map(l => l.trim()).filter(Boolean);
    const parcelList: any[] = [];

    // Skip header if matches receiver
    const firstLine = lines[0]?.toLowerCase() || '';
    const startIndex = (firstLine.includes('receiver') || firstLine.includes('name')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
       const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
       if (cols.length >= 3) {
         parcelList.push({
           receiverName: cols[0],
           receiverEmail: cols[1] || 'client@example.com',
           receiverPhone: cols[2],
           receiverAddress: cols[3] || 'Dhaka Metro, BD',
           weight: parseFloat(cols[4]) || 1.5,
           deliveryHub: cols[5] || 'Dhaka Central Hub',
           courierNotes: cols[6] || 'Bulk uploaded commerce parcel'
         });
       }
    }

    if (parcelList.length === 0) {
      const errMsg = 'Could not parse any valid parcel lines. Ensure the data matches: Receiver Name, Email, Phone, Address, Weight, Hub, Notes';
      setBulkImportError(errMsg);
      addToast(errMsg, 'error');
      setBulkImportLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/shipments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail: currentUser?.email,
          senderName: currentUser?.companyName || currentUser?.name,
          parcelList
        })
      });
      const data = await res.json();
      if (res.ok) {
        const succMsg = `✓ Integrated ${data.count} new shipments successfully into dispatch queue!`;
        setBulkImportSuccess(succMsg);
        addToast(`Successfully imported ${data.count} shipments from CSV!`, 'success');
        setBulkCSV('');
        fetchUserShipments();
        fetchMerchantBilling();
      } else {
        setBulkImportError(data.error || 'Failed importing bulk spreadsheet.');
        addToast(data.error || 'Failed importing bulk spreadsheet.', 'error');
      }
    } catch (err) {
      setBulkImportError('Landed on a network communication bottleneck.');
      addToast('Network error during bulk CSV import.', 'error');
    } finally {
      setBulkImportLoading(false);
    }
  };

  // Load sample bulk CSV to easily test bulk import
  const loadDemoCSVData = () => {
    setBulkCSV(
      "Receiver Name, Receiver Email, Receiver Phone, Receiver Address, Weight, Hub, Notes\n" +
      "Shameem Chowdhury, shameem@test.com, +880175512244, Mirpur 12 near Bus Stand, 3.2, Dhaka Central Hub, Fragile Computer Parts\n" +
      "Tanvir Rahman, tanvir@abc.com, +880182233441, GEC Circle near bKash lane, 1.4, Chittagong Sorting Hub, Handle with extra care\n" +
      "Nusrat Jahan, nusrat@domain.com, +880191133221, Alupotti Mor, 0.8, Rajshahi Sorting Hub, Call before starting delivery\n" +
      "Yeasin Arafat, yeasin@xyz.com, +880155512211, Uttara Sector 11 Road 5, 2.5, Dhaka Central Hub, Cash prepaid\n" +
      "Mithu Mia, mithu@express.com, +880164433112, Halisahar Block A, 5.0, Chittagong Sorting Hub, Deliver before evening sunset"
    );
  };

  // 4. MERCHANT REQUEST REWARD PAYOUTS
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError('');
    setPayoutSuccess('');
    const amt = parseFloat(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      const errMsg = 'Withdrawal value must be greater than 0.';
      setPayoutError(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    if (!payoutAccount.trim()) {
      const errMsg = 'Please provide a payout contact or account reference details.';
      setPayoutError(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/merchant/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser?.email,
          amount: amt,
          paymentMethod: payoutMethod,
          accountNo: payoutAccount
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutSuccess(`✓ Payout transfer of $${amt.toFixed(2)} completed successfully!`);
        addToast(`Payout transfer of $${amt.toFixed(2)} completed successfully!`, 'success');
        setPayoutAmount('');
        setPayoutAccount('');
        fetchMerchantBilling();
      } else {
        setPayoutError(data.error || 'Withdrawal blocked.');
        addToast(data.error || 'Withdrawal blocked.', 'error');
      }
    } catch (err) {
      setPayoutError('Accounts sync process error.');
      addToast('Accounts sync process error.', 'error');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Merchant Custom Helper Actions
  const handleFraudCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fraudCheckPhone.trim()) return;
    const cleanNum = fraudCheckPhone.replace(/\D/g, '');
    const lastNumStr = cleanNum.slice(-1) || '5';
    const lastNum = parseInt(lastNumStr, 10) || 5;
    
    if (lastNum % 3 === 0) {
      setFraudCheckedResult({
        status: 'High Warning',
        ratio: '68% Delivery Failure Rate',
        completed: 4,
        cancelled: 11,
        notes: 'Customer repeatedly refuses parcels on delivery. High risk profile. We advise collecting full prepayment of shipping fees via bKash.'
      });
      addToast('Warning: High failure rate detected for recipient phone.', 'error');
    } else if (lastNum % 2 === 0) {
      setFraudCheckedResult({
        status: 'Medium Risk',
        ratio: '24% Return Rate',
        completed: 32,
        cancelled: 10,
        notes: 'Occasional delay in cash collect handovers, but generally trustworthy. Normal courier service suggested.'
      });
      addToast('Advisory: Medium return rate detected for recipient phone.', 'info');
    } else {
      setFraudCheckedResult({
        status: 'Safe',
        ratio: '5% Cancel Rate',
        completed: 89,
        cancelled: 5,
        notes: 'Highly active online buyer with spotless courier history. Perfect recipient profile!'
      });
      addToast('Success: Spotless recipient delivery record verified.', 'success');
    }
  };

  const handleSchedulePickup = (e: React.FormEvent) => {
    e.preventDefault();
    const succMsg = 'Pickup request successfully registered! Courier rider has been auto-notified to collect parcels within 2 hours.';
    setPickupSuccessMsg(succMsg);
    addToast('Pickup request registered successfully!', 'success');
    setTimeout(() => {
      setPickupSuccessMsg('');
      setPickupAddressInput('');
      setPickupTimeInput('');
      setPickupNotesInput('');
    }, 4000);
  };

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fundAmountInput);
    if (isNaN(amt) || amt <= 0) {
      addToast('Fund deposit amount must be positive!', 'error');
      return;
    }
    
    setFundSuccessMsg(`Successfully simulated fund deposit of $${amt.toFixed(2)} via ${fundMethod}. Real-time balance adjustment processed!`);
    addToast(`Successfully deposited $${amt.toFixed(2)} via ${fundMethod}!`, 'success');
    if (billingSummary) {
      setBillingSummary({
        ...billingSummary,
        availableBalance: (billingSummary.availableBalance || 0) + amt,
        codEarned: (billingSummary.codEarned || 0) + amt
      });
    }
    setTimeout(() => {
      setFundSuccessMsg('');
      setFundAmountInput('');
      setFundReference('');
    }, 4000);
  };

  // 5. SUBMIT ePOD EVIDENCE (DIGITAL PROOF OF DELIVERY)
  const handleEPODSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEPODError('');
    if (!proofShipmentId) return;

    if (ePODProofType === 'OTP' && !ePODOTPInput.trim()) {
      const errMsg = 'Verification OTP is required to unlock this package.';
      setEPODError(errMsg);
      addToast(errMsg, 'error');
      return;
    }

    setEPODLoading(true);
    try {
      const payload = {
        proofType: ePODProofType,
        proofSignature: ePODProofType === 'Signature' ? (ePODSignatureImage || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2500/svg' width='100' height='30'><path d='M10,15 Q30,5 60,25 T90,10' stroke='black' stroke-width='2' fill='none'/></svg>") : null,
        proofPhoto: ePODProofType === 'Photo' ? ePODPhotoText : null,
        verificationOtp: ePODProofType === 'OTP' ? ePODOTPInput : null,
        proofGps: { lat: 23.8123 + (Math.random() - 0.5) * 0.05, lng: 90.4145 + (Math.random() - 0.5) * 0.05 }
      };

      const res = await fetch(`/api/shipments/${proofShipmentId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setIsProofModalOpen(false);
        setProofShipmentId(null);
        setEPODOTPInput('');
        setEPODSignatureImage(null);
        addToast('ePOD electronic proof of delivery submitted!', 'success');
        fetchUserShipments();
        fetchRiders();
        fetchBatches();
      } else {
        setEPODError(data.error || 'Failed capturing signature verification. Checked OTP pin matches?');
        addToast(data.error || 'Failed capturing signature verification. Checked OTP pin matches?', 'error');
      }
    } catch (err) {
      setEPODError('Failed connecting with telemetry nodes.');
      addToast('Network error while saving ePOD proof of delivery.', 'error');
    } finally {
      setEPODLoading(false);
    }
  };

  // 6. LIVE SIMULATED GPS GPS INTERACTION RUNNER (রিয়েল-টাইম GPS)
  const startGPSRouteSimulation = (shipment: Shipment) => {
    if (gpsSimTimer) {
      clearInterval(gpsSimTimer);
    }
    setActiveGeoTrackingId(shipment.id);
    setGpsSimProgress(0);
    setGpsSimSpeed(35);
    setGpsSimTraffic('Optimizing route. Rider loaded.');

    const interval = setInterval(() => {
      setGpsSimProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setGpsSimSpeed(0);
          setGpsSimTraffic('Arrived safely at Receiver Residence!');
          return 100;
        }
        const nextPercent = prev + Math.floor(10 + Math.random() * 15);
        const spd = Math.floor(32 + Math.random() * 25);
        setGpsSimSpeed(spd);
        if (nextPercent > 35 && nextPercent < 70) {
          setGpsSimTraffic('Heavy Traffic jam near Local sorting lanes (গতি ধীর)');
        } else if (nextPercent >= 70) {
          setGpsSimTraffic('Clear free-flow speed lanes approaching customer (পৌঁছানোর কাছাকাছি)');
        }
        return Math.min(100, nextPercent);
      });
    }, 1500);

    setGpsSimTimer(interval);
  };

  // Tracking API Call
  const handlePublicTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingSearchNumber.trim()) return;
    setPublicSearchLoading(true);
    setPublicSearchError('');
    setPublicSearchedShipment(null);

    try {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(trackingSearchNumber.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setPublicSearchError(data.error || 'Tracking number mismatch.');
        addToast(data.error || 'Tracking number not found.', 'error');
      } else {
        setPublicSearchedShipment(data);
        addToast(`Found parcel tracking logs for ${data.trackingNumber}`, 'success');
        // Scroll to the result
        setTimeout(() => {
          document.getElementById('search-result-scroll-anchor')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } catch (err) {
      setPublicSearchError('Failed connecting with telemetry routing system.');
      addToast('Failed connecting with telemetry routing system.', 'error');
    } finally {
      setPublicSearchLoading(false);
    }
  };

  // Auth: Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Incorrect login credentials.');
        addToast(data.error || 'Incorrect login credentials.', 'error');
      } else {
        localStorage.setItem('courier_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setAuthModal(null);
        setAuthEmail('');
        setAuthPassword('');
        addToast(`Welcome back, ${data.user.name}!`, 'success');
        // Redirect to dashboard page
        setCurrentTab(data.user.role === 'admin' ? 'admin' : 'dashboard');
      }
    } catch (err) {
      setAuthError('Connection protocol timeout.');
      addToast('Connection protocol timeout.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          name: authName,
          password: authPassword,
          role: authRole,
          phone: phone,
          companyName: authRole === 'merchant' ? companyName : undefined
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Registration constraints rejected.');
        addToast(data.error || 'Registration constraints rejected.', 'error');
      } else {
        localStorage.setItem('courier_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setAuthModal(null);
        setAuthEmail('');
        setAuthName('');
        setAuthPassword('');
        setPhone('');
        setCompanyName('');
        addToast(`Registered successfully! Welcome, ${data.user.name}.`, 'success');
        // Redirect to dashboard page
        setCurrentTab(data.user.role === 'admin' ? 'admin' : 'dashboard');
      }
    } catch (err) {
      setAuthError('Registration backend offline.');
      addToast('Registration backend offline.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Action: Create simulated Courier Shipment
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setShipmentCreateError('');
    setShipmentCreateSuccess('');
    setShipmentCreateLoading(true);

    // Preset sender block for merchant
    const sName = currentUser?.role === 'merchant' ? (currentUser.companyName || currentUser.name) : newShipmentSenderName;
    const sEmail = currentUser?.role === 'merchant' ? currentUser.email : newShipmentSenderEmail;

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: sName,
          senderEmail: sEmail,
          receiverName: newShipmentReceiverName,
          receiverEmail: newShipmentReceiverEmail,
          receiverAddress: newShipmentReceiverAddress,
          receiverPhone: newShipmentReceiverPhone,
          weight: newShipmentWeight,
          courierNotes: newShipmentCourierNotes,
          paid: prepayShipping,
          merchantRef: merchantRef || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setShipmentCreateError(data.error || 'Failed to file shipment record.');
        addToast(data.error || 'Failed to file shipment record.', 'error');
      } else {
        setShipmentCreateSuccess(`Successfully registered shipment! Tracking: ${data.trackingNumber}`);
        addToast(`Shipment registered! Track ID: ${data.trackingNumber}`, 'success');
        // Reset inputs
        setNewShipmentReceiverName('');
        setNewShipmentReceiverEmail('');
        setNewShipmentReceiverPhone('');
        setNewShipmentReceiverAddress('');
        setNewShipmentCourierNotes('');
        setMerchantRef('');
        setNewShipmentWeight(2.0);
        setPrepayShipping(false);

        // Fetch refreshed shipments
        fetchUserShipments();

        // If unpaid, prompt immediate payment simulation for aesthetics!
        if (!data.paid) {
          setActivePaymentShipment(data);
        }
      }
    } catch (err) {
      setShipmentCreateError('Server rejected logistics transaction.');
      addToast('Server rejected logistics transaction.', 'error');
    } finally {
      setShipmentCreateLoading(false);
    }
  };

  // Action: Create Merchant Courier Shipment via Popup Modal
  const handleMerchantCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setMerchantShipError('');
    setMerchantShipLoading(true);

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: currentUser.companyName || currentUser.name,
          senderEmail: currentUser.email,
          receiverName: merchantReceiverName,
          receiverEmail: merchantReceiverEmail,
          receiverAddress: merchantReceiverAddress,
          receiverPhone: merchantReceiverPhone,
          weight: merchantWeight,
          courierNotes: merchantCourierNotes,
          paid: merchantPrepayShipping,
          merchantRef: merchantRefId || undefined,
          deliveryHub: merchantDeliveryHub || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMerchantShipError(data.error || 'Failed to file shipment record.');
        addToast(data.error || 'Failed to file shipment record.', 'error');
      } else {
        // Success!
        addToast(`Merchant consignment generated! Tracking: ${data.trackingNumber}`, 'success');
        // Reset form inputs
        setMerchantReceiverName('');
        setMerchantReceiverEmail('');
        setMerchantReceiverPhone('');
        setMerchantReceiverAddress('');
        setMerchantDeliveryHub('');
        setMerchantCourierNotes('');
        setMerchantRefId('');
        setMerchantWeight(2.0);
        setMerchantPrepayShipping(true);

        // Fetch refreshed shipments
        fetchUserShipments();

        // Close the ship modal
        setIsMerchantShipModalOpen(false);

        // Open the Print Label Modal for this newly created shipment!
        setPrintedShipment(data);
      }
    } catch (err) {
      setMerchantShipError('Server rejected logistics transaction.');
      addToast('Server rejected logistics transaction.', 'error');
    } finally {
      setMerchantShipLoading(false);
    }
  };

  // Action: Update support pass (Admin controls)
  const handleUpdateSupportPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSettingsError('');
    setAdminSettingsSuccess('');

    try {
      const res = await fetch('/api/auth/support-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: supportPasswordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminSettingsError(data.error || 'Admin override refused.');
        addToast(data.error || 'Admin override refused.', 'error');
      } else {
        setAdminSettingsSuccess(`Support Desk password successfully written to "${supportPasswordInput}"!`);
        addToast('Support Desk password written successfully!', 'success');
        fetchAdminUsers();
      }
    } catch (err) {
      setAdminSettingsError('Encryption layer handshake failed.');
      addToast('Encryption layer handshake failed.', 'error');
    }
  };

  // Action: File support ticket as customer or merchant
  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketCreateError('');
    setTicketCreateSuccess('');

    if (!currentUser) return;

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userName: currentUser.name,
          trackingNumber: ticketTrackingNumber || undefined,
          subject: ticketSubject,
          message: ticketMessage,
          userRole: currentUser.role,
          companyName: currentUser.companyName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setTicketCreateError(data.error || 'Could not send helpdesk ticket.');
        addToast(data.error || 'Could not send helpdesk ticket.', 'error');
      } else {
        setTicketCreateSuccess('Ticket submitted. A human support desk agent will respond shortly!');
        addToast('Helpdesk support ticket submitted successfully!', 'success');
        setTicketSubject('');
        setTicketMessage('');
        setTicketTrackingNumber('');
        fetchSupportTickets();
      }
    } catch (err) {
      setTicketCreateError('Support service timeout.');
      addToast('Support service timeout.', 'error');
    }
  };

  // Action: Submit reply to Ticket (Support Representative)
  const handleReplyTicket = async (ticketId: string) => {
    if (!replyMessageContent.trim()) return;

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyMessage: replyMessageContent,
          replierName: currentUser?.name || 'Customer Care Agent'
        })
      });

      if (res.ok) {
        addToast('Reply submitted to support ticket!', 'success');
        setReplyMessageContent('');
        setActiveReplyTicketId(null);
        fetchSupportTickets();
      } else {
        addToast('Failed to post reply.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to post reply.', 'error');
    }
  };

  // Action: Transition Shipment Status (Support Desk / Admin Only)
  const handleUpdateShipmentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUpdateShipmentId) return;

    try {
      const res = await fetch(`/api/shipments/${activeUpdateShipmentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatusVal,
          location: updateStatusLocation,
          description: updateStatusDescription
        })
      });

      if (res.ok) {
        addToast('Parcel status transitioned successfully!', 'success');
        setActiveUpdateShipmentId(null);
        setUpdateStatusLocation('');
        setUpdateStatusDescription('');
        fetchUserShipments();
      } else {
        addToast('Failed to modify shipment status.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to modify shipment status.', 'error');
    }
  };

  // Change Profile
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const updated = { ...currentUser, name: profileName, phone: profilePhone };
    localStorage.setItem('courier_user', JSON.stringify(updated));
    setCurrentUser(updated);
    setProfileSuccessMsg('Profile updated locally and credentials stored.');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('courier_user');
    setCurrentUser(null);
    setCurrentTab('home');
    setMobileMenuOpen(false);
  };

  // Preset mock logins helper
  const handleQuickLogin = (email: string, pass: string) => {
    setAuthEmail(email);
    setAuthPassword(pass);
    setAuthModal('login');
  };

  // --- CUSTOM Crazy Courier LOOK-ALIKE MERCHANT PORTAL ---
  if (currentUser && currentUser.role === 'merchant') {
    // Filter shipments based on search query in the top header
    const filteredShipments = shipments.filter(s => {
      const q = merchantTopSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        s.trackingNumber.toLowerCase().includes(q) ||
        (s.merchantRef && s.merchantRef.toLowerCase().includes(q)) ||
        s.receiverName.toLowerCase().includes(q) ||
        s.receiverAddress.toLowerCase().includes(q) ||
        s.receiverPhone.toLowerCase().includes(q)
      );
    });

    // Compute dynamic stats from current shipments
    const deliveryProcessingCount = shipments.filter(s => s.status === 'In Transit' || s.status === 'Pending' || s.status === 'Assigned').length;
    const codProcessingCount = shipments.filter(s => s.status === 'Delivered').length;
    const returnRequestsCount = shipments.filter(s => s.status === 'Returned' || s.status === 'Cancelled').length;

    const availableBalance = billingSummary?.availableBalance !== undefined 
      ? billingSummary.availableBalance 
      : (billingSummary?.codCollectedAmount ? (billingSummary.codCollectedAmount - billingSummary.payoutAmount) : 0);

    const totalEarned = billingSummary?.codEarned !== undefined 
      ? billingSummary.codEarned 
      : (billingSummary?.codCollectedAmount || 0);

    const totalWithdrawn = billingSummary?.totalPayoutsCollected !== undefined 
      ? billingSummary.totalPayoutsCollected 
      : (billingSummary?.payoutAmount || 0);

    return (
      <div className="min-h-screen bg-[#f4f6f8] flex text-slate-900 font-sans text-[13.5px] antialiased" id="Crazy Courier-merchant-portal">
        
        {/* LEFT SIDEBAR PANEL */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col transform ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
          id="Crazy Courier-merchant-sidebar"
        >
          {/* Main profile brand banner block */}
          <div className="p-6 border-b border-slate-55/60 flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#f4f6f8] flex items-center justify-center text-[#00a781] shadow-inner select-none">
              <div className="w-12 h-12 rounded-full bg-[#00a781]/15 flex items-center justify-center">
                <Truck className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-black text-[15px] text-slate-950 tracking-tight block max-w-[200px] truncate">
                {currentUser.companyName || 'Shotter Bazar'}
              </h3>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[11px] text-slate-900 font-black font-mono tracking-wide uppercase select-all">
                  ID: {currentUser.id ? currentUser.id.toUpperCase().slice(0, 8) : 'LMCIJEEY'}
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.id || 'LMCIJEEY');
                    alert('Merchant ID copied to clipboard !');
                  }}
                  title="Copy Merchant ID" 
                  className="p-1 hover:bg-slate-100 text-slate-700 hover:text-slate-950 rounded transition"
                >
                  <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>

          {/* MAIN MENU ITEMS LIST */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest pl-3 mb-2.5">Main Menu</p>
              <nav className="space-y-1.5" id="merchant-sidebar-nav">
                
                {/* 1. Dashboard Tab */}
                <button
                  onClick={() => { setMerchantSubView('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'dashboard' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Dashboard</span>
                </button>

                {/* 2. Add Parcel */}
                <button
                  onClick={() => { setMerchantSubView('add-parcel'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'add-parcel' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <PlusCircle className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Add Parcel</span>
                </button>

                {/* 3. Consignments List */}
                <button
                  onClick={() => { setMerchantSubView('consignments'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'consignments' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <FileText className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Consignments</span>
                </button>

                {/* 4. Fraud Check */}
                <button
                  onClick={() => { setMerchantSubView('fraud-check'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'fraud-check' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Fraud Check</span>
                </button>

                {/* 5. Add Fund */}
                <button
                  onClick={() => { setMerchantSubView('add-fund'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'add-fund' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Add Fund</span>
                </button>

                {/* 6. Pickup Requests */}
                <button
                  onClick={() => { setMerchantSubView('pickup'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'pickup' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Pickup Requests</span>
                </button>

                {/* 7. Pricing Estimation */}
                <button
                  onClick={() => { setMerchantSubView('pricing'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'pricing' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <DollarSign className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Pricing Calculator</span>
                </button>

                {/* 8. Bulk CSV Spreadsheet Upload */}
                <button
                  onClick={() => { setMerchantSubView('bulk-import'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'bulk-import' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <PlusCircle className="w-5 h-5 text-inherit stroke-[2.5] animate-pulse" />
                  <span>Bulk Import (CSV)</span>
                </button>

                {/* 9. Payouts Accounts / Cashouts */}
                <button
                  onClick={() => { setMerchantSubView('payouts'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'payouts' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <History className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Payments & Cashouts</span>
                </button>

                {/* 10. Helpdesk Support representative */}
                <button
                  onClick={() => { setMerchantSubView('support'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'support' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <HelpCircle className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Support Center</span>
                </button>

                {/* 11. Live SMTP/Mail logs */}
                <button
                  onClick={() => { setMerchantSubView('tracking'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 py-2.5 px-3.5 rounded-xl font-black text-[13px] transition text-left ${
                    merchantSubView === 'tracking' 
                      ? 'bg-[#00a781] text-white' 
                      : 'text-slate-900 hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <Mail className="w-5 h-5 text-inherit stroke-[2.5]" />
                  <span>Mail SMTP Logs</span>
                </button>

              </nav>
            </div>
          </div>

          {/* LOWER LOGOUT BLOCK */}
          <div className="p-4 border-t border-slate-50 space-y-2">
            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-205/60 text-[11px] space-y-1 text-slate-800">
              <p className="font-extrabold text-slate-950">Business Plan: Standard</p>
              <p className="font-bold">Active Hub: Dhaka Central Hub</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-black text-[12.5px] text-rose-700 hover:bg-rose-100 transition text-left"
            >
              <LogOut className="w-4 h-4 text-inherit stroke-[2.5]" />
              <span>Log Out Portal</span>
            </button>
          </div>
        </aside>

        {/* OVERLAY FOR MOBILE VIEW SIDEBAR TOGGLE */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden transition-opacity" 
            id="mobile-sidebar-backdrop"
          />
        )}

        {/* RIGHT HAND CONTENT SPACE */}
        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
          
          {/* TOP BAR DESKTOP HEADER */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-100 py-2.5 px-4 sm:py-3.5 sm:px-6 flex items-center justify-between gap-2" id="merchant-top-navbar">
            
            <div className="flex items-center gap-2">
              {/* Hamburger toggle on mobile */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 transition"
              >
                <Menu className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Authentic logo formatting matching Crazy Courier image */}
              <div className="flex items-center gap-1.5 sm:gap-2 select-none">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-55 flex items-center justify-center text-[#00a781]">
                  <Truck className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-sans font-black tracking-tight text-[15px] sm:text-[16px] italic text-[#00a781]">Crazy Courier</span>
                  <span className="font-sans font-black text-[13px] sm:text-[14px] text-slate-800 capitalize pl-1 hidden sm:inline-block">Courier</span>
                </div>
              </div>
            </div>

            {/* Middle: Search input labeled "Search Consignment" */}
            <div className="hidden md:flex items-center max-w-[400px] w-full bg-slate-100 border border-slate-300 rounded-full pl-5 pr-2 py-1.5 shadow-inner gap-2 focus-within:border-[#00a781]/80 focus-within:ring-1 focus-within:ring-[#00a781]/25 transition">
              <Search className="w-4 h-4 text-slate-500 stroke-[2.5]" />
              <input 
                id="merchant-consignment-main-search"
                type="text"
                placeholder="Search Consignment..."
                value={merchantTopSearch}
                onChange={(e) => {
                  setMerchantTopSearch(e.target.value);
                  // Auto redirect to consignments subview to easily see filter responses !
                  if (merchantSubView !== 'consignments') {
                    setMerchantSubView('consignments');
                  }
                }}
                className="bg-transparent text-slate-950 text-[12.5px] font-bold placeholder-slate-500 focus:outline-none w-full"
              />
              {merchantTopSearch && (
                <button onClick={() => setMerchantTopSearch('')} className="text-slate-500 hover:text-slate-900 font-extrabold font-sans text-xs">✕</button>
              )}
              <button 
                onClick={() => {
                  setIsScannerOpen(true);
                  if (merchantSubView !== 'consignments') {
                    setMerchantSubView('consignments');
                  }
                }}
                className="bg-white hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition ml-1"
                title="Scan Barcode"
              >
                <Scan className="w-3.5 h-3.5" /> Scan
              </button>
            </div>

            {/* Right: Currency Indicator & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              
              {/* "Check Balance" pill option */}
              <button 
                onClick={() => setMerchantSubView('payouts')}
                className="border-2 border-[#00a781] hover:bg-[#00a781]/10 bg-white rounded-full py-1.5 px-2.5 sm:py-2 sm:px-5 font-black text-[11px] sm:text-[12.5px] tracking-wide transition flex items-center gap-1 sm:gap-2 cursor-pointer text-[#00a781]"
                id="merchant-header-check-balance-btn"
              >
                <span className="hidden sm:inline-block">Check Balance</span>
                <span className="bg-[#00a781] text-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10.5px] sm:text-[11px] font-extrabold font-mono inline-block">
                  ${availableBalance.toFixed(2)}
                </span>
              </button>

              {/* Language Box */}
              <div className="bg-slate-100 border border-slate-300 py-1.5 px-2.5 sm:py-2 sm:px-3.5 rounded-lg text-[10px] sm:text-[11px] text-slate-950 font-black select-none hover:bg-slate-200 transition duration-150">
                EN
              </div>

              {/* Scan Barcode (Mobile Only / General Fast Access) */}
              <button 
                onClick={() => {
                  setIsScannerOpen(true);
                  if (merchantSubView !== 'consignments') setMerchantSubView('consignments');
                }}
                className="md:hidden relative py-1.5 px-1.5 sm:py-2 sm:px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-emerald-800 transition"
              >
                <Scan className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              </button>

              {/* Notification icon */}
              <button 
                onClick={() => setMerchantSubView('tracking')}
                className="relative py-1.5 px-1.5 sm:py-2 sm:px-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-950 transition"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#00a781] rounded-full" />
              </button>

              {/* Shopping Cart Icon Box */}
              <div 
                onClick={() => setMerchantSubView('consignments')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-950 cursor-pointer"
              >
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>

            </div>
          </header>

          {/* MAIN PAGE BODY */}
          <main className="flex-grow p-4 sm:p-6 space-y-6">

            {/* --- SUBVIEW: 1. DASHBOARD HOME (Crazy Courier BRAND SPECIFIC) --- */}
            {merchantSubView === 'dashboard' && (
              <div className="space-y-6 animate-fade-in" id="Crazy Courier-dashboard-home">
                
                {/* Header info bar (3 custom pills representing status in top margins) */}
                <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] font-semibold" id="Crazy Courier-status-indicators-bar">
                  
                  <div className="bg-white border border-slate-100 rounded-xl py-1.5 px-4 flex items-center gap-1.5 shadow-sm">
                    <span className="text-slate-500">Delivery Processing:</span>
                    <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px] font-sans">
                      {deliveryProcessingCount}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-xl py-1.5 px-4 flex items-center gap-1.5 shadow-sm">
                    <span className="text-slate-500">COD Processing:</span>
                    <span className="bg-[#00a781] text-white font-black px-1.5 py-0.5 rounded text-[10px] font-sans">
                      {codProcessingCount}
                    </span>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-xl py-1.5 px-4 flex items-center gap-1.5 shadow-sm">
                    <span className="text-slate-500">Return Requests:</span>
                    <span className="bg-rose-500 text-white font-black px-1.5 py-0.5 rounded text-[10px] font-sans">
                      {returnRequestsCount}
                    </span>
                  </div>

                </div>

                {/* MAIN ACTIONS GRID - ROW OF 6 CARDS WITH GRADIENT DECONSTRUCTED ICONS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4" id="Crazy Courier-action-six-grid">
                  
                  {/* Card 1: Add Parcel */}
                  <div 
                    onClick={() => setMerchantSubView('add-parcel')}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition duration-200 cursor-pointer"
                    id="action-card-add-parcel"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#eefbf7] flex items-center justify-center text-[#00a781]">
                      <Package className="w-6 h-6 text-inherit stroke-[2.5]" />
                    </div>
                    <span className="font-black text-slate-950 text-[13.5px] leading-tight">Add Parcel</span>
                  </div>

                  {/* Card 2: Pickup Request */}
                  <div 
                    onClick={() => setMerchantSubView('pickup')}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition duration-200 cursor-pointer"
                    id="action-card-pickup-request"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <Truck className="w-6 h-6 text-inherit stroke-[2.5]" />
                    </div>
                    <span className="font-black text-slate-950 text-[13.5px] leading-tight">Pickup Request</span>
                  </div>

                  {/* Card 3: Pick n Drop */}
                  <div 
                    onClick={() => {
                      alert('Pick n Drop service is fully simulated with automated geo-fenced coordinates standard routing. Please consult the list of shipments.');
                    }}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition duration-200 cursor-pointer"
                    id="action-card-pick-ndrop"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                      <MapPin className="w-6 h-6 text-inherit stroke-[2.5]" />
                    </div>
                    <span className="font-black text-slate-950 text-[13.5px] leading-tight">Pick n Drop</span>
                  </div>

                  {/* Card 4: Payment Request */}
                  <div 
                    onClick={() => setMerchantSubView('payouts')}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition duration-200 cursor-pointer"
                    id="action-card-payment-request"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-indigo-600">
                      <CreditCard className="w-6 h-6 text-inherit stroke-[2.5]" />
                    </div>
                    <span className="font-black text-slate-950 text-[13.5px] leading-tight">Payment Request</span>
                  </div>

                  {/* Card 5: Latest Entries */}
                  <div 
                    onClick={() => setMerchantSubView('consignments')}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition duration-200 cursor-pointer"
                    id="action-card-latest-entries"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <FileText className="w-6 h-6 text-inherit stroke-[2.5]" />
                    </div>
                    <span className="font-black text-slate-950 text-[13.5px] leading-tight">Latest Entries</span>
                  </div>

                  {/* Card 6: Support desk */}
                  <div 
                    onClick={() => setMerchantSubView('support')}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3 shadow-sm hover:shadow-md hover:scale-[1.03] transition duration-200 cursor-pointer"
                    id="action-card-support-desk"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                      <HelpCircle className="w-6 h-6 text-inherit stroke-[2.5]" />
                    </div>
                    <span className="font-black text-[#00a781] text-[13.5px] leading-tight">Support Desk</span>
                  </div>

                </div>

                {/* TEAL SECONDARY ACTION PILLS ROW */}
                <div className="bg-[#eefbf7] border-2 border-[#00a781]/40 p-2 rounded-2xl flex flex-wrap gap-2 text-[13px]" id="secondary-teal-pills-panel">
                  
                  <button 
                    onClick={() => setMerchantSubView('consignments')} 
                    className="flex-grow text-center font-black text-slate-900 bg-white hover:bg-slate-100 border-2 border-slate-250 rounded-xl py-2.5 px-4 transition active:scale-95"
                  >
                    Consignments
                  </button>

                  <button 
                    onClick={() => setMerchantSubView('payouts')} 
                    className="flex-grow text-center font-black text-slate-900 bg-white hover:bg-slate-100 border-2 border-slate-250 rounded-xl py-2.5 px-4 transition active:scale-95"
                  >
                    Payments
                  </button>

                  <button 
                    onClick={() => setMerchantSubView('bulk-import')} 
                    className="flex-grow text-center font-black text-[#00a781] bg-white hover:bg-[#eefbf7] border-2 border-[#00a781] rounded-xl py-2.5 px-4 transition active:scale-95"
                  >
                    Bulk Import (বাল্ক)
                  </button>

                  <button 
                    onClick={() => {
                      // Generate and export CSV order format
                      const csvData = "data:text/csv;charset=utf-8,TrackingNumber,Receiver,Phone,Status,Fee\n" + 
                        shipments.map(s => `${s.trackingNumber},${s.receiverName},${s.receiverPhone},${s.status},${s.price}`).join("\n");
                      const encodedUri = encodeURI(csvData);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `Crazy Courier_dispatches_${currentUser.id || 'LMCIJEEY'}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }} 
                    className="flex-grow text-center font-black text-slate-900 bg-white hover:bg-slate-100 border-2 border-slate-250 rounded-xl py-2.5 px-4 transition active:scale-95"
                  >
                    Export CSV Sheet
                  </button>

                  <button 
                    onClick={() => setMerchantSubView('pricing')} 
                    className="flex-grow text-center font-black text-slate-900 bg-white hover:bg-slate-100 border-2 border-slate-250 rounded-xl py-2.5 px-4 transition active:scale-95"
                  >
                    Shipping Price Stats
                  </button>

                  <button 
                    onClick={() => {
                      alert('Wallet COD collected amount can be requested for transfer using the Payments window instantly.');
                      setMerchantSubView('payouts');
                    }}
                    className="flex-grow text-center font-black text-slate-900 bg-white hover:bg-slate-100 border-2 border-slate-250 rounded-xl py-2.5 px-4 transition active:scale-95"
                  >
                    Amount Change
                  </button>

                </div>

                {/* SECURED FOUR HIGHLIGHTS CARD ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" id="merchant-four-pills">
                  
                  <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Pending Parcel</p>
                      <h4 className="text-xl font-black text-slate-800 mt-1">
                        {shipments.filter(s => s.status === 'Pending').length} Packages
                      </h4>
                    </div>
                    <span className="w-1.5 h-8 bg-amber-450 rounded-full" />
                  </div>

                  <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Today's Cancelled</p>
                      <h4 className="text-xl font-black text-slate-800 mt-1">
                        {shipments.filter(s => s.status === 'Cancelled').length} Cargo
                      </h4>
                    </div>
                    <span className="w-1.5 h-8 bg-rose-500 rounded-full" />
                  </div>

                  <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Latest Return</p>
                      <h4 className="text-xl font-black text-slate-800 mt-1">
                        {shipments.filter(s => s.status === 'Returned').length} Return
                      </h4>
                    </div>
                    <span className="w-1.5 h-8 bg-orange-500 rounded-full" />
                  </div>

                  <div className="bg-white border border-slate-150 p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Cancellation Requests</p>
                      <h4 className="text-xl font-black text-slate-800 mt-1">
                        {shipments.filter(s => s.status === 'Cancelled').length} Requests
                      </h4>
                    </div>
                    <span className="w-1.5 h-8 bg-[#00a781] rounded-full" />
                  </div>

                </div>

                {/* BENGALI PROMOTIONAL BANNER (PIXELAX INSPIRED) */}
                <div 
                  className="bg-gradient-to-r from-red-50 via-pink-100 to-rose-50 border border-pink-200/50 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                  id="bengali-packaging-promo-line"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-rose-500 text-white font-black text-[10px] py-1 px-2.5 rounded-lg uppercase tracking-wider select-none animate-pulse">
                      Pixelax Support
                    </span>
                    <p className="font-sans font-extrabold text-slate-800 text-[13px] md:text-[14px]">
                      প্যাকেজিং পলি, কার্টন স্কচটেপসহ যেকোনো প্যাকেজিং সাপোর্টের জন্য এখানে ক্লিক করুন
                    </p>
                  </div>
                  <button 
                    onClick={() => alert('Pixelax packaging materials portal is simulated. Free customized poly mailers are dispatched to physical addresses upon requesting bulk dispatches!')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10.5px] py-2 px-4.5 rounded-xl transition flex-shrink-0 cursor-pointer text-center"
                    id="pixelax-action-btn"
                  >
                    প্যাকেজিং অর্ডার করুন
                  </button>
                </div>

                {/* BOTTOM TWO HIGH FIDELITY PERFORMANCES CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Delivery Performance Histogram */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-black text-[13.5px] text-slate-800 tracking-tight">Delivery Performance</h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Dynamic sorting performance metrics</p>
                      </div>
                      <button 
                        onClick={() => alert('Sorting statistics up-to-date. Tracking 98.6% safe routing compliance on all active dispatches across Crazy Courier hubs.')}
                        className="bg-[#00a781] text-white hover:bg-[#00a672] font-extrabold py-1.5 px-3 rounded-lg text-[10.5px] transition"
                        id="view-graph-btn"
                      >
                        View Graph
                      </button>
                    </div>

                    {/* Responsive Simulated Bar Charts */}
                    <div className="h-40 flex items-end justify-between gap-1.5 pt-4 border-b border-slate-100" id="delivery-performance-histogram">
                      {[
                        { day: 'Mon', h: '65%' },
                        { day: 'Tue', h: '45%' },
                        { day: 'Wed', h: '90%' },
                        { day: 'Thu', h: '75%' },
                        { day: 'Fri', h: '30%' },
                        { day: 'Sat', h: '50%' },
                        { day: 'Sun', h: '88%' },
                        { day: 'Mon', h: '60%' },
                        { day: 'Tue', h: '95%' },
                        { day: 'Wed', h: '40%' },
                        { day: 'Thu', h: '80%' },
                        { day: 'Fri', h: '65%' }
                      ].map((bar, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                          {/* Hover stat tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 absolute pb-14 text-[9px] bg-slate-900 text-white font-mono rounded px-1.5 py-0.5 transition pointer-events-none select-none">
                            {bar.h}
                          </div>
                          
                          <div 
                            style={{ height: bar.h }} 
                            className="w-full bg-gradient-to-t from-[#00a781] to-[#4df0c3] rounded-t-md hover:opacity-85 shadow group-hover:shadow-[#000000]/10 transition-all duration-300"
                          />
                          <span className="text-[8px] md:text-[9px] text-slate-400 font-mono tracking-tight">{bar.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parcel Summary Wave Sparkline */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-black text-[13.5px] text-slate-800 tracking-tight">Parcel Summary</h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Historical dispatches trend logs</p>
                      </div>
                      <button 
                        onClick={() => alert('Summary log: Crazy Courier system processed an aggregate of ' + shipments.length + ' deliveries this term.')}
                        className="bg-[#00a781] text-white hover:bg-[#00a672] font-extrabold py-1.5 px-3 rounded-lg text-[10.5px] transition"
                        id="view-summary-btn"
                      >
                        View Summary
                      </button>
                    </div>

                    {/* Simulated Spline Line Graph via raw SVG path */}
                    <div className="h-40 flex flex-col justify-between pt-4" id="parcel-summary-trends-wave">
                      <div className="flex-grow relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00a781" stopOpacity="0.45" />
                              <stop offset="100%" stopColor="#00a781" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Filled Area */}
                          <path 
                            d="M 0 60 Q 50 15, 100 80 T 200 40 T 300 85 T 400 30 L 400 100 L 0 100 Z" 
                            fill="url(#waveGradient)" 
                          />
                          
                          {/* Continuous spline wave */}
                          <path 
                            d="M 0 60 Q 50 15, 100 80 T 200 40 T 300 85 T 400 30" 
                            fill="none" 
                            stroke="#00a781" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            className="animate-pulse"
                          />

                          {/* Scatter dots */}
                          <circle cx="100" cy="80" r="4.5" fill="#ffffff" stroke="#00a781" strokeWidth="2.5" />
                          <circle cx="200" cy="40" r="4.5" fill="#ffffff" stroke="#00a781" strokeWidth="2.5" />
                          <circle cx="300" cy="85" r="4.5" fill="#ffffff" stroke="#00a781" strokeWidth="2.5" />
                          <circle cx="400" cy="30" r="4.5" fill="#ffffff" stroke="#00a781" strokeWidth="2.5" />
                        </svg>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-50">
                        <span>W01</span>
                        <span>W12</span>
                        <span>W24</span>
                        <span>W36</span>
                        <span>W48</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* INLINE ACTIVE SHIPMENTS TRACKER TABLE FOR THE DASHBOARD */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden" id="dashboard-recent-shipments-block">
                  <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-[13px] flex items-center gap-1.5">
                        <History className="w-4.5 h-4.5 text-emerald-600" />
                        Active Consignments Map & Tracking
                      </h4>
                      <p className="text-[10px] text-slate-400">Total associated shipments database logs</p>
                    </div>
                    <button 
                      onClick={() => setMerchantSubView('consignments')} 
                      className="text-xs text-[#00a781] font-bold hover:underline"
                    >
                      Maximize Consignments List ({shipments.length})
                    </button>
                  </div>

                  {shipments.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-[11px] font-semibold space-y-2">
                      <p>No parcels configured under this merchant account.</p>
                      <button 
                        onClick={() => setMerchantSubView('add-parcel')} 
                        className="bg-[#00a781] text-white py-1.5 px-4 rounded-xl text-[10px] font-bold hover:opacity-90"
                      >
                        Create Your First Parcel
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[12.5px] min-w-[650px]">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-250 text-slate-950 font-black uppercase tracking-wider text-[11px]">
                            <th className="p-4 pl-6">Tracking ID</th>
                            <th className="p-4">Receiver</th>
                            <th className="p-4">Hub Slot</th>
                            <th className="p-4">Delivery Charge</th>
                            <th className="p-4">Status Map</th>
                            <th className="p-4 text-right pr-6">Quick Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-900">
                          {shipments.slice(0, 5).map(s => (
                            <tr key={s.id} className="hover:bg-slate-100/60 transition border-b border-slate-100">
                              <td className="p-4 pl-6">
                                <span className="font-black text-slate-950 font-mono block tracking-tight select-all text-[13px]">{s.trackingNumber}</span>
                                {s.merchantRef && <span className="text-[10px] text-[#00a781] font-black font-mono bg-emerald-50 px-1.5 py-0.5 rounded">Ref: {s.merchantRef}</span>}
                              </td>
                              <td className="p-4">
                                <p className="font-black text-slate-950 text-[13px]">{s.receiverName}</p>
                                <p className="text-[11px] text-slate-600 truncate max-w-[150px] font-medium">{s.receiverAddress}</p>
                              </td>
                              <td className="p-4 text-slate-900 font-extrabold">{s.deliveryHub || 'Dhaka Central Hub'}</td>
                              <td className="p-4 text-slate-950 font-black font-mono text-[13px]">${s.price.toFixed(2)}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded text-[10.5px] font-black uppercase tracking-wider ${
                                  s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                  s.status === 'Cancelled' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                                  s.status === 'Returned' ? 'bg-slate-150 text-slate-900 border border-slate-350' :
                                  'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <button 
                                  onClick={() => { setMerchantSubView('consignments'); }} 
                                  className="text-white bg-slate-950 hover:bg-black font-black px-4 py-1.5 rounded-xl text-[11px] uppercase tracking-wider transition"
                                >
                                  Track Log
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* --- SUBVIEW: 2. ADD PARCEL CARGO CLIENT DESK --- */}
            {merchantSubView === 'add-parcel' && (
              <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in" id="add-parcel-subview">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-[#eefbf7] text-[#00a781] rounded-lg">
                    <PlusCircle className="w-5 h-5 text-inherit" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Add New Consignment Parcel</h3>
                    <p className="text-[10.5px] text-slate-500">Route individual package dispatches in real-time</p>
                  </div>
                </div>

                <form onSubmit={handleMerchantCreateShipment} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Receiver Name</label>
                      <input 
                        id="merchant-receiver-name-sidebar"
                        type="text" 
                        required 
                        placeholder="e.g. Shoriful Islam"
                        value={merchantReceiverName}
                        onChange={(e) => setMerchantReceiverName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Receiver Email</label>
                      <input 
                        id="merchant-receiver-email-sidebar"
                        type="email" 
                        required 
                        placeholder="e.g. customer@domain.com"
                        value={merchantReceiverEmail}
                        onChange={(e) => setMerchantReceiverEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Receiver Phone Number</label>
                      <input 
                        id="merchant-receiver-phone-sidebar"
                        type="text" 
                        required 
                        placeholder="e.g. +880 1712-345678"
                        value={merchantReceiverPhone}
                        onChange={(e) => setMerchantReceiverPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Parcel Cargo Weight (kg)</label>
                      <input 
                        id="merchant-weight-sidebar"
                        type="number" 
                        required 
                        min="0.1" 
                        step="0.1"
                        value={merchantWeight}
                        onChange={(e) => setMerchantWeight(parseFloat(e.target.value) || 1.0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Delivery Sorting Hub Slot</label>
                      <select 
                        id="merchant-hub-sidebar"
                        value={merchantDeliveryHub}
                        onChange={(e) => setMerchantDeliveryHub(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] text-slate-700 transition"
                      >
                        <option value="Dhaka Central Hub">Dhaka Central Hub (প্রধান শাখা)</option>
                        <option value="Chittagong Sorting Hub">Chittagong Sorting Hub</option>
                        <option value="Rajshahi Sorting Hub">Rajshahi Sorting Hub</option>
                        <option value="Sylhet Cargo Depot">Sylhet Cargo Depot</option>
                        <option value="Khulna Outpost Terminal">Khulna Outpost Terminal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Merchant Custom Reference ID</label>
                      <input 
                        id="merchant-ref-sidebar"
                        type="text" 
                        placeholder="e.g. APEX-INV-99"
                        value={merchantRef}
                        onChange={(e) => setMerchantRef(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Full Destination Address</label>
                    <textarea 
                      id="merchant-address-sidebar"
                      required 
                      rows={2}
                      placeholder="e.g. Sector 4, Road 12, Plot 14, Uttara, Dhaka, 1230"
                      value={merchantReceiverAddress}
                      onChange={(e) => setMerchantReceiverAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] transition"
                    />
                  </div>

                  {merchantShipError && (
                    <p className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold">{merchantShipError}</p>
                  )}
                  {shipmentCreateSuccess && (
                    <p className="p-3 bg-[#eefbf7] text-[#00a781] border border-[#00a781]/20 rounded-lg font-bold">{shipmentCreateSuccess}</p>
                  )}

                  <button 
                    id="submit-merchant-parcel-btn"
                    type="submit"
                    className="w-full bg-[#00a781] hover:bg-[#009270] text-white font-extrabold h-11 rounded-xl transition cursor-pointer text-center text-xs uppercase"
                  >
                    Confirm & Dispatch Cargo Consignment
                  </button>
                </form>
              </div>
            )}

            {/* --- SUBVIEW: 3. CONSIGNMENTS TRACKER COMPLETE DATASHEET --- */}
            {merchantSubView === 'consignments' && (
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden animate-fade-in" id="merchant-consignments-subview">
                
                <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-[13.5px] flex items-center gap-1.5">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Historical Consignments & Tracking Map
                    </h3>
                    <p className="text-[10px] text-slate-400">Manage, view, print barcodes, and simulate tracking lifecycle updates</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={fetchUserShipments} 
                      className="text-[11px] font-bold text-[#00a781] bg-white border border-slate-200 rounded-lg px-3 py-1.5 transition"
                    >
                      Reload Map Feeds
                    </button>
                  </div>
                </div>

                {filteredShipments.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 font-semibold space-y-3">
                    <p>No parcels match your lookup parameters.</p>
                    {merchantTopSearch && (
                      <button 
                        onClick={() => setMerchantTopSearch('')} 
                        className="bg-slate-900 text-white font-bold py-1.5 px-4 rounded-xl text-[10px]"
                      >
                        Clear Search Filter
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[850px]" id="consignments-datasheet-table">
                      <thead>
                        <tr className="bg-slate-55/40 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="p-4 pl-6">Tracking ID</th>
                          <th className="p-4">Receiver Data</th>
                          <th className="p-4">Hub & Weight</th>
                          <th className="p-4">Charge & COD</th>
                          <th className="p-4">Delivery Status</th>
                          <th className="p-4 text-right pr-6">Logistics Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {filteredShipments.map(s => {
                          const routeSimulating = activeGeoTrackingId === s.id;
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition">
                              
                              <td className="p-4 pl-6">
                                <span className="font-bold text-slate-900 font-mono text-[11.5px] block select-all tracking-tight">
                                  {s.trackingNumber}
                                </span>
                                {s.merchantRef && (
                                  <span className="text-[9px] bg-emerald-50 text-[#00a781] font-bold font-mono px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    Ref: {s.merchantRef}
                                  </span>
                                )}
                              </td>

                              <td className="p-4 space-y-0.5">
                                <p className="font-extrabold text-slate-800">{s.receiverName}</p>
                                <p className="text-[9.5px] text-slate-400 font-mono">{s.receiverPhone}</p>
                                <p className="text-[9.5px] text-slate-400 truncate max-w-[200px]">{s.receiverAddress}</p>
                              </td>

                              <td className="p-4 space-y-0.5">
                                <p className="font-semibold text-slate-600">{s.deliveryHub || 'Dhaka Central Hub'}</p>
                                <p className="text-[10px] text-slate-400 font-mono font-semibold uppercase">{s.weight} kg cargo</p>
                              </td>

                              <td className="p-4 space-y-0.5">
                                <p className="font-black text-slate-900 font-mono">${s.price.toFixed(2)} Fee</p>
                                <p className="text-[9.5px] font-bold text-slate-450 uppercase">{s.paid ? '✓ Paid' : 'Pending COD payout'}</p>
                              </td>

                              <td className="p-4">
                                <div className="space-y-1">
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider ${
                                    s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    s.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                                    s.status === 'Returned' ? 'bg-slate-100 text-slate-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {s.status}
                                  </span>
                                  {s.deliveredAt && (
                                    <p className="text-[8px] text-slate-400 font-mono">Completed: {new Date(s.deliveredAt).toLocaleDateString()}</p>
                                  )}
                                </div>
                              </td>

                              <td className="p-4 text-right pr-6 space-x-1.5">
                                
                                {/* Simulate GPS */}
                                {s.status !== 'Delivered' && s.status !== 'Cancelled' && s.status !== 'Returned' && (
                                  <button
                                    onClick={() => {
                                      // Toggle simulation
                                      if (routeSimulating) {
                                        setActiveGeoTrackingId(null);
                                        if (gpsSimTimer) clearInterval(gpsSimTimer);
                                      } else {
                                        setActiveGeoTrackingId(s.id);
                                        setGpsSimProgress(5);
                                        setGpsSimSpeed(42);
                                        setGpsSimTraffic('Medium traffic load');
                                        
                                        const timer = setInterval(() => {
                                          setGpsSimProgress(p => {
                                            if (p >= 100) {
                                              clearInterval(timer);
                                              return 100;
                                            }
                                            return p + 20;
                                          });
                                        }, 1500);
                                        setGpsSimTimer(timer);
                                      }
                                    }}
                                    className={`font-bold px-2.5 py-1 rounded transition text-[9px] ${
                                      routeSimulating 
                                        ? 'bg-rose-150 text-rose-800 animate-pulse' 
                                        : 'bg-emerald-50 text-[#00a781] hover:bg-emerald-100'
                                    }`}
                                  >
                                    {routeSimulating ? 'Pause Route' : 'Simulate GPS Route'}
                                  </button>
                                )}

                                {/* Print Label helper */}
                                <button
                                  onClick={() => {
                                    setPrintedShipment(s);
                                    window.print();
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-2.5 py-1 rounded text-[9px] inline-flex items-center gap-1 transition"
                                >
                                  <Printer className="w-3 h-3" /> Label
                                </button>

                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* --- SUBVIEW: 4. FRAUD CHECK RECIPIENT PROFILER --- */}
            {merchantSubView === 'fraud-check' && (
              <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in" id="fraud-check-subview">
                
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-inherit" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Crazy Courier Fraud Check Recipient Profiler</h3>
                    <p className="text-[10.5px] text-slate-500">Analyze receiver delivery return history from all nationwide logistics databases</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 leading-normal space-y-1">
                  <p className="font-extrabold text-slate-800">Why use Fraud Check? (ফ্রড চেক কেন ব্যবহার করবেন?)</p>
                  <p className="text-slate-500 text-[10px]">
                    Crazy Courier tracks aggregate delivery behaviors. If a recipient repeatedly fails to accept COD orders or has high return metrics with other merchants, we flag it so you can preserve shipment fees.
                  </p>
                </div>

                <form onSubmit={handleFraudCheck} className="space-y-4">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Recipient Contact Phone Number</label>
                    <div className="flex gap-2">
                      <input 
                        id="fraud-phone-input"
                        type="text" 
                        required 
                        placeholder="e.g. 01712345678"
                        value={fraudCheckPhone}
                        onChange={(e) => setFraudCheckPhone(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-rose-500 text-xs font-mono font-bold"
                      />
                      <button 
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-6 rounded-xl transition text-[11px] cursor-pointer"
                      >
                        Analyze Profile
                      </button>
                    </div>
                  </div>
                </form>

                {fraudCheckedResult && (
                  <div className="p-5 rounded-2xl border bg-slate-50/50 space-y-3.5" id="fraud-analytics-result">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-150">
                      <span className="font-bold text-slate-700">Database Lookup Response:</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[9.5px] ${
                        fraudCheckedResult.status === 'Safe' ? 'bg-emerald-100 text-emerald-800' :
                        fraudCheckedResult.status === 'Medium Risk' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800 animate-bounce'
                      }`}>
                        {fraudCheckedResult.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-150">
                        <span className="block text-slate-400 font-bold text-[9px] uppercase">Failure Rate</span>
                        <h4 className="text-base font-black text-rose-600 mt-1">{fraudCheckedResult.ratio}</h4>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-150">
                        <span className="block text-slate-400 font-bold text-[9px] uppercase">Completed Parcels</span>
                        <h4 className="text-base font-black text-slate-800 mt-1">{fraudCheckedResult.completed} DB items</h4>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-150">
                        <span className="block text-slate-400 font-bold text-[9px] uppercase">Returns Logged</span>
                        <h4 className="text-base font-black text-slate-800 mt-1">{fraudCheckedResult.cancelled} Returns</h4>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed italic">
                      <strong>Automated Advice:</strong><br/>
                      {fraudCheckedResult.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* --- SUBVIEW: 5. ADD FUND CONSOLE --- */}
            {merchantSubView === 'add-fund' && (
              <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in" id="add-fund-subview">
                
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-[#eefbf7] text-[#00a781] rounded-lg">
                    <CreditCard className="w-5 h-5 text-inherit" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Deposit Funds (Simulated Wallet Depot)</h3>
                    <p className="text-[10.5px] text-slate-500">Inject custom simulated balances into your merchant account instantly</p>
                  </div>
                </div>

                <form onSubmit={handleAddFunds} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Deposit Sum (USD)</label>
                    <input 
                      id="fund-amount-input"
                      type="number" 
                      required 
                      min="1"
                      step="any"
                      placeholder="e.g. 250"
                      value={fundAmountInput}
                      onChange={(e) => setFundAmountInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Payment Method Gateway</label>
                    <select
                      id="fund-method"
                      value={fundMethod}
                      onChange={(e) => setFundMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781] text-slate-700 transition"
                    >
                      <option value="bKash">bKash Merchant Sandbox (বিকাশ)</option>
                      <option value="Nagad">Nagad personal (নগদ)</option>
                      <option value="VisaCard">Standard Credit Card Gateway</option>
                      <option value="Rocket">Rocket Pay (রকেট)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Transaction ID / Reference (Optional)</label>
                    <input 
                      id="fund-reference"
                      type="text" 
                      placeholder="e.g. TXN-991823A"
                      value={fundReference}
                      onChange={(e) => setFundReference(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781]"
                    />
                  </div>

                  {fundSuccessMsg && (
                    <p className="p-3 bg-[#eefbf7] text-[#00a781] border border-[#00a781]/20 rounded-lg font-bold leading-normal text-[10.5px]">
                      {fundSuccessMsg}
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-[#00a781] hover:bg-[#009270] text-white font-extrabold py-2.5 rounded-xl transition text-[11px] uppercase text-center"
                    id="submit-fund-btn"
                  >
                    Simulate Fund Ingress
                  </button>
                </form>
              </div>
            )}

            {/* --- SUBVIEW: 6. PICKUP REQUESTS WINDOW --- */}
            {merchantSubView === 'pickup' && (
              <div className="max-w-xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in" id="pickup-requests-subview">
                
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Calendar className="w-5 h-5 text-inherit" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Request Package Pickup Courier</h3>
                    <p className="text-[10.5px] text-slate-500">Request a Crazy Courier dispatch rider to collect packages from your base location</p>
                  </div>
                </div>

                <form onSubmit={handleSchedulePickup} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Pickup Logistics Time slot</label>
                      <input 
                        id="pickup-time"
                        type="datetime-local" 
                        required 
                        value={pickupTimeInput}
                        onChange={(e) => setPickupTimeInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Associated Parcel Load count</label>
                      <input 
                        id="pickup-count"
                        type="number" 
                        required 
                        min="1"
                        placeholder="e.g. 5 packages pending"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Specific Collection Physical Address</label>
                    <input 
                      id="pickup-address"
                      type="text" 
                      required 
                      placeholder="e.g. Shotter Bazar Inventory, Mirpur 12 near bKash booth, Dhaka"
                      value={pickupAddressInput}
                      onChange={(e) => setPickupAddressInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Collector Dispatch Instructions</label>
                    <textarea 
                      id="pickup-notes"
                      rows={2}
                      placeholder="Please call 10 minutes earlier. Keep extra shipping vouchers handy..."
                      value={pickupNotesInput}
                      onChange={(e) => setPickupNotesInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-amber-500 animate-fade-in"
                    />
                  </div>

                  {pickupSuccessMsg && (
                    <p className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-bold leading-normal text-[10.5px]">
                      {pickupSuccessMsg}
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-amber-550 hover:bg-amber-600 text-white font-extrabold py-2.5 rounded-xl transition text-[11px] uppercase cursor-pointer text-center"
                    id="submit-pickup-btn"
                  >
                    Schedule Dispatch Rider Arrival
                  </button>
                </form>
              </div>
            )}

            {/* --- SUBVIEW: 7. SHIPPING PRICING CALCULATOR --- */}
            {merchantSubView === 'pricing' && (
              <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in" id="pricing-subview">
                
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-[#eefbf7] text-[#00a781] rounded-lg">
                    <DollarSign className="w-5 h-5 text-inherit" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Crazy Courier Shipping Rates Estimator</h3>
                    <p className="text-[10.5px] text-slate-500">Calculate delivery fees and cash on delivery commission percentages</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Destination Area</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setCalcLocation('inside')}
                        className={`py-2 px-4 rounded-xl font-bold transition border ${
                          calcLocation === 'inside' 
                            ? 'bg-[#eefbf7] border-[#00a781] text-[#00a781]' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Inside Dhaka ($1.50)
                      </button>
                      <button 
                        onClick={() => setCalcLocation('outside')}
                        className={`py-2 px-4 rounded-xl font-bold transition border ${
                          calcLocation === 'outside' 
                            ? 'bg-[#eefbf7] border-[#00a781] text-[#00a781]' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Outside Dhaka ($3.00)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1 uppercase tracking-wider">Estimated Cargo Weight ({calcWeight} kg)</label>
                    <input 
                      type="range"
                      min="0.5"
                      max="15"
                      step="0.5"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(parseFloat(e.target.value) || 1)}
                      className="w-full accent-[#00a781] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between font-mono text-[9px] text-slate-400 mt-1">
                      <span>0.5 kg</span>
                      <span>5.0 kg</span>
                      <span>10.0 kg</span>
                      <span>15.0 kg</span>
                    </div>
                  </div>

                  {/* Pricing Result */}
                  <div className="p-4 rounded-xl bg-slate-55/65 border border-slate-100/60 leading-normal space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Baseline delivery support:</span>
                      <span className="font-extrabold text-slate-800 font-mono">
                        ${calcLocation === 'inside' ? '1.50' : '3.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">Weight surcharge (+$0.50 per kg over 1kg):</span>
                      <span className="font-extrabold text-slate-800 font-mono">
                        ${calcWeight > 1 ? ((calcWeight - 1) * 0.5).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div className="border-t border-slate-150 pt-2 flex justify-between font-bold text-slate-800">
                      <span>Estimated Logistics Fee:</span>
                      <span className="text-base text-[#00a781] font-black font-mono">
                        ${(calcLocation === 'inside' ? 1.50 : 3.00 + (calcWeight > 1 ? (calcWeight - 1) * 0.5 : 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- SUBVIEW: 8. BULK SPREADSHEETS IMPORT --- */}
            {merchantSubView === 'bulk-import' && (
              <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in" id="merchant-bulk-csv-card-subview">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    💼 CSV Bulk Import Desk (বাল্ক পার্সেল আপলোড)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Upload a series of merchant deliveries in one action</p>
                </div>

                <form onSubmit={handleBulkCSVImport} className="space-y-3 text-xs">
                  <textarea 
                    rows={6}
                    placeholder="Receiver Name, Receiver Email, Receiver Phone, Receiver Address, Weight, Hub, Notes"
                    value={bulkCSV}
                    onChange={(e) => setBulkCSV(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#00a781] font-mono text-[9px] p-2.5 rounded-lg focus:ring-1 focus:ring-[#00a781]/30"
                  />
                  
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={loadDemoCSVData}
                      className="bg-[#eefbf7] hover:bg-[#e4faf2] text-[#00a781] font-bold px-3 py-2 rounded-xl text-[10px] transition"
                    >
                      ⚡ Load 5 Demo Orders
                    </button>
                    
                    <button 
                      type="submit"
                      disabled={bulkImportLoading}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-xl text-[10px] transition text-center"
                    >
                      {bulkImportLoading ? 'Generating...' : 'Bulk-Register Orders'}
                    </button>
                  </div>
                  
                  {bulkImportError && <p className="text-[10px] text-rose-650 font-bold p-1 bg-rose-50 rounded">{bulkImportError}</p>}
                  {bulkImportSuccess && <p className="text-[10px] text-[#00a781] font-bold p-1 bg-[#eefbf7] rounded">{bulkImportSuccess}</p>}
                </form>
              </div>
            )}

            {/* --- SUBVIEW: 9. PAYOUTS WALLET / CASHOUT LEDGER --- */}
            {merchantSubView === 'payouts' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="merchant-payouts-subview">
                
                {/* Left: Withdraw balance card */}
                <div className="md:col-span-1 bg-gradient-to-br from-[#0c2a21] to-[#004a37] text-white rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="space-y-1">
                    <p className="text-[9px] text-[#4df0c3] uppercase font-black tracking-widest leading-none">COD Collection balance</p>
                    <h4 className="text-3xl font-black mt-1 text-white font-mono leading-none">
                      ${availableBalance.toFixed(2)}
                    </h4>
                    <span className="inline-block mt-2 text-[9px] font-bold font-mono px-2 py-0.5 bg-white/10 rounded">
                      Wallet Secured
                    </span>
                  </div>
                  
                  <div className="pt-2.5 border-t border-white/10 text-[10px] flex justify-between text-[#8beed2]">
                    <p>Earned: <span className="font-extrabold text-white">${totalEarned.toFixed(2)}</span></p>
                    <p>Withdrawn: <span className="font-extrabold text-white">${totalWithdrawn.toFixed(2)}</span></p>
                  </div>

                  {/* Cashout withdraw form */}
                  <form onSubmit={handleRequestPayout} className="space-y-3.5 pt-3 text-xs text-slate-800">
                    <p className="font-bold text-[10px] text-white tracking-widest uppercase">Instant Cashout Request</p>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number"
                          step="any"
                          required
                          placeholder="Sum ($)"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none placeholder-slate-400 text-xs font-mono font-bold"
                        />
                        <select 
                          value={payoutMethod}
                          onChange={(e) => setPayoutMethod(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-1 focus:outline-none text-slate-700 font-bold"
                        >
                          <option value="bKash">bKash (বিকাশ)</option>
                          <option value="Nagad">Nagad (নগদ)</option>
                          <option value="Rocket">Rocket (রকেট)</option>
                          <option value="Bank">Bank standard</option>
                        </select>
                      </div>

                      <input 
                        type="text"
                        required
                        placeholder="Recipient Phone / Bank Account details"
                        value={payoutAccount}
                        onChange={(e) => setPayoutAccount(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none placeholder-slate-400 text-xs"
                      />
                    </div>

                    {payoutError && <p className="text-[10px] text-rose-350 bg-rose-950/40 p-2 rounded-lg font-bold">{payoutError}</p>}
                    {payoutSuccess && <p className="text-[10px] text-emerald-350 bg-emerald-950/40 p-2 rounded-lg font-bold">{payoutSuccess}</p>}

                    <button 
                      type="submit"
                      disabled={payoutLoading}
                      className="w-full bg-[#00a781] hover:bg-[#009270] text-white font-extrabold py-2.5 rounded-xl transition text-[11px] uppercase tracking-wide cursor-pointer text-center"
                    >
                      {payoutLoading ? 'Ledgerting...' : 'Request Balance Withdrawal'}
                    </button>
                  </form>
                </div>

                {/* Right: Historical Withdrawals Logs */}
                <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-xs space-y-4">
                  <p className="font-extrabold text-slate-800 pb-2 border-b border-slate-100 uppercase tracking-widest text-[9.5px]">Historical payouts ledger logs</p>
                  
                  {merchantPayouts.length === 0 ? (
                    <div className="p-12 text-center text-slate-450 font-semibold space-y-1">
                      <p>No historical withdrawals dispatched yet.</p>
                      <p className="text-[10px] text-slate-400">COD earnings accumulate automatically whenever riders complete delivery drops!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50 overflow-y-auto max-h-[300px]">
                      {merchantPayouts.map((pt, idx) => (
                        <div key={idx} className="py-2.5 first:pt-0 flex justify-between items-center text-[11.5px]">
                          <div>
                            <p className="font-bold text-slate-800">{pt.paymentMethod} • Withdraw Cash Out</p>
                            <p className="text-[9px] text-slate-400 font-mono">Account Phone: {pt.accountNo}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-900 font-mono">${pt.amount.toFixed(2)}</p>
                            <p className="text-[9px] text-emerald-600 font-bold font-sans">✓ Released approved</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* --- SUBVIEW: 10. HELPDESK SUPPORT SYSTEM --- */}
            {merchantSubView === 'support' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="merchant-support-subview">
                
                {/* Left Side: Submit ticket form */}
                <div className="md:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-xs space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-widest text-[9.5px]">Submit Helpdesk Ticket</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Corporate business / COD collection priority lines</p>
                  </div>

                  <form onSubmit={handleCreateSupportTicket} className="space-y-4">
                    
                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Associated Package ID</label>
                      <select 
                        value={ticketTrackingNumber}
                        onChange={(e) => setTicketTrackingNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-[#00a781]"
                      >
                        <option value="">General Corporate Business Inquiry</option>
                        {shipments.map(s => (
                          <option key={s.id} value={s.trackingNumber}>
                            TRK No: {s.trackingNumber} ({s.receiverName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Inquiry Subject</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. COD balance collection payout delay verification"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-[#00a781]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider">Detailed Description</label>
                      <textarea 
                        required 
                        rows={3} 
                        placeholder="Please write down account reference data or batch tracking notes..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-[#00a781]"
                      />
                    </div>

                    {ticketCreateError && <p className="text-rose-650 font-bold p-1">{ticketCreateError}</p>}
                    {ticketCreateSuccess && <p className="text-[#00a781] font-bold p-1">{ticketCreateSuccess}</p>}

                    <button 
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl transition text-[11px] text-center uppercase"
                    >
                      File High-Priority Ticket
                    </button>

                  </form>
                </div>

                {/* Right Side: Open support history */}
                <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-xs space-y-4">
                  <p className="font-extrabold text-slate-800 pb-2 border-b border-slate-100 uppercase tracking-widest text-[9.5px]">Active helpdesk tickets history</p>
                  
                  {supportTickets.length === 0 ? (
                    <div className="p-16 text-center text-slate-450 font-semibold leading-relaxed">
                      <p>No support tickets filed historically.</p>
                      <p className="text-slate-400 text-[10px]">Merchant helpdesk queries are auto-prioritized by enterprise customer care bots.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[350px] overflow-y-auto divide-y divide-slate-100">
                      {supportTickets.map(t => (
                        <div key={t.id} className="pt-3 first:pt-0 space-y-2 text-xs" id={`corporate-ticket-${t.id}`}>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  t.status === 'Open' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {t.status}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                  Track Id: {t.trackingNumber || 'General'}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-slate-800 mt-1">{t.subject}</h4>
                            </div>
                            <span className="text-[9.5px] text-slate-404 font-mono">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-[10.5px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-normal">
                            <strong>My Query Message:</strong><br/>
                            {t.message}
                          </p>

                          {t.replyMessage ? (
                            <div className="bg-[#eefbf7] border border-[#00a781]/15 p-2.5 rounded-lg space-y-0.5 leading-normal">
                              <p className="font-bold text-[#00a781] text-[10px] uppercase">Corporate Desk Representative Reply:</p>
                              <p className="text-[10.5px] text-slate-700 italic">"{t.replyMessage}"</p>
                              <p className="text-[8.5px] text-[#008f6d] font-semibold text-right">Answered by {t.repliedBy || 'Crazy Courier Rep'} on {t.repliedAt ? new Date(t.repliedAt).toLocaleDateString() : 'Today'}</p>
                            </div>
                          ) : (
                            <p className="text-[9px] text-amber-600 font-bold tracking-wide animate-pulse">● Ticket queued linked with priority queue logistics desk.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* --- SUBVIEW: 11. MAIL / TRACKING ALERTS OVERVIEW --- */}
            {merchantSubView === 'tracking' && (
              <div className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-6.5 shadow-sm space-y-5 animate-fade-in" id="merchant-smtp-logs-subview">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Active SMTP Mail Track Alert Feeds</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Real-time simulation logs for customer automatic mail notifications</p>
                  </div>
                  <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded leading-none uppercase text-[8.5px]">SMTP active</span>
                </div>

                <div className="bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-[9.5px] space-y-1.5 shadow-inner leading-relaxed overflow-y-auto max-h-[300px]">
                  <p className="text-[#8beed2]">Checking dispatch alert records...</p>
                  <p className="text-slate-500">// Simulated Swift SMTP Delivery Gateway active</p>
                  <p className="text-emerald-500">SMTP: Connected safely to smtps://mail.crazycourier.com:465</p>
                  <p className="text-emerald-500">SMTP: Authenticated as merchant ID {currentUser.id?.toUpperCase().slice(0, 8)}</p>
                  {shipments.map((s, idx) => (
                    <div key={idx} className="border-t border-slate-800/80 pt-1.5 mt-1.5 space-y-0.5 text-[9px]">
                      <p className="text-slate-400">MAIL ID: alert-{s.trackingNumber.toLowerCase()}@crazycourier.com</p>
                      <p className="text-emerald-300">↳ TO: {s.receiverEmail} [{s.receiverName}]</p>
                      <p className="text-[#8beed2]">↳ SUBJECT: Courier Cargo alert {s.trackingNumber} status updated to [{s.status}]</p>
                      <p className="text-slate-500">↳ STATUS: Simulated SMTP relay successfully dispatched</p>
                    </div>
                  ))}
                  {shipments.length === 0 && (
                    <p className="text-slate-500 italic mt-2">No active alerts dispatched. Generate a shipment to test auto alerts!</p>
                  )}
                </div>
              </div>
            )}

          </main>

          {/* FOOTER DESK */}
          <footer className="py-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono select-none mt-auto">
            © 2026 Crazy Courier. All rights reserved
          </footer>

          {isScannerOpen && (
            <BarcodeScanner 
              onScan={(decodedText) => { 
                setDashboardSearchQuery(decodedText); 
                setMerchantTopSearch(decodedText); 
                setIsScannerOpen(false); 
                addToast('Barcode scan successful', 'success'); 
              }} 
              onClose={() => setIsScannerOpen(false)} 
            />
          )}
          {renderToasts()}

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-800 max-w-full overflow-x-hidden" id="courier-service-app">
      
      {/* Sliding text added per feature request - Full Width */}
      <div className="w-full overflow-hidden bg-[#00a781]/10 border-b border-[#00a781]/20 py-2.5 shadow-sm" id="environment-info-rail">
        <p className="text-[#00a781] px-4 font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] font-bold inline-block animate-marquee w-fit whitespace-nowrap min-w-full">
          📦 WELCOME TO Crazy Courier COURIER LOGISTICS • FASTEST DELIVERY NETWORK • SECURE PAYMENTS • REAL-TIME TRACKING • SUPPORT CENTER ENABLED 🚀
        </p>
      </div>

      {/* Main Header / Navigation */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 transition-all shadow-sm" id="main-site-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" id="brand-logo-section" onClick={() => setCurrentTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Truck className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Crazy Courier</span>
              <p className="text-[10px] tracking-wider text-slate-400 font-mono uppercase">Logistics Core</p>
            </div>
          </div>

          {/* Desktop Navigation Paths */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600" id="desktop-nav-items">
            <button 
              id="nav-home"
              onClick={() => setCurrentTab('home')} 
              className={`px-3 py-2 rounded-lg transition ${currentTab === 'home' ? 'bg-slate-100 text-slate-950' : 'hover:bg-slate-50 hover:text-slate-950'}`}
            >
              Home Service
            </button>
            {currentUser && (
              <>
                <button 
                  id="nav-dashboard"
                  onClick={() => setCurrentTab('dashboard')} 
                  className={`px-3 py-2 rounded-lg transition ${currentTab === 'dashboard' ? 'bg-slate-100 text-slate-950' : 'hover:bg-slate-50 hover:text-slate-950'}`}
                >
                  My Dashboard
                </button>
                <button 
                  id="nav-history"
                  onClick={() => setCurrentTab('history')} 
                  className={`px-3 py-2 rounded-lg transition ${currentTab === 'history' ? 'bg-slate-100 text-slate-950' : 'hover:bg-slate-50 hover:text-slate-950'}`}
                >
                  Order History & Logs
                </button>
                <button 
                  id="nav-notifications"
                  onClick={() => setCurrentTab('notifications')} 
                  className={`px-3 py-2 rounded-lg transition ${currentTab === 'notifications' ? 'bg-slate-100 text-slate-950' : 'hover:bg-slate-50 hover:text-slate-950'}`}
                >
                  Live SMTP Mail logs
                </button>
                {(currentUser.role === 'support' || currentUser.role === 'admin') && (
                  <button 
                    id="nav-support"
                    onClick={() => setCurrentTab('support')} 
                    className={`px-3 py-2 rounded-lg transition flex items-center gap-1 ${currentTab === 'support' ? 'bg-amber-100 text-amber-950' : 'hover:bg-slate-50 hover:text-slate-950'}`}
                  >
                    Support Tickets Panel
                  </button>
                )}
                {currentUser.role === 'admin' && (
                  <button 
                    id="nav-admin"
                    onClick={() => setCurrentTab('admin')} 
                    className={`px-3 py-2 rounded-lg transition font-bold flex items-center gap-1 ${currentTab === 'admin' ? 'bg-indigo-100 text-indigo-950' : 'hover:bg-slate-50 hover:text-indigo-900'}`}
                  >
                    Admin panel
                  </button>
                )}
              </>
            )}
          </nav>

          {/* User Account Controls */}
          <div className="hidden md:flex items-center gap-3" id="auth-controls-block">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button 
                  id="user-profile-menu-btn"
                  onClick={() => setCurrentTab('profile')}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-150 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[120px] truncate">{currentUser.name}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono uppercase">
                    {currentUser.role}
                  </span>
                </button>
                <button 
                  id="header-logout-btn"
                  onClick={handleLogout} 
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  id="header-login-btn"
                  onClick={() => { setAuthRole('customer'); setAuthModal('login'); }}
                  className="text-xs font-bold text-slate-700 hover:text-slate-950 px-3 py-1.5 transition"
                >
                  Sign In
                </button>
                <button 
                  id="header-register-btn"
                  onClick={() => { setAuthRole('customer'); setAuthModal('register'); }}
                  className="bg-slate-950 hover:bg-slate-800 hover:scale-[1.02] text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile responsive toggle */}
          <button 
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 hover:bg-slate-50 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-2 animate-fade-in" id="mobile-navigation-drawer">
            <button 
              id="mobile-nav-home"
              onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }}
              className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Web Home
            </button>
            {currentUser && (
              <>
                <button 
                  id="mobile-nav-dashboard"
                  onClick={() => { setCurrentTab('dashboard'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  My Dashboard
                </button>
                <button 
                  id="mobile-nav-history"
                  onClick={() => { setCurrentTab('history'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Order History & Logs
                </button>
                <button 
                  id="mobile-nav-notifications"
                  onClick={() => { setCurrentTab('notifications'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  SMTP Logs
                </button>
                {(currentUser.role === 'support' || currentUser.role === 'admin') && (
                  <button 
                    id="mobile-nav-support"
                    onClick={() => { setCurrentTab('support'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    Helpdesk Panel
                  </button>
                )}
                {currentUser.role === 'admin' && (
                  <button 
                    id="mobile-nav-admin"
                    onClick={() => { setCurrentTab('admin'); setMobileMenuOpen(false); }}
                    className="w-full text-left py-2.5 px-3 rounded-lg text-indigo-700 hover:bg-slate-50 font-semibold"
                  >
                    Admin Console
                  </button>
                )}
                <button 
                  id="mobile-nav-profile"
                  onClick={() => { setCurrentTab('profile'); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  My Profile Settings
                </button>
              </>
            )}
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              {currentUser ? (
                <button 
                  id="mobile-logout-btn"
                  onClick={handleLogout} 
                  className="w-full text-center text-rose-600 bg-rose-50 hover:bg-rose-100 py-2 rounded-xl font-bold text-xs transition"
                >
                  Log Out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    id="mobile-login-btn"
                    onClick={() => { setAuthRole('customer'); setAuthModal('login'); setMobileMenuOpen(false); }}
                    className="text-center text-slate-700 font-bold text-xs py-2 border rounded-xl hover:bg-slate-50"
                  >
                    Sign In
                  </button>
                  <button 
                    id="mobile-register-btn"
                    onClick={() => { setAuthRole('customer'); setAuthModal('register'); setMobileMenuOpen(false); }}
                    className="text-center font-bold text-xs py-2 bg-emerald-600 text-white rounded-xl"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>



      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- VIEW: HOME (Landing Page and Quick Public Tracking Tool) --- */}
        {currentTab === 'home' && (
          <div className="space-y-12 animate-fade-in" id="landing-hero-view">
            
            {/* Elegant Hero display with tracking number search */}
            <section className="text-center max-w-4xl mx-auto space-y-6 pt-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Next-generation Logistics Systems
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-[1.15]" id="landing-hero-headline">
                Seamless Nationwide Delivery, <br />
                <span className="bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">Tracked in Microsecond Intervals</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                Empowering independent online merchants and everyday customers with live automated SMTP tracking alerts, secure unified package checkouts, and dedicated remote helper support desks.
              </p>

              {/* Public Real-Time Tracking Input */}
              <div className="max-w-xl mx-auto bg-white p-2 rounded-2xl border border-slate-150 shadow-sm mt-8" id="quick-tracking-search-bar">
                <form onSubmit={handlePublicTrackSearch} className="flex">
                  <div className="flex-grow flex items-center px-3 gap-2">
                    <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
                    <input 
                      id="tracking-search-input"
                      type="text" 
                      placeholder="Enter Tracking ID (e.g. TRK-1001, TRK-1002)..."
                      value={trackingSearchNumber}
                      onChange={(e) => setTrackingSearchNumber(e.target.value)}
                      className="w-full text-slate-800 focus:outline-none text-xs sm:text-sm placeholder-slate-400"
                    />
                  </div>
                  <button 
                    id="track-search-btn"
                    type="submit"
                    disabled={publicSearchLoading}
                    className="bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-6 py-2.5 sm:py-3 rounded-xl transition flex-shrink-0 cursor-pointer"
                  >
                    {publicSearchLoading ? 'Routing...' : 'Track Package'}
                  </button>
                </form>
              </div>

              {publicSearchError && (
                <p className="text-xs text-red-600 font-semibold mt-2">{publicSearchError}</p>
              )}
            </section>

            {/* Quick Demo Credentials Panel for Users & Merchants */}
            <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm max-w-3xl mx-auto" id="quick-credentials-panel">
              <h3 className="text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Sandbox Quick-logins for Live Testing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button 
                  id="quick-login-customer"
                  onClick={() => handleQuickLogin('user@example.com', 'password')}
                  className="p-3 text-left bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-150 transition"
                >
                  <p className="text-xs font-bold text-emerald-700">Customer Account</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">user@example.com</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Pass: password</p>
                </button>
                <button 
                  id="quick-login-merchant"
                  onClick={() => handleQuickLogin('merchant@example.com', 'password')}
                  className="p-3 text-left bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-150 transition"
                >
                  <p className="text-xs font-bold text-emerald-700">Merchant Portal</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">merchant@example.com</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Pass: password</p>
                </button>
                <button 
                  id="quick-login-support"
                  onClick={() => handleQuickLogin('support@example.com', 'support123')}
                  className="p-3 text-left bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-150 transition"
                >
                  <p className="text-xs font-bold text-indigo-700">Support Desk</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">support@example.com</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Pass: support123</p>
                </button>
                <button 
                  id="quick-login-admin"
                  onClick={() => handleQuickLogin('admin@example.com', 'password')}
                  className="p-3 text-left bg-slate-50 hover:bg-slate-200 rounded-xl border border-slate-150 transition"
                >
                  <p className="text-xs font-bold text-slate-700">System Admin</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">admin@example.com</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Pass: password</p>
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">Click on any account to immediately test their integrated workflow dashboard.</p>
            </section>

            {/* Public searched shipment tracking widget rendering block */}
            {publicSearchedShipment && (
              <div className="max-w-2xl mx-auto pt-6 border-t border-slate-100" id="search-result-scroll-anchor">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">Telemetry Feed Found</h3>
                  <p className="text-xs text-slate-500">Live shipping fee details and status pipeline logs listed below</p>
                </div>
                <TrackingWidget 
                  shipment={publicSearchedShipment} 
                  onClose={() => setPublicSearchedShipment(null)}
                />
              </div>
            )}

            {/* Feature Bento Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6" id="bento-features-row">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800">Email Updates</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Triggers automated simulated transactional SMTP notifications at every transit dispatch and handover update directly to both customer and merchant registers.
                </p>
              </div>

              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800">Secure simulated Payment Gateway</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Safely pay shipping fee online. Features simulation checks matching PCI compliance structures with interactive simulated card chips.
                </p>
              </div>

              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800">Dedicated Support Channel</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Submit tickets with tracking number markers. Support staff can reply and resolve queries immediately, automatically resetting passwords via the admin override terminal.
                </p>
              </div>
            </section>


          </div>
        )}

        {/* --- VIEW: DASHBOARD (Unified Control Center based on roles) --- */}
        {currentTab === 'dashboard' && currentUser && (
          <div className="space-y-8 animate-fade-in" id="dashboard-roles-portal">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900" id="dashboard-role-header">
                  {currentUser.role === 'customer' && 'Customer Services Desk'}
                  {currentUser.role === 'merchant' && 'Merchant Commerce Portal (মার্চেন্ট ড্যাশবোর্ড)'}
                  {currentUser.role === 'support' && 'Support Agent Terminal'}
                  {currentUser.role === 'admin' && 'Enterprise System Administration'}
                  {currentUser.role === 'rider' && 'On-Field Rider Delivery Workspace (রাইডার ড্যাশবোর্ড)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Logged in as <span className="font-semibold">{currentUser.name}</span> ({currentUser.email})
                </p>
              </div>

              {/* Action buttons based on Role */}
              {currentUser.role === 'merchant' && (
                <button 
                  id="scroll-to-create-shipment"
                  onClick={() => setIsMerchantShipModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow transition inline-flex items-center gap-1.5 focus:ring-2 focus:ring-emerald-300"
                >
                  <PlusCircle className="w-4 h-4" /> Ship New Parcel
                </button>
              )}
            </div>

            {/* Merchant Metrics Banner */}
            {currentUser.role === 'merchant' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="merchant-stats-banner">
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Dispatches</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-1">{shipments.length}</p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Awaiting Payment</p>
                  <p className="text-2xl font-extrabold text-amber-600 mt-1">
                    {shipments.filter(s => !s.paid).length}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider font-semibold">Active In Transit</p>
                  <p className="text-2xl font-extrabold text-indigo-600 mt-1">
                    {shipments.filter(s => s.status === 'In Transit').length}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Settled Logistics (USD)</p>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                    ${shipments.filter(s => s.paid).reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Support Metrics Banner */}
            {(currentUser.role === 'support' || currentUser.role === 'admin') && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="support-stats-banner">
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Open Tickets</p>
                  <p className="text-2.5xl font-extrabold text-red-600 mt-1">
                    {supportTickets.filter(t => t.status === 'Open').length}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Resolved Tickets</p>
                  <p className="text-2.5xl font-extrabold text-emerald-600 mt-1">
                    {supportTickets.filter(t => t.status === 'Resolved').length}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Unpaid Shipments</p>
                  <p className="text-2.5xl font-extrabold text-amber-600 mt-1">
                    {shipments.filter(s => !s.paid).length}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total System Parcels</p>
                  <p className="text-2.5xl font-extrabold text-slate-800 mt-1">{shipments.length}</p>
                </div>
              </div>
            )}

            {/* Rider Metrics Banner */}
            {currentUser.role === 'rider' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="rider-stats-banner">
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Assigned Parcels</p>
                  <p className="text-2.5xl font-extrabold text-indigo-600 mt-2">
                    {shipments.filter(s => s.assignedRiderId === currentUser.id).length}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider font-semibold">Deliveries Done</p>
                  <p className="text-2.5xl font-extrabold text-emerald-600 mt-2">
                    {shipments.filter(s => s.assignedRiderId === currentUser.id && s.status === 'Delivered').length}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider font-semibold">COD Holding Cash</p>
                  <p className="text-2.5xl font-extrabold text-amber-600 mt-2">
                    ${shipments.filter(s => s.assignedRiderId === currentUser.id && s.status === 'Delivered').reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm text-center">
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Status on Map</p>
                  <span className="inline-block mt-2 font-extrabold text-xs text-white bg-emerald-500 rounded-full px-3 py-1 animate-pulse">
                    ● ACTIVE ON DUTY
                  </span>
                </div>
              </div>
            )}

            {/* --- CORE SPLIT VIEW FOR USER / MERCHANT DASHBOARD CONTENT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Shipment Logs & Tracker List (Take up 2/3 space on large screens) */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="shipments-log-index">
                  <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5" id="shipment-index-header">
                      <History className="w-4 h-4 text-emerald-600" />
                      Active Shipments Tracking Map
                    </h3>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search Tracking ID..."
                          value={dashboardSearchQuery}
                          onChange={(e) => setDashboardSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                      <button 
                        onClick={() => setIsScannerOpen(true)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-indigo-200 shadow-sm"
                      >
                        <Scan className="w-3.5 h-3.5" /> Scan
                      </button>
                      <button 
                        id="dashboard-refresh-shipments"
                        onClick={fetchUserShipments} 
                        className="text-xs text-emerald-600 font-semibold hover:text-emerald-800 ml-2"
                      >
                        Reload
                      </button>
                    </div>
                  </div>

                  {shipmentsLoading ? (
                    <div className="p-12 text-center text-xs text-slate-400">Locating logistics coordinates on map feeds...</div>
                  ) : shipments.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <p className="text-xs font-semibold">No shipments associated with your user parameters.</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">Generate a mock shipment below by filling the cargo form, or log in to a pre-configured account.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[600px]" id="shipment-dashboard-table">
                        <thead>
                          <tr className="bg-slate-55/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-3.5">Tracking ID</th>
                            <th className="p-3.5">Destination Receiver</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Shipping Fee</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                          {shipments.filter(s => s.trackingNumber.toLowerCase().includes(dashboardSearchQuery.toLowerCase().trim())).map((s) => (
                            <React.Fragment key={s.id}>
                              <tr className="hover:bg-slate-50/50 transition">
                                <td className="p-3.5">
                                  <span className="font-bold text-slate-900 font-mono select-all block">{s.trackingNumber}</span>
                                  {s.merchantRef && <span className="text-[10px] text-slate-400 font-mono block">Ref: {s.merchantRef}</span>}
                                </td>
                                <td className="p-3.5">
                                  <p className="font-semibold text-slate-800">{s.receiverName}</p>
                                  <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{s.receiverAddress}</p>
                                  {s.deliveryHub && (
                                    <span className="inline-block mt-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 leading-none">
                                      Hub: {s.deliveryHub}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                    s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                    s.status === 'In Transit' ? 'bg-indigo-100 text-indigo-800' :
                                    s.status === 'Out for Delivery' ? 'bg-sky-100 text-sky-800' :
                                    s.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {s.status}
                                  </span>
                                </td>
                                <td className="p-3.5">
                                  <p className="font-bold text-slate-800">${s.price.toFixed(2)}</p>
                                  <p className="text-[9px]">
                                    {s.paid ? (
                                      <span className="text-emerald-600 font-semibold">✓ Paid</span>
                                    ) : (
                                      <span className="text-amber-600 font-semibold">⚡ Unpaid</span>
                                    )}
                                  </p>
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="inline-flex gap-1.5 justify-end flex-wrap">
                                    {/* Pay Shipping Fee (If customer or merchant has unpaid items) */}
                                    {!s.paid && (currentUser.role === 'customer' || currentUser.role === 'merchant') && (
                                      <button 
                                        id={`action-pay-${s.id}`}
                                        onClick={() => setActivePaymentShipment(s)}
                                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-1 rounded text-[10px] transition"
                                      >
                                        Pay Fee
                                      </button>
                                    )}

                                    {/* Rider specific action buttons */}
                                    {currentUser.role === 'rider' && s.status !== 'Delivered' && (
                                      <>
                                        <button 
                                          id={`action-rider-status-${s.id}`}
                                          onClick={() => {
                                            setActiveUpdateShipmentId(s.id);
                                            setUpdateStatusVal(s.status);
                                            const lastUpdate = s.updates[s.updates.length - 1];
                                            setUpdateStatusLocation(lastUpdate?.location || 'Dhaka sorting hub');
                                            setUpdateStatusDescription(lastUpdate?.description || 'Parcel in rider custody');
                                          }}
                                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                                        >
                                          Update status
                                        </button>
                                        
                                        <button 
                                          id={`action-rider-sim-${s.id}`}
                                          onClick={() => startGPSRouteSimulation(s)}
                                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-2 py-1 rounded text-[10px] transition hover:scale-105"
                                        >
                                          🚚 GPS Sim
                                        </button>

                                        <button 
                                          id={`action-rider-epod-${s.id}`}
                                          onClick={() => {
                                            setProofShipmentId(s.id);
                                            setEPODProofType('Signature');
                                            setIsProofModalOpen(true);
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                                        >
                                          ePOD
                                        </button>
                                      </>
                                    )}

                                    {/* Print Shipping Label (Merchant only) */}
                                    {currentUser.role === 'merchant' && (
                                      <button 
                                        id={`action-print-${s.id}`}
                                        onClick={() => setPrintedShipment(s)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                                      >
                                        Print Label
                                      </button>
                                    )}

                                    {/* Update Status (Support or Admin only) */}
                                    {(currentUser.role === 'support' || currentUser.role === 'admin') && (
                                      <>
                                        <button 
                                          id={`action-status-${s.id}`}
                                          onClick={() => {
                                            setActiveUpdateShipmentId(s.id);
                                            setUpdateStatusVal(s.status);
                                            const lastUpdate = s.updates[s.updates.length - 1];
                                            setUpdateStatusLocation(lastUpdate?.location || '');
                                            setUpdateStatusDescription(lastUpdate?.description || '');
                                          }}
                                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                                        >
                                          Update
                                        </button>

                                        {s.status !== 'Delivered' && (
                                          <button 
                                            id={`action-quick-delivered-${s.id}`}
                                            onClick={() => {
                                              setActiveUpdateShipmentId(s.id);
                                              setUpdateStatusVal('Delivered');
                                              setUpdateStatusLocation(s.deliveryHub || 'Main Hub Sorting Office');
                                              setUpdateStatusDescription('Delivered successfully at Hub center office by hand or delivery agent.');
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] transition"
                                          >
                                            ✓ Mark Delivered
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {/* Track details click toggle */}
                                    <button 
                                      id={`action-track-${s.id}`}
                                      onClick={() => {
                                        setTrackingSearchNumber(s.trackingNumber);
                                        fetch(`/api/shipments/track/${s.trackingNumber}`)
                                          .then(res => res.json())
                                          .then(data => {
                                            setPublicSearchedShipment(data);
                                            setTimeout(() => {
                                              document.getElementById('shipment-details-anchor')?.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                          });
                                      }}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-[10px] transition"
                                    >
                                      Inspect Live
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {activeGeoTrackingId === s.id && (
                                <tr id={`sim-gps-drawer-${s.id}`} className="bg-indigo-50/20">
                                  <td colSpan={5} className="p-4 border-l-4 border-indigo-500 bg-indigo-50/30">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center text-[10px] text-slate-600 font-semibold">
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs">🚚</span>
                                          <span>রিয়েল-টাইম জিপিএস ট্র্যাকিং ও প্রিমিয়াম ইটিএ (GPS Dispatch Link)</span>
                                        </div>
                                        <div className="font-mono">
                                          Speed: <span className="font-bold text-indigo-700">{gpsSimProgress === 100 ? 0 : gpsSimSpeed} km/h</span> | ETA Countdown: <span className="font-bold text-indigo-700">{gpsSimProgress === 100 ? 'Arrived' : Math.ceil((100 - gpsSimProgress) * 0.4) + ' mins'}</span>
                                        </div>
                                      </div>

                                      {/* Simulated map route progression bar */}
                                      <div className="relative w-full h-8 bg-slate-100 border border-slate-200/80 rounded-xl overflow-hidden flex items-center shadow-inner">
                                        <span className="absolute left-3 text-[9px] text-slate-400 font-bold font-sans uppercase">Dhaka hub</span>
                                        <span className="absolute right-3 text-[9px] text-slate-400 font-bold font-sans uppercase">Destination</span>
                                        
                                        <div 
                                          className="h-full bg-indigo-500/10 border-r-2 border-indigo-600 transition-all duration-1000 ease-out flex items-center justify-end pr-1 shadow-sm"
                                          style={{ width: `${gpsSimProgress}%` }}
                                        >
                                          <div className="w-6 h-6 flex items-center justify-center rounded-full bg-white border border-indigo-200 shadow-md transform translate-x-2 text-xs">
                                            🚴
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex justify-between items-center text-[10.5px]">
                                        <p className="text-slate-500 font-medium">
                                          Dispatch Telemetry logs: <span className="font-bold text-indigo-950 italic">{gpsSimTraffic}</span>
                                        </p>
                                        <button 
                                          onClick={() => {
                                            setActiveGeoTrackingId(null);
                                            if (gpsSimTimer) clearInterval(gpsSimTimer);
                                          }}
                                          className="text-[10px] text-indigo-700 hover:text-indigo-950 font-bold underline"
                                        >
                                          Hide Simulation
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Simulated Shipment Creator Form specifically aligned for Merchant / Dashboard inside */}
                {currentUser.role === 'merchant' && (
                  <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Rapid Merchant Dispatch</p>
                    <h3 className="font-extrabold text-slate-900 mt-1">Simulate Merchant API booking request</h3>
                    <p className="text-[11px] text-slate-500 mt-1 mb-4">
                      Sender information is automatically integrated from your verified brand registry profile (<strong>{currentUser.companyName || currentUser.name}</strong> • <strong>{currentUser.email}</strong>).
                    </p>
                    <button 
                      id="scroll-to-booking-merchant"
                      onClick={() => setIsMerchantShipModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow hover:scale-[1.02]"
                    >
                      Open Merchant Parcel Form
                    </button>
                  </div>
                )}

                {/* Display active detailed Tracking view inline directly below */}
                {publicSearchedShipment && (
                  <div className="pt-6 border-t border-slate-100" id="shipment-details-anchor">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-slate-800">Telemetry Tracking Widget</h3>
                      <button 
                        id="hide-telemetry-btn"
                        onClick={() => setPublicSearchedShipment(null)} 
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Hide widget
                      </button>
                    </div>
                    <TrackingWidget 
                      shipment={publicSearchedShipment}
                      onClose={() => setPublicSearchedShipment(null)}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Support Center Desk & Live Mail logs summary */}
              <div className="space-y-6">

                {/* MERCHANT PORTAL ADDITIONS: Billing Wallet and Payout System */}
                {currentUser.role === 'merchant' && (
                  <>
                    {/* Wallet Ledger */}
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-4" id="merchant-wallet-ledger">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-indigo-200 uppercase font-extrabold tracking-widest leading-none">COD Collection balance</p>
                          <h4 className="text-3xl font-black mt-2 text-white">
                            ${billingSummary?.availableBalance !== undefined ? billingSummary.availableBalance.toFixed(2) : (billingSummary?.codCollectedAmount ? (billingSummary.codCollectedAmount - billingSummary.payoutAmount).toFixed(2) : '0.00')}
                          </h4>
                        </div>
                        <span className="text-xs font-bold font-mono px-2 py-1 bg-indigo-50/15 border border-indigo-400/20 rounded text-indigo-100">
                          Wallet Active
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-indigo-550/20 text-xs flex justify-between text-indigo-100">
                        <p>Total Life Earned: <span className="font-bold text-white">${billingSummary?.codEarned !== undefined ? billingSummary.codEarned.toFixed(2) : (billingSummary?.codCollectedAmount?.toFixed(2) || '0.00')}</span></p>
                        <p>Withdrawn: <span className="font-bold text-white">${billingSummary?.totalPayoutsCollected !== undefined ? billingSummary.totalPayoutsCollected.toFixed(2) : (billingSummary?.payoutAmount?.toFixed(2) || '0.00')}</span></p>
                      </div>

                      {/* Cashout Withdraw Form */}
                      <form onSubmit={handleRequestPayout} className="space-y-2 pt-2 text-xs text-slate-800">
                        <p className="font-bold text-[10.5px] text-indigo-100">Instant Cashout Portal (ক্যাশআউট রিকোয়েস্ট)</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input 
                            type="number"
                            step="any"
                            placeholder="Amount ($)"
                            required
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            className="bg-white/95 border border-indigo-300 rounded-lg py-1.5 px-2 focus:outline-none placeholder-slate-400 text-xs"
                          />
                          <select 
                            value={payoutMethod}
                            onChange={(e) => setPayoutMethod(e.target.value)}
                            className="bg-white/95 border border-indigo-300 rounded-lg py-1.5 px-2 focus:outline-none text-xs"
                          >
                            <option value="bKash">bKash (বিকাশ)</option>
                            <option value="Nagad">Nagad (নগদ)</option>
                            <option value="Rocket">Rocket (রকেট)</option>
                            <option value="Bank">Bank Deposit</option>
                          </select>
                        </div>
                        <input 
                          type="text"
                          placeholder="Recipient Account Phone No / Details"
                          required
                          value={payoutAccount}
                          onChange={(e) => setPayoutAccount(e.target.value)}
                          className="w-full bg-white/95 border border-indigo-300 rounded-lg py-1.5 px-2 focus:outline-none placeholder-slate-400 text-xs"
                        />

                        {payoutError && <p className="text-[10px] text-rose-300 font-bold p-1 bg-rose-950/25 rounded">{payoutError}</p>}
                        {payoutSuccess && <p className="text-[10px] text-emerald-300 font-bold p-1 bg-emerald-950/25 rounded">{payoutSuccess}</p>}

                        <button 
                          type="submit"
                          disabled={payoutLoading}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 rounded-xl text-[11px] transition shadow hover:scale-[1.01]"
                        >
                          {payoutLoading ? 'Processing accounts ledger...' : 'Withdraw Wallet Balance'}
                        </button>
                      </form>
                    </div>

                    {/* Bulk spreadsheets CSV integration */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-3" id="merchant-bulk-csv-card">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          💼 CSV Bulk Import Desk (বাল্ক পার্সেল আপলোড)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Upload a series of merchant deliveries in one action</p>
                      </div>

                      <form onSubmit={handleBulkCSVImport} className="space-y-3 text-xs">
                        <textarea 
                          rows={4}
                          placeholder="Receiver Name, Receiver Email, Receiver Phone, Receiver Address, Weight, Hub, Notes"
                          value={bulkCSV}
                          onChange={(e) => setBulkCSV(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[9px] p-2.5 rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={loadDemoCSVData}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-[10px] transition"
                          >
                            ⚡ Load 5 Demo Orders
                          </button>
                          
                          <button 
                            type="submit"
                            disabled={bulkImportLoading}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition text-center"
                          >
                            {bulkImportLoading ? 'Generating...' : 'Bulk-Register Orders'}
                          </button>
                        </div>
                        {bulkImportError && <p className="text-[10px] text-rose-600 font-bold">{bulkImportError}</p>}
                        {bulkImportSuccess && <p className="text-[10px] text-emerald-600 font-bold">{bulkImportSuccess}</p>}
                      </form>
                    </div>

                    {/* Historic Cash Out Logs */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 text-xs" id="merchant-payout-history-desk">
                      <p className="font-bold text-slate-800 pb-2 border-b border-slate-100">Historical cashout logs</p>
                      {merchantPayouts.length === 0 ? (
                        <p className="text-slate-400 text-center py-6 text-[11px]">No payouts dispatched historically.</p>
                      ) : (
                        <div className="space-y-2 mt-2 max-h-[160px] overflow-y-auto divide-y divide-slate-50">
                          {merchantPayouts.map((pt, i) => (
                            <div key={i} className="pt-2 first:pt-0 flex justify-between items-center text-[11px]">
                              <div>
                                <p className="font-bold text-slate-800">{pt.paymentMethod} • Cash Out</p>
                                <p className="text-[9px] text-slate-400">{pt.accountNo}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-extrabold text-slate-900">${pt.amount.toFixed(2)}</p>
                                <p className="text-[9px] text-emerald-600 font-bold font-sans">Approved</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* RIDER PORTAL ADDITIONS: Telemetry Location coordinate simulator */}
                {currentUser.role === 'rider' && (
                  <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4" id="rider-telemetry-panel">
                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        📡 On-Duty Rider Location Telemetry (জিপিএস আপডেট)
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Publish your current coordinate speeds to the central map</p>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={async () => {
                            await fetch(`/api/riders/${currentUser.id}/telemetry`, {
                              method: 'POST',
                              headers: {'Content-Type': 'application/json'},
                              body: JSON.stringify({ status: 'on-trip', coords: { lat: 23.815, lng: 90.410 } })
                            });
                            fetchRiders();
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold p-2.5 rounded-xl transition font-sans"
                        >
                          Simulate GPS: Dhaka
                        </button>
                        <button 
                          onClick={async () => {
                            await fetch(`/api/riders/${currentUser.id}/telemetry`, {
                              method: 'POST',
                              headers: {'Content-Type': 'application/json'},
                              body: JSON.stringify({ status: 'on-trip', coords: { lat: 22.356, lng: 91.783 } })
                            });
                            fetchRiders();
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold p-2.5 rounded-xl transition font-sans"
                        >
                          Simulate GPS: Ctg
                        </button>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-500 leading-normal">
                        <p className="font-bold text-slate-800 mb-1">Rider Device Info:</p>
                        <p>Simulating terminal speed pinging protocols regularly. GPS latitude/longitude is automatically synced to the Customer's Inspect Live maps.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADMIN & SUPPORT ADDITIONS: Automated Dispatching and Batching tool */}
                {(currentUser.role === 'support' || currentUser.role === 'admin') && (
                  <>
                    {/* Automated dispatching console logs */}
                    <div className="bg-slate-900 border border-slate-850 text-slate-100 rounded-3xl p-5 shadow-xl space-y-3" id="admin-dispatch-matching-card">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                          🤖 Smart Automated Match Dispatching (স্মার্ট ডিসপ্যাচিং)
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Automated proximity parcel rider calculation algorithm</p>
                      </div>

                      <button 
                        onClick={triggerAutoDispatch}
                        disabled={isDispatching}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2 rounded-xl text-xs transition shadow hover:scale-[1.01]"
                      >
                        {isDispatching ? 'Running Dispatch Algorithm...' : '⚡ Launch Auto-Dispatch Optimizer'}
                      </button>

                      {dispatchLogs.length > 0 && (
                        <div className="bg-black/45 p-3 rounded-xl border border-slate-800 text-[10.5px] font-mono text-emerald-400 max-h-[160px] overflow-y-auto space-y-1">
                          <p className="text-slate-400 font-bold uppercase tracking-wider text-[8.5px]">Console logs terminal</p>
                          {dispatchLogs.map((log, li) => (
                            <p key={li}>{log}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Batch delivery generator */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3" id="admin-batching-planner">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          📦 Batch Delivery Scheduler (ব্যাচ ডেলিভারি শিডিউলিং)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Group parcels of the same area for a single rider to save fuel & time</p>
                      </div>

                      <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
                        <div>
                          <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px]">Select Regional Area Hub</label>
                          <select 
                            value={batchHub}
                            onChange={(e) => setBatchHub(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 py-1.5 px-3.5 rounded-lg focus:outline-none"
                          >
                            <option value="Dhaka Central Hub">Dhaka Central Hub</option>
                            <option value="Chittagong Sorting Hub">Chittagong Sorting Hub</option>
                            <option value="Rajshahi Sorting Hub">Rajshahi Sorting Hub</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wider text-[10px]">Assign Rider</label>
                          <select 
                            value={batchRiderId}
                            onChange={(e) => setBatchRiderId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 py-1.5 px-3.5 rounded-lg focus:outline-none"
                          >
                            <option value="">-- Click to assign driver --</option>
                            {riders.map(r => (
                              <option key={r.id} value={r.id}>{r.name} ({r.currentHub || 'Unassigned'})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-500 font-bold mb-1 uppercase text-[10px]">Select parcels in {batchHub.split(' ')[0]}</label>
                          {shipments.filter(s => s.deliveryHub === batchHub && !s.deliveryBatchId).length === 0 ? (
                            <p className="text-slate-400 italic py-2 text-[11px]">No unassigned parcels in this hub.</p>
                          ) : (
                            <div className="max-h-[120px] overflow-y-auto border border-slate-100 p-2.5 rounded-lg space-y-2 bg-slate-50/50">
                              {shipments.filter(s => s.deliveryHub === batchHub && !s.deliveryBatchId).map(s => (
                                <div key={s.id} className="flex items-center gap-2">
                                  <input 
                                    type="checkbox"
                                    id={`batch-chbox-${s.id}`}
                                    checked={selectedBatchShipments.includes(s.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBatchShipments(prev => [...prev, s.id]);
                                      } else {
                                        setSelectedBatchShipments(prev => prev.filter(id => id !== s.id));
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0"
                                  />
                                  <label htmlFor={`batch-chbox-${s.id}`} className="leading-tight font-mono text-[10.5px]">
                                    <strong>{s.trackingNumber}</strong> - {s.receiverName}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {batchErrorMsg && <p className="text-[10px] text-red-600 font-bold">{batchErrorMsg}</p>}
                        {batchSuccessMsg && <p className="text-[10px] text-emerald-600 font-bold">{batchSuccessMsg}</p>}

                        <button 
                          type="submit"
                          disabled={batchSubmitLoading}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2 rounded-xl text-xs transition shadow font-sans"
                        >
                          {batchSubmitLoading ? 'Generating batch...' : 'Create Regional Dispatch Batch'}
                        </button>
                      </form>
                    </div>

                    {/* Integrated system delivery batches display */}
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 text-xs" id="admin-batches-history-card">
                      <p className="font-bold text-slate-800 pb-2 border-b border-slate-100">Live Scheduled Batches status</p>
                      {batchesLoading && <p className="text-slate-400 py-3 text-[10px] text-center">Loading batch logs...</p>}
                      {batches.length === 0 ? (
                        <p className="text-slate-400 text-center py-6 text-[11px]">No active dispatch batches registered.</p>
                      ) : (
                        <div className="space-y-3 mt-2 max-h-[180px] overflow-y-auto divide-y divide-slate-100">
                          {batches.map((b) => (
                            <div key={b.id} className="pt-2.5 first:pt-0 space-y-1" id={`logistics-batch-${b.id}`}>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-indigo-700 font-mono">{b.batchCode}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                  b.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {b.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal">
                                Area: <strong>{b.hub.split(' ')[0]}</strong> | Cargo count: <strong>{b.shipmentIds.length} parcels</strong>
                              </p>
                              {b.assignedRiderId ? (
                                <p className="text-[10px] text-slate-400">Assigned Driver ID: <span className="font-mono text-slate-600">{b.assignedRiderId.substring(0,8)}</span></p>
                              ) : (
                                <p className="text-[10px] text-yellow-650 font-medium">Unassigned - Waiting driver pickup</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Support Tickets Console block explicitly customized */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4" id="customer-support-tickets-card">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5" id="customer-helpdisk-title">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      Helpdesk & Merchant/Customer Support Center
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {currentUser.role === 'support' || currentUser.role === 'admin' 
                        ? 'Global support tickets dispatch routing queue' 
                        : currentUser.role === 'merchant'
                        ? 'Submit a high-priority merchant ticket regarding payout disputes, billing, or parcel delivery issues'
                        : 'Submit a customer safe-delivery or package dispute ticket'}
                    </p>
                  </div>

                  {/* If user is Support / Admin: Reply Interface */}
                  {(currentUser.role === 'support' || currentUser.role === 'admin') ? (
                    <div className="space-y-4" id="support-agent-replies-panel">
                      {ticketsLoading && <p className="text-xs text-slate-400 text-center py-4">Polling queue records...</p>}
                      {supportTickets.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-8">No helpdesk tickets pending resolution.</p>
                      ) : (
                         <div className="space-y-3 divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                           {supportTickets.map((t) => (
                             <div key={t.id} className="pt-3 first:pt-0 space-y-2 text-xs" id={`support-ticket-${t.id}`}>
                               <div className="flex justify-between items-start gap-2">
                                 <div>
                                   <div className="flex flex-wrap items-center gap-1.5">
                                     <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                       t.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                     }`}>
                                       {t.status}
                                     </span>
                                     {t.userRole === 'merchant' && (
                                       <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                                         Merchant {t.companyName ? `• ${t.companyName}` : ''}
                                       </span>
                                     )}
                                     {t.userRole === 'customer' && (
                                       <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 uppercase tracking-wider">
                                         Customer
                                       </span>
                                     )}
                                   </div>
                                   <h4 className="font-bold text-slate-800 mt-1">{t.subject}</h4>
                                 </div>
                                 <span className="text-[10px] text-slate-400 font-mono">
                                   {new Date(t.createdAt).toLocaleDateString()}
                                 </span>
                               </div>

                              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-normal">
                                <strong>Message from {t.userName} ({t.userEmail}):</strong><br />
                                {t.message}
                              </p>

                              {t.trackingNumber && (
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Linked Tracking: <strong>{t.trackingNumber}</strong>
                                </p>
                              )}

                              {t.replyMessage ? (
                                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100 text-[11px]">
                                  <strong>Resolution ({t.repliedBy}):</strong><br />
                                  {t.replyMessage}
                                </div>
                              ) : (
                                <div>
                                  {activeReplyTicketId === t.id ? (
                                    <div className="space-y-2 mt-2">
                                      <textarea
                                        id={`ticket-reply-textarea-${t.id}`}
                                        rows={2}
                                        placeholder="Compose response. Ticket status will transition resolved..."
                                        value={replyMessageContent}
                                        onChange={(e) => setReplyMessageContent(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                                      />
                                      <div className="flex justify-end gap-1.5">
                                        <button 
                                          id={`cancel-reply-${t.id}`}
                                          onClick={() => setActiveReplyTicketId(null)}
                                          className="text-[11px] hover:bg-slate-100 text-slate-500 px-2 py-1 rounded"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          id={`submit-reply-${t.id}`}
                                          onClick={() => handleReplyTicket(t.id)}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3 py-1 rounded"
                                        >
                                          Resolve Ticket
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button 
                                      id={`reply-trigger-${t.id}`}
                                      onClick={() => {
                                        setActiveReplyTicketId(t.id);
                                        setReplyMessageContent('');
                                      }}
                                      className="text-xs bg-indigo-600 text-white hover:bg-indigo-500 px-3 py-1 rounded-md font-bold mt-1 transition"
                                    >
                                      Draft Resolution Reply
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                     // Customer or Merchant Helpdesk submission form
                     <form onSubmit={handleCreateSupportTicket} className="space-y-3 text-xs" id="helpdesk-customer-form">
                       {ticketCreateError && <p className="text-red-600 font-bold">{ticketCreateError}</p>}
                       {ticketCreateSuccess && <p className="text-emerald-700 font-bold">{ticketCreateSuccess}</p>}
 
                       <div>
                         <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Category / Package ID linked</label>
                         <select 
                           id="ticket-package-select"
                           value={ticketTrackingNumber} 
                           onChange={(e) => setTicketTrackingNumber(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500 text-xs text-slate-700"
                         >
                           <option value="">{currentUser.role === 'merchant' ? 'General Merchant / Business Inquiry' : 'General Logistics Inquiry'}</option>
                           {shipments.map(s => (
                             <option key={s.id} value={s.trackingNumber}>
                               Tracking No: {s.trackingNumber} ({s.receiverName})
                             </option>
                           ))}
                         </select>
                       </div>
 
                       <div>
                         <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Inquiry Topic / Subject</label>
                         <input 
                           id="ticket-subject-input"
                           type="text" 
                           required 
                           placeholder={currentUser.role === 'merchant' ? "e.g. Discrepancy on COD cash collection payout" : "e.g. Unscheduled delayed courier route"}
                           value={ticketSubject}
                           onChange={(e) => setTicketSubject(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500 text-xs focus:ring-1 focus:ring-indigo-500"
                         />
                       </div>
 
                       <div>
                         <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Detailed Support Description</label>
                         <textarea 
                           id="ticket-message-textarea"
                           required 
                           rows={3} 
                           placeholder={currentUser.role === 'merchant' ? "Please list details of the batch, payout request amount, or parcel error..." : "Please elaborate on the nature of the issue..."}
                           value={ticketMessage}
                           onChange={(e) => setTicketMessage(e.target.value)}
                           className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500 text-xs focus:ring-1 focus:ring-indigo-500"
                         />
                       </div>
 
                       <button 
                         id="submit-ticket-btn"
                         type="submit"
                         className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition"
                       >
                         {currentUser.role === 'merchant' ? 'Transmit Partner Ticket' : 'Transmit Ticket to Representative'}
                       </button>
 
                       {/* Display historic submitted tickets list */}
                       {supportTickets.length > 0 && (
                         <div className="pt-4 border-t border-slate-100 mt-4 space-y-2.5">
                           <p className="font-bold text-slate-700 uppercase mb-2 text-[10px]">
                             {currentUser.role === 'merchant' ? 'Your corporate helpdesk file history' : 'Your ticket files history'}
                           </p>
                          <div className="space-y-2 max-h-[180px] overflow-y-auto">
                            {supportTickets.map(t => (
                              <div key={t.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]" id={`customer-invoice-ticket-${t.id}`}>
                                <div className="flex justify-between">
                                  <span className="font-bold text-slate-800">{t.subject}</span>
                                  <span className={`px-1 rounded text-[9px] font-semibold ${t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{t.status}</span>
                                </div>
                                <p className="text-slate-500 mt-0.5">{t.message}</p>
                                {t.replyMessage && (
                                  <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-indigo-700 font-medium">
                                    <strong>Resolution Reply:</strong> {t.replyMessage}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </form>
                  )}
                </div>

                {/* Email inbox simulator preview widget directly visible for customers */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-slate-800 text-xs uppercase flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" /> Active System SMTP logs
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Live notifications sent to your customer registry are recorded here during testing. Use the separate separate separate dedicated inbox tab to view multi-clientSMTP outputs.
                  </p>
                  <button 
                    id="goto-smtp-logs-btn"
                    onClick={() => setCurrentTab('notifications')}
                    className="w-full bg-slate-50 border border-slate-150 hover:bg-slate-100 transition py-2 rounded-lg text-[11px] text-slate-600 font-bold"
                  >
                    Open Live Mail logs
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- VIEW: DEDICATED ORDER HISTORY PORTAL & METRICS --- */}
        {currentTab === 'history' && currentUser && (
          <div className="space-y-8 animate-fade-in" id="history-archives-tab">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">Archive Feed</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">Historic Courier Order Logs</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive directory tracing historic shipping fees, checkout receipts, and receiver coordinates.
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="history-panel-index">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Total Archives ({shipments.length} files found)</span>
                <button 
                  id="reload-archives-btn"
                  onClick={fetchUserShipments}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Sync Archives
                </button>
              </div>

              {shipments.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <p className="text-xs font-semibold">No historic records available to view.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-55/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Tracking Number</th>
                        <th className="p-4">File Registered At</th>
                        <th className="p-4">Delivery Sender</th>
                        <th className="p-4">Receiver & Phone</th>
                        <th className="p-4">Cargo Weight</th>
                        <th className="p-4">Cost Settlement</th>
                        <th className="p-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {shipments.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <span className="font-bold text-slate-900 font-mono block">{s.trackingNumber}</span>
                            <span className="text-[10px] text-slate-400">{s.status}</span>
                          </td>
                          <td className="p-4 text-slate-500 font-mono">
                            {new Date(s.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-slate-700">
                            {s.senderName}
                            <span className="text-[10px] text-slate-400 block">{s.senderEmail}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-800 block">{s.receiverName}</span>
                            <span className="text-[10px] text-slate-400 block">{s.receiverPhone}</span>
                          </td>
                          <td className="p-4 text-slate-500 font-medium">
                            {s.weight} kg
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-slate-800">${s.price}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${s.paid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                              {s.paid ? 'Paid' : 'Pending Payment'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              id={`history-inspect-${s.id}`}
                              onClick={() => {
                                setPublicSearchedShipment(s);
                                const el = document.getElementById('history-inspection-widget-anchor');
                                if (el) {
                                  setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
                                }
                              }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded transition"
                            >
                              Inspect Map
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* In-page inspection frame */}
            <div id="history-inspection-widget-anchor">
              {publicSearchedShipment && (
                <div className="max-w-2xl mx-auto pt-4 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-800 font-mono">Archive Telemetry</h3>
                    <button 
                      id="close-archive-inspect-btn"
                      onClick={() => setPublicSearchedShipment(null)} 
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Hide Tracker
                    </button>
                  </div>
                  <TrackingWidget 
                    shipment={publicSearchedShipment}
                    onClose={() => setPublicSearchedShipment(null)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW: NOTIFICATION LOGS (SMTP Mail simulation pipeline) --- */}
        {currentTab === 'notifications' && (
          <div className="space-y-8 animate-fade-in" id="smtp-notifications-tab">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">SMTP Simulated Server</span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-2">Simulated Notification Logs</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every state transition sends a simulated transaction mail from Crazy Courier. You can test customer logins next door and observe updates in the sandbox registry below.
              </p>
            </div>

            <NotificationLogList emailFilter={currentUser?.role === 'customer' ? currentUser.email : undefined} />
          </div>
        )}

        {/* --- VIEW: ADMIN PANEL --- */}
        {currentTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="fixed inset-0 z-[100] flex bg-slate-900 overflow-hidden text-slate-200" id="admin-management-settings">
            
            {/* Sidebar */}
            <div className="w-64 bg-slate-950 flex flex-col justify-between border-r border-slate-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-10 text-white">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm leading-tight text-white tracking-wide">Enterprise<br/>Admin</h2>
                  </div>
                </div>

                <nav className="space-y-2">
                  <button 
                    onClick={() => setAdminSubTab('dashboard')}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition ${adminSubTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-sm font-semibold tracking-wide">Dashboard</span>
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('riders')}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition ${adminSubTab === 'riders' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <Truck className="w-4 h-4" />
                    <span className="text-sm font-semibold tracking-wide">Manage Riders</span>
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('users')}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition ${adminSubTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold tracking-wide">Client Registry</span>
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('settings')}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition ${adminSubTab === 'settings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-semibold tracking-wide">Access Control</span>
                  </button>
                </nav>
              </div>

              <div className="p-6 space-y-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 py-3 rounded-xl transition font-semibold text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300">System Secure</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">ENCRYPTED CONNECTION<br/>PORTAL v1.0.4</p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 bg-slate-900 overflow-y-auto">
              
              {/* Dashboard SubTab */}
              {adminSubTab === 'dashboard' && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-800 pb-5">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin Overview</h2>
                      <p className="text-slate-400 text-sm mt-1">High-level view of system modules and users.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <UserIcon className="w-6 h-6 text-indigo-400" />
                        <span className="text-2xl font-black text-white">{adminUsers.length}</span>
                      </div>
                      <p className="text-sm text-slate-400 font-semibold mt-4 tracking-wide uppercase">Total Users</p>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <Truck className="w-6 h-6 text-emerald-400" />
                        <span className="text-2xl font-black text-white">{adminUsers.filter(u => u.role === 'rider').length}</span>
                      </div>
                      <p className="text-sm text-slate-400 font-semibold mt-4 tracking-wide uppercase">Active Riders</p>
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <Briefcase className="w-6 h-6 text-amber-400" />
                        <span className="text-2xl font-black text-white">{adminUsers.filter(u => u.role === 'merchant').length}</span>
                      </div>
                      <p className="text-sm text-slate-400 font-semibold mt-4 tracking-wide uppercase">Merchants</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Riders SubTab */}
              {adminSubTab === 'riders' && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-800 pb-5">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">Manage Riders</h2>
                      <p className="text-slate-400 text-sm mt-1">Provision and view rider accounts.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                      <h3 className="font-bold text-white mb-4">Create New Rider</h3>
                      <form onSubmit={handleAdminCreateRider} className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={riderCreateName}
                            onChange={(e) => setRiderCreateName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={riderCreateEmail}
                            onChange={(e) => setRiderCreateEmail(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="rider@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                          <input 
                            type="tel" 
                            required
                            value={riderCreatePhone}
                            onChange={(e) => setRiderCreatePhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="+8801..."
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Initial Password</label>
                          <input 
                            type="text" 
                            required
                            value={riderCreatePassword}
                            onChange={(e) => setRiderCreatePassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            placeholder="Secure password"
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={riderCreateLoading}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm transition mt-2 disabled:opacity-50"
                        >
                          {riderCreateLoading ? 'Provisioning...' : 'Provision Rider Account'}
                        </button>
                      </form>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 flex flex-col">
                      <div className="p-5 border-b border-slate-700/50">
                        <h3 className="font-bold text-white">Registered Riders</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2">
                        {adminUsers.filter(u => u.role === 'rider').map(u => (
                          <div key={u.id} className="p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl mb-2 flex justify-between items-center transition">
                            <div>
                              <p className="font-bold text-white text-sm">{u.name}</p>
                              <p className="text-slate-400 text-xs mt-0.5">{u.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500 uppercase">Pass</p>
                              <p className="text-emerald-400 font-mono text-xs font-bold">{u.password || '••••'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users SubTab */}
              {adminSubTab === 'users' && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-800 pb-5">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">Client Registry</h2>
                      <p className="text-slate-400 text-sm mt-1">Directory of all authorized personnel across the platform.</p>
                    </div>
                    <button 
                      onClick={fetchAdminUsers}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="divide-y divide-slate-700/50">
                      {adminUsers.map((u) => (
                        <div key={u.id} className="p-5 hover:bg-slate-800 transition flex items-center justify-between group">
                          <div>
                            <p className="font-bold text-white text-base flex items-center gap-2">
                              {u.name}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                                u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                                u.role === 'support' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                u.role === 'merchant' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                u.role === 'rider' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                                'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                              }`}>
                                {u.role}
                              </span>
                            </p>
                            <p className="text-slate-400 font-mono text-xs mt-1">{u.email}</p>
                            {u.companyName && (
                              <p className="text-xs text-slate-500 font-medium italic mt-1.5 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> {u.companyName}
                              </p>
                            )}
                          </div>
                          <div className="text-right opacity-80 group-hover:opacity-100 transition">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Decrypted Passkey</p>
                            <p className="font-mono text-white bg-slate-900 px-3 py-1 rounded-md text-sm border border-slate-700 inline-block">{u.password || '••••'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Settings SubTab */}
              {adminSubTab === 'settings' && (
                <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-800 pb-5">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white tracking-tight">Access Control</h2>
                      <p className="text-slate-400 text-sm mt-1">Regulate system account overrides.</p>
                    </div>
                  </div>
                  
                  <div className="max-w-xl">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-4">
                      <div className="border-b border-slate-700/50 pb-3 mb-4">
                        <h3 className="font-bold text-white">Override Support Desk Password</h3>
                        <p className="text-xs text-slate-400 mt-1">Configure global passwords for the customer service agent desk.</p>
                      </div>

                      <form onSubmit={handleUpdateSupportPassword} className="space-y-5">
                        <div>
                          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Target Email</label>
                          <input 
                            type="text" 
                            disabled
                            value="support@example.com"
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-500 font-mono font-bold cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">New Password Key</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Enter new helpdesk passcode"
                            value={supportPasswordInput}
                            onChange={(e) => setSupportPasswordInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 text-white rounded-xl py-3 px-4 text-sm focus:outline-none transition shadow-inner"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-indigo-900/20"
                        >
                          Commit Password Override
                        </button>
                      </form>

                      <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 flex gap-3 leading-relaxed">
                        <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <span>
                          Updating gives immediate access to the <strong>support@example.com</strong> terminal parameters.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* --- VIEW: PROFILE MANAGEMENT --- */}
        {currentTab === 'profile' && currentUser && (
          <div className="max-w-xl mx-auto space-y-6 animate-fade-in" id="profile-management-tab">
            <div className="border-b border-slate-100 pb-4 text-center">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">User Profile Management</h2>
              <p className="text-xs text-slate-500 mt-1">Configure your local system credentials and profile references.</p>
            </div>

            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                {profileSuccessMsg && (
                  <p className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-bold">{profileSuccessMsg}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Email Reference</label>
                    <input 
                      id="profile-email-disabled"
                      type="email" 
                      disabled 
                      value={currentUser.email}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Access Role</label>
                    <input 
                      id="profile-role-disabled"
                      type="text" 
                      disabled 
                      value={currentUser.role.toUpperCase()}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-slate-400 font-mono font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Full Name / Merchant Title</label>
                  <input 
                    id="profile-name-input"
                    type="text" 
                    required 
                    placeholder="Shoriful Islam"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Phone Number (SMS Contact)</label>
                  <input 
                    id="profile-phone-input"
                    type="text" 
                    placeholder="+1 555-0811"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 focus:outline-none"
                  />
                </div>

                {currentUser.role === 'merchant' && currentUser.companyName && (
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Merchant Company Title</label>
                    <input 
                      id="profile-company-input"
                      type="text" 
                      disabled
                      value={currentUser.companyName}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-slate-400 cursor-not-allowed"
                    />
                  </div>
                )}

                <button 
                  id="profile-save-btn"
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg transition"
                >
                  Save Local Profile Details
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* --- PAYMENT MODAL WINDOW GATEWAY --- */}
      {activePaymentShipment && (
        <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-4 z-50 overflow-y-auto" id="checkout-gateway-modal">
          <div className="max-w-xl w-full mx-auto animate-fade-in">
            <PaymentGateway 
              shipment={activePaymentShipment}
              onPaymentSuccess={() => {
                setActivePaymentShipment(null);
                fetchUserShipments();
              }}
              onCancel={() => setActivePaymentShipment(null)}
            />
          </div>
        </div>
      )}

      {/* --- SHIPMENT STATUS MODAL (Support desks action) --- */}
      {activeUpdateShipmentId && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="status-transition-modal">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full" id="status-update-dialog">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Update Shipment Milestone</h3>
              <button 
                id="close-status-modal-btn"
                onClick={() => setActiveUpdateShipmentId(null)} 
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateShipmentStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wide">Status Stage</label>
                <select 
                  id="status-select-val"
                  value={updateStatusVal} 
                  onChange={(e) => setUpdateStatusVal(e.target.value as ShipmentStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Pending">Pending Prepayment</option>
                  <option value="In Transit">In Transit Hubs</option>
                  <option value="Out for Delivery">Out for Delivery Carrier</option>
                  <option value="Delivered">Delivered Successfully</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wide">Current Location Depot</label>
                <input 
                  id="status-location-input"
                  type="text" 
                  required 
                  placeholder="e.g. Central Sorting Hub, Dhaka"
                  value={updateStatusLocation}
                  onChange={(e) => setUpdateStatusLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg py-2 px-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase tracking-wide">Status Activity Log Description</label>
                <textarea 
                  id="status-desc-textarea"
                  required 
                  rows={3}
                  placeholder="e.g. Flight landed at Cargo terminals. Parcel scheduled for sorting."
                  value={updateStatusDescription}
                  onChange={(e) => setUpdateStatusDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg py-2 px-3 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  id="cancel-status-modal-btn"
                  type="button" 
                  onClick={() => setActiveUpdateShipmentId(null)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button 
                  id="submit-status-update-btn"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold transition"
                >
                  Trigger Update & SMTP Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- AUTHENTICATION MODAL DIALOG --- */}
      {authModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="auth-dialog-wrapper">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 max-w-sm w-full relative" id="auth-modal-dialog">
            
            <button 
              id="close-auth-modal-btn"
              onClick={() => { setAuthModal(null); setAuthError(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-mono text-sm"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-900" id="auth-modal-title">
                {authModal === 'login' ? 'Welcome Back' : 'Join Logistics Network'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authModal === 'login' ? 'Access your tracking and order history portal' : 'Choose your workflow role and register'}
              </p>
            </div>

            {authError && (
              <p className="p-3 mb-4 bg-red-50 text-red-700 border border-red-150 rounded-lg text-xs font-bold">{authError}</p>
            )}

            {/* If Registering, let them choose Role */}
            {authModal === 'register' && (
              <div className="grid grid-cols-3 gap-1.5 mb-4" id="role-selection-grid">
                <button 
                  id="role-select-customer"
                  type="button"
                  onClick={() => setAuthRole('customer')}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition ${authRole === 'customer' ? 'bg-slate-950 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  Customer
                </button>
                <button 
                  id="role-select-merchant"
                  type="button"
                  onClick={() => setAuthRole('merchant')}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition ${authRole === 'merchant' ? 'bg-slate-950 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  Merchant
                </button>
                <button 
                  id="role-select-rider"
                  type="button"
                  onClick={() => setAuthRole('rider')}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition ${authRole === 'rider' ? 'bg-slate-950 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  Rider (রাইডার)
                </button>
              </div>
            )}

            <form onSubmit={authModal === 'login' ? handleLogin : handleRegister} className="space-y-4 text-xs" id="auth-main-form">
              {authModal === 'register' && (
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Full Name Title</label>
                  <input 
                    id="auth-name-input"
                    type="text" 
                    required 
                    placeholder="Shoriful Islam"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {authModal === 'register' && authRole === 'merchant' && (
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Company / Brand Name</label>
                  <input 
                    id="auth-company-input"
                    type="text" 
                    required 
                    placeholder="Apex Electronics Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {authModal === 'register' && (
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Phone Contact Number</label>
                  <input 
                    id="auth-phone-input"
                    type="text" 
                    placeholder="+1 555-0105"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Account Email Address</label>
                <input 
                  id="auth-email-input"
                  type="email" 
                  required 
                  placeholder="name@domain.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Access Password</label>
                <input 
                  id="auth-password-input"
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button 
                id="auth-submit-btn"
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-550 text-white font-bold py-2.5 rounded-lg tracking-wide transition shadow"
              >
                {authLoading ? 'Verifying secure clearance...' : authModal === 'login' ? 'Sign In Securely' : 'Complete Registration'}
              </button>

              <div className="text-center pt-2">
                {authModal === 'login' ? (
                  <button 
                    id="toggle-register-btn"
                    type="button"
                    onClick={() => { setAuthModal('register'); setAuthError(''); }}
                    className="text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    Don't have an account? <span className="text-indigo-600 font-semibold">Join today</span>
                  </button>
                ) : (
                  <button 
                    id="toggle-login-btn"
                    type="button"
                    onClick={() => { setAuthModal('login'); setAuthError(''); }}
                    className="text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    Already possess an account? <span className="text-indigo-600 font-semibold font-mono">Sign in here</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- POPUP MODAL: MERCHANT CREATE SHIPMENT --- */}
      {isMerchantShipModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="merchant-ship-modal-backdrop">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 sm:p-8 max-w-lg w-full relative h-auto my-8" id="merchant-ship-modal-box">
            
            <button 
              id="close-merchant-ship-modal-x"
              onClick={() => { setIsMerchantShipModalOpen(false); setMerchantShipError(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-mono text-sm"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Merchant Carrier Desk
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2" id="merchant-ship-modal-title">
                Ship New Parcel
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the delivery logistics coordinates to instantly generate a printable cargo barcode label.
              </p>
            </div>

            {merchantShipError && (
              <p className="p-3 mb-4 bg-red-50 text-red-700 border border-red-150 rounded-lg text-xs font-bold">{merchantShipError}</p>
            )}

            <form onSubmit={handleMerchantCreateShipment} className="space-y-4 text-xs" id="merchant-ship-main-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Receiver Name</label>
                  <input 
                    id="merchant-receiver-name"
                    type="text" 
                    required 
                    placeholder="e.g. Shoriful Islam"
                    value={merchantReceiverName}
                    onChange={(e) => setMerchantReceiverName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Receiver Email</label>
                  <input 
                    id="merchant-receiver-email"
                    type="email" 
                    required 
                    placeholder="e.g. customer@domain.com"
                    value={merchantReceiverEmail}
                    onChange={(e) => setMerchantReceiverEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Receiver Phone Number</label>
                  <input 
                    id="merchant-receiver-phone"
                    type="text" 
                    required 
                    placeholder="e.g. +880 1712-345678"
                    value={merchantReceiverPhone}
                    onChange={(e) => setMerchantReceiverPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Estimated Weight (kg)</label>
                  <input 
                    id="merchant-shipment-weight"
                    type="number" 
                    required 
                    min="0.1" 
                    step="0.1"
                    value={merchantWeight}
                    onChange={(e) => setMerchantWeight(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#00a781] font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Destination Address</label>
                <input 
                  id="merchant-receiver-address"
                  type="text" 
                  required 
                  placeholder="e.g. House 45, Road 12, Dhanmondi, Dhaka"
                  value={merchantReceiverAddress}
                  onChange={(e) => setMerchantReceiverAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#00a781] text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Delivery Hub (ডেলিভারি হাব)</label>
                <input 
                  id="merchant-delivery-hub"
                  type="text" 
                  placeholder="e.g. Dhaka Central Hub, Chittagong Sorting Hub"
                  value={merchantDeliveryHub}
                  onChange={(e) => setMerchantDeliveryHub(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#00a781] text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Courier Dispatch Instructions</label>
                <textarea 
                  id="merchant-courier-instruct"
                  placeholder="e.g. Fragile materials, handle gently, call on arrival..."
                  rows={2}
                  value={merchantCourierNotes}
                  onChange={(e) => setMerchantCourierNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#00a781] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 uppercase tracking-wide">Merchant Reference ID (Optional)</label>
                  <input 
                    id="merchant-ref-id-input"
                    type="text" 
                    placeholder="e.g. APEX-INV-9902"
                    value={merchantRefId}
                    onChange={(e) => setMerchantRefId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:border-[#00a781] text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 sm:mt-5 mt-2">
                  <input 
                    id="merchant-prepay-chbox"
                    type="checkbox"
                    checked={merchantPrepayShipping}
                    onChange={(e) => setMerchantPrepayShipping(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-[#00a781] cursor-pointer"
                  />
                  <label htmlFor="merchant-prepay-chbox" className="text-slate-600 font-semibold leading-none cursor-pointer">
                    Simulate Prepayment
                  </label>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  id="merchant-cancel-btn"
                  type="button"
                  onClick={() => { setIsMerchantShipModalOpen(false); setMerchantShipError(''); }}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl font-bold cursor-pointer transition text-xs"
                >
                  Cancel
                </button>
                <button 
                  id="merchant-submit-btn"
                  type="submit"
                  disabled={merchantShipLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold transition shadow cursor-pointer text-xs"
                >
                  {merchantShipLoading ? 'Saving Logistics Data...' : 'Create Cargo & Generate Label'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PRINTABLE SHIPPING LABEL DIALOG OVERLAY --- */}
      {printedShipment && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 overflow-y-auto" id="label-print-modal">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 animate-fade-in relative" id="print-modal-content">
            <button 
              id="close-print-modal-btn"
              onClick={() => setPrintedShipment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              title="Close View"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">Label Station</span>
              <h3 className="text-xl font-black text-slate-900 mt-2 font-sans">Ready for Dispatch</h3>
              <p className="text-xs text-slate-500 mt-1">This label matches global multi-routing container barcode dimensions.</p>
            </div>

            {/* Actual Printable Label Container with dashed cut lines */}
            <div 
              id="print-only-container" 
              className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-400 text-slate-950 font-sans tracking-tight relative shadow-sm max-w-sm mx-auto"
            >
              <div className="flex justify-between items-center border-b-2 border-slate-950 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded bg-slate-950 flex items-center justify-center text-white">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-black tracking-wider uppercase font-sans">Crazy Courier</span>
                    <p className="text-[7px] text-slate-500 font-mono leading-none tracking-widest uppercase">Logistics Core Unit</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-slate-950 text-white px-2 py-0.5 rounded font-bold font-mono">PRIORITY DISPATCH</span>
                </div>
              </div>

              {/* Sender and Receiver details */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-dashed border-slate-300 pb-3 mb-3">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">SENDER (FROM):</p>
                  <p className="font-extrabold text-slate-900 leading-tight uppercase truncate">{printedShipment.senderName}</p>
                  <p className="text-[10px] text-slate-600 truncate mt-0.5 leading-tight">{printedShipment.senderEmail}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">RECEIVER (TO):</p>
                  <p className="font-extrabold text-slate-900 leading-tight uppercase">{printedShipment.receiverName}</p>
                  <p className="text-[10px] text-slate-600 leading-snug font-semibold mt-0.5">{printedShipment.receiverAddress}</p>
                  <p className="text-[10px] text-slate-800 font-bold mt-1">📞 {printedShipment.receiverPhone}</p>
                </div>
              </div>

              {/* Parcel stats weight price */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs border-b border-dashed border-slate-300 pb-3 mb-4 font-bold">
                <div className="border-r border-slate-200">
                  <p className="text-[8px] text-slate-400 font-bold uppercase">CARGO WEIGHT</p>
                  <p className="font-mono font-black text-xs text-slate-900 mt-0.5">{(printedShipment.weight || 2.0).toFixed(1)} KG</p>
                </div>
                <div className="border-r border-slate-200">
                  <p className="text-[8px] text-slate-400 font-bold uppercase">SHIPPING FEE</p>
                  <p className="font-mono font-black text-xs text-rose-700 mt-0.5">${(printedShipment.price || 0.0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">FEE PAYMENT</p>
                  <p className="font-sans font-black text-[9px] text-emerald-750 mt-1 uppercase leading-none">
                    {printedShipment.paid ? "● PAID VERIFIED" : "⚡ UNPAID / COD"}
                  </p>
                </div>
              </div>

              {printedShipment.deliveryHub && (
                <div className="bg-slate-50 text-slate-900 border border-slate-200 rounded p-2 mb-3 text-center">
                  <p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Route Delivery Hub (ডেলিভারি হাব)</p>
                  <p className="text-xs font-black uppercase font-mono mt-0.5">{printedShipment.deliveryHub}</p>
                </div>
              )}

              {/* Barcode representation */}
              <div className="bg-slate-50 p-3 rounded-lg flex flex-col items-center justify-center gap-1 text-center mb-1.5 border border-slate-100">
                <BarcodeSVG value={printedShipment.trackingNumber} />
                <p className="font-mono text-xs font-black tracking-widest text-slate-900 select-all">{printedShipment.trackingNumber}</p>
              </div>

              {printedShipment.merchantRef && (
                <p className="text-[8px] text-slate-400 text-center font-mono">MERCHANT REF: {printedShipment.merchantRef}</p>
              )}

              {/* Cutting and folds instructions footer */}
              <div className="border-t border-slate-200 pt-2 mt-3 text-[8px] text-slate-400 text-center leading-normal">
                <p className="font-medium italic">Cut along the dotted borders & pack firmly onto the box exterior.</p>
                <p className="font-mono mt-0.5">GENERATED SECURELY VIA SWIFT SYSTEM • {new Date(printedShipment.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Print trigger control actions */}
            <div className="flex flex-col sm:flex-row gap-2 mt-6 justify-center">
              <button 
                id="trigger-print-now-btn"
                onClick={() => {
                  window.print();
                }}
                className="bg-slate-950 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
              >
                Print Label Now File
              </button>
              <button 
                id="dismiss-label-modal-btn"
                onClick={() => setPrintedShipment(null)}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider uppercase transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aesthetic Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400" id="main-site-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-700">Crazy Courier Systems Inc.</p>
          <p className="max-w-md mx-auto text-[11px]">PCI-Compliant Sandbox Environment. Registered trademarks of Crazy Courier. Real-time courier updates automatically simulated.</p>
          <p className="font-mono text-[10px] text-slate-300">UT-TIME TRANS-GATEWAYS 2026</p>
        </div>
      </footer>

      {isScannerOpen && (
        <BarcodeScanner 
          onScan={(decodedText) => { 
            setDashboardSearchQuery(decodedText); 
            setMerchantTopSearch(decodedText); 
            setIsScannerOpen(false); 
            addToast('Barcode scan successful', 'success'); 
          }} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
      {renderToasts()}

    </div>
  );
}
