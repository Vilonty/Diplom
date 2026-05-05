import React from 'react';
import Header from '../../../components/common/Header/Header';
import Footer from '../../../components/common/Footer/Footer';

import TestResult from '../../../components/common/Result/TestResult'

const TestPage = () => {
  return (
    <div>
        <Header />
            <TestResult  />
        <Footer />
    </div>
  );
};

export default TestPage;