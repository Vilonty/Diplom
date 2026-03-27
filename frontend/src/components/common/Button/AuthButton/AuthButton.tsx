import React from "react";
import styles from "./AuthButton.module.css";

interface AuthButtonProps {
    children: React.ReactNode;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
    disabled?: boolean; 
}

const AuthButton = ({ 
    children, 
    type = 'button', 
    onClick,
    disabled = false  
}: AuthButtonProps) => {
    return (
        <button 
            className={styles.button}
            type={type}
            onClick={onClick}
            disabled={disabled}  
        >
            {children}
        </button>
    );
};

export default AuthButton;