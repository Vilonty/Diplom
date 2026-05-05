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

export interface User {
    id: number;
    login: string;
    email: string;
    full_name: string;
    bio: string;
    avatar: string | null;
    status: string;
    is_subscribe: boolean;
    created_at: string;
    last_seen: string;
    friends_count?: number;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}

export interface RegisterResponse {
    message?: string;
    user?: User;
    access?: string;
    refresh?: string;
}