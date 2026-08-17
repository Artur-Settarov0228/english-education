import axios from 'axios';

// Backend URL Configuration
// Make it dynamic based on the frontend's current hostname so django-tenants can parse it correctly
const currentHost = window.location.hostname;
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${currentHost}:8000`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Global response interceptor for 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('username');
      localStorage.removeItem('is_superuser');
      // Token yaroqsiz bo'lsa yoki yo'qolsa, avtomatik login sahifasiga qaytarish
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// 1. Auth Service
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/User/auth/login/', { username, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      localStorage.setItem('user_role', response.data.role || 'admin');
      localStorage.setItem('username', username);
      localStorage.setItem('is_superuser', response.data.is_superuser ? 'true' : 'false');
    }
    return response.data;
  },
  getProfile: async () => {
    const res = await api.get('/User/users/me/');
    return res.data;
  },
  updateProfile: async (userData) => {
    const res = await api.patch('/User/users/me/', userData);
    return res.data;
  },
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.patch('/User/users/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

// 2. Customer / Multi-Tenant Super Admin Service
export const customerService = {
  getOrganizations: async () => {
    const res = await api.get('/Customers/organizations/');
    return res.data.results || res.data;
  },
  createOrganization: async (orgData) => {
    const res = await api.post('/Customers/organizations/', orgData);
    return res.data;
  },
  updateOrganization: async (id, orgData) => {
    const res = await api.patch(`/Customers/organizations/${id}/`, orgData);
    return res.data;
  },
  deleteOrganization: async (id) => {
    const res = await api.delete(`/Customers/organizations/${id}/`);
    return res.data;
  },
  getDomains: async () => {
    const res = await api.get('/Customers/domains/');
    return res.data.results || res.data;
  }
};

// 3. User & Student Service
export const userService = {
  getUsers: async (role = '') => {
    const url = role ? `/User/users/?role=${role}` : '/User/users/';
    const res = await api.get(url);
    return res.data.results || res.data;
  },
  createUser: async (userData) => {
    const res = await api.post('/User/users/', userData);
    return res.data;
  },
  updateUser: async (id, userData) => {
    const res = await api.patch(`/User/users/${id}/`, userData);
    return res.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/User/users/${id}/`);
    return res.data;
  },
  getParents: async () => {
    const res = await api.get('/User/parents/');
    return res.data.results || res.data;
  },
  createParent: async (parentData) => {
    const res = await api.post('/User/parents/', parentData);
    return res.data;
  },
  checkTelegramStatus: async (studentId) => {
    const res = await api.get(`/User/students/${studentId}/check-telegram/`);
    return res.data;
  }
};

// 4. Lessons, Courses & Groups Service
export const lessonService = {
  getCourses: async () => {
    const res = await api.get('/Lessons/courses/');
    return res.data.results || res.data;
  },
  createCourse: async (courseData) => {
    const res = await api.post('/Lessons/courses/', courseData);
    return res.data;
  },
  getGroups: async () => {
    const res = await api.get('/Lessons/groups/');
    return res.data.results || res.data;
  },
  createGroup: async (groupData) => {
    const res = await api.post('/Lessons/groups/', groupData);
    return res.data;
  },
  getGroupStudents: async (groupId) => {
    const res = await api.get(`/Lessons/groups/${groupId}/students/`);
    return res.data;
  },
  getLessons: async (groupId = null) => {
    const url = groupId ? `/Lessons/lessons/?group=${groupId}` : '/Lessons/lessons/';
    const res = await api.get(url);
    return res.data.results || res.data;
  },
  createLesson: async (lessonData) => {
    const res = await api.post('/Lessons/lessons/', lessonData);
    return res.data;
  },
  uploadVideo: async (lessonId, file, title, description) => {
    const formData = new FormData();
    formData.append('video_file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const res = await api.post(`/Lessons/lessons/${lessonId}/upload-video/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getAttendance: async (lessonId = null) => {
    const url = lessonId ? `/Lessons/attendance/?lesson=${lessonId}` : '/Lessons/attendance/';
    const res = await api.get(url);
    return res.data.results || res.data;
  },
  saveAttendance: async (attendanceData) => {
    const res = await api.post('/Lessons/attendance/', attendanceData);
    return res.data;
  },
  getEnrollments: async () => {
    const res = await api.get('/Lessons/enrollments/');
    return res.data.results || res.data;
  },
  getMaterials: async () => {
    const res = await api.get('/Lessons/materials/');
    return res.data.results || res.data;
  },
  createMaterial: async (formData) => {
    const res = await api.post('/Lessons/materials/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

// 5. Tasks, Quizzes & Grades Service
export const taskService = {
  getTasks: async (groupId = null) => {
    const url = groupId ? `/Tasks/tasks/?group=${groupId}` : '/Tasks/tasks/';
    const res = await api.get(url);
    return res.data.results || res.data;
  },
  createTask: async (taskData) => {
    const res = await api.post('/Tasks/tasks/', taskData);
    return res.data;
  },
  getQuizQuestions: async (taskId = null) => {
    const url = taskId ? `/Tasks/quiz-questions/?task=${taskId}` : '/Tasks/quiz-questions/';
    const res = await api.get(url);
    return res.data.results || res.data;
  },
  createQuizQuestion: async (questionData) => {
    const res = await api.post('/Tasks/quiz-questions/', questionData);
    return res.data;
  },
  getSubmissions: async (taskId = null, studentId = null) => {
    let url = '/Tasks/submissions/?';
    if (taskId) url += `task=${taskId}&`;
    if (studentId) url += `student=${studentId}`;
    const res = await api.get(url);
    return res.data.results || res.data;
  },
  submitHomework: async (formData) => {
    const res = await api.post('/Tasks/submissions/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getGrades: async (studentId = null) => {
    const url = studentId ? `/Tasks/grades/?student=${studentId}` : '/Tasks/grades/';
    const res = await api.get(url);
    return res.data.results || res.data;
  },
  gradeSubmission: async (formData) => {
    const res = await api.post('/Tasks/grades/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getLeaderboard: async (groupId) => {
    const res = await api.get(`/Tasks/grades/ratings/?group_id=${groupId}`);
    return res.data;
  },
  getAnalytics: async (studentId) => {
    const res = await api.get(`/Tasks/grades/analytics/?student=${studentId}`);
    return res.data;
  },
  getBadges: async (studentId = null) => {
    const url = studentId ? `/Tasks/badges/?student=${studentId}` : '/Tasks/badges/';
    const res = await api.get(url);
    return res.data.results || res.data;
  }
};

// 6. Payments Service
export const paymentService = {
  getPayments: async () => {
    const res = await api.get('/Payments/payments/');
    return res.data.results || res.data;
  },
  createPayment: async (paymentData) => {
    const res = await api.post('/Payments/payments/', paymentData);
    return res.data;
  }
};

export default api;
