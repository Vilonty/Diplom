import React from 'react';
import Card from '../../Card/UserCard/Card';
import styles from './UsersSection.module.css';


interface TestSectionProps {
  // Основные данные
  title: string;

}
const ActiveUsers = ({
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
            name="пользователь" 
            complete="8"
            create="1"
          />
          <Card 
            name="пользователь" 
            complete="8"
            create="1"
          />
          <Card 
            name="пользователь" 
            complete="8"
            create="1"
          />
          <Card 
            name="пользователь" 
            complete="8"
            create="1"
          />
          <Card 
            name="пользователь" 
            complete="8"
            create="1"
          />
        </div>
      </div>
    </section>
  );
};

export default ActiveUsers;