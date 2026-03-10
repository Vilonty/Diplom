import React from 'react';
import Header from '../../components/common/Header/Header';
import SearchSection from '../../components/common/Search/SearchSection/SearchSection';
import TestSection from '../../components/common/Home/TestSection/TestSection'
import ActiveUsers from '../../components/common/Home/ActiveUsers/UsersSection'
import Footer from '../../components/common/Footer/Footer';

const Home = () => {
  return (
    <div>
        <Header />

            <main>

                {/* Блок поиска */}
                <SearchSection/>

                {/* Блок тесты */}
                <TestSection title="ТЕСТЫ"/>

                {/* Блок опросы */}
                <TestSection title="ОПРОСЫ"/>

                {/* Блок авторы */}
                <ActiveUsers title="АКТИВНЫЕ ПОЛЬЗОВАТЕЛИ"/>
                
            </main>
        
        <Footer />
    </div>
  );
};

export default Home;