import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Flame, Lock, Mail, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export const Login = () => {
  const [email, setEmail] = useState('admin@petroflow.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back! Logged in successfully.');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing ambient effects */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 mb-4">
          <Flame className="w-8 h-8 text-amber-300 fill-amber-300" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">PetroFlow Enterprise</h2>
        <p className="mt-1 text-xs text-slate-400">
          Intelligent Fuel Inventory, Pump Operations & Business Analytics System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Sign in to station workspace</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enter authorized operational credentials</p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@petroflow.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              Sign In to Station
            </Button>
          </form>

          {/* Quick Demo Credentials Autofill Helper */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Quick Demonstration Roles (Click to Autofill):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('admin@petroflow.com', 'Admin@123')}
                className="p-2 rounded-lg border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-[11px] font-bold text-slate-900 group-hover:text-blue-600">Admin</div>
                <div className="text-[9px] text-slate-400 truncate">Full Control</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('manager@petroflow.com', 'Manager@123')}
                className="p-2 rounded-lg border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-[11px] font-bold text-slate-900 group-hover:text-blue-600">Manager</div>
                <div className="text-[9px] text-slate-400 truncate">Operations</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('attendant@petroflow.com', 'Attendant@123')}
                className="p-2 rounded-lg border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="text-[11px] font-bold text-slate-900 group-hover:text-blue-600">Attendant</div>
                <div className="text-[9px] text-slate-400 truncate">POS Dispenser</div>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          Protected by Enterprise Argon2/bcrypt Hashing, Rate Limiting & Audit Logging.
        </p>
      </div>
    </div>
  );
};
