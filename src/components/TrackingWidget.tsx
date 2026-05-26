import React from 'react';
import { Shipment, ShipmentStatus } from '../types.js';
import { Package, Truck, CheckCircle2, Clock, MapPin, Calendar, FileText, ArrowUpRight } from 'lucide-react';

interface TrackingWidgetProps {
  shipment: Shipment;
  onClose?: () => void;
}

export default function TrackingWidget({ shipment, onClose }: TrackingWidgetProps) {
  // Status check helpers
  const getStatusStep = (status: ShipmentStatus) => {
    switch (status) {
      case 'Pending': return 1;
      case 'In Transit': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      case 'Cancelled': return 0;
      default: return 1;
    }
  };

  const steps = [
    { title: 'Registered', desc: 'Awaiting dispatch', icon: FileText, step: 1 },
    { title: 'In Transit', desc: 'Moving between hubs', icon: Truck, step: 2 },
    { title: 'Out for Delivery', desc: 'With local carrier', icon: Package, step: 3 },
    { title: 'Delivered', desc: 'Securely received', icon: CheckCircle2, step: 4 },
  ];

  const currentStep = getStatusStep(shipment.status);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 max-w-2xl w-full mx-auto" id="tracking-widget-card">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {shipment.status}
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-2 flex items-center gap-1.5" id="tracking-number-title">
            Tracking #: <span className="font-mono text-emerald-600 select-all">{shipment.trackingNumber}</span>
          </h3>
        </div>
        {onClose && (
          <button 
            id="close-tracking-btn"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Basic info bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl mb-6 text-sm" id="tracking-summary-panel">
        <div>
          <p className="text-slate-400 text-xs">Estimated Delivery</p>
          <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {new Date(shipment.estimatedDelivery).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Weight</p>
          <p className="font-semibold text-slate-800 mt-0.5">{shipment.weight} kg</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Payment State</p>
          <p className="font-semibold text-slate-800 mt-0.5">
            <span className={`px-2 py-0.5 text-xs rounded-md ${shipment.paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {shipment.paid ? 'Paid' : 'Unpaid'}
            </span>
          </p>
        </div>
        <div>
          <p className="text-slate-400 text-xs">Price Fee</p>
          <p className="font-semibold text-slate-800 mt-0.5">${shipment.price}</p>
        </div>
      </div>

      {/* Progress pipeline */}
      {shipment.status !== 'Cancelled' ? (
        <div className="relative mb-8 px-2" id="tracking-progress-steps">
          <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 -z-10 hidden md:block"></div>
          <div 
            className="absolute top-5 left-8 h-1 bg-emerald-500 -z-10 transition-all duration-500 hidden md:block" 
            style={{ width: `${(Math.max(0, currentStep - 1) / 3) * 85}%` }}
          ></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((st) => {
              const Icon = st.icon;
              const isCompleted = currentStep >= st.step;
              const isCurrent = currentStep === st.step;
              
              return (
                <div key={st.step} className="flex md:flex-col items-center gap-3 md:gap-2 text-left md:text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'bg-white border-slate-200 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-emerald-100 shadow-smScale' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>{st.title}</p>
                    <p className="text-[10px] text-slate-400 hidden md:block">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-xl text-center flex items-center justify-center gap-2" id="shipment-cancelled-banner">
          <Clock className="w-5 h-5 text-red-500" />
          <span className="font-semibold">This shipment was cancelled.</span>
        </div>
      )}

      {/* Logistics timeline events */}
      <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-1">
        <span>Logistics Activity Log</span>
        <span className="text-xs font-normal text-slate-400">({shipment.updates.length} events)</span>
      </h4>
      <div className="relative border-l-2 border-slate-200 pl-8 ml-3 space-y-8" id="tracking-timeline-history">
        {shipment.updates.slice().reverse().map((update, index) => {
          const isLatest = index === 0;
          const updateDate = new Date(update.timestamp);
          return (
            <div key={update.id || index} className="group relative -ml-1 transition flex hover:bg-slate-50 p-3 -mx-3 rounded-xl cursor-default" id={`timeline-item-${index}`}>
              {/* Timeline dot */}
              <div className={`absolute -left-[43px] top-4 w-7 h-7 rounded-full flex items-center justify-center border-4 ${
                isLatest ? 'bg-emerald-500 border-white ring-4 ring-emerald-100 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500 transition-colors'
              }`}>
                {isLatest ? <Truck className="w-3.5 h-3.5" /> : <MapPin className="w-3 h-3" />}
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-emerald-700 transition">
                    {update.location}
                    {isLatest && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ml-2 shadow-sm">Current</span>}
                  </span>
                  
                  {/* Detailed timestamp with hover effect to reveal seconds or subtext */}
                  <div className="relative flex flex-col text-right">
                    <span className="text-[11px] font-bold text-slate-400 font-mono group-hover:text-slate-600 transition">
                      {updateDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono group-hover:text-emerald-600 transition font-semibold">
                      {updateDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed group-hover:text-slate-700 transition">{update.description}</p>
                
                {isLatest && shipment.courierNotes && (
                  <div className="mt-3 text-xs bg-amber-50 text-amber-800 border border-amber-200/60 rounded-lg p-3 italic shadow-sm flex items-start gap-2">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span><strong>Notes:</strong> {shipment.courierNotes}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shipment details */}
      <div className="mt-8 border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs" id="shipment-addresses-panel">
        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
          <p className="font-bold text-slate-800 mb-1.5 uppercase tracking-wide">Sender info</p>
          <p className="font-semibold text-slate-700">{shipment.senderName}</p>
          <p className="text-slate-500">{shipment.senderEmail}</p>
        </div>
        <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
          <p className="font-bold text-slate-800 mb-1.5 uppercase tracking-wide">Receiver Delivery Address</p>
          <p className="font-semibold text-slate-700">{shipment.receiverName}</p>
          <p className="text-slate-500">{shipment.receiverPhone}</p>
          <p className="text-slate-600 mt-1 font-medium">{shipment.receiverAddress}</p>
          {shipment.deliveryHub && (
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-semibold uppercase tracking-wide">Delivery Hub:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{shipment.deliveryHub}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
