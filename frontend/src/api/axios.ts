import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { RefreshResponse } from '../types/user';

let API_URL = 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Публичные эндпоинты, на которые не нужно редиректить при 401
const publicEndpoints = [
    '/tests/',
    '/auth/login/',
    '/auth/register/',
    '/users/top/',
    '/users/search/',
    '/reports/list/',
    '/auth/profile/',
    '/friends/',
    '/profile/'
];

// Перехватчик запросов 
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Перехватчик ответов 
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        
        // Проверяем, является ли эндпоинт публичным
        const isPublicEndpoint = publicEndpoints.some(endpoint => 
            originalRequest.url?.includes(endpoint)
        );
        
        // Если ошибка 401, это не публичный эндпоинт, и это не запрос на обновление токена
        if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post<RefreshResponse>(`${API_URL}/auth/refresh/`, {
                    refresh: refreshToken
                });
                
                const newAccessToken = response.data.access;
                localStorage.setItem('access_token', newAccessToken);
                
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }
                return api(originalRequest);
                
            } catch (refreshError) {
                // Если refresh токен не работает — выходим
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        // Для публичных эндпоинтов просто возвращаем ошибку без редиректа
        return Promise.reject(error);
    }
);

export default api;