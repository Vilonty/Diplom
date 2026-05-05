import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import CreateTestOrSurvey from '../../components/common/Create/CreateTestOrSurvey';

const CreateMain: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const validType = type === 'survey' ? 'survey' : 'test';
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EAE7DC' }}>
      <Header />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <CreateTestOrSurvey type={validType} />
      </div>
      <Footer />
    </div>
  );
};

export default CreateMain;