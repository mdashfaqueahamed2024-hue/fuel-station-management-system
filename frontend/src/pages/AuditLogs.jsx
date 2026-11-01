import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { History, Shield, Filter, Search } from 'lucide-react';

export const AuditLogs = () => {
  const { activeStationId } = useStation();
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        action: actionFilter,
        entityType: entityFilter,
        limit: 100,
      });
      setLogs(res.data?.logs || []);
    } catch (err) {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeStationId, actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Immutable Audit Trail & System Event Journal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-resistant audit record of financial transactions, price updates, stock adjustments, and logins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-700 bg-white"
          >
            <option value="">All Audited Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="SALE_CREATE">SALE_CREATE</option>
            <option value="SALE_REVERSE">SALE_REVERSE</option>
            <option value="PRICE_UPDATE">PRICE_UPDATE</option>
            <option value="STOCK_ADJUST">STOCK_ADJUST</option>
            <option value="DELIVERY_CONFIRM">DELIVERY_CONFIRM</option>
            <option value="SHIFT_OPEN">SHIFT_OPEN</option>
            <option value="SHIFT_CLOSE">SHIFT_CLOSE</option>
            <option value="EXPENSE_REVIEW">EXPENSE_REVIEW</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Security Event Ledger"
          subtitle="All entries include cryptographic timestamps, actor credentials, and before-and-after state changes"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Entity ID</th>
                <th className="p-3">State Changes / Detail</th>
                <th className="p-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-slate-500 font-sans">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-semibold font-sans text-slate-900">
                      {log.actorName}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {log.user?.role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          log.action.includes('REVERSE')
                            ? 'danger'
                            : log.action.includes('PRICE')
                            ? 'warning'
                            : log.action.includes('CONFIRM')
                            ? 'success'
                            : 'primary'
                        }
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-700 font-sans font-medium">{log.entityType}</td>
                    <td className="p-3 text-slate-400 truncate max-w-[100px]">{log.entityId || '—'}</td>
                    <td className="p-3 text-slate-600 max-w-sm font-sans truncate">
                      {log.afterState ? log.afterState : log.beforeState || 'State transition verified'}
                    </td>
                    <td className="p-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-xs text-slate-400 font-sans">
                    No audit records matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
