import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import { uploadAvatar } from '../../../../api/auth';
import ReportModal from '../../ReportModal/ReportModal';
import MuteBanModal from '../../BanMute/MuteBanModal';
import styles from './ProfileHeader.module.css';

interface ProfileHeaderProps {
    isOwnProfile: boolean;
    userId: number | null;
}

interface UserData {
    id: number;
    login: string;
    full_name: string;
    bio: string;
    avatar: string | null;
    created_at: string;
    last_seen: string;
    friends_count: number;
    status?: string;
    is_muted?: boolean;
    is_banned?: boolean;
    mute_reason?: string;
    ban_reason?: string;
    mute_until?: string;
    ban_until?: string;
    mute_permanent?: boolean;
    ban_permanent?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ isOwnProfile, userId }) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [friendStatus, setFriendStatus] = useState<'none' | 'request_sent' | 'friend'>('none');
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();
    const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);

    const BASE_URL = 'http://localhost:8000';
    
    const reportReasons = [
        "Оскорбительное поведение",
        "Спам",
        "Другое"
    ];

    useEffect(() => {
        loadUserData();
        checkAdminStatus();
        if (!isOwnProfile && userId) {
            checkFriendStatus();
        }
    }, [userId, isOwnProfile]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            let response;
            
            if (isOwnProfile) {
                response = await api.get('/auth/profile/');
            } else if (userId) {
                response = await api.get(`/auth/profile/${userId}/`);
            }
            
            if (response && response.data) {
                setUserData(response.data);
                setFullName(response.data.full_name || response.data.login);
                setBio(response.data.bio || '');
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkAdminStatus = async () => {
        try {
            const profile = await api.get('/auth/profile/');
            setIsAdmin(profile.data.status === 'admin');
        } catch (error) {
            console.error('Ошибка проверки админа:', error);
        }
    };

    const checkFriendStatus = async () => {
        try {
            const response = await api.get(`/friends/check/${userId!}/`);
            if (response.data.is_friend) {
                setFriendStatus('friend');
            } else if (response.data.is_friend_request_sent) {
                setFriendStatus('request_sent');
            } else {
                setFriendStatus('none');
            }
        } catch (error) {
            console.error('Ошибка проверки статуса дружбы:', error);
        }
    };

    const handleLogout = async () => {
        try {
            const refresh = localStorage.getItem('refresh_token');
            if (refresh) {
                await api.post('/auth/logout/', { refresh });
            }
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            localStorage.clear();
            navigate('/login');
        }
    };

    const handleAddFriend = async () => {
        if (!userId) {
            alert('Ошибка: ID пользователя не найден');
            return;
        }
        
        try {
            await api.post(`/friends/send/${userId}/`);
            setFriendStatus('request_sent');
            alert('Запрос на добавление в друзья отправлен!');
        } catch (error: any) {
            console.error('Ошибка:', error);
            alert(`Ошибка: ${error.response?.data?.error || error.message || 'Неизвестная ошибка'}`);
        }
    };

    const handleRemoveFriend = async () => {
        if (!userId) {
            alert('Ошибка: ID пользователя не найден');
            return;
        }
        
        try {
            await api.delete(`/friends/remove/${userId}/`);
            setFriendStatus('none');
            alert('Пользователь удалён из друзей');
        } catch (error: any) {
            console.error('Ошибка:', error);
            alert(`Ошибка: ${error.response?.data?.error || error.message || 'Неизвестная ошибка'}`);
        }
    };

    const handleCancelRequest = async () => {
        if (!userId) {
            alert('Ошибка: ID пользователя не найден');
            return;
        }
        
        try {
            await api.delete(`/friends/cancel-request/${userId}/`);
            setFriendStatus('none');
            alert('Запрос отменён');
        } catch (error: any) {
            console.error('Ошибка:', error);
            alert(`Ошибка: ${error.response?.data?.error || error.message || 'Неизвестная ошибка'}`);
        }
    };

    const handleMuteUser = async (reason: string, duration: string, durationValue: number | null, durationUnit: string | null) => {
        try {
            await api.post(`/admin/users/${userId}/mute/`, { 
                reason, 
                duration,
                duration_value: durationValue,
                duration_unit: durationUnit
            });
            alert(`Пользователь замучен ${duration === 'permanent' ? 'перманентно' : ''}`);
            setIsMuteModalOpen(false);
            await loadUserData();
        } catch (error: any) {
            console.error('Ошибка мута:', error);
            alert(`Ошибка: ${error.response?.data?.error || 'Не удалось замутить пользователя'}`);
        }
    };

    const handleBanUser = async (reason: string, duration: string, durationValue: number | null, durationUnit: string | null) => {
        if (window.confirm('Вы уверены, что хотите забанить этого пользователя?')) {
            try {
                await api.post(`/admin/users/${userId}/ban/`, { 
                    reason, 
                    duration,
                    duration_value: durationValue,
                    duration_unit: durationUnit
                });
                alert(`Пользователь забанен ${duration === 'permanent' ? 'перманентно' : ''}`);
                setIsBanModalOpen(false);
                await loadUserData();
            } catch (error: any) {
                console.error('Ошибка бана:', error);
                alert(`Ошибка: ${error.response?.data?.error || 'Не удалось забанить пользователя'}`);
            }
        }
    };

    const handleUnmuteUser = async () => {
        if (window.confirm('Снять мут с пользователя?')) {
            try {
                await api.post(`/admin/users/${userId}/unmute/`);
                alert('Мут снят');
                await loadUserData();
            } catch (error: any) {
                console.error('Ошибка снятия мута:', error);
                alert('Не удалось снять мут');
            }
        }
    };

    const handleUnbanUser = async () => {
        if (window.confirm('Снять бан с пользователя?')) {
            try {
                await api.post(`/admin/users/${userId}/unban/`);
                alert('Бан снят');
                await loadUserData();
            } catch (error: any) {
                console.error('Ошибка снятия бана:', error);
                alert('Не удалось снять бан');
            }
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSave = async () => {
        try {
            let avatarUrl = userData?.avatar;
            
            if (avatarFile) {
                avatarUrl = await uploadAvatar(avatarFile);
                console.log('Аватар загружен:', avatarUrl);
            }

            const updateData: any = {};
            if (fullName !== (userData?.full_name || userData?.login)) {
                updateData.full_name = fullName;
            }
            if (bio !== userData?.bio) {
                updateData.bio = bio;
            }
            if (avatarUrl && avatarFile) {
                updateData.avatar = avatarUrl;
            }

            if (Object.keys(updateData).length > 0) {
                await api.patch('/auth/profile/', updateData);
            }
            
            await loadUserData();
            
            setIsModalOpen(false);
            
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
            setAvatarFile(null);
            
            alert('Профиль успешно обновлен!');
            
        } catch (error: any) {
            console.error('Ошибка обновления:', error);
            alert(`Ошибка при обновлении профиля: ${error.response?.data?.error || 'Попробуйте другое фото'}`);
        }
    };

    const handleCloseModal = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setAvatarFile(null);
        setIsModalOpen(false);
    };

    const openReportModal = () => {
        setIsReportModalOpen(true);
    };

    const closeReportModal = () => {
        setIsReportModalOpen(false);
    };

    const handleSubmitReport = async (reason: string, comment: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            const confirm = window.confirm('Вы не авторизованы. Хотите перейти на страницу входа?');
            if (confirm) {
                navigate('/login');
            }
            return;
        }
        
        try {
            await api.post('/reports/user/', {
                target_id: userId!,
                reason: reason,
                comment: comment
            });
            alert('Жалоба отправлена');
            closeReportModal();
        } catch (error: any) {
            console.error('Ошибка отправки жалобы:', error);
            
            if (error.response?.status === 401) {
                const confirm = window.confirm('Сессия истекла. Хотите перейти на страницу входа?');
                if (confirm) {
                    navigate('/login');
                }
            } else {
                alert(`Ошибка при отправке жалобы: ${error.response?.data?.error || error.message}`);
            }
        }
    };

    const getAvatarUrl = (avatar: string | null | undefined) => {
        if (!avatar) {
            return 'https://via.placeholder.com/150/4C4C4C/FFFFFF?text=Avatar';
        }
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
            return avatar;
        }
        if (avatar.startsWith('data:image')) {
            return avatar;
        }
        return `${BASE_URL}${avatar}`;
    };

    const renderFriendButton = () => {
        if (friendStatus === 'friend') {
            return (
                <button 
                    className={styles.friendButton}
                    onClick={handleRemoveFriend}
                >
                    Удалить из друзей
                </button>
            );
        } else if (friendStatus === 'request_sent') {
            return (
                <button 
                    className={styles.friendButton}
                    onClick={handleCancelRequest}
                >
                    Отменить запрос
                </button>
            );
        } else {
            return (
                <button 
                    className={styles.friendButton}
                    onClick={handleAddFriend}
                >
                    Добавить в друзья
                </button>
            );
        }
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (!userData) {
        return <div className={styles.error}>Ошибка загрузки профиля</div>;
    }

    const displayName = userData.full_name || userData.login;
    const displayBio = userData.bio || 'Нет описания';
    const avatarUrl = getAvatarUrl(userData.avatar);
    const formattedDate = new Date(userData.created_at).toLocaleDateString('ru-RU');
    const formattedLastSeen = new Date(userData.last_seen).toLocaleString('ru-RU');

    return (
        <>
            <div className={styles.profileInfoBlockMain}>
                <div className={styles.profileImage}>
                    <img 
                        alt="аватарка пользователя" 
                        src={avatarUrl}
                        onError={(e) => {
                            console.error('Ошибка загрузки аватара:', avatarUrl);
                            e.currentTarget.src = 'https://via.placeholder.com/150/4C4C4C/FFFFFF?text=Avatar';
                        }}
                    />
                </div>
                <div className={styles.profileInfoBlockMainMain}>
                    <div className={styles.profileName}><span>{displayName}</span></div>
                    <div className={styles.profileBio}><span>{displayBio}</span></div>
                    <div className={styles.profileStats}>
                        <p>Дата регистрации: {formattedDate}</p>
                        <p>Последний заход: {formattedLastSeen}</p>
                        <p>Друзей: {userData.friends_count}</p>
                    </div>
                </div>
                
                {isOwnProfile && (
                    <div className={styles.profileInfoBlockMainEnd}>
                        <button className={styles.logoutButton} onClick={handleLogout}>
                            Выйти
                        </button>
                        <button className={styles.editButton} onClick={() => setIsModalOpen(true)}>
                            Редактировать профиль
                        </button>
                    </div>
                )}

                {!isOwnProfile && (
                    <div className={styles.profileInfoBlockMainEnd}>
                        <button 
                            className={styles.reportButton}
                            onClick={openReportModal}
                        >
                            !
                        </button>
                        {renderFriendButton()}
                        {isAdmin && (
                            <>
                                {userData.is_muted ? (
                                    <button 
                                        className={styles.unmuteButton}
                                        onClick={handleUnmuteUser}
                                    >
                                        Снять мут
                                    </button>
                                ) : (
                                    <button 
                                        className={styles.muteButton}
                                        onClick={() => setIsMuteModalOpen(true)}
                                    >
                                        Замутить
                                    </button>
                                )}
                                
                                {userData.is_banned ? (
                                    <button 
                                        className={styles.unbanButton}
                                        onClick={handleUnbanUser}
                                    >
                                        Снять бан
                                    </button>
                                ) : (
                                    <button 
                                        className={styles.banButton}
                                        onClick={() => setIsBanModalOpen(true)}
                                    >
                                        Забанить
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Модальное окно редактирования профиля */}
            {isOwnProfile && isModalOpen && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Редактировать профиль</h2>
                        
                        <div className={styles.avatarPreview}>
                            <img 
                                src={previewUrl || avatarUrl} 
                                alt="Аватарка"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/150/4C4C4C/FFFFFF?text=Avatar';
                                }}
                            />
                            <input
                                type="file"
                                id="avatarInput"
                                accept="image/*"
                                className={styles.fileInput}
                                onChange={handleAvatarChange}
                            />
                            <button onClick={() => document.getElementById('avatarInput')?.click()}>
                                Выбрать аватарку
                            </button>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Имя пользователя</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Введите имя"
                                maxLength={50}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Описание (био)</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Расскажите о себе"
                                maxLength={200}
                                rows={3}
                            />
                        </div>

                        <div className={styles.modalButtons}>
                            <button className={styles.cancelButton} onClick={handleCloseModal}>
                                Отмена
                            </button>
                            <button className={styles.saveButton} onClick={handleSave}>
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно жалобы */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={closeReportModal}
                onSubmit={handleSubmitReport}
                title="Пожаловаться на пользователя"
                reasons={reportReasons}
            />

            {/* Модальные окна мута/бана */}
            <MuteBanModal
                isOpen={isMuteModalOpen}
                onClose={() => setIsMuteModalOpen(false)}
                onSubmit={handleMuteUser}
                title="Замутить пользователя"
                actionType="mute"
            />
            <MuteBanModal
                isOpen={isBanModalOpen}
                onClose={() => setIsBanModalOpen(false)}
                onSubmit={handleBanUser}
                title="Забанить пользователя"
                actionType="ban"
            />
        </>
    );
};

export default ProfileHeader;