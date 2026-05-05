import api from './axios';
import { 
    LoginResponse, 
    RegisterResponse,
    User 
} from '../types/user';

// ============ АУТЕНТИФИКАЦИЯ ============

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
        if (response.data.user) {
            localStorage.setItem('user_id', response.data.user.id.toString());
        }
    }
    
    return response.data;
};

export const logout = async (refresh?: string): Promise<void> => {
    const refreshToken = refresh || localStorage.getItem('refresh_token');
    
    try {
        if (refreshToken) {
            await api.post('/auth/logout/', { refresh: refreshToken });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
    }
};

export const isAuthenticated = (): boolean => {
    return localStorage.getItem('access_token') !== null;
};

export const getProfile = async (): Promise<{ data: User }> => {
    const response = await api.get('/auth/profile/');
    return response;
};

export const updateProfile = async (data: Partial<User>): Promise<{ data: User }> => {
    const response = await api.patch('/auth/profile/', data);
    return response;
};

export const getUserProfile = async (userId: string): Promise<{ data: User }> => {
    const response = await api.get(`/auth/profile/${userId}/`);
    return response;
};

// ============ ДРУЗЬЯ ============

export const getFriends = async (): Promise<{ data: User[] }> => {
    const response = await api.get('/friends/');
    return response;
};

export const getFriendRequests = async (): Promise<{ data: any[] }> => {
    const response = await api.get('/friends/requests/');
    return response;
};

export const sendFriendRequest = async (userId: number): Promise<{ data: any }> => {
    const response = await api.post(`/friends/send/${userId}/`);
    return response;
};

export const acceptFriendRequest = async (requestId: number): Promise<{ data: any }> => {
    const response = await api.post(`/friends/accept/${requestId}/`);
    return response;
};

export const rejectFriendRequest = async (requestId: number): Promise<{ data: any }> => {
    const response = await api.delete(`/friends/reject/${requestId}/`);
    return response;
};

export const checkFriendStatus = async (userId: number): Promise<{ data: { is_friend: boolean; is_friend_request_sent: boolean } }> => {
    const response = await api.get(`/friends/check/${userId}/`);
    return response;
};

export const reportUser = async (data: { target_id: number; reason: string }): Promise<{ data: any }> => {
    const response = await api.post('/reports/user/', data);
    return response;
};

export const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/auth/upload-avatar/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    
    return response.data.url;
};

export const getUserStatus = async (): Promise<string> => {
    try {
        const response = await api.get('/auth/profile/');
        return response.data.status || 'user';
    } catch (error) {
        console.error('Ошибка получения статуса:', error);
        return 'user';
    }
};

export const isAdmin = async (): Promise<boolean> => {
    const status = await getUserStatus();
    return status === 'admin';
};