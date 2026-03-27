export interface User {
    id: number;
    login: string;
    email: string;
    status: string;
    created_at: string;
}

export interface LoginRequest {
    login: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}

export interface RegisterRequest {
    login: string;
    email: string;
    password: string;
    password2: string;
}

export interface RegisterResponse {
    id: number;
    login: string;
    email: string;
    status: string;
    created_at: string;
}

export interface RefreshResponse {
    access: string;
    refresh?: string;
}