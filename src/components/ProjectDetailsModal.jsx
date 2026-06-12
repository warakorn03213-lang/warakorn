import React, { useState, useRef } from 'react';
import { X, Calendar, AlertCircle, RotateCcw, Heart, Globe } from 'lucide-react';

export default function ProjectDetailsModal({ 
  isOpen, 
  onClose, 
  item, 
  currentUser, 
  authorAvatar, 
  isPublicView,
  onAuthorClick,
  authorId,
  onLikeToggle,
  authorBio,
  authorSocialLink,
  onCommentAdd,
  onCommentDelete,
  isFollowing,
  onFollowToggle,
  users
}) {
  if (!isOpen || !item) return null;

  const { title, description, type, fileUrl, fileName, fileSize, date, tags, authorName, authorEmail } = item;
  const likes = item.likes || [];
  const isLiked = currentUser ? likes.includes(currentUser.email) : false;
  const likeCount = likes.length;

  const handleLikeClick = (e) => {
    e.stopPropagation();
    if (onLikeToggle) {
      onLikeToggle(item.id);
    }
  };

  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef(null);

  const handleVideoTimeUpdate = (e) => {
    const video = e.target;
    // Limit video preview for guest/public view to 10 seconds
    if (isPublicView && video.currentTime >= 10) {
      video.pause();
      setVideoEnded(true);
    }
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setVideoEnded(false);
      videoRef.current.play();
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const text = e.target.commentText.value.trim();
    if (!text) return;
    
    if (onCommentAdd) {
      onCommentAdd(item.id, text);
      e.target.commentText.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-[4px] opacity-0 animate-overlay"
        onClick={onClose}
      />

      <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 max-w-2xl w-full relative z-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/35 opacity-0 scale-95 animate-scale-in text-slate-700 dark:text-slate-300 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{type} details</span>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 rounded-full transition active:scale-90 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          
          <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            {type === 'image' && fileUrl && (
              <img src={fileUrl} alt={title} className="w-full h-auto max-h-[350px] object-contain mx-auto" />
            )}
            
            {type === 'video' && fileUrl && (
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  src={fileUrl}
                  controls={!videoEnded}
                  onTimeUpdate={handleVideoTimeUpdate}
                  className="w-full h-full object-contain"
                />
                {videoEnded && (
                  <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-[4px] flex flex-col items-center justify-center p-4 text-center z-10 animate-scale-in">
                    <AlertCircle size={24} className="text-blue-500 mb-2" />
                    <span className="text-xs font-bold text-white mb-1">สิ้นสุดวิดีโอตัวอย่าง 10 วินาที</span>
                    <span className="text-[10px] text-slate-400 mb-3">
                      {currentUser ? 'อยู่ในโหมดผู้เข้าชมสาธารณะ' : 'เข้าสู่ระบบเพื่อรับชมวิดีโอฉบับเต็ม'}
                    </span>
                    <button
                      onClick={handleReplay}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer shadow"
                    >
                      <RotateCcw size={12} />
                      <span>เล่นใหม่</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug">{title}</h2>

            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => {
                    if (onAuthorClick) {
                      onAuthorClick(authorEmail);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-2.5 cursor-pointer group/author"
                  title={`ดูผลงานทั้งหมดของ ${authorName}`}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-100 dark:border-slate-900 shrink-0 transition group-hover/author:border-blue-500">
                    {authorAvatar ? (
                      <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{authorName ? authorName[0].toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover/author:text-blue-600 group-hover/author:dark:text-blue-400 transition-colors flex items-center gap-1.5">
                      <span>{authorName || 'ทั่วไป'}</span>
                      {authorId && <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md shrink-0">@{authorId}</span>}
                    </div>
                    <div className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">{authorEmail}</div>
                  </div>
                </div>
                
                {currentUser && currentUser.email !== authorEmail && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onFollowToggle) onFollowToggle(authorEmail);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition active:scale-95 cursor-pointer border ${
                      isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-xs'
                    }`}
                  >
                    {isFollowing ? 'ติดตามแล้ว' : 'ติดตาม'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <button
                  onClick={handleLikeClick}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer group/like mr-2"
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

                <div className="flex items-center gap-1">
                  <Calendar size={13} />
                  <span>เผยแพร่: {date}</span>
                </div>
              </div>
            </div>

            {(authorBio || authorSocialLink) && (
              <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl space-y-2 text-xs leading-relaxed animate-scale-in">
                {authorBio && (
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    "{authorBio}"
                  </p>
                )}
                {authorSocialLink && (
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                    <Globe size={13} />
                    <a 
                      href={authorSocialLink.startsWith('http') ? authorSocialLink : `https://${authorSocialLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {authorSocialLink}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">รายละเอียด</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{description || 'ไม่มีคำอธิบายเพิ่มเติม'}</p>
            </div>

            {tags && tags.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">แท็ก</h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      onClick={() => {
                        window.location.hash = `#tag/${encodeURIComponent(tag)}`;
                        onClose();
                      }}
                      className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-blue-500/40 text-slate-500 dark:text-slate-400 rounded-lg hover:text-blue-600 cursor-pointer transition duration-150"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>ความคิดเห็น</span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-extrabold">
                  {item.comments ? item.comments.length : 0}
                </span>
              </h4>
              
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {item.comments && item.comments.length > 0 ? (
                  item.comments.map((comment) => {
                    const commentAuthor = users.find(u => u.email === comment.authorEmail) || {};
                    const isOwnComment = currentUser && currentUser.email === comment.authorEmail;
                    const isAdmin = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin');
                    
                    return (
                      <div key={comment.id} className="flex gap-3 text-xs md:text-sm animate-[fadeIn_0.2s_ease-out]">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-800 font-bold text-slate-400">
                          {commentAuthor.avatar ? (
                            <img src={commentAuthor.avatar} alt={comment.authorName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{comment.authorName ? comment.authorName[0].toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100/80 dark:border-slate-800/60 p-3.5 rounded-2xl">
                          <div className="flex items-center justify-between gap-3 mb-1.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                              <span>{comment.authorName}</span>
                              {commentAuthor.userId && (
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                                  @{commentAuthor.userId}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                {comment.date}
                              </span>
                              
                              {(isOwnComment || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('ต้องการลบความคิดเห็นนี้ใช่หรือไม่?')) {
                                      if (onCommentDelete) onCommentDelete(item.id, comment.id);
                                    }
                                  }}
                                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer transition active:scale-95"
                                >
                                  ลบ
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">ยังไม่มีความคิดเห็นในขณะนี้</p>
                )}
              </div>
              
              {currentUser ? (
                <form onSubmit={handleCommentSubmit} className="flex gap-2.5 items-end pt-2">
                  <textarea
                    name="commentText"
                    placeholder="เขียนความคิดเห็นของคุณ..."
                    required
                    rows={1}
                    className="flex-1 px-4 py-2.5 text-xs md:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-slate-400 dark:focus:border-slate-600 rounded-xl outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-colors resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.target.form.requestSubmit();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    ส่ง
                  </button>
                </form>
              ) : (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      onClose();
                      window.location.hash = '#login';
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    เข้าสู่ระบบเพื่อแสดงความคิดเห็น
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

        {type === 'image' && fileUrl && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-end shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-900 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-2xl active:scale-[0.98] transition cursor-pointer"
            >
              เปิดภาพขนาดจริง
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
