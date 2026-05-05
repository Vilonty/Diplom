import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  name: string;
  completed: string;
  created: string;
  userId: string;
  avatar?: string;
}

const Card = ({ 
  name, 
  completed, 
  created, 
  userId, 
  avatar 
}: CardProps) => {
  const profileLink = `/profile/${userId}`;

  return (
    <a href={profileLink} className={styles.cardLink} style={{ textDecoration: 'none' }}>
      <div className={styles.card}>
        <div className={styles.authorBlock}>
          <div className={styles.authorChip}>
            <div className={styles.authorAvatar}>
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={name} 
                  className={styles.avatarImage}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add(styles.avatarPlaceholder);
                  }}
                />
              ) : (
                <div className={styles.avatarPlaceholder} />
              )}
            </div>
            <p className={styles.authorName}>{name}</p>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statsRow}>
            <p className={styles.statItem}>✅{completed}</p>
            <p className={styles.statItem}>🛠️{created}</p>
          </div>
        </div>
      </div>
    </a>
  );
};

export default Card;