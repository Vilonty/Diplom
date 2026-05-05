import React from 'react';
import styles from './Footer.module.css';
import tgLogo from '../../../assets/footer/tg_logo.png';
import vkLogo from '../../../assets/footer/vk_logo.png';
import ytLogo from '../../../assets/footer/yt_logo.png';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* Левый блок - информация */}
      <div className={styles.info}>
        <h3>ОНЛАЙН ТЕСТЫ</h3>
        <h3>ПОЧТА: example@gmail.com</h3>
        <div className={styles.socialRow}>
          <h3>СОЦ СЕТИ:</h3>
          <div className={styles.socialIcons}>
            <a 
              href="https://t.me" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.socialIcon}
            >
              <img src={tgLogo} alt="Telegram" />
            </a>
            <a 
              href="https://vk.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.socialIcon}
            >
              <img src={vkLogo} alt="VK" />
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.socialIcon}
            >
              <img src={ytLogo} alt="YouTube" />
            </a>
          </div>
        </div>
      </div>

      {/* Правый блок - навигация в 3 колонки */}
      <div className={styles.nav}>
        {/* Первая колонка - ТЕСТЫ */}
        <div>
          <h3>ТЕСТЫ</h3>
          <ul>
            <li>НОВЫЕ</li>
            <li>ЛУЧШИЕ</li>
            <li>ТЕМЫ</li>
          </ul>
        </div>

        {/* Вторая колонка - ОПРОСЫ */}
        <div>
          <h3>ОПРОСЫ</h3>
          <ul>
            <li>НОВЫЕ</li>
            <li>ЛУЧШИЕ</li>
            <li>ТЕМЫ</li>
          </ul>
        </div>

        {/* Третья колонка - СОЗДАТЬ */}
        <div>
          <h3>СОЗДАТЬ</h3>
          <ul>
            <li>ТЕСТЫ</li>
            <li>ОПРОСЫ</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;