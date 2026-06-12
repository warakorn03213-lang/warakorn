import React, { useState, useEffect } from 'react';
import { X, Shield, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function AdminCreateModal({ isOpen, onClose, onSave, users }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    const isEmailTaken = users.some(u => u.email.toLowerCase() === trimmedEmail);
    if (isEmailTaken) {
      setError('อีเมลนี้ถูกใช้งานในระบบแล้ว');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSave({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/15 dark:bg-slate-950/35 backdrop-blur-[2px] opacity-0 animate-overlay"
        onClick={onClose}
      />

      <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 max-w-md w-full relative z-10 p-7 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-300">
        
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Shield size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">เพิ่มผู้ดูแลระบบใหม่</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 animate-scale-in">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ชื่อแสดงผล / ชื่อ-นามสกุล</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon size={16} />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น แอดมินสมยศ"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 focus:border-slate-400 dark:focus:border-slate-700 outline-none placeholder-slate-400 dark:placeholder-slate-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">อีเมลล็อกอิน</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น admin3@admin.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 focus:border-slate-500 dark:focus:border-slate-700 outline-none placeholder-slate-400 dark:placeholder-slate-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">รหัสผ่าน</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 focus:border-slate-500 dark:focus:border-slate-700 outline-none placeholder-slate-400 dark:placeholder-slate-500 transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition duration-150 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition duration-150 cursor-pointer active:scale-95 shadow-sm shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
