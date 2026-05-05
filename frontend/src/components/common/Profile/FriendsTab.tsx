import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import styles from './profile.module.css';

interface Friend {
    id: number;
    login: string;
    full_name: string;
    avatar: string | null;
    last_seen: string;
}

interface FriendRequest {
    id: number;
    from_user: {
        id: number;
        login: string;
        full_name: string;
        avatar: string | null;
    };
    created_at: string;
}

interface FriendsTabProps {
    isOwnProfile?: boolean;
    userId?: number | null;
}

const FriendsTab: React.FC<FriendsTabProps> = ({ isOwnProfile = true, userId = null }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
    const [error, setError] = useState<string | null>(null);

    const BASE_URL = 'http://localhost:8000';

    useEffect(() => {
        console.log('=== FriendsTab useEffect START ===');
        console.log('isOwnProfile:', isOwnProfile);
        console.log('userId:', userId);
        
        if (isOwnProfile) {
            console.log('Загружаем своих друзей');
            loadMyFriends();
            loadFriendRequests();
        } else if (userId) {
            console.log('Загружаем друзей пользователя ID:', userId);
            loadUserFriends(userId);
        } else {
            console.error('Нет userId и не свой профиль!');
            setLoading(false);
        }
    }, [isOwnProfile, userId]);

    const loadMyFriends = async () => {
        try {
            console.log('Запрос GET /friends/');
            const response = await api.get('/friends/');
            console.log('Ответ:', response.data);
            setFriends(response.data);
        } catch (err) {
            console.error('Ошибка:', err);
            setError('Не удалось загрузить друзей');
        } finally {
            setLoading(false);
        }
    };

    const loadUserFriends = async (targetUserId: number) => {
        try {
            console.log(`Запрос GET /friends/${targetUserId}/`);
            const response = await api.get(`/friends/${targetUserId}/`);
            console.log('Ответ:', response.data);
            setFriends(response.data);
        } catch (err: any) {
            console.error('Ошибка:', err);
            console.error('Статус:', err.response?.status);
            console.error('Данные:', err.response?.data);
            setError(`Не удалось загрузить друзей: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadFriendRequests = async () => {
        try {
            const response = await api.get('/friends/requests/');
            setFriendRequests(response.data);
        } catch (err) {
            console.error('Ошибка загрузки заявок:', err);
        }
    };

    const getAvatarUrl = (avatar: string | null) => {
        if (!avatar) return 'https://via.placeholder.com/48/4C4C4C/FFFFFF?text=User';
        if (avatar.startsWith('http') || avatar.startsWith('data:image')) {
            return avatar;
        }
        return `${BASE_URL}${avatar}`;
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>Ошибка: {error}</div>;
    }

    return (
        <div className={styles.friendsContent}>
            <div className={styles.stickyHeader}>
                <div className={styles.tabsHeader}>
                    <button 
                        className={`${styles.tabButton} ${activeTab === 'friends' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        Друзья ({friends.length})
                    </button>
                    {isOwnProfile && (
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'requests' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('requests')}
                        >
                            Заявки ({friendRequests.length})
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'friends' && (
                <div className={styles.friendsList}>
                    {friends.length === 0 ? (
                        <div className={styles.empty}>Нет друзей</div>
                    ) : (
                        friends.map((friend) => (
                            <div className={styles.friendItem} key={friend.id}>
                                <Link to={`/profile/${friend.id}`} className={styles.friendLink}>
                                    <div className={styles.friendAvatar}>
                                        <img 
                                            src={getAvatarUrl(friend.avatar)} 
                                            alt={friend.full_name || friend.login}
                                            className={styles.avatarImage}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48/4C4C4C/FFFFFF?text=User';
                                            }}
                                        />
                                    </div>
                                    <div className={styles.friendInfo}>
                                        <span className={styles.friendName}>{friend.full_name || friend.login}</span>
                                        <span className={styles.friendLastSeen}>
                                            Последний заход: {new Date(friend.last_seen).toLocaleString('ru-RU')}
                                        </span>
                                    </div>
                                </Link>
                                {isOwnProfile && (
                                    <button 
                                        className={styles.removeFriendButton}
                                        onClick={() => handleRemoveFriend(friend.id)}
                                    >
                                        Удалить
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {isOwnProfile && activeTab === 'requests' && (
                <div className={styles.friendsList}>
                    {friendRequests.length === 0 ? (
                        <div className={styles.empty}>Нет входящих заявок</div>
                    ) : (
                        friendRequests.map((request) => (
                            <div className={styles.friendRequestItem} key={request.id}>
                                <Link to={`/profile/${request.from_user.id}`} className={styles.friendLink}>
                                    <div className={styles.friendAvatar}>
                                        <img 
                                            src={getAvatarUrl(request.from_user.avatar)} 
                                            alt={request.from_user.full_name || request.from_user.login}
                                            className={styles.avatarImage}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48/4C4C4C/FFFFFF?text=User';
                                            }}
                                        />
                                    </div>
                                    <div className={styles.friendInfo}>
                                        <span className={styles.friendName}>
                                            {request.from_user.full_name || request.from_user.login}
                                        </span>
                                        <span className={styles.requestDate}>
                                            Заявка от: {new Date(request.created_at).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </Link>
                                <div className={styles.requestButtons}>
                                    <button 
                                        className={styles.acceptButton}
                                        onClick={() => handleAcceptRequest(request.id)}
                                    >
                                        Принять
                                    </button>
                                    <button 
                                        className={styles.rejectButton}
                                        onClick={() => handleRejectRequest(request.id)}
                                    >
                                        Отклонить
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default FriendsTab;