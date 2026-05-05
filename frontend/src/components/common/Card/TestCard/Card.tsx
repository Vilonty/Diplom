import React from 'react';
import { Link } from 'react-router-dom';
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
  testId?: string;
  authorId?: string;
  authorAvatar?: string;
}

const Card = ({ 
  title,
  description,
  author,
  rating,
  users,
  questions,
  imageUrl,
  type,
  testId = '#',
  authorId = '#',
  authorAvatar
}: CardProps) => {
  const testLink = type === 'test' ? `/test/${testId}` : `/survey/${testId}`;
  const profileLink = `/profile/${authorId}`;

  // Обработчик клика по автору - навигация через JS, не через ссылку
  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = profileLink;
  };

  return (
    <div className={styles.card}>
      <Link to={testLink} className={styles.testLink}>
        <div className={styles.imageContainer}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title} 
              className={styles.image}
              onError={(e) => {
                console.error('❌ Ошибка загрузки картинки:', imageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className={styles.imagePlaceholder} />
          )}
        </div>
        
        <div className={styles.authorBlock}>
          <div 
            className={styles.authorChip}
            onClick={handleAuthorClick}
          >
            <div className={styles.authorAvatar}>
              {authorAvatar ? (
                <img 
                  src={authorAvatar}
                  alt={author} 
                  className={styles.avatarImage}
                  onError={(e) => {
                    console.error('❌ Ошибка загрузки аватара:', authorAvatar);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className={styles.avatarPlaceholder} />
              )}
            </div>
            <p className={styles.authorName}>{author}</p>
          </div>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
          {type === 'survey' && <p className={styles.surveyBadge}>опросник</p>}
        </div>

        <div className={styles.stats}>
          <hr className={styles.divider} />
          <div className={styles.statsRow}>
            <p className={styles.statItem}>⭐{rating}</p>
            <p className={styles.statItem}>👤{users}</p>
            <p className={styles.statItem}>📗{questions}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Card;