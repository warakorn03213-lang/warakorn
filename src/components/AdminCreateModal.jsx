import React, { useState, useEffect } from 'react';
import { X, Shield, Mail, Lock, User as UserIcon } from 'lucide-react';

export default function AdminCreateModal({ isOpen, onClose, onSave, users }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    // Check if email already exists
    const emailExists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      setError('อีเมลนี้ถูกใช้งานในระบบแล้ว');
      return;
    }

    onSave({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/15 dark:bg-slate-950/35 backdrop-blur-[2px] opacity-0 animate-overlay"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 max-w-md w-full relative z-10 p-7 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-350">
        
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-450 animate-scale-in">
              {error}
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">ชื่อแสดงผล / ชื่อ-นามสกุล</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon size={16} />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น แอดมินสมยศ"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 focus:border-slate-400 dark:focus:border-slate-700 outline-none placeholder-slate-400 dark:placeholder-slate-550 transition"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">อีเมลล็อกอิน</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="เช่น admin3@admin.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 focus:border-slate-400 dark:focus:border-slate-700 outline-none placeholder-slate-400 dark:placeholder-slate-550 transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">รหัสผ่าน</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 focus:border-slate-400 dark:focus:border-slate-700 outline-none placeholder-slate-400 dark:placeholder-slate-550 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 font-bold rounded-xl text-xs transition duration-150 cursor-pointer active:scale-95"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition duration-150 cursor-pointer active:scale-95 shadow-sm shadow-amber-500/10"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
