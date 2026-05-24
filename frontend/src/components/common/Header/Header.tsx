import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import loginIcon from '../../../assets/header/login.png';
import SearchSection from '../Search/SearchSection/SearchSection';
import { getUserStatus } from '../../../api/auth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const searchRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const showSearch = true;
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsAuthenticated(true);
          setUserId(user.id?.toString() || null);
          
          const status = await getUserStatus();
          setIsAdmin(status === 'admin');
        } catch (e) {
          setIsAuthenticated(false);
          setUserId(null);
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setIsAdmin(false);
      }
    };
    
    checkAuth();
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isMenuOpen) setIsMenuOpen(false);
  };
  
  const closeSearch = () => {
    setIsSearchOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        closeSearch();
      }
    };
    
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);
  
  return (
    <>
      <header className={styles.header}>
        <div className={styles.container}>
          {showSearch && (
            <button className={styles.searchButton} onClick={toggleSearch} aria-label="Поиск">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" />
              </svg>
            </button>
          )}
          
          <Link to="/" className={styles.logo}>
            ОНЛАЙН-ТЕСТЫ
          </Link>
          
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>ГЛАВНАЯ</Link>
            <Link to="/testlist" className={styles.navLink}>ТЕСТЫ</Link>
            <Link to="/create" className={styles.navLink}>СОЗДАТЬ</Link>
            {isAdmin && (
              <Link to="/admin" className={styles.navLink}>АДМИН</Link>
            )}
          </nav>
          
          <Link to={isAuthenticated ? `/profile/${userId}` : "/register"} className={styles.loginButton}>
            <img src={loginIcon} alt="картинка кнопки пользователя" />
            {!isAuthenticated && <span>войти</span>}
          </Link>
          
          <div className={styles.mobileButtons}>
            <Link to={isAuthenticated ? `/profile/${userId}` : "/register"} className={styles.profileButton} aria-label="Профиль">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
            
            <button className={styles.burgerButton} onClick={toggleMenu} aria-label="Меню">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6L20 6M4 12L20 12M4 18L20 18" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <button className={styles.closeMenuButton} onClick={closeMenu}>✕</button>
        </div>
        <nav className={styles.mobileNav}>
          <Link to="/" className={styles.mobileNavLink} onClick={closeMenu}>ГЛАВНАЯ</Link>
          <Link to="/testlist" className={styles.mobileNavLink} onClick={closeMenu}>ТЕСТЫ</Link>
          <Link to="/create" className={styles.mobileNavLink} onClick={closeMenu}>СОЗДАТЬ</Link>
          {isAdmin && (
            <Link to="/admin" className={styles.mobileNavLink} onClick={closeMenu}>АДМИН</Link>
          )}
          <Link to={isAuthenticated ? `/profile/${userId}` : "/register"} className={styles.mobileNavLink} onClick={closeMenu}>
            {isAuthenticated ? "ПРОФИЛЬ" : "ВОЙТИ"}
          </Link>
        </nav>
      </div>
      
      {isSearchOpen && (
        <div className={styles.searchOverlay}>
          <div className={styles.searchMenu} ref={searchRef}>
            <div className={styles.searchMenuHeader}>
              <button className={styles.closeSearchButton} onClick={closeSearch}>✕</button>
            </div>
            <SearchSection isMobile={true} showTypeSelector={false} />
          </div>
        </div>
      )}
      
      {isMenuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}
    </>
  );
};

export default Header;