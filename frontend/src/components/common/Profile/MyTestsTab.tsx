import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import styles from './profile.module.css';

interface MyTestsTabProps {
    userId?: number | null;
    isOwnProfile?: boolean;
}

const MyTestsTab: React.FC<MyTestsTabProps> = ({ userId, isOwnProfile = true }) => {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCreatedTests();
    }, [userId]);

    const loadCreatedTests = async () => {
        try {
            setLoading(true);
            let targetUserId = userId;
            
            if (isOwnProfile && !targetUserId) {
                const profile = await api.get('/auth/profile/');
                targetUserId = profile.data.id;
            }
            
            if (!targetUserId) {
                setError('ID пользователя не найден');
                return;
            }
            
            // Для чужого профиля используем created-tests
            const url = isOwnProfile 
                ? `/profile/${targetUserId}/my-tests/`
                : `/profile/${targetUserId}/created-tests/`;
            
            const response = await api.get(url);
            console.log('Tests response:', response.data);
            setTests(response.data);
        } catch (err) {
            console.error('Ошибка загрузки созданных тестов:', err);
            setError('Не удалось загрузить созданные тесты');
        } finally {
            setLoading(false);
        }
    };

    const getTestLink = (test: any) => {
        if (!test.is_open && test.access_token) {
            return `/test/${test.id}?token=${test.access_token}`;
        }
        return `/test/${test.id}`;
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (tests.length === 0) {
        return <div className={styles.empty}>Нет созданных тестов</div>;
    }

    return (
        <div className={styles.testsContent}>
            <div className={styles.stickyHeader}>
                <h3>Мои тесты</h3>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.testsTable}>
                    <thead>
                        <tr>
                            <th>Название теста</th>
                            <th>Тип</th>
                            <th>Вопросов</th>
                            <th>Прошло человек</th>
                            <th>Рейтинг</th>
                            <th>Доступ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tests.map((test: any) => (
                            <tr key={test.id}>
                                <td className={styles.testLink}>
                                    <Link to={getTestLink(test)}>
                                        <div className={styles.testInfo}>
                                            <strong>{test.name}</strong>
                                            <span className={styles.testDescription}>{test.description}</span>
                                        </div>
                                    </Link>
                                 </td>
                                 <td>{test.type || (test.is_survey ? 'опрос' : 'тест')}</td>
                                 <td>{test.questions}</td>
                                 <td>{test.completed}</td>
                                 <td className={styles.rating}>★ {test.rating ? test.rating.toFixed(1) : '0'}</td>
                                 <td className={test.is_open ? styles.public : styles.private}>
                                     {test.is_open ? 'Публичный' : 'Приватный'}
                                 </td>
                             </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyTestsTab;