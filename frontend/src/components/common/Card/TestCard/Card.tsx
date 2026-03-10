import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title: string;
  description?: string;
  author?: string;
  rating?: string;
  users?: string;
  questions?: string;
  imageUrl?: string;
  type?: 'test' | 'survey';
}

const Card = ({ 
  title,
  description,
  author,
  rating,
  users,
  questions,
  imageUrl,
  type
}: CardProps) => {
  return (
    <div className={styles.card}>
      {/* Блок с изображением */}
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <img src={imageUrl} alt={title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
      </div>
      
      {/* Блок с автором */}
      <div className={styles.authorBlock}>
        <div className={styles.authorChip}>
          <div className={styles.authorAvatar} />
          <p className={styles.authorName}>{author}</p>
        </div>
      </div>

      {/* Блок с заголовком и описанием */}
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
        {type === 'survey' && <p className={styles.surveyBadge}>опросник</p>}
      </div>

      {/* Блок со статистикой */}
      <div className={styles.stats}>
        <hr className={styles.divider} />
        <div className={styles.statsRow}>
          <p className={styles.statItem}>⭐{rating}</p>
          <p className={styles.statItem}>👤{users}</p>
          <p className={styles.statItem}>📗{questions}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;