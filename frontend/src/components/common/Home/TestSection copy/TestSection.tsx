import React from 'react';
import Card from '../../Card/TestCard/Card';
import styles from './TestSection.module.css';


interface TestSectionProps {
  // Основные данные
  title: string;

}
const TestSection = ({
    title
}: TestSectionProps) => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          {title}
        </h2>
        
        <div className={styles.grid}>
          <Card 
            title="НАЗВАНИЕ" 
            description="ОПИСАНИЕ"
            author="автор"
            rating="4.5/10"
            users="23"
            questions="10"
            type="test"
          />
          <Card 
            title="НАЗВАНИЕ" 
            description="ОПИСАНИЕ"
            author="автор"
            rating="4.5/10"
            users="23"
            questions="10"
            type="test"
          />
          <Card 
            title="НАЗВАНИЕ" 
            description="ОПИСАНИЕ"
            author="автор"
            rating="4.5/10"
            users="23"
            questions="10"
            type="test"
          />
          <Card 
            title="НАЗВАНИЕ" 
            description="ОПИСАНИЕ"
            author="автор"
            rating="4.5/10"
            users="23"
            questions="10"
            type="test"
          />
        </div>
      </div>
    </section>
  );
};

export default TestSection;