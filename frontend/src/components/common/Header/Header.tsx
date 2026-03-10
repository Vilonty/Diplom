import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css'; 

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          ОНЛАЙН-ТЕСТЫ
        </Link>
        
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>
            ГЛАВНАЯ
          </Link>
          <Link to="/products" className={styles.navLink}>
            ТЕСТЫ
          </Link>
          <Link to="/about" className={styles.navLink}>
            СОЗДАТЬ
          </Link>
        </nav>

        <Link to="/register" className={styles.loginButton}>
          войти
        </Link>
      </div>
    </header>
  );
};

export default Header;