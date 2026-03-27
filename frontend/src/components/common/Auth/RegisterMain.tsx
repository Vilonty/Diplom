// src/components/RegisterMain.tsx

import React from 'react';
import InputForm from '../Form/RegisterAuthForm/InputForm';
import BaseAuthLayout from './BaseAuthLayout';
import AuthButton from '../Button/AuthButton/AuthButton';
import { useRegisterForm } from '../../../hooks/useAuthForm';
import styles from "./RegisterMain.module.css";

const RegisterMain = () => {
    const { formData, error, isSubmitting, handleChange, handleSubmit } = useRegisterForm();

    return (
        <BaseAuthLayout 
            title="РЕГИСТРАЦИЯ" 
            linkTo="/login" 
            linkText="ВОЙТИ"
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
                    names='email' 
                    pl='EMAIL'
                    value={formData.email}
                    onChange={handleChange}
                />
                <InputForm 
                    names='password' 
                    pl='ПАРОЛЬ'
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                />
                <InputForm 
                    names='confirmPassword' 
                    pl='ПОВТОР ПАРОЛЯ'
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                />

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        name="subscribe"
                        value="yes"
                        className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>
                        обработка персональных данных
                    </span>
                </label>

                <AuthButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'РЕГИСТРАЦИЯ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
                </AuthButton>
            </form>
        </BaseAuthLayout>
    );
};

export default RegisterMain;