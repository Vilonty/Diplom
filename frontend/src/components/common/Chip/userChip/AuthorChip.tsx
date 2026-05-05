// src/components/common/AuthorChip/AuthorChip.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './AuthorChip.module.css';

interface AuthorChipProps {
    authorId: number;
    authorName: string;
    authorAvatar?: string | null;
}

const AuthorChip: React.FC<AuthorChipProps> = ({ authorId, authorName, authorAvatar }) => {
    const BASE_URL = 'http://localhost:8000';
    
    const getAvatarUrl = (avatar: string | null | undefined) => {
        if (!avatar) return null;
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
            return avatar;
        }
        return `${BASE_URL}${avatar}`;
    };

    const avatarUrl = getAvatarUrl(authorAvatar);

    return (
        <Link to={`/profile/${authorId}`} className={styles.authorLink}>
            <div className={styles.authorChip}>
                <div className={styles.authorAvatar}>
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl}
                            alt={authorName} 
                            className={styles.avatarImage}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder} />
                    )}
                </div>
                <span className={styles.authorName}>{authorName}</span>
            </div>
        </Link>
    );
};

export default AuthorChip;