import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Footer.module.css';
import tgLogo from '../../../assets/footer/tg_logo.png';
import vkLogo from '../../../assets/footer/vk_logo.png';
import ytLogo from '../../../assets/footer/yt_logo.png';

const Footer = () => {
  const navigate = useNavigate();

  // Обработчики навигации с параметрами
  const handleTestsNew = () => {
    navigate('/testlist?sort=new&type=test');
  };

  const handleTestsPopular = () => {
    navigate('/testlist?sort=popular&type=test');
  };

  const handleTestsTopics = () => {
    navigate('/testlist?type=test');
  };

  const handleSurveysNew = () => {
    navigate('/testlist?sort=new&type=survey');
  };

  const handleSurveysPopular = () => {
    navigate('/testlist?sort=popular&type=survey');
  };

  const handleSurveysTopics = () => {
    navigate('/testlist?type=survey');
  };

  const handleCreateTest = () => {
    navigate('/create/test');
  };

  const handleCreateSurvey = () => {
    navigate('/create/survey');
  };

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
            <li onClick={handleTestsNew}>НОВЫЕ</li>
            <li onClick={handleTestsPopular}>ЛУЧШИЕ</li>
            <li onClick={handleTestsTopics}>ТЕМЫ</li>
          </ul>
        </div>

        {/* Вторая колонка - ОПРОСЫ */}
        <div>
          <h3>ОПРОСЫ</h3>
          <ul>
            <li onClick={handleSurveysNew}>НОВЫЕ</li>
            <li onClick={handleSurveysPopular}>ЛУЧШИЕ</li>
            <li onClick={handleSurveysTopics}>ТЕМЫ</li>
          </ul>
        </div>

        {/* Третья колонка - СОЗДАТЬ */}
        <div>
          <h3>СОЗДАТЬ</h3>
          <ul>
            <li onClick={handleCreateTest}>ТЕСТЫ</li>
            <li onClick={handleCreateSurvey}>ОПРОСЫ</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;