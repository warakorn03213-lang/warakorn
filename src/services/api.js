// API service layer for BlueFolio
// All API calls in one place with consistent error handling

export function getAuthHeaders() {
  const token = localStorage.getItem('bluefolio_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function handleResponse(response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
  }
  return response.json();
}

// ─── Auth ──────────────────────────────────────────

export async function login(credentials) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
}

export async function register(newUser) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser),
  });
  return handleResponse(response);
}

export async function createAdmin(newAdminData) {
  const response = await fetch('/api/auth/create-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(newAdminData),
  });
  return handleResponse(response);
}

// ─── Users ─────────────────────────────────────────

export async function fetchUsers() {
  const response = await fetch('/api/users', {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function updateProfile(formData) {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse(response);
}

export async function deleteUser(email) {
  const response = await fetch(`/api/users/${email}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function suspendUser(email, isSuspended) {
  const response = await fetch(`/api/users/${email}/suspend`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ isSuspended }),
  });
  return handleResponse(response);
}

export async function toggleFollow(followerEmail, followedEmail) {
  const response = await fetch('/api/users/follow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ followerEmail, followedEmail }),
  });
  return handleResponse(response);
}

export async function fetchFollowing(email) {
  const response = await fetch(`/api/users/${email}/following`);
  return handleResponse(response);
}

// ─── Projects ──────────────────────────────────────

export async function fetchProjects() {
  const response = await fetch('/api/projects');
  return handleResponse(response);
}

export function formatProjects(projectsList) {
  return projectsList.map((project) => ({
    ...project,
    tags: project.tags ? project.tags.split(',').filter(Boolean) : [],
  }));
}

export async function saveProject(savedItem, selectedFile, authorEmail) {
  const formData = new FormData();
  formData.append('title', savedItem.title);
  formData.append('description', savedItem.description || '');
  formData.append('type', savedItem.type);
  formData.append('authorEmail', authorEmail);
  const tagsStr = savedItem.tags ? savedItem.tags.join(',') : '';
  formData.append('tags', tagsStr);

  if (selectedFile) {
    formData.append('mediaFile', selectedFile);
  } else {
    formData.append('fileUrl', savedItem.fileUrl || '');
  }

  let response;
  if (savedItem.id) {
    // Update existing project
    response = await fetch(`/api/projects/${savedItem.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title: savedItem.title,
        description: savedItem.description,
        tags: tagsStr,
      }),
    });
  } else {
    // Create new project
    response = await fetch('/api/projects', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
  }

  return handleResponse(response);
}

export async function deleteProject(id) {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function suspendProject(id, isSuspended) {
  const response = await fetch(`/api/projects/${id}/suspend`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ isSuspended }),
  });
  return handleResponse(response);
}

export async function toggleLike(projectId, email) {
  const response = await fetch(`/api/projects/${projectId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ email }),
  });
  return handleResponse(response);
}

export async function addComment(projectId, authorEmail, authorName, text) {
  const response = await fetch(`/api/projects/${projectId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ authorEmail, authorName, text }),
  });
  return handleResponse(response);
}

export async function deleteComment(projectId, commentId) {
  const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}
