import { X, SlidersHorizontal, Image as ImageIcon, Video as VideoIcon, Check } from 'lucide-react';

export default function FilterModal({
  isOpen,
  onClose,
  filterType,
  setFilterType,
  selectedTag,
  setSelectedTag,
  allTags
}) {
  if (!isOpen) return null;

  const handleTagClick = (tag) => {
    const isCurrentlySelected = selectedTag === tag;
    
    if (isCurrentlySelected) {
      setSelectedTag(null);
      if (window.location.hash.startsWith('#tag/')) {
        window.location.hash = '#/';
      }
    } else {
      setSelectedTag(tag);
      window.location.hash = `#tag/${encodeURIComponent(tag)}`;
    }
  };

  const handleClearFilters = () => {
    setFilterType('all');
    setSelectedTag(null);
    window.location.hash = '#/';
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-[4px] opacity-0 animate-overlay"
        onClick={onClose}
      />

      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 max-w-lg w-full relative z-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/35 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-400 flex flex-col max-h-[95vh] sm:max-h-[85vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">กรอง</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition active:scale-90 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">เลือกประเภทผลงาน</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'all', label: 'ทั้งหมด', icon: SlidersHorizontal },
                { id: 'image', label: 'รูปภาพ', icon: ImageIcon },
                { id: 'video', label: 'วิดีโอ', icon: VideoIcon },
              ].map((cat) => {
                const isSelected = filterType === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilterType(cat.id)}
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-xs font-bold transition duration-150 cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{cat.label}</span>
                    {isSelected && <Check size={12} className="ml-auto stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">เลือกแท็กผลงาน</h4>
            {allTags.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">ไม่มีแท็กในระบบผลงานขณะนี้</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1">
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition duration-150 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-500/10'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between shrink-0">
          <button
            onClick={handleClearFilters}
            className="text-xs font-bold text-slate-500 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-500 transition cursor-pointer active:scale-95"
          >
            ล้างตัวกรองทั้งหมด
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-2xl active:scale-[0.98] transition cursor-pointer shadow-sm shadow-slate-900/10 dark:shadow-black/10"
          >
            ตกลง / ใช้ตัวกรอง
          </button>
        </div>

      </div>
    </div>
  );
}
