import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PortfolioCard from './components/PortfolioCard';
import ProjectModal from './components/ProjectModal';
import ProfileModal from './components/ProfileModal';
import AdminCreateModal from './components/AdminCreateModal';
import ProjectDetailsModal from './components/ProjectDetailsModal';
import AuthCard from './components/AuthCard';
import FilterModal from './components/FilterModal';
import { Plus, Search, Info, Briefcase, LogIn, X, SlidersHorizontal, Globe, ExternalLink } from 'lucide-react';

const initialUsers = [
  {
    email: 'admin@admin.com',
    password: 'admin123',
    name: 'แอดมินระดับสูง (Super Admin)',
    userId: 'ADM01',
    role: 'superadmin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80'
  },
  {
    email: 'admin2@admin.com',
    password: 'admin123',
    name: 'แอดมินทั่วไป (Admin)',
    userId: 'ADM02',
    role: 'admin',
    avatar: ''
  }
];

const initialItems = [];

export default function App() {
  const [user, setUser] = useState(() => {
    const storedSession = localStorage.getItem('bluefolio_session');
    return storedSession ? JSON.parse(storedSession) : null;
  });
  const [users, setUsers] = useState(() => {
    const storedUsers = localStorage.getItem('bluefolio_users');
    return storedUsers ? JSON.parse(storedUsers) : [];
  });
  const [portfolio, setPortfolio] = useState(() => {
    const storedItems = localStorage.getItem('bluefolio_items');
    if (storedItems) {
      const parsed = JSON.parse(storedItems);
      return parsed.filter(item => item.id !== 3);
    }
    return [];
  });
  
  // Tab states
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#workspace') return 'workspace';
    if (hash === '#admin') return 'admin';
    return 'explore';
  }); // explore, workspace
  const [selectedAuthor, setSelectedAuthor] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#creator/')) {
      return decodeURIComponent(hash.replace('#creator/', ''));
    }
    return null;
  });
  const [selectedTag, setSelectedTag] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#tag/')) {
      return decodeURIComponent(hash.replace('#tag/', ''));
    }
    return null;
  });
  const [adminSubTab, setAdminSubTab] = useState('creators');

  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(() => {
    return window.location.hash === '#filters';
  });
  const [editingItem, setEditingItem] = useState(null);
  const [viewingProject, setViewingProject] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#project/')) {
      const idStr = hash.replace('#project/', '');
      const storedItems = localStorage.getItem('bluefolio_items');
      if (storedItems) {
        const parsed = JSON.parse(storedItems);
        const project = parsed.find(p => String(p.id) === idStr);
        if (project && project.id !== 3) {
          return project;
        }
      }
    }
    return null;
  });
  
  const [isPublicView, setIsPublicView] = useState(false);
  const [showAuth, setShowAuth] = useState(() => {
    return window.location.hash === '#login';
  });

  // Dark/Light Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('bluefolio_dark');
    return saved ? JSON.parse(saved) : false;
  });

  // Suspended Creators state
  const [suspendedEmails, setSuspendedEmails] = useState(() => {
    const saved = localStorage.getItem('bluefolio_suspended_emails');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bluefolio_suspended_emails', JSON.stringify(suspendedEmails));
  }, [suspendedEmails]);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setAdminSubTab('posts');
      } else if (user.role === 'superadmin') {
        setAdminSubTab('creators');
      }
    }
  }, [user]);

  // Apply dark mode theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('bluefolio_dark', JSON.stringify(darkMode));
  }, [darkMode]);

  // Security guard for admin tab
  useEffect(() => {
    if (activeTab === 'admin' && (!user || (user.role !== 'superadmin' && user.role !== 'admin'))) {
      window.location.hash = '#/';
    }
  }, [activeTab, user]);

  useEffect(() => {
    // One-time migration to clear mock data
    const isMockCleared = localStorage.getItem('bluefolio_mock_cleared_v2');
    if (!isMockCleared) {
      localStorage.removeItem('bluefolio_users');
      localStorage.removeItem('bluefolio_items');
      localStorage.removeItem('bluefolio_session');
      localStorage.removeItem('bluefolio_suspended_emails');
      localStorage.setItem('bluefolio_mock_cleared_v2', 'true');
      window.location.reload();
      return;
    }

    const storedUsers = localStorage.getItem('bluefolio_users');
    let usersList = [];
    if (storedUsers) {
      usersList = JSON.parse(storedUsers);
      let migrated = false;
      usersList = usersList.map((u, index) => {
        let changed = false;
        if (u.email === 'admin@admin.com' && u.role !== 'superadmin') {
          u.role = 'superadmin';
          changed = true;
        }
        if (!u.role && u.email !== 'admin@admin.com' && u.email !== 'admin2@admin.com') {
          u.role = 'creator';
          changed = true;
        }
        if (!u.userId) {
          if (u.email === 'admin@admin.com') {
            u.userId = 'ADM01';
          } else if (u.email === 'admin2@admin.com') {
            u.userId = 'ADM02';
          } else {
            const numStr = String(index + 1).padStart(2, '0');
            u.userId = `USR${numStr}`;
          }
          changed = true;
        }
        if (changed) migrated = true;
        return u;
      });
      const hasAdmin2 = usersList.some(u => u.email === 'admin2@admin.com');
      if (!hasAdmin2) {
        usersList.push({
          email: 'admin2@admin.com',
          password: 'admin123',
          name: 'แอดมินทั่วไป (Admin)',
          userId: 'ADM02',
          role: 'admin',
          avatar: ''
        });
        migrated = true;
      }
      if (migrated) {
        localStorage.setItem('bluefolio_users', JSON.stringify(usersList));
      }
    } else {
      usersList = initialUsers;
      localStorage.setItem('bluefolio_users', JSON.stringify(initialUsers));
    }
    setUsers(usersList);

    const storedSession = localStorage.getItem('bluefolio_session');
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      const matchedUser = usersList.find(u => u.email === parsedSession.email);
      if (matchedUser) {
        setUser(matchedUser);
        localStorage.setItem('bluefolio_session', JSON.stringify(matchedUser));
      } else {
        setUser(parsedSession);
      }
    }

    const storedItems = localStorage.getItem('bluefolio_items');
    if (storedItems) {
      const parsed = JSON.parse(storedItems);
      const filtered = parsed.filter(item => item.id !== 3);
      setPortfolio(filtered);
      localStorage.setItem('bluefolio_items', JSON.stringify(filtered));
    } else {
      setPortfolio(initialItems);
      localStorage.setItem('bluefolio_items', JSON.stringify(initialItems));
    }
  }, []);

  // Hash Routing logic to support Browser Back Button
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash !== '#login') {
        setShowAuth(false);
      }

      if (hash !== '#filters') {
        setIsFilterModalOpen(false);
      }

      if (!hash || hash === '#/' || hash === '#explore') {
        setActiveTab('explore');
        setSelectedAuthor(null);
        setSelectedTag(null);
        setViewingProject(null);
      } else if (hash.startsWith('#creator/')) {
        const email = decodeURIComponent(hash.replace('#creator/', ''));
        setActiveTab('explore');
        setSelectedAuthor(email);
        setSelectedTag(null);
        setViewingProject(null);
      } else if (hash.startsWith('#tag/')) {
        const tag = decodeURIComponent(hash.replace('#tag/', ''));
        setActiveTab('explore');
        setSelectedAuthor(null);
        setSelectedTag(tag);
        setViewingProject(null);
      } else if (hash.startsWith('#project/')) {
        const idStr = hash.replace('#project/', '');
        const project = portfolio.find(p => String(p.id) === idStr);
        if (project) {
          setViewingProject(project);
        } else {
          if (portfolio.length > 0) {
            setViewingProject(null);
          }
        }
      } else if (hash === '#workspace') {
        setActiveTab('workspace');
        setSelectedAuthor(null);
        setSelectedTag(null);
        setViewingProject(null);
      } else if (hash === '#admin') {
        setActiveTab('admin');
        setSelectedAuthor(null);
        setSelectedTag(null);
        setViewingProject(null);
      } else if (hash === '#login') {
        setShowAuth(true);
      } else if (hash === '#filters') {
        setIsFilterModalOpen(true);
        setActiveTab('explore');
        setSelectedAuthor(null);
        setViewingProject(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [portfolio]);

  const handleLogin = (credentials) => {
    const foundUser = users.find(
      (u) => u.email === credentials.email && u.password === credentials.password
    );
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('bluefolio_session', JSON.stringify(foundUser));
      setIsPublicView(false);
      return true;
    }
    return false;
  };

  const handleRegister = (newUser) => {
    const emailExists = users.some((u) => u.email === newUser.email);
    if (emailExists) return false;

    const creatorCount = users.filter(u => u.role !== 'admin' && u.role !== 'superadmin').length + 1;
    const padded = String(creatorCount).padStart(2, '0');
    const newUserId = `USR${padded}`;

    const registeredUser = {
      ...newUser,
      name: newUser.name || newUser.email.split('@')[0],
      userId: newUserId,
      avatar: ''
    };

    const updatedUsers = [...users, registeredUser];
    setUsers(updatedUsers);
    localStorage.setItem('bluefolio_users', JSON.stringify(updatedUsers));
    return true;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bluefolio_session');
    window.location.hash = '#/';
  };

  const handleSaveItem = (savedItem) => {
    if (user && suspendedEmails.includes(user.email)) {
      alert('บัญชีของคุณถูกระงับสิทธิ์การโพสต์ผลงานชั่วคราว ไม่สามารถดำเนินการนี้ได้');
      return;
    }
    let updatedPortfolio = [];
    if (savedItem.id) {
      updatedPortfolio = portfolio.map((item) =>
        item.id === savedItem.id 
          ? { 
              ...savedItem, 
              authorName: item.authorName, 
              authorEmail: item.authorEmail,
              likes: item.likes || [],
              isSuspended: item.isSuspended || false
            } 
          : item
      );
    } else {
      const newItem = {
        ...savedItem,
        id: Date.now(),
        authorName: user.name || user.email.split('@')[0],
        authorEmail: user.email
      };
      updatedPortfolio = [newItem, ...portfolio];
    }
    setPortfolio(updatedPortfolio);
    localStorage.setItem('bluefolio_items', JSON.stringify(updatedPortfolio));
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
      alert('คุณไม่มีสิทธิ์ลบโพสต์ผลงาน');
      return;
    }
    if (window.confirm('ยืนยันที่จะลบโพสต์ผลงานนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
      const updatedPortfolio = portfolio.filter((item) => item.id !== id);
      setPortfolio(updatedPortfolio);
      localStorage.setItem('bluefolio_items', JSON.stringify(updatedPortfolio));
    }
  };

  const getAuthorByEmail = (email) => {
    return users.find(u => u.email === email) || {};
  };

  const handleSaveProfile = ({ name, avatar, bio, socialLink }) => {
    const updatedUser = { ...user, name, avatar, bio, socialLink };
    setUser(updatedUser);
    localStorage.setItem('bluefolio_session', JSON.stringify(updatedUser));

    const updatedUsers = users.map((u) => (u.email === user.email ? updatedUser : u));
    setUsers(updatedUsers);
    localStorage.setItem('bluefolio_users', JSON.stringify(updatedUsers));

    const updatedPortfolio = portfolio.map((item) =>
      item.authorEmail === user.email ? { ...item, authorName: name } : item
    );
    setPortfolio(updatedPortfolio);
    localStorage.setItem('bluefolio_items', JSON.stringify(updatedPortfolio));
  };

  const handleToggleSuspendUser = (email) => {
    if (!user || user.role !== 'superadmin') {
      alert('เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้นที่สามารถระงับบัญชีผู้ใช้ได้');
      return;
    }
    if (email === user.email) {
      alert('คุณไม่สามารถระงับบัญชีของตัวเองได้');
      return;
    }
    const target = users.find(u => u.email === email);
    if (target && target.role === 'superadmin') {
      alert('ไม่สามารถระงับบัญชีผู้ดูแลระบบระดับสูงท่านอื่นได้');
      return;
    }
    let updated;
    if (suspendedEmails.includes(email)) {
      updated = suspendedEmails.filter((e) => e !== email);
    } else {
      updated = [...suspendedEmails, email];
    }
    setSuspendedEmails(updated);
  };

  const handleDeleteUser = (email) => {
    if (!user || user.role !== 'superadmin') {
      alert('เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้นที่สามารถลบบัญชีผู้ใช้ได้');
      return;
    }
    if (email === user.email) {
      alert('คุณไม่สามารถลบบัญชีของตัวเองได้');
      return;
    }
    const target = users.find(u => u.email === email);
    if (target && target.role === 'superadmin') {
      alert('ไม่สามารถลบบัญชีผู้ดูแลระบบระดับสูงท่านอื่นได้');
      return;
    }
    const confirmMessage = target && target.role === 'admin'
      ? `ยืนยันการลบผู้ดูแลระบบ ${email}? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
      : `ยืนยันการลบบัญชีผู้ใช้ ${email} และโพสต์ผลงานทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`;
      
    if (window.confirm(confirmMessage)) {
      const updatedUsers = users.filter((u) => u.email !== email);
      setUsers(updatedUsers);
      localStorage.setItem('bluefolio_users', JSON.stringify(updatedUsers));

      const updatedPortfolio = portfolio.filter((item) => item.authorEmail !== email);
      setPortfolio(updatedPortfolio);
      localStorage.setItem('bluefolio_items', JSON.stringify(updatedPortfolio));

      if (suspendedEmails.includes(email)) {
        setSuspendedEmails(suspendedEmails.filter((e) => e !== email));
      }
    }
  };

  const handleCreateAdmin = (newAdminData) => {
    const adminCount = users.filter(u => u.role === 'admin' || u.role === 'superadmin').length + 1;
    const padded = String(adminCount).padStart(2, '0');
    const newAdminId = `ADM${padded}`;

    const newAdmin = {
      ...newAdminData,
      userId: newAdminId,
      role: 'admin',
      avatar: ''
    };

    const updatedUsers = [...users, newAdmin];
    setUsers(updatedUsers);
    localStorage.setItem('bluefolio_users', JSON.stringify(updatedUsers));
    alert(`สร้างบัญชีผู้ดูแลระบบ ${newAdmin.name} (@${newAdmin.userId}) สำเร็จแล้ว!`);
  };

  const handleToggleLike = (projectId) => {
    if (!user) {
      window.location.hash = '#login';
      return;
    }

    const updatedPortfolio = portfolio.map((item) => {
      if (item.id === projectId) {
        const likes = item.likes || [];
        const isLiked = likes.includes(user.email);
        const updatedLikes = isLiked
          ? likes.filter((email) => email !== user.email)
          : [...likes, user.email];
        return { ...item, likes: updatedLikes };
      }
      return item;
    });

    setPortfolio(updatedPortfolio);
    localStorage.setItem('bluefolio_items', JSON.stringify(updatedPortfolio));
  };

  const handleToggleSuspendProject = (id) => {
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
      alert('คุณไม่มีสิทธิ์ระงับโพสต์ผลงาน');
      return;
    }
    const updated = portfolio.map((item) =>
      item.id === id ? { ...item, isSuspended: !item.isSuspended } : item
    );
    setPortfolio(updated);
    localStorage.setItem('bluefolio_items', JSON.stringify(updated));
  };

  const handleToggleFollow = (creatorEmail) => {
    if (!user) {
      window.location.hash = '#login';
      return;
    }
    if (user.email === creatorEmail) {
      alert('คุณไม่สามารถติดตามตัวเองได้');
      return;
    }
    
    const following = user.following || [];
    const isFollowing = following.includes(creatorEmail);
    const updatedFollowing = isFollowing
      ? following.filter(email => email !== creatorEmail)
      : [...following, creatorEmail];
    
    const updatedUser = { ...user, following: updatedFollowing };
    setUser(updatedUser);
    localStorage.setItem('bluefolio_session', JSON.stringify(updatedUser));
    
    const updatedUsers = users.map(u => u.email === user.email ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('bluefolio_users', JSON.stringify(updatedUsers));
  };

  const handleAddComment = (projectId, text) => {
    if (!user) return;
    const newComment = {
      id: Date.now(),
      authorName: user.name || user.email.split('@')[0],
      authorEmail: user.email,
      text,
      date: new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    
    const updatedPortfolio = portfolio.map((item) => {
      if (item.id === projectId) {
        const comments = item.comments || [];
        return { ...item, comments: [...comments, newComment] };
      }
      return item;
    });
    
    setPortfolio(updatedPortfolio);
    localStorage.setItem('bluefolio_items', JSON.stringify(updatedPortfolio));
    
    if (viewingProject && viewingProject.id === projectId) {
      const comments = viewingProject.comments || [];
      setViewingProject({ ...viewingProject, comments: [...comments, newComment] });
    }
  };

  const handleDeleteComment = (projectId, commentId) => {
    const updatedPortfolio = portfolio.map((item) => {
      if (item.id === projectId) {
        const comments = item.comments || [];
        return { ...item, comments: comments.filter(c => c.id !== commentId) };
      }
      return item;
    });
    
    setPortfolio(updatedPortfolio);
    localStorage.setItem('bluefolio_items', JSON.stringify(updatedPortfolio));
    
    if (viewingProject && viewingProject.id === projectId) {
      const comments = viewingProject.comments || [];
      setViewingProject({ ...viewingProject, comments: comments.filter(c => c.id !== commentId) });
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Calculate all unique tags in the system
  const allTags = React.useMemo(() => {
    const tagsSet = new Set();
    portfolio.forEach(item => {
      if (!item.isSuspended && item.tags) {
        item.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [portfolio]);


  // Calculate popular tags dynamically
  const popularTags = React.useMemo(() => {
    const counts = {};
    portfolio.forEach(item => {
      if (!item.isSuspended && item.tags) {
        item.tags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(entry => entry[0]);
  }, [portfolio]);

  const filteredPortfolio = portfolio.filter((item) => {
    const author = users.find(u => u.email === item.authorEmail);
    const authorId = author ? author.userId : '';

    const searchTerms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => {
      if (term.startsWith('#')) {
        const cleanTerm = term.substring(1);
        if (!cleanTerm) return true;
        return item.tags && item.tags.some(tag => tag.toLowerCase().includes(cleanTerm));
      } else {
        return (
          item.title.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term))) ||
          (item.authorName && item.authorName.toLowerCase().includes(term)) ||
          (authorId && authorId.toLowerCase().includes(term))
        );
      }
    });
      
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesAuthor = activeTab !== 'explore' || !selectedAuthor || item.authorEmail === selectedAuthor;
    const matchesWorkspace = activeTab !== 'workspace' || (user && item.authorEmail === user.email);
    const matchesTag = activeTab !== 'explore' || !selectedTag || (item.tags && item.tags.includes(selectedTag));
    const matchesFollowing = !showFollowingOnly || (user && user.following && user.following.includes(item.authorEmail));
    
    const isOwner = user && item.authorEmail === user.email;
    const isAdmin = user && (user.role === 'superadmin' || user.role === 'admin');
    const matchesSuspension = activeTab === 'admin' || !item.isSuspended || isOwner || isAdmin;

    return matchesSearch && matchesType && matchesAuthor && matchesWorkspace && matchesSuspension && matchesTag && matchesFollowing;
  });

  if (showAuth) {
    return (
      <AuthCard
        onLogin={(creds) => {
          const success = handleLogin(creds);
          if (success) {
            setShowAuth(false);
            window.location.hash = '#workspace';
          }
          return success;
        }}
        onRegister={handleRegister}
        onCancel={() => {
          if (window.location.hash === '#login') {
            window.history.back();
          } else {
            setShowAuth(false);
          }
        }}
      />
    );
  }

  const getSelectedAuthorName = () => {
    if (!selectedAuthor) return '';
    const found = portfolio.find(item => item.authorEmail === selectedAuthor);
    return found ? found.authorName : selectedAuthor;
  };

  const getAuthorAvatar = (email) => {
    const found = users.find(u => u.email === email);
    return found ? found.avatar : null;
  };

  const getUserById = (email) => {
    const found = users.find(u => u.email === email);
    return found ? found.userId : '';
  };

  const getAuthorRoleLabel = (email) => {
    const found = users.find(u => u.email === email);
    if (!found) return 'Creator / ครีเอเตอร์';
    if (found.role === 'superadmin') return 'Super Admin / ผู้ดูแลระบบระดับสูง';
    if (found.role === 'admin') return 'Admin / ผู้ดูแลระบบ';
    return 'Creator / ครีเอเตอร์';
  };
  const mobileWords = (searchTerm || '').split(/\s+/);
  const mobileLastWord = mobileWords[mobileWords.length - 1] || '';
  const mobileIsTypingTag = mobileLastWord.startsWith('#');
  const mobileTagQuery = mobileIsTypingTag ? mobileLastWord.substring(1).toLowerCase() : '';
  const mobileSuggestedTags = (mobileIsTypingTag && allTags)
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(mobileTagQuery) && 
        tag.toLowerCase() !== mobileTagQuery
      ).slice(0, 5)
    : [];

  const handleSelectMobileTagSuggestion = (tag) => {
    const newWords = [...mobileWords];
    newWords.pop();
    newWords.push(`#${tag}`);
    setSearchTerm(newWords.join(' ') + ' ');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 selection:bg-blue-50/60 dark:selection:bg-blue-950/40 transition-colors duration-200">
      
      {/* Banner Preview Mode */}
      {isPublicView && activeTab === 'workspace' && (
        <div className="bg-slate-900 text-white text-[11px] py-2 px-6 flex items-center justify-between shadow-sm relative z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
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

      {/* Navbar */}
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        isPublicView={isPublicView}
        setIsPublicView={setIsPublicView}
        onLoginClick={() => { window.location.hash = '#login'; }}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          window.location.hash = tab === 'explore' ? '#/' : `#${tab}`;
        }}
        onEditProfileClick={() => setIsProfileModalOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        allTags={allTags}
      />

      {/* Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {activeTab === 'admin' && user && (user.role === 'superadmin' || user.role === 'admin') ? (
          /* Admin Panel Dashboard */
          <section className="animate-scale-in space-y-8">
            <div className="border-b border-slate-150 dark:border-slate-800 pb-6">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                แผงควบคุมผู้ดูแลระบบ (Admin Panel)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {user.role === 'superadmin' 
                  ? 'สถานะ: Super Admin | จัดการบัญชีผู้ใช้, ระงับ/ปลดระงับโพสต์, ลบโพสต์และลบบัญชี/แอดมินได้ทั้งหมด'
                  : 'สถานะ: Admin | จัดการและตรวจสอบโพสต์ผลงานเท่านั้น (ระงับ/ปลดระงับโพสต์, ลบโพสต์)'}
              </p>
            </div>

            {/* Sub-tab selection (Only visible to Super Admin) */}
            {user.role === 'superadmin' && (
              <div className="flex gap-6 border-b border-slate-100 dark:border-slate-850 pb-4 text-sm font-bold">
                <button
                  onClick={() => setAdminSubTab('creators')}
                  className={`pb-1 cursor-pointer transition relative ${
                    adminSubTab === 'creators'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                  }`}
                >
                  <span>จัดการครีเอเตอร์ ({users.filter((u) => u.role !== 'admin' && u.role !== 'superadmin').length})</span>
                </button>
                <button
                  onClick={() => setAdminSubTab('admins')}
                  className={`pb-1 cursor-pointer transition relative ${
                    adminSubTab === 'admins'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                  }`}
                >
                  <span>จัดการแอดมิน ({users.filter((u) => u.role === 'admin' && u.email !== user.email).length})</span>
                </button>
                <button
                  onClick={() => setAdminSubTab('posts')}
                  className={`pb-1 cursor-pointer transition relative ${
                    adminSubTab === 'posts'
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                  }`}
                >
                  <span>จัดการโพสต์ผลงาน ({portfolio.length})</span>
                </button>
              </div>
            )}

            {/* Sub-tab Content */}
            {user.role === 'superadmin' && adminSubTab === 'creators' ? (
              /* Creators List */
              <div className="space-y-4 animate-scale-in">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
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
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                        {users
                          .filter((u) => u.role !== 'admin' && u.role !== 'superadmin')
                          .filter((u) => {
                            if (!searchTerm) return true;
                            const term = searchTerm.toLowerCase();
                            return (
                              u.name.toLowerCase().includes(term) ||
                              u.email.toLowerCase().includes(term) ||
                              (u.userId && u.userId.toLowerCase().includes(term))
                            );
                          })
                          .map((u) => {
                            const isSuspended = suspendedEmails.includes(u.email);
                            const userWorksCount = portfolio.filter((item) => item.authorEmail === u.email).length;
                            return (
                              <tr key={u.email} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/50 dark:border-slate-800 shrink-0 font-bold text-slate-550">
                                      {u.avatar ? (
                                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span>{u.name ? u.name[0].toUpperCase() : 'U'}</span>
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {u.name}
                                      </span>
                                      {u.userId && <span className="text-[10px] text-slate-400 mt-0.5">@{u.userId}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{u.email}</td>
                                <td className="py-4 px-6 text-center font-bold text-slate-800 dark:text-slate-200">
                                  {userWorksCount} ผลงาน
                                </td>
                                <td className="py-4 px-6">
                                  {isSuspended ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/40">
                                      ระงับการโพสต์
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-455 border border-emerald-100 dark:border-emerald-900/40">
                                      ปกติ
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-right space-x-2">
                                  <button
                                    onClick={() => handleToggleSuspendUser(u.email)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                                      isSuspended
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                        : 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/45 text-rose-600 dark:text-rose-400 border border-rose-100/40 dark:border-rose-900/40'
                                    }`}
                                  >
                                    {isSuspended ? 'ปลดระงับ' : 'ระงับการโพสต์'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.email)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                                  >
                                    ลบบัญชี
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        {users.filter((u) => u.role !== 'admin' && u.role !== 'superadmin').length === 0 && (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-450 dark:text-slate-500">
                              ไม่มีครีเอเตอร์ในระบบ
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : user.role === 'superadmin' && adminSubTab === 'admins' ? (
              /* Admins List */
              <div className="space-y-4 animate-scale-in">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                    <span>ผู้ดูแลระบบทั่วไป (Admins)</span>
                    <span className="px-2 py-0.5 text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/40 rounded-full font-bold">
                      {users.filter((u) => u.role === 'admin' && u.email !== user.email).length}
                    </span>
                  </h3>
                  <button
                    onClick={() => setIsAdminModalOpen(true)}
                    className="flex items-center gap-1.5 px-4.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 shadow-sm shadow-amber-500/10"
                  >
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
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-855">
                        {users
                          .filter((u) => u.role === 'admin' && u.email !== user.email)
                          .filter((u) => {
                            if (!searchTerm) return true;
                            const term = searchTerm.toLowerCase();
                            return (
                              u.name.toLowerCase().includes(term) ||
                              u.email.toLowerCase().includes(term) ||
                              (u.userId && u.userId.toLowerCase().includes(term))
                            );
                          })
                          .map((u) => (
                            <tr key={u.email} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/50 dark:border-slate-800 shrink-0 font-bold text-slate-550">
                                    {u.avatar ? (
                                      <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{u.name ? u.name[0].toUpperCase() : 'A'}</span>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                      <span>{u.name}</span>
                                      <span className="px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/40 rounded text-[9px] font-bold">
                                        Admin
                                      </span>
                                    </span>
                                    {u.userId && <span className="text-[10px] text-slate-400 mt-0.5">@{u.userId}</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{u.email}</td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => handleDeleteUser(u.email)}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                                >
                                  ลบแอดมิน
                                </button>
                              </td>
                            </tr>
                          ))}
                        {users.filter((u) => u.role === 'admin' && u.email !== user.email).length === 0 && (
                          <tr>
                            <td colSpan="3" className="py-12 text-center text-slate-450 dark:text-slate-500">
                              ไม่มีผู้ดูแลระบบทั่วไปในระบบ
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* Sub-tab Content: Posts List */
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
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                      {portfolio
                        .filter((item) => {
                          if (!searchTerm) return true;
                          const searchTerms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
                          return searchTerms.length === 0 || searchTerms.every(term => {
                            if (term.startsWith('#')) {
                              const cleanTerm = term.substring(1);
                              if (!cleanTerm) return true;
                              return item.tags && item.tags.some(tag => tag.toLowerCase().includes(cleanTerm));
                            } else {
                              return (
                                item.title.toLowerCase().includes(term) ||
                                (item.description && item.description.toLowerCase().includes(term)) ||
                                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term))) ||
                                (item.authorName && item.authorName.toLowerCase().includes(term)) ||
                                (item.authorEmail && item.authorEmail.toLowerCase().includes(term))
                              );
                            }
                          });
                        })
                        .map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {item.type === 'image' && item.fileUrl ? (
                                <img src={item.fileUrl} alt="" className="w-10 h-7 rounded-md object-cover border border-slate-200 dark:border-slate-800 shrink-0" />
                              ) : (
                                <div className="w-10 h-7 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">{item.type}</span>
                                </div>
                              )}
                              <span 
                                onClick={() => { window.location.hash = `#project/${item.id}`; }}
                                className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-650 cursor-pointer line-clamp-1 max-w-[200px]"
                              >
                                {item.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-slate-800 dark:text-slate-200 font-medium">{item.authorName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.authorEmail}</div>
                          </td>
                          <td className="py-4 px-6 text-slate-500 dark:text-slate-400 capitalize">{item.type}</td>
                          <td className="py-4 px-6 text-slate-500 dark:text-slate-400">{item.date}</td>
                          <td className="py-4 px-6">
                            {item.isSuspended ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border border-rose-100 dark:border-rose-900/40">
                                ถูกระงับ
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-455 border border-emerald-100 dark:border-emerald-900/40">
                                เผยแพร่ปกติ
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2 shrink-0">
                            <button
                              onClick={() => handleToggleSuspendProject(item.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                                item.isSuspended
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  : 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/45 text-rose-600 dark:text-rose-450 border border-rose-100/40 dark:border-rose-900/40'
                              }`}
                            >
                              {item.isSuspended ? 'ปลดระงับ' : 'ระงับโพสต์'}
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                            >
                              ลบโพสต์
                            </button>
                          </td>
                        </tr>
                      ))}
                      {portfolio.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-450 dark:text-slate-500">
                            ไม่มีโพสต์ผลงานในระบบ
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        ) : activeTab === 'workspace' && !user ? (
          /* Guest Workspace View (Login Prompt Card) */
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
        ) : (
          /* Explore View OR Authenticated Workspace View */
          <>
            {/* Redesigned Premium Headers */}
            {activeTab === 'workspace' && user ? (
              /* Premium Workspace Header Banner */
              <div className="relative overflow-hidden rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 mb-10 shadow-xs animate-scale-in">
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Avatar with Edit Profile hover state */}
                    <div className="relative group shrink-0">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-md flex items-center justify-center text-3xl font-extrabold text-slate-400">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                        )}
                      </div>
                      {!isPublicView && (
                        <button 
                          onClick={() => setIsProfileModalOpen(true)}
                          className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-white cursor-pointer"
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
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            ID: {user.userId}
                          </span>
                        )}
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                          {user.role === 'superadmin' ? 'Super Admin / ผู้ดูแลระบบระดับสูง' : user.role === 'admin' ? 'Admin / ผู้ดูแลระบบ' : 'Creator / ครีเอเตอร์'}
                        </span>
                        {isPublicView && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            โหมดผู้ชมภายนอก
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 mt-1">{user.email}</p>
                      
                      {user.bio && (
                        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-xl italic leading-relaxed">
                          "{user.bio}"
                        </p>
                      )}
                      
                      {user.socialLink && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                          <ExternalLink size={12} />
                          <a 
                            href={user.socialLink.startsWith('http') ? user.socialLink : `https://${user.socialLink}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {user.socialLink}
                          </a>
                        </div>
                      )}
                      
                      {/* Statistical Count */}
                      <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="text-slate-900 dark:text-white font-bold">
                            {portfolio.filter(item => item.authorEmail === user.email).length}
                          </span> 
                          <span>ผลงานเผยแพร่</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Workspace */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!isPublicView ? (
                      <>
                        <button
                          onClick={() => setIsProfileModalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
                        >
                          <span>ตั้งค่าโปรไฟล์</span>
                        </button>
                        <button
                          onClick={() => {
                            if (suspendedEmails.includes(user.email)) {
                              alert('บัญชีของคุณถูกระงับสิทธิ์การโพสต์ผลงานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ');
                              return;
                            }
                            setEditingItem(null);
                            setIsModalOpen(true);
                          }}
                          disabled={suspendedEmails.includes(user.email)}
                          className={`flex items-center gap-1.5 px-4 py-2.5 font-bold rounded-xl text-xs transition cursor-pointer shadow-sm active:scale-95 animate-[scaleIn_0.2s_ease-out] ${
                            suspendedEmails.includes(user.email)
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-dashed border-slate-205 dark:border-slate-800'
                              : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-slate-900/10'
                          }`}
                        >
                          <Plus size={14} />
                          <span>เพิ่มผลงานใหม่</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsPublicView(false)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95"
                      >
                        <span>กลับไปโหมดจัดการ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab === 'explore' && selectedAuthor ? (
              /* Premium Creator Filtered Header Banner */
              <div className="relative overflow-hidden rounded-[32px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 mb-10 shadow-xs animate-scale-in">
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Creator Avatar */}
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-850 shadow-md shrink-0 flex items-center justify-center text-3xl font-extrabold text-slate-400">
                      {getAuthorAvatar(selectedAuthor) ? (
                        <img src={getAuthorAvatar(selectedAuthor)} alt={getSelectedAuthorName()} className="w-full h-full object-cover" />
                      ) : (
                        <span>{getSelectedAuthorName() ? getSelectedAuthorName()[0].toUpperCase() : 'U'}</span>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                          {getSelectedAuthorName()}
                        </h1>
                        {getUserById(selectedAuthor) && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            ID: {getUserById(selectedAuthor)}
                          </span>
                        )}
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                          {getAuthorRoleLabel(selectedAuthor)}
                        </span>
                      </div>
                      
                      <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 mt-1">{selectedAuthor}</p>
                      
                      {getAuthorByEmail(selectedAuthor)?.bio && (
                        <p className="text-xs md:text-sm text-slate-655 dark:text-slate-400 mt-2 max-w-xl italic leading-relaxed">
                          "{getAuthorByEmail(selectedAuthor).bio}"
                        </p>
                      )}
                      
                      {getAuthorByEmail(selectedAuthor)?.socialLink && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                          <ExternalLink size={12} />
                          <a 
                            href={getAuthorByEmail(selectedAuthor).socialLink.startsWith('http') ? getAuthorByEmail(selectedAuthor).socialLink : `https://${getAuthorByEmail(selectedAuthor).socialLink}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {getAuthorByEmail(selectedAuthor).socialLink}
                          </a>
                        </div>
                      )}
                      
                      {/* Stats info */}
                      <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <span className="text-slate-900 dark:text-white font-bold">
                            {portfolio.filter(item => item.authorEmail === selectedAuthor).length}
                          </span> 
                          <span>ผลงานเผยแพร่</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Creator Follow Action */}
                  {user ? (
                    user.email !== selectedAuthor && (
                      <button
                        onClick={() => handleToggleFollow(selectedAuthor)}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer border shrink-0 ${
                          user.following && user.following.includes(selectedAuthor)
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border-slate-205 dark:border-slate-700'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-500/10'
                        }`}
                      >
                        {user.following && user.following.includes(selectedAuthor) ? 'ติดตามแล้ว' : 'ติดตามครีเอเตอร์'}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => { window.location.hash = '#login'; }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm shadow-blue-500/10"
                    >
                      ติดตามครีเอเตอร์
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Warning Banner for Suspended Creator in Workspace */}
            {activeTab === 'workspace' && user && suspendedEmails.includes(user.email) && (
              <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/40 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-rose-600 dark:text-rose-455 animate-scale-in">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-400">⚠️ บัญชีของคุณถูกระงับสิทธิ์การโพสต์ผลงานชั่วคราว</h4>
                  <p className="mt-1 leading-relaxed text-rose-550 dark:text-rose-455">คุณไม่สามารถโพสต์ผลงานใหม่ รวมถึงไม่สามารถแก้ไขข้อมูลผลงานที่มีอยู่เดิมได้ จนกว่าผู้ดูแลระบบจะปลดการระงับสิทธิ์นี้ หากมีข้อสงสัยใดๆ กรุณาติดต่อผู้ดูแลระบบ</p>
                </div>
              </div>
            )}


            {/* Warning Banner for Suspended Creator in Workspace */}
            {activeTab === 'workspace' && user && suspendedEmails.includes(user.email) && (
              <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/40 rounded-2xl flex items-start gap-3 text-xs md:text-sm text-rose-600 dark:text-rose-400 animate-scale-in">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-700 dark:text-rose-400">⚠️ บัญชีของคุณถูกระงับสิทธิ์การโพสต์ผลงานชั่วคราว</h4>
                  <p className="mt-1 leading-relaxed text-rose-550 dark:text-rose-450">คุณไม่สามารถโพสต์ผลงานใหม่ รวมถึงไม่สามารถแก้ไขข้อมูลผลงานที่มีอยู่เดิมได้ จนกว่าผู้ดูแลระบบจะปลดการระงับสิทธิ์นี้ หากมีข้อสงสัยใดๆ กรุณาติดต่อผู้ดูแลระบบ</p>
                </div>
              </div>
            )}

            {/* Filter and Search Bar Row */}
            {activeTab === 'explore' && (
              <div className="mb-10 space-y-6 animate-scale-in">
                
                {/* Left: Category Quick Filters (อยู่ด้านบนเดี่ยวๆ สวยงามเหมือนเดิม) */}
                <div className="flex items-center gap-6 text-sm font-semibold border-b border-slate-100 dark:border-slate-800/60 pb-3 overflow-x-auto">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'image', label: 'รูปภาพ' },
                    { id: 'video', label: 'วิดีโอ' },
                  ].map((tab) => {
                    const isActive = filterType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setFilterType(tab.id)}
                        className={`py-1 cursor-pointer transition whitespace-nowrap relative ${
                          isActive 
                            ? 'text-blue-600 dark:text-blue-400 font-bold' 
                            : 'text-slate-455 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-fade-in"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right: Advanced Filters + Search Counter (อยู่ด่านล่างตามสั่ง) */}
                <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl">
                  {/* Left: Summary Info */}
                  <div className="text-xs md:text-sm font-semibold text-slate-550 dark:text-slate-400">
                    พบ <span className="text-blue-600 dark:text-blue-400 font-extrabold">{filteredPortfolio.length}</span> ผลงานเผยแพร่
                  </div>

                  {/* Right: Filter Trigger Button */}
                  <div className="flex items-center gap-2">
                    {user && (
                      <button
                        onClick={() => setShowFollowingOnly(!showFollowingOnly)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 border ${
                          showFollowingOnly
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-205 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <span>เฉพาะที่ติดตาม</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => { window.location.hash = '#filters'; }}
                      className="relative flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-205 dark:border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <SlidersHorizontal size={13} className="text-slate-500 dark:text-slate-450" />
                      <span>ตัวกรองขั้นสูง</span>
                      
                      {/* Badge if selectedTag is active */}
                      {selectedTag && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full shadow-sm shadow-blue-500/20 animate-scale-in"></span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Popular Tags */}
                {popularTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center text-xs p-1 animate-scale-in">
                    <span className="text-slate-400 dark:text-slate-500 font-bold">แท็กยอดนิยม:</span>
                    {popularTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          if (selectedTag === tag) {
                            setSelectedTag(null);
                            window.location.hash = '#/';
                          } else {
                            setSelectedTag(tag);
                            window.location.hash = `#tag/${encodeURIComponent(tag)}`;
                          }
                        }}
                        className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition cursor-pointer active:scale-[0.97] ${
                          selectedTag === tag
                            ? 'bg-blue-600 border-blue-600 text-white font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-350 dark:hover:border-slate-600'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Tag Badge */}
                {selectedTag && (
                  <div className="flex flex-wrap gap-2 items-center p-1">
                    <span className="text-xs text-slate-400 dark:text-slate-555 font-semibold mr-1">แท็กที่ใช้ค้นหา:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-400 border border-blue-150/40 rounded-full text-xs font-semibold animate-scale-in">
                      <span>#{selectedTag}</span>
                      <button 
                        onClick={() => {
                          setSelectedTag(null);
                          if (window.location.hash.startsWith('#tag/')) {
                            window.location.hash = '#/';
                          }
                        }} 
                        className="hover:text-rose-500 cursor-pointer ml-1 text-slate-400"
                        title="เอาแท็กออก"
                      >
                        <X size={10} className="stroke-[3]" />
                      </button>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        window.location.hash = '#/';
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-455 dark:hover:text-rose-350 cursor-pointer transition active:scale-95 ml-2"
                    >
                      ล้างตัวกรอง
                    </button>
                  </div>
                )}
                
                {/* Search input for mobile view */}
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
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-300 dark:border-slate-750 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/15 outline-none placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 shadow-sm"
                  />
                  {showMobileSuggestions && mobileSuggestedTags.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-lg z-50 py-1.5 text-xs text-slate-705 dark:text-slate-300">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        แท็กที่แนะนำ
                      </div>
                      {mobileSuggestedTags.map(tag => (
                        <button
                          key={tag}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectMobileTagSuggestion(tag);
                          }}
                          className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer font-semibold"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Portfolio Cards Grid */}
            <section>
              {filteredPortfolio.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-16 text-center">
                  <p className="text-xs md:text-sm text-slate-450 dark:text-slate-500">ไม่พบชิ้นงานที่สอดคล้องกับการค้นหาของคุณในฟีดนี้</p>
                  {activeTab === 'workspace' && user && !suspendedEmails.includes(user.email) && (
                    <button
                      onClick={() => {
                        setEditingItem(null);
                        setIsModalOpen(true);
                      }}
                      className="mt-3 text-xs md:text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      อัปโหลดผลงานชิ้นแรก
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPortfolio.map((item, index) => (
                    <PortfolioCard
                      key={item.id}
                      item={item}
                      onEdit={startEdit}
                      onDelete={handleDeleteItem}
                      isPublicView={!user && (isPublicView || activeTab === 'explore')}
                      index={index}
                      currentUser={user}
                      authorAvatar={getAuthorAvatar(item.authorEmail)}
                      onCardClick={() => { window.location.hash = `#project/${item.id}`; }}
                      onAuthorClick={(email) => { window.location.hash = `#creator/${encodeURIComponent(email)}`; }}
                      activeTab={activeTab}
                      isAuthorSuspended={suspendedEmails.includes(item.authorEmail)}
                      authorId={getUserById(item.authorEmail)}
                      onLikeToggle={handleToggleLike}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Context alerts */}
            <section className="border-t border-slate-100 dark:border-slate-800 mt-16 pt-8 flex items-start gap-2.5 max-w-2xl">
              <Info size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs md:text-sm leading-relaxed text-slate-400 dark:text-slate-500">
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

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => {
          if (window.location.hash === '#filters') {
            window.history.back();
          } else {
            setIsFilterModalOpen(false);
          }
        }}
        filterType={filterType}
        setFilterType={setFilterType}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        allTags={allTags}
      />

      {/* Project Creation/Editing Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem}
      />

      {/* Profile Modification Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        currentUser={user}
      />

      {/* Admin Creation Modal */}
      <AdminCreateModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSave={handleCreateAdmin}
        users={users}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        isOpen={viewingProject !== null}
        onClose={() => {
          if (window.location.hash.startsWith('#project/')) {
            window.history.back();
          } else {
            setViewingProject(null);
          }
        }}
        item={viewingProject}
        currentUser={user}
        authorAvatar={viewingProject ? getAuthorAvatar(viewingProject.authorEmail) : null}
        isPublicView={!user && (isPublicView || activeTab === 'explore')}
        onAuthorClick={(email) => {
          window.location.hash = `#creator/${encodeURIComponent(email)}`;
        }}
        authorId={viewingProject ? getUserById(viewingProject.authorEmail) : ''}
        onLikeToggle={handleToggleLike}
        authorBio={viewingProject ? getAuthorByEmail(viewingProject.authorEmail)?.bio : ''}
        authorSocialLink={viewingProject ? getAuthorByEmail(viewingProject.authorEmail)?.socialLink : ''}
        onCommentAdd={handleAddComment}
        onCommentDelete={handleDeleteComment}
        isFollowing={viewingProject && user && user.following ? user.following.includes(viewingProject.authorEmail) : false}
        onFollowToggle={handleToggleFollow}
        users={users}
      />

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 mt-20 py-8 text-center text-xs text-slate-450 dark:text-slate-550">
        <div className="max-w-6xl mx-auto px-6">
          <p>© {new Date().getFullYear()} BlueFolio. สร้างด้วย React และ Tailwind CSS v4</p>
        </div>
      </footer>

    </div>
  );
}
