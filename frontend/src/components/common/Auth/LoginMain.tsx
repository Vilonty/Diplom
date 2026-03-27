// src/components/LoginMain.tsx

import React from 'react';
import InputForm from '../Form/RegisterAuthForm/InputForm';
import BaseAuthLayout from './BaseAuthLayout';
import AuthButton from '../Button/AuthButton/AuthButton';
import { useLoginForm } from '../../../hooks/useAuthForm';
import styles from "./LoginMain.module.css";

const LoginMain = () => {
    const { formData, error, isSubmitting, handleChange, handleSubmit } = useLoginForm();

    return (
        <BaseAuthLayout 
            title="ВХОД" 
            linkTo="/register" 
            linkText="ЗАРЕГИСТРИРОВАТЬСЯ"
        >
            {error && (
                <div style={{ 
                    color: 'red', 
                    textAlign: 'center', 
                    marginBottom: '15px',
                    fontSize: '14px'
                }}>
                    {error}
                </div>
            )}
            
            <form className={styles.form} onSubmit={handleSubmit}>
                <InputForm 
                    names='login' 
                    pl='ЛОГИН'
                    value={formData.login}
                    onChange={handleChange}
                />
                <InputForm 
                    names='password' 
                    pl='ПАРОЛЬ'
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                />

                <AuthButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'ВХОД...' : 'ВОЙТИ'}
                </AuthButton>
            </form>
        </BaseAuthLayout>
    );
};

export default LoginMain;