import React from "react";
import styles from "./AuthButton.module.css";

interface AuthButtonProps {
    children: React.ReactNode;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
}

const AuthButton = ({ children, type = 'button', onClick }: AuthButtonProps) => {
    return (
        <button 
            className={styles.button}
            type={type}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default AuthButton;