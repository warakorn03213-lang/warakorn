import { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import PortfolioCard from './components/PortfolioCard';
import ProjectModal from './components/ProjectModal';
import ProfileModal from './components/ProfileModal';
import AdminCreateModal from './components/AdminCreateModal';
import ProjectDetailsModal from './components/ProjectDetailsModal';
import AuthCard from './components/AuthCard';
import FilterModal from './components/FilterModal';
import ToastContainer from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import { Plus, Search, Info, Briefcase, LogIn, X, SlidersHorizontal, ExternalLink, Loader2, Clock, Heart, MessageSquare } from 'lucide-react';

import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useUsers } from './hooks/useUsers';
import { usePortfolio } from './hooks/usePortfolio';
import * as api from './services/api';

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error('JSON parsing error on localStorage data:', error);
    return fallback;
  }
};

export default function App() {
  // ─── Toast ──────────────────────────────────────
  const { toasts, addToast, removeToast } = useToast();

  // ─── Auth ───────────────────────────────────────
  const { user, setUser, handleLogin, handleRegister, handleLogout, handleSaveProfile } = useAuth(addToast);

  // ─── Users ──────────────────────────────────────
  const {
    users, setUsers,
    handleToggleSuspendUser, handleDeleteUser, handleCreateAdmin,
    handleToggleFollow, isUserSuspended,
    getAuthorByEmail, getAuthorAvatar, getUserById, getAuthorRoleLabel,
  } = useUsers(user, setUser, addToast);

  // ─── Navigation state ──────────────────────────
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#workspace') return 'workspace';
    if (hash === '#admin') return 'admin';
    return 'explore';
  });

  const [selectedAuthor, setSelectedAuthor] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#creator/')) return decodeURIComponent(hash.replace('#creator/', ''));
    return null;
  });

  const [selectedTag, setSelectedTag] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#tag/')) return decodeURIComponent(hash.replace('#tag/', ''));
    return null;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [workspaceSubTab, setWorkspaceSubTab] = useState('posts'); // posts, bookmarks
  const [adminSubTab, setAdminSubTab] = useState('creators');

  // ─── Portfolio ──────────────────────────────────
  const {
    portfolio, setPortfolio,
    handleSaveItem, handleDeleteItem, handleToggleSuspendProject,
    handleToggleLike, handleAddComment, handleDeleteComment,
    filteredPortfolio, visiblePortfolio, hasMore, loadMore, bookmarks, handleToggleBookmark,
    allTags, popularTags,
    sortBy, setSortBy,
  } = usePortfolio(user, users, searchTerm, filterType, activeTab, selectedAuthor, selectedTag, showFollowingOnly, isUserSuspended, addToast, workspaceSubTab);

  // ─── UI state ──────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(() => window.location.hash === '#filters');
  const [editingItem, setEditingItem] = useState(null);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);
  const [showAuth, setShowAuth] = useState(() => window.location.hash === '#login');
  const [loading, setLoading] = useState(true);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  // ─── Task 7: viewingProject derived from ID ────
  const [viewingProjectId, setViewingProjectId] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#project/')) return hash.replace('#project/', '');
    return null;
  });

  const viewingProject = useMemo(() => {
    if (!viewingProjectId) return null;
    return portfolio.find((p) => String(p.id) === String(viewingProjectId)) || null;
  }, [viewingProjectId, portfolio]);

  // ─── Dark mode ─────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => safeJsonParse(localStorage.getItem('bluefolio_dark'), false));

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('bluefolio_dark', JSON.stringify(darkMode));
  }, [darkMode]);

  // ─── Admin sub-tab default ─────────────────────
  useEffect(() => {
    if (user) setAdminSubTab(user.role === 'admin' ? 'posts' : 'creators');
  }, [user]);

  // ─── Guard admin tab ───────────────────────────
  useEffect(() => {
    if (activeTab === 'admin' && (!user || (user.role !== 'superadmin' && user.role !== 'admin'))) {
      window.location.hash = '#/';
    }
  }, [activeTab, user]);

  // ─── Initial data fetch ────────────────────────
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        let usersList = [];
        try {
          usersList = await api.fetchUsers();
          setUsers(usersList);
        } catch (err) {
          console.warn('Could not fetch users (probably not an admin):', err.message);
        }

        const storedSession = localStorage.getItem('bluefolio_session');
        if (storedSession) {
          const parsedSession = safeJsonParse(storedSession, null);
          if (parsedSession?.email) {
            const matchedUserProfile = usersList.find((u) => u.email === parsedSession.email);

            let followingList = [];
            try {
              const followingData = await api.fetchFollowing(parsedSession.email);
              followingList = followingData.following || [];
            } catch { /* ignore */ }

            const updatedUserSession = matchedUserProfile
              ? { ...matchedUserProfile, following: followingList }
              : { ...parsedSession, following: followingList };

            setUser(updatedUserSession);
            localStorage.setItem('bluefolio_session', JSON.stringify(updatedUserSession));
          }
        }

        const projectsList = await api.fetchProjects();
        setPortfolio(api.formatProjects(projectsList));
      } catch (error) {
        console.error('Error fetching initial data from backend API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Hash routing ──────────────────────────────
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (hash !== '#login') setShowAuth(false);
      if (hash !== '#filters') setIsFilterModalOpen(false);

      if (!hash || hash === '#/' || hash === '#explore') {
        setActiveTab('explore');
        setSelectedAuthor(null);
        setSelectedTag(null);
        setViewingProjectId(null);
      } else if (hash.startsWith('#creator/')) {
        setActiveTab('explore');
        setSelectedAuthor(decodeURIComponent(hash.replace('#creator/', '')));
        setSelectedTag(null);
        setViewingProjectId(null);
      } else if (hash.startsWith('#tag/')) {
        setActiveTab('explore');
        setSelectedAuthor(null);
        setSelectedTag(decodeURIComponent(hash.replace('#tag/', '')));
        setViewingProjectId(null);
      } else if (hash.startsWith('#project/')) {
        setViewingProjectId(hash.replace('#project/', ''));
      } else if (hash === '#workspace') {
        setActiveTab('workspace');
        setSelectedAuthor(null);
        setSelectedTag(null);
        setViewingProjectId(null);
      } else if (hash === '#admin') {
        setActiveTab('admin');
        setSelectedAuthor(null);
        setSelectedTag(null);
        setViewingProjectId(null);
      } else if (hash === '#login') {
        setShowAuth(true);
      } else if (hash === '#filters') {
        setIsFilterModalOpen(true);
        setActiveTab('explore');
        setSelectedAuthor(null);
        setViewingProjectId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ─── Helper functions ──────────────────────────
  const triggerConfirm = (config) => {
    setConfirmModalConfig({
      ...config,
      isOpen: true,
      onClose: () => setConfirmModalConfig(null)
    });
  };

  const confirmDeleteProject = (id) => {
    triggerConfirm({
      title: 'ยืนยันการลบผลงาน',
      message: 'ยืนยันที่จะลบโพสต์ผลงานนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
      type: 'danger',
      onConfirm: () => handleDeleteItem(id),
    });
  };

  const confirmDeleteUser = (email) => {
    const target = users.find((u) => u.email === email);
    const confirmMessage = target?.role === 'admin'
      ? `ยืนยันการลบผู้ดูแลระบบ ${email}? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
      : `ยืนยันการลบบัญชีผู้ใช้ ${email} และโพสต์ผลงานทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`;

    triggerConfirm({
      title: 'ยืนยันการลบบัญชีผู้ใช้',
      message: confirmMessage,
      type: 'danger',
      onConfirm: () => handleDeleteUser(email, setPortfolio),
    });
  };

  const confirmDeleteComment = (projectId, commentId) => {
    triggerConfirm({
      title: 'ยืนยันการลบความคิดเห็น',
      message: 'ต้องการลบความคิดเห็นนี้ใช่หรือไม่?',
      type: 'danger',
      onConfirm: () => handleDeleteComment(projectId, commentId),
    });
  };

  const getSelectedAuthorName = () => {
    if (!selectedAuthor) return '';
    const found = portfolio.find((item) => item.authorEmail === selectedAuthor);
    return found ? found.authorName : selectedAuthor;
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Mobile tag suggestions
  const mobileWords = (searchTerm || '').split(/\s+/);
  const mobileLastWord = mobileWords[mobileWords.length - 1] || '';
  const mobileIsTypingTag = mobileLastWord.startsWith('#');
  const mobileTagQuery = mobileIsTypingTag ? mobileLastWord.slice(1).toLowerCase() : '';
  const mobileSuggestedTags = mobileIsTypingTag && allTags
    ? allTags.filter((tag) => {
        const normalized = tag.toLowerCase();
        return normalized.includes(mobileTagQuery) && normalized !== mobileTagQuery;
      }).slice(0, 5)
    : [];

  const handleSelectMobileTagSuggestion = (tag) => {
    const newWords = [...mobileWords];
    newWords.pop();
    newWords.push(`#${tag}`);
    setSearchTerm(newWords.join(' ') + ' ');
  };

  // ─── Loading screen ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center gap-6 animate-scale-in">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">BlueFolio</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Auth screen ───────────────────────────────
  if (showAuth) {
    return (
      <>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <AuthCard
          onLogin={async (creds) => {
            const success = await handleLogin(creds);
            if (success) {
              setShowAuth(false);
              window.location.hash = '#workspace';
            }
            return success;
          }}
          onRegister={async (newUser) => {
            const result = await handleRegister(newUser);
            if (result) {
              addToast('สมัครสมาชิกสำเร็จ! กรุณาลงชื่อเข้าใช้งาน', 'success');
              return true;
            }
            return false;
          }}
          onCancel={() => {
            if (window.location.hash === '#login') window.history.back();
            else setShowAuth(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 selection:bg-blue-50/60 dark:selection:bg-blue-950/40 transition-colors duration-200">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {confirmModalConfig && (
        <ConfirmModal
          isOpen={confirmModalConfig.isOpen}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          cancelText={confirmModalConfig.cancelText}
          type={confirmModalConfig.type}
          onConfirm={confirmModalConfig.onConfirm}
          onClose={() => setConfirmModalConfig(null)}
        />
      )}

      {isPublicView && activeTab === 'workspace' && (
        <div className="bg-slate-900 text-white text-[11px] py-2 px-6 flex items-center justify-between shadow-sm relative z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="font-semibold text-slate-300">หน้าต่างแสดงตัวอย่างสำหรับผู้เข้าชมทั่วไป</span>
          </div>
          <button
            onClick={() => setIsPublicView(false)}
            className="px-2.5 py-0.5 bg-white text-slate-900 rounded font-bold hover:bg-slate-100 transition text-[9px] cursor-pointer"
          >
            กลับสู่หน้าผู้จัดทำ
          </button>
        </div>
      )}

      <Navbar
        user={user}
        onLogout={handleLogout}
        isPublicView={isPublicView}
        setIsPublicView={setIsPublicView}
        onLoginClick={() => { window.location.hash = '#login'; }}
        activeTab={activeTab}
        setActiveTab={(tab) => { window.location.hash = tab === 'explore' ? '#/' : `#${tab}`; }}
        onEditProfileClick={() => setIsProfileModalOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        allTags={allTags}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {activeTab === 'admin' && user && (user.role === 'superadmin' || user.role === 'admin') ? (
          <AdminPanel
            user={user}
            users={users}
            portfolio={portfolio}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            adminSubTab={adminSubTab}
            setAdminSubTab={setAdminSubTab}
            isUserSuspended={isUserSuspended}
            handleToggleSuspendUser={handleToggleSuspendUser}
            handleDeleteUser={confirmDeleteUser}
            handleToggleSuspendProject={handleToggleSuspendProject}
            handleDeleteItem={confirmDeleteProject}
            setIsAdminModalOpen={setIsAdminModalOpen}
          />
        ) : activeTab === 'workspace' && !user ? (
          <WorkspaceLoginPrompt />
        ) : (
          <>
            {activeTab === 'workspace' && user ? (
              <>
                <WorkspaceHeader
                  user={user}
                  isPublicView={isPublicView}
                  setIsPublicView={setIsPublicView}
                  setIsProfileModalOpen={setIsProfileModalOpen}
                  setIsModalOpen={setIsModalOpen}
                  setEditingItem={setEditingItem}
                  isUserSuspended={isUserSuspended}
                  portfolio={portfolio}
                  addToast={addToast}
                  workspaceSubTab={workspaceSubTab}
                  setWorkspaceSubTab={setWorkspaceSubTab}
                  bookmarks={bookmarks}
                />
                {!isPublicView && (
                  <div className="relative w-full block md:hidden mb-6 animate-scale-in">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ค้นหาผลงานของคุณ..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/15 outline-none placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 shadow-sm"
                    />
                  </div>
                )}
              </>
            ) : activeTab === 'explore' && selectedAuthor ? (
              <CreatorHeader
                selectedAuthor={selectedAuthor}
                getSelectedAuthorName={getSelectedAuthorName}
                getAuthorAvatar={getAuthorAvatar}
                getUserById={getUserById}
                getAuthorRoleLabel={getAuthorRoleLabel}
                getAuthorByEmail={getAuthorByEmail}
                portfolio={portfolio}
                user={user}
                handleToggleFollow={handleToggleFollow}
              />
            ) : null}

            {activeTab === 'workspace' && user && isUserSuspended(user.email) && (
              <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-rose-600 dark:text-rose-500 animate-scale-in">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-400">⚠️ บัญชีของคุณถูกระงับสิทธิ์การโพสต์ผลงานชั่วคราว</h4>
                  <p className="mt-1 leading-relaxed text-rose-500 dark:text-rose-500">คุณไม่สามารถโพสต์ผลงานใหม่ รวมถึงไม่สามารถแก้ไขข้อมูลผลงานที่มีอยู่เดิมได้ จนกว่าผู้ดูแลระบบจะปลดการระงับสิทธิ์นี้ หากมีข้อสงสัยใดๆ กรุณาติดต่อผู้ดูแลระบบ</p>
                </div>
              </div>
            )}

            {activeTab === 'explore' && (
              <ExploreControls
                filterType={filterType}
                setFilterType={setFilterType}
                filteredPortfolio={filteredPortfolio}
                user={user}
                showFollowingOnly={showFollowingOnly}
                setShowFollowingOnly={setShowFollowingOnly}
                popularTags={popularTags}
                selectedTag={selectedTag}
                setSelectedTag={setSelectedTag}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showMobileSuggestions={showMobileSuggestions}
                setShowMobileSuggestions={setShowMobileSuggestions}
                mobileSuggestedTags={mobileSuggestedTags}
                handleSelectMobileTagSuggestion={handleSelectMobileTagSuggestion}
                activeTab={activeTab}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            )}

            <section>
              {filteredPortfolio.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-16 text-center">
                  <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500">ไม่พบชิ้นงานที่สอดคล้องกับการค้นหาของคุณในฟีดนี้</p>
                  {activeTab === 'workspace' && user && !isUserSuspended(user.email) && (
                    <button
                      onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                      className="mt-3 text-xs md:text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      อัปโหลดผลงานชิ้นแรก
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visiblePortfolio.map((item, index) => (
                    <PortfolioCard
                      key={item.id}
                      item={item}
                      onEdit={startEdit}
                      onDelete={confirmDeleteProject}
                      isPublicView={!user && (isPublicView || activeTab === 'explore')}
                      index={index}
                      currentUser={user}
                      authorAvatar={getAuthorAvatar(item.authorEmail)}
                      onCardClick={() => { window.location.hash = `#project/${item.id}`; }}
                      onAuthorClick={(email) => { window.location.hash = `#creator/${encodeURIComponent(email)}`; }}
                      activeTab={activeTab}
                      isAuthorSuspended={isUserSuspended(item.authorEmail)}
                      authorId={getUserById(item.authorEmail)}
                      onLikeToggle={handleToggleLike}
                      bookmarks={bookmarks}
                      onBookmarkToggle={handleToggleBookmark}
                    />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-12 animate-scale-in">
                  <button
                    onClick={loadMore}
                    className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-extrabold rounded-2xl text-xs transition cursor-pointer active:scale-95 shadow-xs flex items-center gap-2"
                  >
                    <span>โหลดผลงานเพิ่มเติม</span>
                  </button>
                </div>
              )}
            </section>

            <section className="border-t border-slate-100 dark:border-slate-800 mt-16 pt-8 flex items-start gap-2.5 max-w-2xl">
              <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs md:text-sm leading-relaxed text-slate-400 dark:text-slate-600">
                {activeTab === 'explore'
                  ? "💡 โหมดนี้แสดงผลงานของนักพัฒนาทุกคนภายนอก สามารถนำเมาส์คลิกบนชื่อผู้พัฒนาเพื่อกรองดูผลงานเฉพาะของครีเอเตอร์รายนั้นได้ทันที"
                  : isPublicView
                  ? "* กำลังพรีวิวผลงานหน้าสาธารณะของตัวคุณเอง"
                  : "* หน้าจัดการข้อมูลผลงานเฉพาะของบัญชีคุณเอง สามารถแก้ไขรายละเอียด หรือคลิกที่รูปโปรไฟล์ที่เมนูด้านบนเพื่อแก้ไขโปรไฟล์หรือเปิดโหมดมืด"}
              </p>
            </section>
          </>
        )}
      </main>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => {
          if (window.location.hash === '#filters') window.history.back();
          else setIsFilterModalOpen(false);
        }}
        filterType={filterType}
        setFilterType={setFilterType}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        allTags={allTags}
      />

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={(savedItem, selectedFile) => handleSaveItem(savedItem, selectedFile, setEditingItem)}
        editingItem={editingItem}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={(profileData, avatarFile) => handleSaveProfile(profileData, avatarFile, setUsers, setPortfolio)}
        currentUser={user}
        onDeleteAccount={confirmDeleteUser}
      />

      <AdminCreateModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSave={handleCreateAdmin}
        users={users}
      />

      <ProjectDetailsModal
        isOpen={viewingProject !== null}
        onClose={() => {
          if (window.location.hash.startsWith('#project/')) window.history.back();
          else setViewingProjectId(null);
        }}
        item={viewingProject}
        currentUser={user}
        authorAvatar={viewingProject ? getAuthorAvatar(viewingProject.authorEmail) : null}
        isPublicView={!user && (isPublicView || activeTab === 'explore')}
        onAuthorClick={(email) => { window.location.hash = `#creator/${encodeURIComponent(email)}`; }}
        authorId={viewingProject ? getUserById(viewingProject.authorEmail) : ''}
        onLikeToggle={handleToggleLike}
        authorBio={viewingProject ? getAuthorByEmail(viewingProject.authorEmail)?.bio : ''}
        authorSocialLink={viewingProject ? getAuthorByEmail(viewingProject.authorEmail)?.socialLink : ''}
        onCommentAdd={handleAddComment}
        onCommentDelete={confirmDeleteComment}
        isFollowing={viewingProject && user && user.following ? user.following.includes(viewingProject.authorEmail) : false}
        onFollowToggle={handleToggleFollow}
        users={users}
        bookmarks={bookmarks}
        onBookmarkToggle={handleToggleBookmark}
      />

      <footer className="border-t border-slate-100 dark:border-slate-800 mt-20 py-8 text-center text-xs text-slate-400 dark:text-slate-600">
        <div className="max-w-6xl mx-auto px-6">
          <p>© {new Date().getFullYear()} BlueFolio. สร้างด้วย React และ Tailwind CSS v4</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Admin Panel (extracted to reduce App size) ──────────────────

function AdminPanel({
  user, users, portfolio, searchTerm, setSearchTerm, adminSubTab, setAdminSubTab,
  isUserSuspended, handleToggleSuspendUser, handleDeleteUser,
  handleToggleSuspendProject, handleDeleteItem, setIsAdminModalOpen,
}) {
  return (
    <section className="animate-scale-in space-y-8">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          แผงควบคุมผู้ดูแลระบบ (Admin Panel)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {user.role === 'superadmin'
            ? 'สถานะ: Super Admin | จัดการบัญชีผู้ใช้, ระงับ/ปลดระงับโพสต์, ลบโพสต์และลบบัญชี/แอดมินได้ทั้งหมด'
            : 'สถานะ: Admin | จัดการและตรวจสอบโพสต์ผลงานเท่านั้น (ระงับ/ปลดระงับโพสต์, ลบโพสต์)'}
        </p>
      </div>

      {/* Mobile Search Input */}
      <div className="relative w-full block md:hidden mb-6">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            adminSubTab === 'posts'
              ? "ค้นหาชื่อผลงาน, ผู้เขียน หรือแท็ก..."
              : "ค้นหาด้วยชื่อหรืออีเมล..."
          }
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/15 outline-none placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 shadow-sm"
        />
      </div>

      {user.role === 'superadmin' && (
        <div className="flex gap-6 border-b border-slate-100 dark:border-slate-800 pb-4 text-sm font-bold">
          {[
            { key: 'creators', label: `จัดการครีเอเตอร์ (${users.filter((u) => u.role !== 'admin' && u.role !== 'superadmin').length})` },
            { key: 'admins', label: `จัดการแอดมิน (${users.filter((u) => u.role === 'admin' && u.email !== user.email).length})` },
            { key: 'posts', label: `จัดการโพสต์ผลงาน (${portfolio.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAdminSubTab(tab.key)}
              className={`pb-1 cursor-pointer transition relative ${
                adminSubTab === tab.key
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {user.role === 'superadmin' && adminSubTab === 'creators' ? (
        <CreatorsTable users={users} portfolio={portfolio} searchTerm={searchTerm} isUserSuspended={isUserSuspended} handleToggleSuspendUser={handleToggleSuspendUser} handleDeleteUser={handleDeleteUser} />
      ) : user.role === 'superadmin' && adminSubTab === 'admins' ? (
        <AdminsTable users={users} user={user} searchTerm={searchTerm} handleDeleteUser={handleDeleteUser} setIsAdminModalOpen={setIsAdminModalOpen} />
      ) : (
        <PostsTable portfolio={portfolio} searchTerm={searchTerm} handleToggleSuspendProject={handleToggleSuspendProject} handleDeleteItem={handleDeleteItem} />
      )}
    </section>
  );
}

function CreatorsTable({ users, portfolio, searchTerm, isUserSuspended, handleToggleSuspendUser, handleDeleteUser }) {
  const creators = users
    .filter((u) => u.role !== 'admin' && u.role !== 'superadmin')
    .filter((u) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || (u.userId && u.userId.toLowerCase().includes(term));
    });

  return (
    <div className="space-y-4 animate-scale-in">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
        <span>ครีเอเตอร์ / ผู้ใช้งาน (Creators)</span>
        <span className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/40 rounded-full font-bold">
          {users.filter((u) => u.role !== 'admin' && u.role !== 'superadmin').length}
        </span>
      </h3>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 font-bold">
                <th className="py-4 px-6">ผู้ใช้งาน</th>
                <th className="py-4 px-6">อีเมล</th>
                <th className="py-4 px-6 text-center">จำนวนผลงาน</th>
                <th className="py-4 px-6">สถานะ</th>
                <th className="py-4 px-6 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {creators.map((u) => {
                const suspended = isUserSuspended(u.email);
                const worksCount = portfolio.filter((item) => item.authorEmail === u.email).length;
                return (
                  <tr key={u.email} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/50 dark:border-slate-800 shrink-0 font-bold text-slate-600">
                          {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <span>{u.name ? u.name[0].toUpperCase() : 'U'}</span>}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                          {u.userId && <span className="text-[10px] text-slate-400 mt-0.5">@{u.userId}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">{u.email}</td>
                    <td className="py-4 px-6 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">{worksCount} ผลงาน</td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {suspended ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-500 border border-rose-100 dark:border-rose-900/40">ระงับการโพสต์</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-900/40">ปกติ</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => handleToggleSuspendUser(u.email)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${suspended ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' : 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/45 text-rose-600 dark:text-rose-400 border border-rose-100/40 dark:border-rose-900/40'}`}>
                        {suspended ? 'ปลดระงับ' : 'ระงับการโพสต์'}
                      </button>
                      <button onClick={() => handleDeleteUser(u.email)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs">
                        ลบบัญชี
                      </button>
                    </td>
                  </tr>
                );
              })}
              {creators.length === 0 && (
                <tr><td colSpan="5" className="py-12 text-center text-slate-400 dark:text-slate-500">ไม่มีครีเอเตอร์ในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminsTable({ users, user, searchTerm, handleDeleteUser, setIsAdminModalOpen }) {
  const admins = users
    .filter((u) => u.role === 'admin' && u.email !== user.email)
    .filter((u) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || (u.userId && u.userId.toLowerCase().includes(term));
    });

  return (
    <div className="space-y-4 animate-scale-in">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
          <span>ผู้ดูแลระบบทั่วไป (Admins)</span>
          <span className="px-2 py-0.5 text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/40 rounded-full font-bold">
            {users.filter((u) => u.role === 'admin' && u.email !== user.email).length}
          </span>
        </h3>
        <button onClick={() => setIsAdminModalOpen(true)} className="flex items-center gap-1.5 px-4.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-sm shadow-amber-500/10">
          <Plus size={14} />
          <span>เพิ่มแอดมินใหม่</span>
        </button>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 font-bold">
                <th className="py-4 px-6">ผู้ดูแลระบบ</th>
                <th className="py-4 px-6">อีเมล</th>
                <th className="py-4 px-6 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
              {admins.map((u) => (
                <tr key={u.email} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/50 dark:border-slate-800 shrink-0 font-bold text-slate-600">
                        {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <span>{u.name ? u.name[0].toUpperCase() : 'A'}</span>}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/40 rounded text-[9px] font-bold">Admin</span>
                        </span>
                        {u.userId && <span className="text-[10px] text-slate-400 mt-0.5">@{u.userId}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">{u.email}</td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <button onClick={() => handleDeleteUser(u.email)} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs">
                      ลบแอดมิน
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr><td colSpan="3" className="py-12 text-center text-slate-500 dark:text-slate-500">ไม่มีผู้ดูแลระบบทั่วไปในระบบ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PostsTable({ portfolio, searchTerm, handleToggleSuspendProject, handleDeleteItem }) {
  const filtered = portfolio.filter((item) => {
    if (!searchTerm) return true;
    const searchTerms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return searchTerms.length === 0 || searchTerms.every((term) => {
      if (term.startsWith('#')) {
        const cleanTerm = term.slice(1);
        if (!cleanTerm) return true;
        return item.tags && item.tags.some((tag) => tag.toLowerCase().includes(cleanTerm));
      }
      return (
        item.title.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term)) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(term))) ||
        (item.authorName && item.authorName.toLowerCase().includes(term)) ||
        (item.authorEmail && item.authorEmail.toLowerCase().includes(term))
      );
    });
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-500 font-bold">
              <th className="py-4 px-6">ชื่อผลงาน</th>
              <th className="py-4 px-6">ผู้สร้างสรรค์</th>
              <th className="py-4 px-6">ประเภท</th>
              <th className="py-4 px-6">วันที่อัปโหลด</th>
              <th className="py-4 px-6">สถานะ</th>
              <th className="py-4 px-6 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {item.type === 'image' && item.fileUrl ? (
                      <img src={item.fileUrl} alt="" className="w-10 h-7 rounded-md object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                    ) : (
                      <div className="w-10 h-7 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.type}</span>
                      </div>
                    )}
                    <span onClick={() => { window.location.hash = `#project/${item.id}`; }} className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 cursor-pointer line-clamp-1 max-w-[200px]">{item.title}</span>
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="text-slate-800 dark:text-slate-200 font-medium">{item.authorName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.authorEmail}</div>
                </td>
                <td className="py-4 px-6 text-slate-500 dark:text-slate-400 capitalize whitespace-nowrap">{item.type}</td>
                <td className="py-4 px-6 text-slate-500 dark:text-slate-400 whitespace-nowrap">{item.date}</td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {item.isSuspended ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-500 border border-rose-100 dark:border-rose-900/40">ถูกระงับ</span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-900/40">เผยแพร่ปกติ</span>
                  )}
                </td>
                <td className="py-4 px-6 text-right space-x-2 shrink-0 whitespace-nowrap">
                  <button onClick={() => handleToggleSuspendProject(item.id)} className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${item.isSuspended ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' : 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/45 text-rose-600 dark:text-rose-400 border border-rose-100/40 dark:border-rose-900/40'}`}>
                    {item.isSuspended ? 'ปลดระงับ' : 'ระงับโพสต์'}
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs">
                    ลบโพสต์
                  </button>
                </td>
              </tr>
            ))}
            {portfolio.length === 0 && (
              <tr><td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500">ไม่มีโพสต์ผลงานในระบบ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkspaceLoginPrompt() {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-xs border border-blue-100 dark:border-blue-900/30">
        <Briefcase size={36} />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
        พื้นที่จัดการผลงานส่วนตัว
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
        เข้าสู่ระบบหรือสมัครสมาชิกเพื่อเริ่มต้นการบันทึก สร้างสรรค์ และเผยแพร่ผลงานของท่านแบบมืออาชีพได้ทันที
      </p>
      <button
        onClick={() => { window.location.hash = '#login'; }}
        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition cursor-pointer active:scale-95 shadow-md shadow-blue-500/20 w-full"
      >
        <LogIn size={16} />
        <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
      </button>
    </div>
  );
}

function WorkspaceHeader({
  user,
  isPublicView,
  setIsPublicView,
  setIsProfileModalOpen,
  setIsModalOpen,
  setEditingItem,
  isUserSuspended,
  portfolio,
  addToast,
  workspaceSubTab,
  setWorkspaceSubTab,
  bookmarks = [],
}) {
  return (
    <div className="relative overflow-hidden sm:rounded-[32px] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 sm:p-6 md:p-8 mb-10 shadow-xs animate-scale-in">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-md flex items-center justify-center text-3xl font-extrabold text-slate-400">
              {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>}
            </div>
            {!isPublicView && (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-205 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-white cursor-pointer"
                title="แก้ไขข้อมูลโปรไฟล์"
              >
                <span>แก้ไขโปรไฟล์</span>
              </button>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {isPublicView ? `${user.name}'s Portfolio` : user.name}
              </h1>
              {user.userId && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">ID: {user.userId}</span>
              )}
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                {user.role === 'superadmin' ? 'Super Admin / ผู้ดูแลระบบระดับสูง' : user.role === 'admin' ? 'Admin / ผู้ดูแลระบบ' : 'Creator / ครีเอเตอร์'}
              </span>
              {isPublicView && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">โหมดผู้ชมภายนอก</span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 mt-1">{user.email}</p>
            {user.bio && (
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl italic leading-relaxed">"{user.bio}"</p>
            )}
            {user.socialLink && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                <ExternalLink size={12} />
                <a href={user.socialLink.startsWith('http') ? user.socialLink : `https://${user.socialLink}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{user.socialLink}</a>
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="text-slate-900 dark:text-white font-bold">{portfolio.filter((item) => item.authorEmail === user.email).length}</span>
                <span>ผลงานเผยแพร่</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isPublicView ? (
            <>
              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95">
                <span>ตั้งค่าโปรไฟล์</span>
              </button>
              <button
                onClick={() => {
                  if (isUserSuspended(user.email)) {
                    addToast('บัญชีของคุณถูกระงับสิทธิ์การโพสต์ผลงานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ', 'error');
                    return;
                  }
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
                disabled={isUserSuspended(user.email)}
                className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer shadow-sm active:scale-95 animate-[scaleIn_0.2s_ease-out] ${
                  isUserSuspended(user.email)
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-dashed border-slate-200 dark:border-slate-800'
                    : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-slate-900/10'
                }`}
              >
                <Plus size={14} />
                <span>เพิ่มผลงานใหม่</span>
              </button>
            </>
          ) : (
            <button onClick={() => setIsPublicView(false)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95">
              <span>กลับไปโหมดจัดการ</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Sub-tabs */}
      {!isPublicView && (
        <div className="flex gap-6 border-t border-slate-100 dark:border-slate-800/60 mt-6 pt-4 text-xs md:text-sm font-bold relative z-10">
          <button
            onClick={() => setWorkspaceSubTab('posts')}
            className={`pb-1 cursor-pointer transition relative ${
              workspaceSubTab === 'posts'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span>ผลงานของฉัน ({portfolio.filter((item) => item.authorEmail === user.email).length})</span>
          </button>
          <button
            onClick={() => setWorkspaceSubTab('bookmarks')}
            className={`pb-1 cursor-pointer transition relative ${
              workspaceSubTab === 'bookmarks'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span>ผลงานที่บันทึกไว้ ({bookmarks.length})</span>
          </button>
        </div>
      )}
    </div>
  );
}

function CreatorHeader({ selectedAuthor, getSelectedAuthorName, getAuthorAvatar, getUserById, getAuthorRoleLabel, getAuthorByEmail, portfolio, user, handleToggleFollow }) {
  const authorData = getAuthorByEmail(selectedAuthor);
  return (
    <div className="relative overflow-hidden sm:rounded-[32px] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 sm:p-6 md:p-8 mb-10 shadow-xs animate-scale-in">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-md shrink-0 flex items-center justify-center text-3xl font-extrabold text-slate-400">
            {getAuthorAvatar(selectedAuthor) ? <img src={getAuthorAvatar(selectedAuthor)} alt={getSelectedAuthorName()} className="w-full h-full object-cover" /> : <span>{getSelectedAuthorName() ? getSelectedAuthorName()[0].toUpperCase() : 'U'}</span>}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{getSelectedAuthorName()}</h1>
              {getUserById(selectedAuthor) && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700">ID: {getUserById(selectedAuthor)}</span>
              )}
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">{getAuthorRoleLabel(selectedAuthor)}</span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 mt-1">{selectedAuthor}</p>
            {authorData?.bio && (
              <p className="text-xs md:text-sm text-slate-700 dark:text-slate-400 mt-2 max-w-xl italic leading-relaxed">"{authorData.bio}"</p>
            )}
            {authorData?.socialLink && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                <ExternalLink size={12} />
                <a href={authorData.socialLink.startsWith('http') ? authorData.socialLink : `https://${authorData.socialLink}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{authorData.socialLink}</a>
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <span className="text-slate-900 dark:text-white font-bold">{portfolio.filter((item) => item.authorEmail === selectedAuthor).length}</span>
                <span>ผลงานเผยแพร่</span>
              </span>
            </div>
          </div>
        </div>
        {user ? (
          user.email !== selectedAuthor && (
            <button
              onClick={() => handleToggleFollow(selectedAuthor)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer border shrink-0 ${
                user.following && user.following.includes(selectedAuthor)
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/10'
              }`}
            >
              {user.following && user.following.includes(selectedAuthor) ? 'ติดตามแล้ว' : 'ติดตามครีเอเตอร์'}
            </button>
          )
        ) : (
          <button onClick={() => { window.location.hash = '#login'; }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-blue-500/10">
            ติดตามครีเอเตอร์
          </button>
        )}
      </div>
    </div>
  );
}

function ExploreControls({
  filterType, setFilterType, filteredPortfolio, user, showFollowingOnly, setShowFollowingOnly,
  popularTags, selectedTag, setSelectedTag, searchTerm, setSearchTerm,
  showMobileSuggestions, setShowMobileSuggestions, mobileSuggestedTags, handleSelectMobileTagSuggestion, activeTab,
  sortBy, setSortBy,
}) {
  return (
    <div className="mb-10 space-y-6 animate-scale-in">
      <div className="flex items-center gap-6 text-sm font-semibold border-b border-slate-100 dark:border-slate-800/60 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'ทั้งหมด' },
          { id: 'image', label: 'รูปภาพ' },
          { id: 'video', label: 'วิดีโอ' },
        ].map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button key={tab.id} onClick={() => setFilterType(tab.id)} className={`py-1 cursor-pointer transition whitespace-nowrap relative ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
              <span>{tab.label}</span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-fade-in" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl">
        <div className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400">
          พบ <span className="text-blue-600 dark:text-blue-400 font-extrabold">{filteredPortfolio.length}</span> ผลงานเผยแพร่
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user && (
            <button
              onClick={() => setShowFollowingOnly(!showFollowingOnly)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 border ${
                showFollowingOnly ? 'bg-blue-600 border-blue-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span>เฉพาะที่ติดตาม</span>
            </button>
          )}

          <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xs flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
                sortBy === 'latest'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Clock size={13} className={sortBy === 'latest' ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
              <span>ผลงานล่าสุด</span>
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
                sortBy === 'popular'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Heart size={13} className={sortBy === 'popular' ? 'text-rose-500 fill-rose-500' : 'text-slate-400 dark:text-slate-500'} />
              <span>ยอดนิยม กดไลก์</span>
            </button>
            <button
              onClick={() => setSortBy('commented')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap ${
                sortBy === 'commented'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <MessageSquare size={13} className={sortBy === 'commented' ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'} />
              <span>ยอดนิยม เม้น</span>
            </button>
          </div>

          <button
            onClick={() => { window.location.hash = '#filters'; }}
            className="relative flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
          >
            <SlidersHorizontal size={13} className="text-slate-500 dark:text-slate-500" />
            <span>ตัวกรอง</span>
            {selectedTag && <span className="w-2 h-2 bg-blue-600 rounded-full shadow-sm shadow-blue-500/20 animate-scale-in" />}
          </button>
        </div>
      </div>

      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-xs p-1 animate-scale-in">
          <span className="text-slate-400 dark:text-slate-500 font-bold">แท็กยอดนิยม:</span>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (selectedTag === tag) { setSelectedTag(null); window.location.hash = '#/'; }
                else { setSelectedTag(tag); window.location.hash = `#tag/${encodeURIComponent(tag)}`; }
              }}
              className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition cursor-pointer active:scale-[0.97] ${
                selectedTag === tag ? 'bg-blue-600 border-blue-600 text-white font-bold' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {selectedTag && (
        <div className="flex flex-wrap gap-2 items-center p-1">
          <span className="text-xs text-slate-400 dark:text-slate-600 font-semibold mr-1">แท็กที่ใช้ค้นหา:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/40 rounded-full text-xs font-semibold animate-scale-in">
            <span>#{selectedTag}</span>
            <button
              onClick={() => { setSelectedTag(null); if (window.location.hash.startsWith('#tag/')) window.location.hash = '#/'; }}
              className="hover:text-rose-500 cursor-pointer ml-1 text-slate-400"
              title="เอาแท็กออก"
            >
              <X size={10} className="stroke-[3]" />
            </button>
          </span>
          <button onClick={() => { setSelectedTag(null); window.location.hash = '#/'; }} className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-300 cursor-pointer transition active:scale-95 ml-2">
            ล้างตัวกรอง
          </button>
        </div>
      )}

      <div className="relative w-full block md:hidden mb-4 animate-scale-in">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowMobileSuggestions(true)}
          onBlur={() => setShowMobileSuggestions(false)}
          placeholder={activeTab === 'explore' ? "ค้นชื่องาน, ผู้เขียน หรือแท็ก..." : "ค้นหาผลงาน..."}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/15 outline-none placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 shadow-sm"
        />
        {showMobileSuggestions && mobileSuggestedTags.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">แท็กที่แนะนำ</div>
            {mobileSuggestedTags.map((tag) => (
              <button key={tag} onMouseDown={(e) => { e.preventDefault(); handleSelectMobileTagSuggestion(tag); }} className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer font-semibold">
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
