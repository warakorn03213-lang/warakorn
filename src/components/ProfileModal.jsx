import React, { useState, useEffect } from 'react';
import { X, Camera, AlertCircle, FileText, Globe } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, onSave, currentUser }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setAvatar(currentUser.avatar || '');
      setBio(currentUser.bio || '');
      setSocialLink(currentUser.socialLink || '');
    }
  }, [currentUser, isOpen]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 400 * 1024) {
      setError('ขนาดรูปภาพต้องไม่เกิน 400 KB เพื่อความรวดเร็วในการโหลด');
      return;
    }
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณากรอกชื่อผู้แสดงตัวตน');
      return;
    }
    onSave({ 
      name: name.trim(), 
      avatar, 
      bio: bio.trim(), 
      socialLink: socialLink.trim() 
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/15 dark:bg-slate-950/35 backdrop-blur-[2px] opacity-0 animate-overlay"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 max-w-sm w-full relative z-10 p-7 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-350">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">แก้ไขโปรไฟล์</h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 rounded-full transition-colors active:scale-90 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 animate-[fadeIn_0.2s_ease-out]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
          
          {/* Avatar edit circle */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-slate-400 dark:text-slate-600">
                  {name ? name[0].toUpperCase() : 'U'}
                </span>
              )}
            </div>
            
            <label className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-bold">
              <Camera size={18} className="mb-1" />
              <span>เปลี่ยนรูป</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Name input */}
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-left">ชื่อผู้แสดงตัวตน</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ชื่อของคุณ"
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-slate-450 dark:focus:border-slate-650 outline-none text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
            />
          </div>


          {/* Bio input */}
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-left flex items-center gap-1.5">
              <FileText size={12} />
              <span>ประวัติย่อ (Bio)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="แนะนำตัวเองสั้นๆ เกี่ยวกับตัวคุณและผลงานของคุณ"
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-slate-450 dark:focus:border-slate-650 outline-none text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors resize-none"
            />
          </div>

          {/* Social Links input */}
          <div className="w-full">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-left flex items-center gap-1.5">
              <Globe size={12} />
              <span>ลิงก์สำหรับติดต่อ (Website / Social Link)</span>
            </label>
            <input
              type="text"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              placeholder="เช่น github.com/username หรือ fb.com/name"
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-slate-450 dark:focus:border-slate-650 outline-none text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-850 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-sm font-bold active:scale-[0.98] transition cursor-pointer shadow-sm"
            >
              บันทึก
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
