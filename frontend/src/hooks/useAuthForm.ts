import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login } from '../api/auth';

interface RegisterFormData {
    login: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface LoginFormData {
    login: string;
    password: string;
}

export const useRegisterForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<RegisterFormData>({
        login: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Проверка паролей
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await register(formData.login, formData.email, formData.password);
            navigate('/login');
        } catch (err: any) {
            if (err.response?.data) {
                const errors = err.response.data;
                if (typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join(', ');
                    setError(errorMessages);
                } else {
                    setError(errors);
                }
            } else {
                setError('Ошибка регистрации. Попробуйте позже.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        error,
        isSubmitting,
        handleChange,
        handleSubmit
    };
};

export const useLoginForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<LoginFormData>({
        login: '',
        password: ''
    });
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        try {
            await login(formData.login, formData.password);
            navigate('/profile');
        } catch (err: any) {
            if (err.response?.data) {
                setError(err.response.data);
            } else {
                setError('Неверный логин или пароль');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        error,
        isSubmitting,
        handleChange,
        handleSubmit
    };
};