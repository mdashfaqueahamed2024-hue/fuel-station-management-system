import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

export const AnomaliesAlerts = () => {
  const { activeStationId } = useStation();
  const { isManager } = useAuth();
  const toast = useToast();

  const [anomalies, setAnomalies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anomRes, alertRes] = await Promise.all([
        api.get('/anomalies/anomalies'),
        api.get('/anomalies/alerts'),
      ]);
      setAnomalies(anomRes.data || []);
      setAlerts(alertRes.data || []);
    } catch (err) {
      toast.error('Failed to load anomaly telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeStationId]);

  const handleResolveAlert = async (id) => {
    try {
      await api.patch(`/anomalies/alerts/${id}/resolve`);
      toast.success('Alert marked as RESOLVED.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Resolve failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Intelligent Anomaly Detection & Operational Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule-based algorithmic heuristics scanning for cash variances, meter slips, shrinkage, and prolonged shifts
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} isLoading={loading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Re-scan Station Heuristics
        </Button>
      </div>

      {/* Academic Heuristic Notice */}
      <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <b>Operational Anomaly Heuristic Disclaimer:</b> Flagged items represent mathematical and statistical outliers requiring human managerial review. They do not constitute conclusive proof of fraudulent conduct. Potential causes include ambient thermal expansion, dispenser pulse meter slippage, transit evaporation, and legitimate rounding variances.
        </div>
      </div>

      {/* Algorithmic Anomaly Scanner Feed */}
      <Card>
        <CardHeader
          title="Rule-Based Operational Anomaly Detection Feed"
          subtitle="Real-time heuristic evaluation across sales, shifts, mechanical counters, and inventory"
        />
        <div className="p-5 space-y-4">
          {anomalies.length > 0 ? (
            anomalies.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      item.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : item.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      <Badge
                        variant={
                          item.severity === 'CRITICAL'
                            ? 'danger'
                            : item.severity === 'HIGH'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {item.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                      {item.explanation}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Rule Type: <span className="font-mono text-slate-600">{item.type}</span> • Timestamp: {new Date(item.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-xs text-slate-400 flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <span>All station telemetry within normal calibrated operating tolerances.</span>
            </div>
          )}
        </div>
      </Card>

      {/* System Alerts Feed */}
      <Card>
        <CardHeader
          title="Active System Notifications & Low-Stock Alerts"
          subtitle="Stateful operational alerts requiring resolution by station managers"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Created</th>
                <th className="p-3">Type</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Alert Notice</th>
                <th className="p-3">Status</th>
                {isManager && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.length > 0 ? (
                alerts.map((al) => (
                  <tr key={al.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-slate-500">
                      {new Date(al.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-700">{al.alertType}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          al.severity === 'CRITICAL'
                            ? 'danger'
                            : al.severity === 'HIGH'
                            ? 'warning'
                            : 'primary'
                        }
                      >
                        {al.severity}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{al.title}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{al.message}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant={al.status === 'ACTIVE' ? 'danger' : 'success'}>
                        {al.status}
                      </Badge>
                    </td>
                    {isManager && (
                      <td className="p-3 text-right">
                        {al.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolveAlert(al.id)}
                          >
                            Mark Resolved
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Resolved</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-xs text-slate-400">
                    No active notifications.
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
