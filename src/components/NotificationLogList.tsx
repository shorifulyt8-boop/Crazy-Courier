import React, { useState, useEffect } from 'react';
import { NotificationLog } from '../types.js';
import { Mail, Check, Calendar, ArrowRight, ArrowLeftRight, Trash2 } from 'lucide-react';

interface NotificationLogListProps {
  emailFilter?: string; // Optional filter for current customer email
}

export default function NotificationLogList({ emailFilter }: NotificationLogListProps) {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = emailFilter 
        ? `/api/notifications/logs?email=${encodeURIComponent(emailFilter)}`
        : '/api/notifications/logs';
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load dispatch emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Periodically fetch to simulate live notification delivery!
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [emailFilter]);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="notification-logs">
      <div className="border-b border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5" id="notification-inbox-title">
            <Mail className="w-4 h-4 text-emerald-600" /> 
            Email Notification logs & Alerts
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {emailFilter 
              ? `Simulated automated SMTP status emails sent to "${emailFilter}"`
              : 'Enterprise dispatch notification pipeline records'}
          </p>
        </div>
        <button 
          id="refresh-logs-btn"
          onClick={fetchLogs} 
          className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition"
        >
          Check Inbox
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 min-h-[350px]">
        {/* Inbox Left Column (Headers) */}
        <div className="md:col-span-2 border-r border-slate-100 divide-y divide-slate-50 max-h-[450px] overflow-y-auto" id="notification-logs-list-column">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading inbox queue...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No email alerts sent yet. Try changing tracking status!</div>
          ) : (
            logs.map((log) => (
              <button
                key={log.id}
                id={`email-log-item-${log.id}`}
                onClick={() => setSelectedLog(log)}
                className={`w-full text-left p-3.5 hover:bg-slate-50 transition block ${
                  selectedLog?.id === log.id ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : ''
                }`}
              >
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {log.trackingNumber}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 mt-1.5 truncate">{log.subject}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{log.content.replace(/\n/g, ' ')}</p>
                <p className="text-[10px] text-indigo-600 mt-1 font-medium">To: {log.email}</p>
              </button>
            ))
          )}
        </div>

        {/* Message Right View (Detail) */}
        <div className="md:col-span-3 p-5 bg-slate-50/30 flex flex-col justify-between" id="notification-detail-column">
          {selectedLog ? (
            <div className="space-y-4 animate-fade-in" id="notification-item-dialog">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Mime-SMTP Sim Client
                </span>
                <h4 className="text-sm font-bold text-slate-800 mt-2">{selectedLog.subject}</h4>
                
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 mt-2">
                  <p><strong>From:</strong> Swift Courier System &lt;no-reply@swiftcourier.com&gt;</p>
                  <p><strong>To:</strong> {selectedLog.email}</p>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  <strong>Date:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed max-h-[250px] overflow-y-auto">
                {selectedLog.content}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>
                  This notification was triggered automatically upon status event mapping. Customers receive immediate updates in production environments.
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center justify-center h-full space-y-2">
              <Mail className="w-8 h-8 text-slate-300" />
              <p className="font-semibold">Email Delivery Preview</p>
              <p className="max-w-[180px] text-[11px]">Select any notification log from the left index panel to inspect email body details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
