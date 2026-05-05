import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // Замени на свой URL бэкенда

export const useRegisterForm = () => {
    const [formData, setFormData] = useState({
        login: '',
        email: '',
        password: '',
        confirmPassword: '',
        subscribe: false
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await axios.post(`${API_URL}/auth/register/`, {
                login: formData.login,
                email: formData.email,
                password: formData.password,
                password2: formData.confirmPassword,
                subscribe: formData.subscribe
            });

            // Автоматически логиним после регистрации
            const loginResponse = await axios.post(`${API_URL}/auth/login/`, {
                login: formData.login,
                password: formData.password
            });

            localStorage.setItem('access_token', loginResponse.data.access);
            localStorage.setItem('refresh_token', loginResponse.data.refresh);
            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
            
            window.location.href = '/profile'; // Перенаправление после успеха
            
        } catch (err: any) {
            if (err.response?.data) {
                const errors = err.response.data;
                if (typeof errors === 'object') {
                    setError(Object.values(errors).flat().join(', '));
                } else {
                    setError(errors.error || 'Ошибка регистрации');
                }
            } else {
                setError('Ошибка соединения с сервером');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return { formData, error, isSubmitting, handleChange, handleSubmit };
};

export const useLoginForm = () => {
    const [formData, setFormData] = useState({
        login: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await axios.post(`${API_URL}/auth/login/`, formData);
            
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            window.location.href = '/profile';
            
        } catch (err: any) {
            if (err.response?.data) {
                setError(err.response.data.error || 'Ошибка входа');
            } else {
                setError('Ошибка соединения с сервером');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return { formData, error, isSubmitting, handleChange, handleSubmit };
};