import React from 'react';
import Chip from '../../Chip/Chip';
import styles from './SearchSection.module.css';

const SearchSection = () => {
  return (
    <section className={styles.section}>
      <input 
        placeholder='🔍 поиск тестов...'
        className={styles.searchInput}
      />
      
      <div className={styles.chipContainer}>
        {/* Теги слева */}
        <div className={styles.tags}>
          <Chip label="НОВЫЕ" type="tag" />
          <Chip label="ЛУЧШИЕ" type="tag" />
          <Chip label="СТАРЫЕ" type="tag" />
          <Chip label="ТЕМЫ" type="tag" />
        </div>
        
        {/* Фильтры справа */}
        <div className={styles.filters}>
          <Chip label="А⭣Я" type="filter" />
          <Chip label="🔍" type="filter" />
        </div>
      </div>
    </section>
  );
};

export default SearchSection;