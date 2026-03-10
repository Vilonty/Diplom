import React from "react";
import InputForm from '../Form/RegisterAuthForm/InputForm';
import BaseAuthLayout from './BaseAuthLayout';
import AuthButton from '../Button/AuthButton/AuthButton';
import styles from "./RegisterMain.module.css";

const RegisterMain = () => {
    return (
        <BaseAuthLayout 
            title="РЕГИСТРАЦИЯ" 
            linkTo="/login" 
            linkText="ВОЙТИ"
        >
            <form className={styles.form}>
                <InputForm names='login' pl='ЛОГИН' />
                <InputForm names='email' pl='EMAIL' />
                <InputForm names='password' pl='ПАРОЛЬ'/>
                <InputForm names='confirmPassword' pl='ПОВТОР ПАРОЛЯ'/>

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

                <AuthButton type="submit">
                    ЗАРЕГИСТРИРОВАТЬСЯ
                </AuthButton>
            </form>
        </BaseAuthLayout>
    );
};

export default RegisterMain;