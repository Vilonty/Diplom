import React from 'react';
import Header from '../../components/common/Header/Header';
import SearchSection from '../../components/common/Search/SearchSection/SearchSection';
import TestSection from '../../components/common/Home/TestSection/TestSection'
import ActiveUsers from '../../components/common/Home/ActiveUsers/UsersSection'
import Footer from '../../components/common/Footer/Footer';
import styles from './Home.module.css';

const Home = () => {
  return (
    <div>
        <Header />

        <main>
          
          {/* Блок поиска */}
          <div className={styles.hideOnMobile}>
            <SearchSection showTypeSelector={false} />
          </div>

          {/* Блок тесты - только тесты */}
          <TestSection title="ТЕСТЫ" type="recent" />

          {/* Блок опросы - только опросы */}
          <TestSection title="ОПРОСЫ" type="surveys" />

          {/* Блок авторы */}
          <ActiveUsers title="АКТИВНЫЕ ПОЛЬЗОВАТЕЛИ"/>
          
        </main>
        
        <Footer />
    </div>
  );
};

export default Home;