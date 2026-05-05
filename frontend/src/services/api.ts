import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Обновление токена при 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refresh = localStorage.getItem('refresh_token');
                const response = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
                localStorage.setItem('access_token', response.data.access);
                originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                return api(originalRequest);
            } catch (e) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    getProfile: () => api.get('/auth/profile/'),
    updateProfile: (data: any) => api.patch('/auth/profile/', data),
    getUserProfile: (userId: number) => api.get(`/auth/profile/${userId}/`),
    logout: (refresh: string) => api.post('/auth/logout/', { refresh }),
    updateLastSeen: () => api.post('/auth/update-last-seen/'),
};

export default api;