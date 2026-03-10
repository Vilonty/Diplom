import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  name: string;
  complete: string;
  create: string;
}

const Card = ({ 
  name,
  complete,
  create
}: CardProps) => {
  return (
    <div className={styles.card}>

      {/* Блок с автором */}
      <div className={styles.authorBlock}>
        <div className={styles.authorChip}>
          <div className={styles.authorAvatar} />
          <p className={styles.authorName}>{name}</p>
        </div>
      </div>

      {/* Блок со статистикой */}
      <div className={styles.stats}>
        <div className={styles.statsRow}>
          <p className={styles.statItem}>✅{complete}</p>
          <p className={styles.statItem}>🛠️{create}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;