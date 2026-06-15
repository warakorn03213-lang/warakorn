import { useState, useCallback } from 'react';
import * as api from '../services/api';

export function useUsers(user, setUser, addToast) {
  const [users, setUsers] = useState([]);

  const isUserSuspended = useCallback(
    (email) => {
      const found = users.find((u) => u.email === email);
      return found ? !!found.isSuspended : false;
    },
    [users]
  );

  const getAuthorByEmail = useCallback(
    (email) => users.find((u) => u.email === email) || {},
    [users]
  );

  const getAuthorAvatar = useCallback(
    (email) => {
      const found = users.find((u) => u.email === email);
      return found ? found.avatar : null;
    },
    [users]
  );

  const getUserById = useCallback(
    (email) => {
      const found = users.find((u) => u.email === email);
      return found ? found.userId : '';
    },
    [users]
  );

  const getAuthorRoleLabel = useCallback(
    (email) => {
      const found = users.find((u) => u.email === email);
      if (!found) return 'Creator / ครีเอเตอร์';
      if (found.role === 'superadmin') return 'Super Admin / ผู้ดูแลระบบระดับสูง';
      if (found.role === 'admin') return 'Admin / ผู้ดูแลระบบ';
      return 'Creator / ครีเอเตอร์';
    },
    [users]
  );

  const handleToggleSuspendUser = async (email) => {
    if (!user || user.role !== 'superadmin') {
      addToast('เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้นที่สามารถระงับบัญชีผู้ใช้ได้', 'error');
      return;
    }
    if (email === user.email) {
      addToast('คุณไม่สามารถระงับบัญชีของตัวเองได้', 'warning');
      return;
    }
    const target = users.find((u) => u.email === email);
    if (target?.role === 'superadmin') {
      addToast('ไม่สามารถระงับบัญชีผู้ดูแลระบบระดับสูงท่านอื่นได้', 'error');
      return;
    }

    const newSuspendedState = !target?.isSuspended;
    try {
      await api.suspendUser(email, newSuspendedState);
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.email === email ? { ...u, isSuspended: newSuspendedState } : u))
      );
      addToast(
        newSuspendedState
          ? `ระงับการโพสต์ของ ${target?.name || email} แล้ว`
          : `ปลดระงับ ${target?.name || email} แล้ว`,
        newSuspendedState ? 'warning' : 'success'
      );
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง', 'error');
    }
  };

  const handleDeleteUser = async (email, setPortfolio) => {
    if (!user) return;

    const isSelfDelete = user.email === email;

    if (isSelfDelete) {
      if (user.role === 'superadmin') {
        addToast('ผู้ดูแลระบบระดับสูง (Super Admin) ไม่สามารถลบบัญชีของตัวเองได้', 'error');
        return;
      }
    } else {
      if (user.role !== 'superadmin') {
        addToast('เฉพาะผู้ดูแลระบบระดับสูง (Super Admin) เท่านั้นที่สามารถลบบัญชีผู้ใช้อื่นได้', 'error');
        return;
      }
      const target = users.find((u) => u.email === email);
      if (target?.role === 'superadmin') {
        addToast('ไม่สามารถลบบัญชีผู้ดูแลระบบระดับสูงท่านอื่นได้', 'error');
        return;
      }
    }

    try {
      await api.deleteUser(email);

      if (isSelfDelete) {
        setUser(null);
        localStorage.removeItem('bluefolio_session');
        localStorage.removeItem('bluefolio_token');
        addToast('ลบบัญชีผู้ใช้ของคุณเรียบร้อยแล้ว', 'success');
        window.location.hash = '#/';
      } else {
        const target = users.find((u) => u.email === email);
        setUsers((prevUsers) => prevUsers.filter((u) => u.email !== email));
        setPortfolio((prevPortfolio) => prevPortfolio.filter((item) => item.authorEmail !== email));
        addToast(`ลบบัญชี ${target?.name || email} เรียบร้อยแล้ว`, 'success');
      }
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง', 'error');
    }
  };

  const handleCreateAdmin = async (newAdminData) => {
    try {
      const newAdmin = await api.createAdmin(newAdminData);
      setUsers((prevUsers) => [...prevUsers, newAdmin]);
      addToast(`สร้างบัญชีผู้ดูแลระบบ ${newAdmin.name} (@${newAdmin.userId}) สำเร็จแล้ว!`, 'success');
      return true;
    } catch (error) {
      addToast(error.message || 'ไม่สามารถสร้างผู้ดูแลระบบได้', 'error');
      return false;
    }
  };

  const handleToggleFollow = async (creatorEmail) => {
    if (!user) {
      window.location.hash = '#login';
      return;
    }
    if (user.email === creatorEmail) {
      addToast('คุณไม่สามารถติดตามตัวเองได้', 'warning');
      return;
    }

    try {
      const data = await api.toggleFollow(user.email, creatorEmail);
      const followingList = data.following || [];

      const updatedUser = { ...user, following: followingList };
      setUser(updatedUser);
      localStorage.setItem('bluefolio_session', JSON.stringify(updatedUser));

      const wasFollowing = user.following && user.following.includes(creatorEmail);
      addToast(
        wasFollowing ? 'ยกเลิกติดตามเรียบร้อยแล้ว' : 'ติดตามเรียบร้อยแล้ว',
        'success'
      );
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง', 'error');
    }
  };

  return {
    users,
    setUsers,
    handleToggleSuspendUser,
    handleDeleteUser,
    handleCreateAdmin,
    handleToggleFollow,
    isUserSuspended,
    getAuthorByEmail,
    getAuthorAvatar,
    getUserById,
    getAuthorRoleLabel,
  };
}
