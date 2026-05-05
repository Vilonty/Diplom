import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import styles from './profile.module.css';

interface StatisticsTabProps {
    userId?: number | null;
    isOwnProfile?: boolean;
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({ userId, isOwnProfile = true }) => {
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadCompletedTests();
    }, [userId]);

    const loadCompletedTests = async () => {
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
            
            const response = await api.get(`/profile/${targetUserId}/completed-tests/`);
            console.log('API response:', response.data);
            setAttempts(response.data);
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
            setError('Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    if (attempts.length === 0) {
        return <div className={styles.empty}>Нет пройденных тестов</div>;
    }

    return (
        <div className={styles.statisticsContent}>
            <div className={styles.stickyHeader}>
                <h3>Статистика по тестам</h3>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.statsTable}>
                    <thead>
                        <tr>
                            <th>Тест</th>
                            <th>Тип теста</th>
                            <th>Автор</th>
                            <th>Вопросов</th>
                            <th>Результат</th>
                            <th>Дата</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attempts.map((attempt: any, index: number) => {
                            const isSurvey = attempt.type === 'опрос';
                            return (
                                <tr key={attempt.id || index}>
                                    <td className={styles.testLink}>
                                        <Link to={`/test/${attempt.id}`}>{attempt.name}</Link>
                                    </td>
                                    <td>{attempt.type}</td>
                                    <td className={styles.authorLink}>
                                        <Link to={`/profile/${attempt.author_id}`}>{attempt.author}</Link>
                                    </td>
                                    <td>{attempt.questions}</td>
                                    <td className={styles.result}>
                                        {isSurvey ? '—' : attempt.result}
                                    </td>
                                    <td>{attempt.date}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StatisticsTab;