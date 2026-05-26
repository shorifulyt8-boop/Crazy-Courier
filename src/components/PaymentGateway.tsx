import React, { useState } from 'react';
import { Shipment } from '../types.js';
import { CreditCard, Shield, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

interface PaymentGatewayProps {
  shipment: Shipment;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentGateway({ shipment, onPaymentSuccess, onCancel }: PaymentGatewayProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'wire'>('card');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/shipments/${shipment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: paymentMethod === 'card' ? 'Secure Credit Card Simulator' : paymentMethod === 'wallet' ? 'Secure Digital Wallet Simulator' : 'Bank Wire Transfer Simulator',
          cardHolder: paymentMethod === 'card' ? cardHolder : 'Simulated Wallet User',
          cardNumber: paymentMethod === 'card' ? cardNumber : 'WALLET-SIM-9992'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process security authorization transaction.');
      }

      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during transaction routing.');
    } finally {
      setLoading(false);
    }
  };

  const formattedCardNumber = cardNumber
    ? cardNumber.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()
    : '•••• •••• •••• ••••';

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 max-w-xl w-full mx-auto shadow-2xl relative overflow-hidden" id="payment-gateway-wrapper">
      {/* Background aesthetic blobs */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>

      {success ? (
        <div className="py-12 text-center animate-fade-in" id="payment-success-screen">
          <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Payment Authorized!</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-4">
            Shipping fees of <strong>${shipment.price}</strong> have been settled securely. Shipment {shipment.trackingNumber} has been updated to Transit.
          </p>
          <p className="text-emerald-400 text-xs font-mono flex items-center justify-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Reloading system dashboard...
          </p>
        </div>
      ) : (
        <div id="payment-form-container">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-emerald-400 w-5 h-5" /> CodeSecure Gateway
              </h3>
              <p className="text-xs text-slate-400 mt-1">Authorized Courier Clearing House System</p>
            </div>
            <button 
              id="payment-cancel-btn"
              onClick={onCancel} 
              className="text-slate-400 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 bg-white/5 p-4 rounded-xl text-sm" id="payment-item-summary">
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider block">Shipment Number</span>
              <span className="font-mono text-emerald-400 font-semibold">{shipment.trackingNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-xs uppercase tracking-wider block">Total Shipping Fee</span>
              <span className="text-lg font-bold">${shipment.price}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2 mb-6" id="payment-method-selector">
            {(['card', 'wallet', 'wire'] as const).map((method) => (
              <button
                key={method}
                id={`pay-method-${method}`}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-1 sm:px-3 rounded-lg text-[10px] sm:text-xs font-semibold border transition ${
                  paymentMethod === method
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {method === 'card' ? 'Credit Card' : method === 'wallet' ? 'E-Wallet' : 'Bank Transfer'}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-500/20 text-red-300 rounded-lg text-xs border border-red-500/30 font-medium">
              Error: {error}
            </div>
          )}

          <form onSubmit={handlePay} className="space-y-4" id="payment-gateway-form">
            {paymentMethod === 'card' ? (
              <div className="space-y-4">
                {/* Visual Credit Card Preview */}
                <div className="bg-gradient-to-tr from-emerald-600 via-teal-700 to-blue-700 rounded-2xl p-5 shadow-lg relative min-h-[160px] flex flex-col justify-between mb-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold tracking-widest text-emerald-300 font-mono">SWIFT-PAY CHIP</span>
                    <CreditCard className="w-8 h-8 text-white/80" />
                  </div>
                  <div>
                    <div className="text-lg md:text-xl font-mono tracking-widest text-white/95 select-none" id="card-preview-number">
                      {formattedCardNumber}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[9px] text-white/50 block font-mono">CARDHOLDER</span>
                      <span className="text-xs font-mono tracking-wider text-white uppercase truncate max-w-[200px]" id="card-preview-holder">
                        {cardHolder || 'Your Name'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-white/50 block font-mono">EXPIRES</span>
                      <span className="text-xs font-mono tracking-wider text-white" id="card-preview-expiry">
                        {expiry || 'MM/YY'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                  <input
                    id="card-holder-input"
                    type="text"
                    required
                    placeholder="e.g. Shoriful Islam"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                  <input
                    id="card-number-input"
                    type="text"
                    required
                    pattern="[0-9s ]{12,19}"
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                    <input
                      id="card-expiry-input"
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">CVV / CVC</label>
                    <input
                      id="card-cvv-input"
                      type="password"
                      required
                      placeholder="•••"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-emerald-500 text-white placeholder-slate-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : paymentMethod === 'wallet' ? (
              <div className="p-6 bg-white/5 rounded-xl text-center space-y-3" id="wallet-checkout-panel">
                <span className="text-sm text-slate-300 block">Select Your Preferred Simulated E-Wallet</span>
                <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                  <div className="p-3 bg-white/5 hover:bg-emerald-500/10 rounded-xl cursor-not-allowed border border-white/10 flex items-center justify-center font-bold text-emerald-400">bKash</div>
                  <div className="p-3 bg-white/5 hover:bg-emerald-500/10 rounded-xl cursor-not-allowed border border-white/10 flex items-center justify-center font-bold text-blue-400">PayPal</div>
                  <div className="p-3 bg-white/5 hover:bg-emerald-500/10 rounded-xl cursor-not-allowed border border-white/10 flex items-center justify-center font-bold text-purple-400">Rocket</div>
                  <div className="p-3 bg-white/5 hover:bg-emerald-500/10 rounded-xl cursor-not-allowed border border-white/10 flex items-center justify-center font-bold text-rose-400">Nagad</div>
                </div>
                <p className="text-[11px] text-slate-500">Wallet clearing triggers instantly on secure simulated settlement engine.</p>
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-xl text-xs space-y-2 text-slate-300 font-mono" id="bank-wire-panel">
                <p className="font-bold text-white uppercase">Swift Courier Service Routing Details:</p>
                <p>Bank Name: Clear-Settlement National Bank</p>
                <p>AC Name: Swift Courier Logistics LLC</p>
                <p>Account ID: 1099-2810-3331-4</p>
                <p>Routing Code: 120993881</p>
                <p className="text-amber-300">Note: Simulation immediately verifies mock wires here.</p>
              </div>
            )}

            <button
              id="submit-payment-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition py-3 rounded-xl font-bold text-sm tracking-wide mt-6 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Bank Security Rails...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 fill-current" /> Authorize Secure Payment of ${shipment.price}
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-500 mt-6 flex items-center justify-center gap-1.5" id="security-badge-footer">
            <Lock className="w-3 h-3 text-slate-400" /> Fully Encrypted AES-256 Transport • PCI-DSS Compliant Simulation Sandbox
          </p>
        </div>
      )}
    </div>
  );
}
