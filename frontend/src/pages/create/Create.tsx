import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Footer from '../../components/common/Footer/Footer';
import api from '../../api/axios';
import choiceStyles from './CreateChoice.module.css';

const Create = () => {
    const navigate = useNavigate();
    const [isBanned, setIsBanned] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [banUntil, setBanUntil] = useState<string | null>(null);
    const [banPermanent, setBanPermanent] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkBanStatus();
    }, []);

    const checkBanStatus = async () => {
        try {
            const profile = await api.get('/auth/profile/');
            if (profile.data.is_banned) {
                setIsBanned(true);
                setBanReason(profile.data.ban_reason || '');
                setBanUntil(profile.data.ban_until);
                setBanPermanent(profile.data.ban_permanent || false);
            }
        } catch (error) {
            console.error('Ошибка проверки бана:', error);
        } finally {
            setLoading(false);
        }
    };

    const getBanUntilText = () => {
        if (!banUntil) return '';
        const date = new Date(banUntil);
        return date.toLocaleString('ru-RU');
    };

    if (loading) {
        return (
            <div className={choiceStyles.createPage}>
                <Header />
                <div className={choiceStyles.createContainer}>
                    <div className={choiceStyles.loading}>Загрузка...</div>
                </div>
                <Footer />
            </div>
        );
    }

    if (isBanned) {
        return (
            <div className={choiceStyles.createPage}>
                <Header />
                <div className={choiceStyles.createContainer}>
                    <div className={choiceStyles.bannedMessage}>
                        <div className={choiceStyles.bannedText}>Ваш аккаунт забанен</div>
                        {banReason && <div className={choiceStyles.bannedReason}>Причина: {banReason}</div>}
                        {banUntil && !banPermanent && (
                            <div className={choiceStyles.bannedUntil}>До: {getBanUntilText()}</div>
                        )}
                        {banPermanent && <div className={choiceStyles.bannedPermanent}>Перманентно</div>}
                        <button 
                            className={choiceStyles.backButton}
                            onClick={() => navigate('/')}
                        >
                            Вернуться на главную
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={choiceStyles.createPage}>
            <Header />
            <div className={choiceStyles.createContainer}>
                <h2>выберите тип</h2>
                <div className={choiceStyles.createMainBlockContainer}>
                    <Link to="/create/test" className={choiceStyles.createMainBlock}>
                        <div className={choiceStyles.createMainBlockTitle}>тест</div>
                        <div className={choiceStyles.createMainBlockDescription}>
                            <p>проверка знаний с оценкой</p>
                            <p>ограничение по времени</p>
                        </div>
                    </Link>
                    
                    <Link to="/create/survey" className={choiceStyles.createMainBlock}>
                        <div className={choiceStyles.createMainBlockTitle}>опрос</div>
                        <div className={choiceStyles.createMainBlockDescription}>
                            <p>сбор мнений без оценки</p>
                            <p>без ограничения времени</p>
                        </div>
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Create;