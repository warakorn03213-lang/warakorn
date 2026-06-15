import { useState, useMemo, useEffect } from 'react';
import * as api from '../services/api';

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error('JSON parsing error on localStorage data:', error);
    return fallback;
  }
};

export function usePortfolio(
  user,
  users,
  searchTerm,
  filterType,
  activeTab,
  selectedAuthor,
  selectedTag,
  showFollowingOnly,
  isUserSuspended,
  addToast,
  workspaceSubTab = 'posts'
) {
  const [portfolio, setPortfolio] = useState([]);
  const [sortBy, setSortBy] = useState('latest'); // latest, popular, commented
  const [visibleCount, setVisibleCount] = useState(12);

  const [bookmarks, setBookmarks] = useState(() => {
    if (!user) return [];
    return safeJsonParse(localStorage.getItem(`bluefolio_bookmarks_${user.email}`), []);
  });

  useEffect(() => {
    if (user) {
      setBookmarks(safeJsonParse(localStorage.getItem(`bluefolio_bookmarks_${user.email}`), []));
    } else {
      setBookmarks([]);
    }
  }, [user]);

  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, filterType, activeTab, selectedAuthor, selectedTag, showFollowingOnly, sortBy, workspaceSubTab]);

  const handleSaveItem = async (savedItem, selectedFile, setEditingItem) => {
    if (user && isUserSuspended(user.email)) {
      addToast('บัญชีของคุณถูกระงับสิทธิ์การโพสต์ผลงานชั่วคราว ไม่สามารถดำเนินการนี้ได้', 'error');
      return false;
    }

    try {
      await api.saveProject(savedItem, selectedFile, user.email);

      // Refresh projects after save
      const projectsList = await api.fetchProjects();
      setPortfolio(api.formatProjects(projectsList));

      setEditingItem(null);
      addToast(savedItem.id ? 'แก้ไขผลงานเรียบร้อยแล้ว' : 'เพิ่มผลงานใหม่เรียบร้อยแล้ว', 'success');
      return true;
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง ไม่สามารถดำเนินการได้', 'error');
      return false;
    }
  };

  const handleDeleteItem = async (id) => {
    const project = portfolio.find((p) => p.id === id);
    const isOwner = project && user && project.authorEmail === user.email;
    const isAdmin = user && (user.role === 'superadmin' || user.role === 'admin');

    if (!isOwner && !isAdmin) {
      addToast('คุณไม่มีสิทธิ์ลบโพสต์ผลงานนี้', 'error');
      return;
    }

    try {
      await api.deleteProject(id);
      setPortfolio((prevPortfolio) => prevPortfolio.filter((item) => item.id !== id));
      addToast('ลบโพสต์ผลงานเรียบร้อยแล้ว', 'success');
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง', 'error');
    }
  };

  const handleToggleSuspendProject = async (id) => {
    if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
      addToast('คุณไม่มีสิทธิ์ระงับโพสต์ผลงาน', 'error');
      return;
    }
    const item = portfolio.find((p) => p.id === id);
    if (!item) return;

    const newSuspendedState = !item.isSuspended;

    try {
      await api.suspendProject(id, newSuspendedState);
      setPortfolio((prevPortfolio) =>
        prevPortfolio.map((p) => (p.id === id ? { ...p, isSuspended: newSuspendedState } : p))
      );
      addToast(
        newSuspendedState ? 'ระงับโพสต์ผลงานแล้ว' : 'ปลดระงับโพสต์ผลงานแล้ว',
        newSuspendedState ? 'warning' : 'success'
      );
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง', 'error');
    }
  };

  const handleToggleLike = async (projectId) => {
    if (!user) {
      window.location.hash = '#login';
      return;
    }

    try {
      await api.toggleLike(projectId, user.email);

      setPortfolio((prevPortfolio) =>
        prevPortfolio.map((item) => {
          if (item.id === projectId) {
            const likes = item.likes || [];
            const isLiked = likes.includes(user.email);
            const updatedLikes = isLiked
              ? likes.filter((email) => email !== user.email)
              : [...likes, user.email];
            return { ...item, likes: updatedLikes };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (projectId, text) => {
    if (!user) return;
    try {
      const newComment = await api.addComment(
        projectId,
        user.email,
        user.name || user.email.split('@')[0],
        text
      );

      setPortfolio((prevPortfolio) =>
        prevPortfolio.map((item) => {
          if (item.id === projectId) {
            const comments = item.comments || [];
            return { ...item, comments: [...comments, newComment] };
          }
          return item;
        })
      );
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง', 'error');
    }
  };

  const handleDeleteComment = async (projectId, commentId) => {
    try {
      await api.deleteComment(projectId, commentId);

      setPortfolio((prevPortfolio) =>
        prevPortfolio.map((item) => {
          if (item.id === projectId) {
            const comments = item.comments || [];
            return { ...item, comments: comments.filter((c) => c.id !== commentId) };
          }
          return item;
        })
      );
      addToast('ลบความคิดเห็นเรียบร้อยแล้ว', 'success');
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง', 'error');
    }
  };

  // ─── Derived state ────────────────────────────────

  const allTags = useMemo(() => {
    const tagsSet = new Set();
    portfolio.forEach((item) => {
      if (!item.isSuspended && item.tags) {
        item.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [portfolio]);

  const popularTags = useMemo(() => {
    const counts = {};
    portfolio.forEach((item) => {
      if (!item.isSuspended && item.tags) {
        item.tags.forEach((tag) => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map((entry) => entry[0]);
  }, [portfolio]);

  const filteredPortfolio = useMemo(() => {
    const filtered = portfolio.filter((item) => {
      const author = users.find((u) => u.email === item.authorEmail);
      const authorId = author ? author.userId : '';

      const searchTerms = searchTerm
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.every((term) => {
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
            (authorId && authorId.toLowerCase().includes(term))
          );
        });

      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesAuthor = activeTab !== 'explore' || !selectedAuthor || item.authorEmail === selectedAuthor;
      const matchesWorkspace =
        activeTab !== 'workspace' ||
        (user &&
          (workspaceSubTab === 'bookmarks'
            ? bookmarks.includes(item.id)
            : item.authorEmail === user.email));
      const matchesTag = activeTab !== 'explore' || !selectedTag || (item.tags && item.tags.includes(selectedTag));
      const matchesFollowing =
        !showFollowingOnly || (user && user.following && user.following.includes(item.authorEmail));

      const isOwner = user && item.authorEmail === user.email;
      const isAdmin = user && (user.role === 'superadmin' || user.role === 'admin');
      const matchesSuspension = activeTab === 'admin' || !item.isSuspended || isOwner || isAdmin;

      return (
        matchesSearch &&
        matchesType &&
        matchesAuthor &&
        matchesWorkspace &&
        matchesSuspension &&
        matchesTag &&
        matchesFollowing
      );
    });

    // Sort results based on sortBy mode
    return [...filtered].sort((a, b) => {
      if (sortBy === 'popular') {
        const likesA = a.likes ? a.likes.length : 0;
        const likesB = b.likes ? b.likes.length : 0;
        if (likesB !== likesA) return likesB - likesA;
        return b.id - a.id;
      }
      if (sortBy === 'commented') {
        const commentsA = a.comments ? a.comments.length : 0;
        const commentsB = b.comments ? b.comments.length : 0;
        if (commentsB !== commentsA) return commentsB - commentsA;
        return b.id - a.id;
      }
      // default: latest
      return b.id - a.id;
    });
  }, [portfolio, users, searchTerm, filterType, activeTab, selectedAuthor, selectedTag, showFollowingOnly, user, sortBy, workspaceSubTab, bookmarks]);

  const visiblePortfolio = useMemo(() => {
    return filteredPortfolio.slice(0, visibleCount);
  }, [filteredPortfolio, visibleCount]);

  const hasMore = visibleCount < filteredPortfolio.length;

  const loadMore = () => {
    setVisibleCount((prev) => prev + 12);
  };

  const handleToggleBookmark = (projectId) => {
    if (!user) {
      window.location.hash = '#login';
      return;
    }
    const isBookmarked = bookmarks.includes(projectId);
    const updated = isBookmarked ? bookmarks.filter((id) => id !== projectId) : [...bookmarks, projectId];
    
    setBookmarks(updated);
    localStorage.setItem(`bluefolio_bookmarks_${user.email}`, JSON.stringify(updated));
    addToast(isBookmarked ? 'ยกเลิกการบันทึกผลงานแล้ว' : 'บันทึกผลงานเรียบร้อยแล้ว', 'success');
  };

  return {
    portfolio,
    setPortfolio,
    handleSaveItem,
    handleDeleteItem,
    handleToggleSuspendProject,
    handleToggleLike,
    handleAddComment,
    handleDeleteComment,
    filteredPortfolio,
    visiblePortfolio,
    hasMore,
    loadMore,
    bookmarks,
    handleToggleBookmark,
    allTags,
    popularTags,
    sortBy,
    setSortBy,
  };
}
