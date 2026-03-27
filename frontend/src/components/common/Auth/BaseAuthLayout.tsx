import React from "react";
import { Link } from 'react-router-dom';
import styles from "./BaseAuthLayout.module.css";

interface BaseAuthLayoutProps {
    title: string;
    linkTo: string;
    linkText: string;
    children: React.ReactNode;
}

const BaseAuthLayout = ({ title, children, linkTo, linkText }: BaseAuthLayoutProps) => {
    return (
        <main className={styles.main}>
            {/* Приветствие */}
            <div className={styles.welcomeSection}>
                <h2 className={styles.welcomeTitle}>
                    ДОБРО ПОЖАЛОВАТЬ
                </h2>
            </div>
            
            {/* Форма */}
            <div className={styles.formSection}>
                <h2 className={styles.formTitle}>
                    {title}
                </h2>
                
                {children}
                
                <Link
                    className={styles.link}
                    to={linkTo}
                >
                    {linkText}
                </Link>
            </div>
        </main>
    );
};

export default BaseAuthLayout;