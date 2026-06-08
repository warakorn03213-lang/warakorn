import React, { useState, useRef } from 'react';
import { FileText, Image as ImageIcon, Video as VideoIcon, Edit3, Trash2, ArrowUpRight, Download, RotateCcw, AlertCircle, Heart } from 'lucide-react';

export default function PortfolioCard({ 
  item, 
  onEdit, 
  onDelete, 
  isPublicView, 
  index, 
  currentUser,
  authorAvatar,
  onCardClick,
  onAuthorClick,
  activeTab,
  isAuthorSuspended,
  authorId,
  onLikeToggle
}) {
  const { title, description, type, fileUrl, fileName, fileSize, date, tags, authorName, authorEmail } = item;
  const [videoPreviewEnded, setVideoPreviewEnded] = useState(false);
  const videoRef = useRef(null);

  const staggerClass = index !== undefined ? `stagger-${(index % 5) + 1}` : '';
  const likes = item.likes || [];
  const isLiked = currentUser ? likes.includes(currentUser.email) : false;
  const likeCount = likes.length;

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onLikeToggle) {
      onLikeToggle(item.id);
    }
  };
  const canEdit = !isPublicView && currentUser && currentUser.email === authorEmail && !isAuthorSuspended;
  const canDelete = canEdit || (currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin'));

  // Handle Video Time Update to limit preview to 10 seconds for visitors/public views
  const handleVideoTimeUpdate = (e) => {
    const video = e.target;
    if (isPublicView && video.currentTime >= 10) {
      video.pause();
      setVideoPreviewEnded(true);
    }
  };

  const handleReplayVideo = (e) => {
    e.stopPropagation(); // Prevent opening details modal when playing video
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setVideoPreviewEnded(false);
      videoRef.current.play();
    }
  };

  const renderMedia = () => {
    if (type === 'image') {
      return fileUrl ? (
        <div className="relative overflow-hidden aspect-video bg-slate-50 dark:bg-slate-950 rounded-2xl">
          <img
            src={fileUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-video bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400 dark:text-slate-505 gap-2 rounded-2xl border border-slate-100 dark:border-slate-800">
          <ImageIcon size={32} className="stroke-1 text-slate-300 dark:text-slate-700" />
          <span className="text-xs text-slate-400 dark:text-slate-500">ไม่มีรูปภาพประกอบ</span>
        </div>
      );
    }

    if (type === 'video') {
      return fileUrl ? (
        <div className="overflow-hidden aspect-video bg-slate-950 rounded-2xl relative">
          <video
            ref={videoRef}
            src={fileUrl}
            controls={!videoPreviewEnded}
            onTimeUpdate={handleVideoTimeUpdate}
            onClick={(e) => e.stopPropagation()} // Prevent card click trigger on video play clicks
            className="w-full h-full object-cover"
          />

          {/* 10s Video Preview overlay */}
          {videoPreviewEnded && (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-[4px] flex flex-col items-center justify-center p-4 text-center z-10 animate-scale-in">
              <AlertCircle size={24} className="text-blue-500 mb-2" />
              <span className="text-xs font-bold text-white mb-1">สิ้นสุดวิดีโอตัวอย่าง 10 วินาที</span>
              <span className="text-[10px] text-slate-400 mb-3 leading-relaxed">
                {currentUser ? 'อยู่ในโหมดผู้เข้าชมสาธารณะ' : 'เข้าสู่ระบบเพื่อรับชมวิดีโอฉบับเต็ม'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleReplayVideo}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-lg text-[10px] transition active:scale-95 cursor-pointer shadow"
                >
                  <RotateCcw size={10} />
                  <span>เล่นใหม่</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-400 dark:text-slate-505 gap-2 rounded-2xl border border-slate-100 dark:border-slate-800">
          <VideoIcon size={32} className="stroke-1 text-slate-300 dark:text-slate-700" />
          <span className="text-xs text-slate-400 dark:text-slate-500">ไม่มีวิดีโอประกอบ</span>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-blue-50/50 dark:bg-blue-950/20 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 p-6 rounded-2xl border border-blue-100/40 dark:border-blue-900/30 relative overflow-hidden transition-all duration-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/35">
        <FileText size={38} className="mb-2 text-blue-555 dark:text-blue-500 stroke-1 transition-transform duration-300 group-hover:scale-110" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-full text-center px-4">{fileName || 'Document File'}</span>
        <span className="text-xs text-slate-455 dark:text-slate-500 mt-1">{fileSize || 'Unknown size'}</span>
        
        {fileUrl && (
          <a
            href={fileUrl}
            download={fileName}
            onClick={(e) => e.stopPropagation()} // Prevent opening details modal when downloading
            className="mt-3 flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition duration-150 cursor-pointer"
          >
            <Download size={13} />
            <span>ดาวน์โหลด</span>
          </a>
        )}
      </div>
    );
  };

  return (
    <div 
      onClick={onCardClick}
      className={`bg-white dark:bg-slate-900 rounded-[32px] flex flex-col h-full border border-slate-100 dark:border-slate-800 p-5 hover:border-blue-250 dark:hover:border-blue-750 hover:shadow-xl hover:shadow-blue-500/[0.04] dark:hover:shadow-blue-900/[0.02] hover:-translate-y-1 transition-all duration-300 ease-out group opacity-0 animate-fade-in-up cursor-pointer ${staggerClass}`}
    >
      
      {/* Media */}
      <div className="mb-5 overflow-hidden rounded-2xl relative">
        {renderMedia()}
        {item.isSuspended && (
          <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg z-20 shadow-md">
            ถูกระงับโดยแอดมิน
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col px-1">
        
        {/* Author header row (no button highlight, clean text layout with optional hover underline filter) */}
        <div className="flex items-center gap-2 mb-3">
          <div 
            onClick={(e) => {
              if (activeTab === 'explore' && onAuthorClick) {
                e.stopPropagation(); // Prevent modal opening
                onAuthorClick(authorEmail);
              }
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 ${
              activeTab === 'explore' ? 'hover:underline cursor-pointer' : ''
            }`}
          >
            <div className="w-5.5 h-5.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-550 dark:text-slate-400 shrink-0 border border-slate-100 dark:border-slate-850">
              {authorAvatar ? (
                <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                <span>{authorName ? authorName[0].toUpperCase() : 'U'}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span>{authorName || 'ทั่วไป'}</span>
              {authorId && <span className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">@{authorId}</span>}
            </div>
          </div>
          <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{date}</span>
        </div>

        {/* Title & Type tag */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
            {title}
          </h4>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 shrink-0 mt-1">
            {type}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 flex-1 line-clamp-2">
          {description}
        </p>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-150 dark:border-slate-800 mt-auto">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 max-w-[50%]">
            {tags && tags.slice(0, 2).map((tag, idx) => (
              <span 
                key={idx} 
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.hash = `#tag/${encodeURIComponent(tag)}`;
                }}
                className="text-xs text-slate-455 hover:text-blue-600 dark:text-slate-555 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Actions Container (Likes + Edit/Delete/View) */}
          <div className="flex items-center gap-3.5">
            {/* Like button */}
            <button
              onClick={handleLikeClick}
              className="flex items-center gap-1 text-xs font-bold text-slate-450 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer group/like"
              title="ถูกใจผลงานนี้"
            >
              <Heart 
                size={14} 
                className={`transition-all duration-200 active:scale-125 ${
                  isLiked ? 'fill-rose-500 text-rose-500 scale-105' : 'text-slate-400 dark:text-slate-500 group-hover/like:scale-105 group-hover/like:text-rose-500'
                }`}
              />
              <span className={isLiked ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>{likeCount}</span>
            </button>

            {/* Action buttons */}
            {(canEdit || canDelete) ? (
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  className="text-slate-400 dark:text-slate-555 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition cursor-pointer"
                  title="แก้ไข"
                >
                  <Edit3 size={15} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="text-slate-400 dark:text-slate-555 hover:text-rose-500 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition cursor-pointer"
                  title="ลบ"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ) : (
            type === 'image' && fileUrl && (
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()} // Prevent details modal from opening when viewing image
                className="text-slate-550 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-450 flex items-center gap-0.5 text-xs font-bold cursor-pointer transition-colors"
              >
                <span>เปิดดูรูป</span>
                <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
