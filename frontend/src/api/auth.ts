import api from './axios';
import { 
    LoginResponse, 
    RegisterResponse,
    User 
} from '../types/user';

// Регистрация
export const register = async (
    login: string, 
    email: string, 
    password: string
): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register/', {
        login,
        email,
        password,
        password2: password
    });
    return response.data;
};

// Вход
export const login = async (
    login: string, 
    password: string
): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login/', {
        login,
        password
    });
    
    if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
    }
    
    return response.data;
};

// Выход
export const logout = async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
        if (refreshToken) {
            await api.post('/auth/logout/', { refresh: refreshToken });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
};

// Проверка аутентификации
export const isAuthenticated = (): boolean => {
    return localStorage.getItem('access_token') !== null;
};