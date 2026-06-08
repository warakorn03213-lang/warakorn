import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose, onSave, editingItem }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('image'); // image, video, document
  const [uploadMode, setUploadMode] = useState('upload'); // upload, url
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setDescription(editingItem.description || '');
      setType(editingItem.type || 'image');
      setFileUrl(editingItem.fileUrl || '');
      setFileName(editingItem.fileName || '');
      setFileSize(editingItem.fileSize || '');
      setTagsInput(editingItem.tags ? editingItem.tags.map(tag => `#${tag}`).join(' ') : '');
      setUploadMode(editingItem.fileUrl && editingItem.fileUrl.startsWith('data:') || editingItem.fileUrl.startsWith('blob:') ? 'upload' : 'url');
    } else {
      setTitle('');
      setDescription('');
      setType('image');
      setUploadMode('upload');
      setFileUrl('');
      setFileName('');
      setFileSize('');
      setTagsInput('');
    }
    setError('');
  }, [editingItem, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);

    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);

    if (file.type.startsWith('image/') && file.size < 1.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('กรุณากรอกชื่อผลงาน');
      return;
    }

    if (!fileUrl) {
      setError('กรุณาเลือกไฟล์อัปโหลดหรือระบุลิงก์ตรงสำหรับผลงาน');
      return;
    }

    let tags = [];
    if (tagsInput.trim()) {
      const words = tagsInput.trim().split(/[\s,]+/).filter(w => w !== '');
      const invalidWords = words.filter(w => !w.startsWith('#') || w === '#');
      if (invalidWords.length > 0) {
        setError('แท็กแต่ละอันต้องขึ้นต้นด้วยเครื่องหมาย # และไม่มีเว้นวรรค เช่น #Design #React');
        return;
      }
      tags = words.map(w => w.substring(1));
    }

    const savedData = {
      title: title.trim(),
      description: description.trim(),
      type,
      fileUrl,
      fileName: type === 'document' ? fileName || 'document.pdf' : fileName,
      fileSize: type === 'document' ? fileSize || '0 bytes' : fileSize,
      tags,
      date: editingItem ? editingItem.date : new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
    };

    if (editingItem) {
      savedData.id = editingItem.id;
    }

    onSave(savedData);
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
      <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 max-w-lg w-full relative z-10 p-7 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-350">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingItem ? 'แก้ไขผลงาน' : 'เพิ่มผลงานชิ้นใหม่'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-655 rounded-full transition-colors active:scale-90 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-100/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 animate-[fadeIn_0.2s_ease-out]">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">ชื่อผลงาน *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ชื่องานของคุณ"
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-slate-405 dark:focus:border-slate-600 rounded-xl outline-none text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">รายละเอียด</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ข้อมูลเกี่ยวกับผลงานชิ้นนี้..."
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-slate-405 dark:focus:border-slate-600 rounded-xl outline-none text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors resize-none"
            />
          </div>

          {/* Type Selector */}
          {!editingItem && (
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">ประเภทชิ้นงาน</label>
              <div className="flex gap-3">
                {[
                  { id: 'image', label: 'รูปภาพ' },
                  { id: 'video', label: 'วิดีโอ' },
                ].map((t) => {
                  const isSelected = type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setType(t.id);
                        setFileUrl('');
                        setFileName('');
                        setFileSize('');
                      }}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-[0.98] cursor-pointer ${
                        isSelected 
                          ? 'border-slate-800 dark:border-slate-200 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload and link selection */}
          {!editingItem ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
              <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => setUploadMode('upload')}
                  className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer ${
                    uploadMode === 'upload' 
                      ? 'bg-white dark:bg-slate-900 border-b border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  อัปโหลดไฟล์
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer ${
                    uploadMode === 'url' 
                      ? 'bg-white dark:bg-slate-900 border-b border-slate-900 dark:border-slate-100 text-slate-900 dark:text-white' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  ใส่ลิงก์ตรง
                </button>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900">
                {uploadMode === 'upload' ? (
                  <div className="text-center animate-[fadeIn_0.2s_ease-out]">
                    <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-6 px-4 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-950/25 transition cursor-pointer">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">เลือกไฟล์จากเครื่อง</span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept={
                          type === 'image' ? 'image/*' :
                          type === 'video' ? 'video/*' : '*/*'
                        }
                        className="hidden"
                      />
                    </label>
                    {fileName && (
                      <div className="mt-3 text-xs bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-100 dark:border-slate-855 rounded-xl flex items-center justify-between text-slate-500 dark:text-slate-400 animate-[fadeIn_0.2s_ease-out]">
                        <span className="truncate max-w-[70%] font-semibold">{fileName}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 bg-slate-200 dark:bg-slate-850 px-1.5 py-0.5 rounded-md">{fileSize}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="animate-[fadeIn_0.2s_ease-out]">
                    <input
                      type="url"
                      value={fileUrl}
                      onChange={(e) => {
                        setFileUrl(e.target.value);
                        try {
                          const parsed = new URL(e.target.value);
                          const parts = parsed.pathname.split('/');
                          setFileName(parts[parts.length - 1] || 'external-link');
                        } catch {
                          setFileName('external-link');
                        }
                        setFileSize('External URL');
                      }}
                      placeholder="https://example.com/file.jpg"
                      className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-650 rounded-xl outline-none text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-[22px] text-xs text-slate-500 dark:text-slate-400 space-y-3 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ประเภทไฟล์:</span> 
                <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-md capitalize">
                  {type === 'image' ? 'รูปภาพ' : type === 'video' ? 'วิดีโอ' : 'เอกสาร/ไฟล์'}
                </span>
              </div>
              {fileName && (
                <div className="truncate font-medium flex items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-2.5 rounded-xl">
                  <span className="truncate max-w-[70%] font-bold text-slate-700 dark:text-slate-350">{fileName}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-lg shrink-0">{fileSize}</span>
                </div>
              )}
              <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal italic">
                * สำหรับชิ้นงานที่อัปโหลดไปแล้ว ระบบอนุญาตให้แก้ไขเฉพาะ ชื่อผลงาน รายละเอียด และแท็กเท่านั้น เพื่อความปลอดภัยของข้อมูลไฟล์ต้นฉบับ
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider mb-2">แท็ก (ต้องขึ้นต้นด้วย # และไม่มีเว้นวรรคในตัวแท็ก)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="เช่น #Design #React #UIUX"
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-655 rounded-xl outline-none text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-550 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
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
