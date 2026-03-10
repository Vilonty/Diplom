import React from "react";
import InputForm from '../Form/RegisterAuthForm/InputForm';
import BaseAuthLayout from './BaseAuthLayout';
import AuthButton from '../Button/AuthButton/AuthButton';
import styles from "./LoginMain.module.css";

const LoginMain = () => {
    return (
        <BaseAuthLayout 
            title="ВХОД" 
            linkTo="/register" 
            linkText="ЗАРЕГИСТРИРОВАТЬСЯ"
        >
            <form className={styles.form}>
                <InputForm names='login' pl='ЛОГИН' />
                <InputForm names='password' pl='ПАРОЛЬ'/>

                <AuthButton type="submit">
                    ВОЙТИ
                </AuthButton>
            </form>
        </BaseAuthLayout>
    );
};

export default LoginMain;