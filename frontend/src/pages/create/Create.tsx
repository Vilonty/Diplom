import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import choiceStyles from './CreateChoice.module.css';

const Create = () => {
  return (
    <div className={choiceStyles.createPage}>
      <Header />
      <div className={choiceStyles.createContainer}>
        <h2>выберите тип</h2>
        <div className={choiceStyles.createMainBlockContainer}>
          <Link to="/create/test" className={choiceStyles.createMainBlock}>
            <div className={choiceStyles.createMainBlockTitle}>тест</div>
            <div className={choiceStyles.createMainBlockDescription}>
              <p>проверка знаний с оценкой</p>
              <p>ограничение по времени</p>
            </div>
          </Link>
          
          <Link to="/create/survey" className={choiceStyles.createMainBlock}>
            <div className={choiceStyles.createMainBlockTitle}>опрос</div>
            <div className={choiceStyles.createMainBlockDescription}>
              <p>сбор мнений без оценки</p>
              <p>без ограничения времени</p>
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Create;