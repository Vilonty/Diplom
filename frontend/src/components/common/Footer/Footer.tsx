import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      {/* Левый блок - информация */}
      <div className={styles.info}>
        <h3>ОНЛАЙН ТЕСТЫ</h3>
        <h3>ПОЧТА: example@gmail.com</h3>
        <h3>СОЦ СЕТИ:</h3>
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