import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Gauge, CheckCircle2, Wrench, AlertTriangle, Plus, Power } from 'lucide-react';

export const PumpsAndMeters = () => {
  const { activeStationId } = useStation();
  const { isManager } = useAuth();
  const toast = useToast();

  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Meter Reading Modal State
  const [selectedPump, setSelectedPump] = useState(null);
  const [meterForm, setMeterForm] = useState({
    readingType: 'AUDIT',
    readingValue: '',
    notes: '',
  });
  const [meterSubmitting, setMeterSubmitting] = useState(false);

  const fetchPumps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/pumps');
      setPumps(res.data || []);
    } catch (err) {
      toast.error('Failed to load pumps data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPumps();
  }, [activeStationId]);

  const handleToggleStatus = async (pump) => {
    const nextStatus = pump.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await api.patch(`/pumps/${pump.id}/status`, { status: nextStatus });
      toast.success(`Pump ${pump.pumpNumber} status set to ${nextStatus}.`);
      fetchPumps();
    } catch (err) {
      toast.error(err.message || 'Status change failed');
    }
  };

  const handleOpenMeterModal = (pump) => {
    setSelectedPump(pump);
    const lastVal = pump.meterReadings?.[0]?.readingValue || pump.totalLifetimeLiters || 0;
    setMeterForm({
      readingType: 'AUDIT',
      readingValue: Number(lastVal).toFixed(2),
      notes: '',
    });
  };

  const handleLogMeter = async (e) => {
    e.preventDefault();
    setMeterSubmitting(true);
    try {
      await api.post('/pumps/meter-readings', {
        pumpId: selectedPump.id,
        readingType: meterForm.readingType,
        readingValue: parseFloat(meterForm.readingValue),
        notes: meterForm.notes,
      });
      toast.success('Meter reading successfully committed.');
      setSelectedPump(null);
      fetchPumps();
    } catch (err) {
      toast.error(err.message || 'Failed to record meter reading');
    } finally {
      setMeterSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pumps & Mechanical Meter Readings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor dispenser nozzle status, lifetime throughput, and manual mechanical counter audits
          </p>
        </div>
      </div>

      {/* Pumps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {pumps.map((pump) => {
          const fuel = pump.tank?.fuelProduct;
          const isDown = pump.status === 'MAINTENANCE';
          const latestReading = pump.meterReadings?.[0];

          return (
            <Card key={pump.id} className="flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{pump.pumpNumber}</h3>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {pump.pumpName}
                      </div>
                    </div>
                  </div>
                  <Badge variant={isDown ? 'danger' : 'success'}>
                    {pump.status}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Connected Fuel & Tank</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fuel?.colorCode }} />
                      <span>{fuel?.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Source: {pump.tank?.tankNumber}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Total Lifetime Liters:</span>
                      <span className="font-bold text-slate-900">
                        {Number(pump.totalLifetimeLiters).toLocaleString()} L
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latest Meter Dip:</span>
                      <span className="font-mono font-semibold">
                        {latestReading ? `${Number(latestReading.readingValue).toLocaleString()} L` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenMeterModal(pump)}
                >
                  Log Reading
                </Button>
                {isManager && (
                  <Button
                    variant={isDown ? 'success' : 'danger'}
                    size="sm"
                    onClick={() => handleToggleStatus(pump)}
                    title="Toggle Operational Status"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Meter Reading Audit Modal */}
      <Modal
        isOpen={!!selectedPump}
        onClose={() => setSelectedPump(null)}
        title={`Log Meter Reading: ${selectedPump?.pumpNumber}`}
        subtitle="Records mechanical totalizer value to cross-examine POS digital volume"
      >
        <form onSubmit={handleLogMeter} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reading Classification
            </label>
            <select
              value={meterForm.readingType}
              onChange={(e) => setMeterForm({ ...meterForm, readingType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="AUDIT">Periodic Routine Audit Inspection</option>
              <option value="OPENING">Shift Opening Totalizer Reading</option>
              <option value="CLOSING">Shift Closing Totalizer Reading</option>
              <option value="RESET">Authorized Totalizer Meter Replacement / Hardware Reset</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Totalizer Mechanical Counter Reading (Liters)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={meterForm.readingValue}
              onChange={(e) => setMeterForm({ ...meterForm, readingValue: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Counter cannot decrease from previous value unless performing an authorized RESET.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observation Notes
            </label>
            <textarea
              rows="2"
              value={meterForm.notes}
              onChange={(e) => setMeterForm({ ...meterForm, notes: e.target.value })}
              placeholder="e.g. Totalizer seal intact, nozzle calibration check passed..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setSelectedPump(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={meterSubmitting}>
              Commit Reading
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
