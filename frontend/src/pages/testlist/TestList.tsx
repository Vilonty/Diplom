import React from 'react';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import TestSection from '../../components/common/Home/TestSection/TestSection'
import TestList from '../../components/common/TestList/TestsList';

const Home = () => {
  return (
    <div>
        <Header />

        
          <TestList />

                
        
        <Footer />
    </div>
  );
};

export default Home;