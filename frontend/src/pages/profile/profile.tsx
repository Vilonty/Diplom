import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import ProfileMain from '../../components/common/Profile/ProfileMain';
import { authAPI } from '../../services/api';

const Profile = () => {
    const { identifier } = useParams(); // Получаем ID или логин из URL
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [loading, setLoading] = useState(true);
    const [profileUserId, setProfileUserId] = useState<number | null>(null);

    useEffect(() => {
        checkProfileOwner();
    }, [identifier]);

    const checkProfileOwner = async () => {
        try {
            // Получаем текущего пользователя
            const currentUser = await authAPI.getProfile();
            
            if (!identifier) {
                // Нет identifier - это свой профиль
                setIsOwnProfile(true);
                setProfileUserId(currentUser.data.id);
            } else {
                // Есть identifier - пытаемся найти пользователя
                try {
                    const targetUser = await authAPI.getUserProfile(identifier);
                    // Сравниваем ID
                    setIsOwnProfile(currentUser.data.id === targetUser.data.id);
                    setProfileUserId(targetUser.data.id);
                } catch (err) {
                    // Пользователь не найден
                    setIsOwnProfile(false);
                    setProfileUserId(null);
                }
            }
        } catch (err) {
            console.error('Ошибка:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (!profileUserId && identifier) {
        return (
            <div>
                <Header />
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <h2>Пользователь не найден</h2>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Header />
            <ProfileMain isOwnProfile={isOwnProfile} userId={profileUserId} />
            <Footer />
        </div>
    );
};

export default Profile;