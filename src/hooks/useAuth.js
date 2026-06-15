import { useState } from 'react';
import * as api from '../services/api';

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error('JSON parsing error on localStorage data:', error);
    return fallback;
  }
};

export function useAuth(addToast) {
  const [user, setUser] = useState(() =>
    safeJsonParse(localStorage.getItem('bluefolio_session'), null)
  );

  const handleLogin = async (credentials) => {
    try {
      const loggedInUser = await api.login(credentials);

      if (loggedInUser.token) {
        localStorage.setItem('bluefolio_token', loggedInUser.token);
      }

      setUser(loggedInUser);
      localStorage.setItem('bluefolio_session', JSON.stringify(loggedInUser));
      return true;
    } catch (error) {
      addToast(error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
      return false;
    }
  };

  const handleRegister = async (newUser) => {
    try {
      const registeredUser = await api.register(newUser);
      return registeredUser;
    } catch (error) {
      addToast(error.message || 'ลงทะเบียนไม่สำเร็จ', 'error');
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bluefolio_session');
    localStorage.removeItem('bluefolio_token');
    window.location.hash = '#/';
  };

  const handleSaveProfile = async ({ name, avatar, bio, socialLink }, avatarFile, setUsers, setPortfolio) => {
    if (!user) return false;
    try {
      const formData = new FormData();
      formData.append('email', user.email);
      formData.append('name', name);
      formData.append('bio', bio || '');
      formData.append('socialLink', socialLink || '');
      formData.append('avatarUrl', avatarFile ? '' : avatar || '');

      if (avatarFile) {
        formData.append('avatarFile', avatarFile);
      }

      const updatedUserProfile = await api.updateProfile(formData);

      const updatedSession = {
        ...updatedUserProfile,
        following: user.following || [],
      };

      setUser(updatedSession);
      localStorage.setItem('bluefolio_session', JSON.stringify(updatedSession));
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.email === user.email ? updatedUserProfile : u))
      );

      // Refresh projects to reflect updated author info
      const projectsList = await api.fetchProjects();
      setPortfolio(api.formatProjects(projectsList));

      addToast('บันทึกโปรไฟล์เรียบร้อยแล้ว', 'success');
      return true;
    } catch (error) {
      addToast(error.message || 'ระบบขัดข้อง', 'error');
      return false;
    }
  };

  return {
    user,
    setUser,
    handleLogin,
    handleRegister,
    handleLogout,
    handleSaveProfile,
  };
}
