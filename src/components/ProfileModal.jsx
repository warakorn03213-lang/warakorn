import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, AlertCircle, FileText, Globe, ZoomIn, ZoomOut, Move } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, onSave, currentUser }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [error, setError] = useState('');

  const [avatarFile, setAvatarFile] = useState(null);

  // Crop Flow States
  const [cropSource, setCropSource] = useState('');
  const [isCropping, setIsCropping] = useState(false);
  const [imageAspect, setImageAspect] = useState('landscape');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setAvatar(currentUser.avatar || '');
      setBio(currentUser.bio || '');
      setSocialLink(currentUser.socialLink || '');
    }
    setAvatarFile(null);
    setCropSource('');
    setIsCropping(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setImageAspect('landscape');
  }, [currentUser, isOpen]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดรูปภาพต้องไม่เกิน 5 MB');
      return;
    }
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSource(reader.result);
      setIsCropping(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth > naturalHeight) {
      setImageAspect('landscape');
    } else {
      setImageAspect('portrait');
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - offset.x,
      y: e.touches[0].clientY - offset.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleCancelCrop = () => {
    setCropSource('');
    setIsCropping(false);
  };

  const handleConfirmCrop = () => {
    if (imgRef.current && containerRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      const containerRect = containerRef.current.getBoundingClientRect();
      const imgRect = imgRef.current.getBoundingClientRect();
      const img = imgRef.current;

      const sX = (containerRect.left - imgRect.left) * (img.naturalWidth / imgRect.width);
      const sY = (containerRect.top - imgRect.top) * (img.naturalHeight / imgRect.height);
      const sWidth = containerRect.width * (img.naturalWidth / imgRect.width);
      const sHeight = containerRect.height * (img.naturalHeight / imgRect.height);

      ctx.drawImage(img, sX, sY, sWidth, sHeight, 0, 0, 256, 256);

      canvas.toBlob((blob) => {
        const croppedFile = new File([blob], 'avatar.png', { type: 'image/png' });
        const croppedUrl = URL.createObjectURL(blob);
        setAvatar(croppedUrl);
        setAvatarFile(croppedFile);
        setIsCropping(false);
      }, 'image/png');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('กรุณากรอกชื่อผู้แสดงตัวตน');
      return;
    }

    onSave({ 
      name: trimmedName, 
      avatar, 
      bio: bio.trim(), 
      socialLink: socialLink.trim() 
    }, avatarFile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/15 dark:bg-slate-950/35 backdrop-blur-[2px] opacity-0 animate-overlay"
        onClick={onClose}
      />

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 max-w-sm w-full relative z-10 p-7 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-300">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">แก้ไขโปรไฟล์</h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full transition-colors active:scale-90 cursor-pointer"
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

        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center">
          
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative select-none">
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

          <div className="w-full">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 text-left">ชื่อผู้แสดงตัวตน</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ชื่อของคุณ"
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-slate-400 dark:focus:border-slate-600 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
            />
          </div>

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
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-slate-400 dark:focus:border-slate-600 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors resize-none"
            />
          </div>

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
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-slate-400 dark:focus:border-slate-600 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
            />
          </div>

          <div className="flex gap-3 w-full pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-900 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-sm font-bold active:scale-[0.98] transition cursor-pointer shadow-sm"
            >
              บันทึก
            </button>
          </div>

        </form>
      </div>

      {/* --- PREMIUM DEDICATED IMAGE CROP OVERLAY (Google Style) --- */}
      {isCropping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[36px] p-6 max-w-sm w-full shadow-2xl flex flex-col items-center animate-scale-in">
            
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">ปรับตำแหน่งและขนาดรูปโปรไฟล์</h4>
            <p className="text-[11px] text-slate-400 mb-6 text-center">คลิกค้างแล้วลากรูปเพื่อขยับตำแหน่งที่ต้องการแสดงผล</p>

            {/* Interactive Crop Frame */}
            <div className="w-[240px] h-[240px] bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden relative select-none border border-slate-100 dark:border-slate-800/80 shadow-inner flex items-center justify-center">
              
              {/* Drag/Interactive Area */}
              <div 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className="absolute inset-0 flex items-center justify-center cursor-move"
              >
                <img 
                  ref={imgRef}
                  src={cropSource} 
                  alt="Crop Target" 
                  onLoad={handleImageLoad}
                  className="max-w-none pointer-events-none select-none max-h-none absolute"
                  style={{
                    width: imageAspect === 'landscape' ? 'auto' : '240px',
                    height: imageAspect === 'landscape' ? '240px' : 'auto',
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease'
                  }}
                />
              </div>

              {/* circular mask overlay: Box-shadow cheat to darken outside 160px crop circle */}
              <div 
                ref={containerRef}
                className="w-[160px] h-[160px] rounded-full border-2 border-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]"
              />
            </div>

            {/* Zoom Slider Control */}
            <div className="w-full mt-6 mb-8 flex items-center gap-3 px-2">
              <ZoomOut size={16} className="text-slate-400" />
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.02" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <ZoomIn size={16} className="text-slate-400" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-md shadow-blue-500/10"
              >
                ใช้รูปนี้
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
