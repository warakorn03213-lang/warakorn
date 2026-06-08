import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthCard({ onLogin, onRegister, onCancel }) {
  const [mode, setMode] = useState('login'); // login, register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('กรุณากรอกชื่อ-นามสกุล');
        return;
      }
      if (password !== confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน');
        return;
      }
      
      const success = onRegister({ email, password, name });
      if (success) {
        setMode('login');
        setError('');
        alert('สมัครสมาชิกสำเร็จ! กรุณาลงชื่อเข้าใช้งาน');
      } else {
        setError('อีเมลนี้เคยลงทะเบียนไว้แล้ว');
      }
    } else {
      const success = onLogin({ email, password });
      if (!success) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-center py-12 px-6 relative transition-colors duration-200">
      


      {/* Centered Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-100/80 dark:border-slate-800/80 shadow-xl shadow-slate-100/40 dark:shadow-black/20 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-300">
        
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">BlueFolio</span>
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
        </div>

        <h2 className="text-center text-lg font-bold text-slate-800 dark:text-white tracking-tight mb-6">
          {mode === 'login' ? 'เข้าสู่ระบบคลังผลงาน' : 'สร้างบัญชีผู้ใช้งานใหม่'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/40 rounded-xl flex items-start gap-2.5 text-xs md:text-sm text-rose-600 dark:text-rose-450 animate-[fadeIn_0.2s_ease-out]">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {mode === 'register' && (
            <div className="animate-[fadeInUp_0.3s_ease-out]">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                ชื่อผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ป้อนชื่อและนามสกุล"
                  className="block w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-slate-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              อีเมลผู้ใช้
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-slate-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              รหัสผ่าน
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน 6 ตัวอักษรขึ้นไป"
                className="block w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-slate-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="animate-[fadeInUp_0.3s_ease-out]">
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="ป้อนรหัสผ่านอีกครั้ง"
                  className="block w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-slate-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-1.5 py-3 px-4 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-sm font-bold active:scale-[0.98] transition cursor-pointer"
            >
              <span>{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {mode === 'login' && (
          <div className="mt-5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-xs text-slate-500 dark:text-slate-450 text-center animate-[fadeInUp_0.4s_ease-out] space-y-1">
            <div>
              <span className="font-bold text-red-600 dark:text-red-400">Super Admin:</span>{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">admin@admin.com</span>
            </div>
            <div>
              <span className="font-bold text-amber-600 dark:text-amber-400">Admin:</span>{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">admin2@admin.com</span>
            </div>
            <div className="text-[10px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-1 mt-1">
              รหัสผ่านสำหรับทั้งสองบัญชี: <span className="font-semibold text-slate-700 dark:text-slate-300">admin123</span>
            </div>
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-xs md:text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-semibold active:scale-95 transition-all"
          >
            {mode === 'login'
              ? 'ยังไม่มีบัญชี? สมัครใช้งาน'
              : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
          </button>
        </div>

      </div>
    </div>
  );
}
