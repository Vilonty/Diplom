import React from 'react';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import TestStatsPageMain from '../../components/common/TestStastPage/TestStastPageMain';

const TestStatsPage = () => {
    return (
        <div>
            <Header />
            <TestStatsPageMain />
            <Footer />
        </div>
    );
};

export default TestStatsPage;