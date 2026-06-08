import React, { useState, useEffect, useRef } from 'react';
import { Compass, Briefcase, Eye, EyeOff, LogOut, Settings, User, Sun, Moon, LogIn, Search } from 'lucide-react';

export default function Navbar({ 
  user, 
  onLogout, 
  isPublicView, 
  setIsPublicView, 
  onLoginClick,
  activeTab,
  setActiveTab,
  onEditProfileClick,
  darkMode,
  setDarkMode,
  searchTerm,
  setSearchTerm,
  allTags = []
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const words = (searchTerm || '').split(/\s+/);
  const lastWord = words[words.length - 1] || '';
  const isTypingTag = lastWord.startsWith('#');
  const tagQuery = isTypingTag ? lastWord.substring(1).toLowerCase() : '';

  const suggestedTags = (isTypingTag && allTags)
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(tagQuery) && 
        tag.toLowerCase() !== tagQuery
      ).slice(0, 5)
    : [];

  const handleSelectTagSuggestion = (tag) => {
    const newWords = [...words];
    newWords.pop(); // remove incomplete hashtag
    newWords.push(`#${tag}`);
    setSearchTerm(newWords.join(' ') + ' ');
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors duration-200 relative z-30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          
          {/* Left: Logo & Navigation Tabs */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                BlueFolio
              </span>
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            </div>

            {/* Main Tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('explore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                <Compass size={14} />
                <span>สำรวจผลงาน</span>
              </button>
              <button
                onClick={() => setActiveTab('workspace')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'workspace'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                }`}
              >
                <Briefcase size={14} />
                <span>จัดการผลงาน</span>
              </button>
              {user && (user.role === 'superadmin' || user.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                  }`}
                >
                  <Settings size={14} />
                  <span>ผู้ดูแลระบบ</span>
                </button>
              )}
            </div>
          </div>


          {/* Middle: Search Input (Only show if activeTab is 'explore' or 'workspace') */}
          {(activeTab === 'explore' || activeTab === 'workspace' || activeTab === 'admin') ? (
            <div className="hidden md:block relative w-80 lg:w-96">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                placeholder={
                  activeTab === 'admin'
                    ? "ค้นหาแอดมิน/ครีเอเตอร์ด้วยชื่อ, ID..."
                    : activeTab === 'explore'
                    ? "ค้นหาผลงาน, แท็ก, ครีเอเตอร์..."
                    : "ค้นหาผลงานของคุณ..."
                }
                className="w-full pl-9.5 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-300 dark:border-slate-800/80 focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/15 outline-none placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
              />
              {showSuggestions && suggestedTags.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1.5 text-xs text-slate-705 dark:text-slate-300">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    แท็กที่แนะนำ
                  </div>
                  {suggestedTags.map(tag => (
                    <button
                      key={tag}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectTagSuggestion(tag);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer font-semibold"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:block w-80 lg:w-96"></div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Public View Toggle (Only relevant when in workspace tab) */}
                {activeTab === 'workspace' && (
                  <button
                    onClick={() => setIsPublicView(!isPublicView)}
                    className={`flex items-center gap-2 text-xs md:text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                      isPublicView
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100/70'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isPublicView ? <EyeOff size={15} /> : <Eye size={15} />}
                    <span>{isPublicView ? 'แก้ไขผลงาน' : 'ดูหน้าเว็บจริง'}</span>
                  </button>
                )}

                {/* Profile dropdown trigger */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0 hover:border-blue-500 dark:hover:border-blue-600 transition cursor-pointer focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl p-2 z-55 animate-scale-in text-slate-700 dark:text-slate-300">
                      
                      {/* User Bio Header */}
                      <div className="p-4 flex items-center gap-3 border-b border-slate-50 dark:border-slate-850">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center font-bold text-slate-500 shrink-0 border border-slate-100 dark:border-slate-800">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name || 'ผู้ใช้งาน'}</h4>
                            {user.userId && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md shrink-0">
                                {user.userId}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block mt-0.5">{user.email}</span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2 space-y-1">
                        
                        {/* View profile/workspace */}
                        <button
                          onClick={() => {
                            setActiveTab('workspace');
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                        >
                          <User size={16} className="text-slate-400" />
                          <span>โปรไฟล์ของฉัน</span>
                        </button>

                        {/* Settings / Edit profile */}
                        <button
                          onClick={() => {
                            onEditProfileClick();
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                        >
                          <Settings size={16} className="text-slate-400" />
                          <span>ตั้งค่าโปรไฟล์</span>
                        </button>

                        {/* Admin panel dropdown menu */}
                        {user && (user.role === 'superadmin' || user.role === 'admin') && (
                          <button
                            onClick={() => {
                              setActiveTab('admin');
                              setDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-705 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                          >
                            <Settings size={16} className="text-slate-400" />
                            <span>ระบบผู้ดูแล (Admin)</span>
                          </button>
                        )}

                        {/* Theme Toggle option */}
                        <button
                          onClick={() => setDarkMode(!darkMode)}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-xs md:text-sm font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            {darkMode ? (
                              <Sun size={16} className="text-amber-500 animate-spin-slow" />
                            ) : (
                              <Moon size={16} className="text-slate-400" />
                            )}
                            <span>โหมดกลางคืน</span>
                          </div>
                          <span className={`w-8 h-4 rounded-full p-0.5 transition duration-205 shrink-0 ${
                            darkMode ? 'bg-blue-600 flex justify-end' : 'bg-slate-200 dark:bg-slate-700 flex justify-start'
                          }`}>
                            <span className="w-3 h-3 bg-white rounded-full shadow-sm"></span>
                          </span>
                        </button>

                      </div>

                      {/* Logout option */}
                      <div className="border-t border-slate-50 dark:border-slate-850 pt-2 pb-1">
                        <button
                          onClick={() => {
                            onLogout();
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs md:text-sm font-semibold rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 hover:text-rose-700 transition cursor-pointer text-left"
                        >
                          <LogOut size={16} />
                          <span>ออกจากระบบ</span>
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* If guest user: can also change dark mode directly via a small navbar icon next to login! */
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-full transition cursor-pointer"
                  title={darkMode ? 'เปิดโหมดกลางวัน' : 'เปิดโหมดกลางคืน'}
                >
                  {darkMode ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} />}
                </button>

                <button
                  onClick={onLoginClick}
                  className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>สำหรับผู้ดูแล (Login)</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex sm:hidden items-center justify-around border-t border-slate-50 dark:border-slate-855 py-3 gap-2">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition ${
              activeTab === 'explore' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            สำรวจผลงาน
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition ${
              activeTab === 'workspace' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            จัดการผลงาน
          </button>
          {user && (user.role === 'superadmin' || user.role === 'admin') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg transition ${
                activeTab === 'admin' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              ผู้ดูแล
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
