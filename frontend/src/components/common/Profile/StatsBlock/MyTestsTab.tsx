import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../../api/axios';
import styles from './MyTestsTab.module.css';

interface MyTestsTabProps {
    userId?: number | null;
    isOwnProfile?: boolean;
}

interface Test {
    id: number;
    title: string;
    description?: string;
    is_survey?: boolean;
    questions_count: number;
    attempts_count: number;
    average_rating: number | null;
    is_open: boolean;
    access_token?: string;
}

type SortField = 'title' | 'type' | 'questions_count' | 'attempts_count' | 'average_rating' | 'is_open' | null;
type SortOrder = 'asc' | 'desc' | null;

const MyTestsTab: React.FC<MyTestsTabProps> = ({ userId, isOwnProfile = true }) => {
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);

    useEffect(() => {
        loadCreatedTests();
    }, [userId, isOwnProfile]);

    const loadCreatedTests = async () => {
        try {
            setLoading(true);
            setError(null);
            
            let targetUserId = userId;
            
            if (isOwnProfile && !targetUserId) {
                try {
                    const profile = await api.get('/auth/profile/');
                    targetUserId = profile.data.id;
                } catch (err) {
                    console.error('Ошибка получения профиля:', err);
                    setError('Не удалось получить данные пользователя');
                    return;
                }
            }
            
            if (!targetUserId) {
                setError('ID пользователя не найден');
                return;
            }
            
            // ВАЖНО: для своего профиля используем my-tests, для чужого - created-tests
            let url;
            if (isOwnProfile) {
                url = `/profile/${targetUserId}/my-tests/`;
            } else {
                url = `/profile/${targetUserId}/created-tests/`;
            }
            
            const response = await api.get(url);
            console.log('Загружены тесты:', response.data);
            setTests(response.data);
        } catch (err: any) {
            console.error('Ошибка загрузки тестов:', err);
            const errorMessage = err.response?.data?.detail || err.message || 'Не удалось загрузить созданные тесты';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: SortField) => {
        console.log('Сортировка по полю:', field);
        if (sortField === field) {
            if (sortOrder === 'desc') {
                setSortField(null);
                setSortOrder(null);
            } else {
                setSortOrder('desc');
            }
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getSortedTests = () => {
        if (!sortField || !sortOrder) {
            return tests;
        }

        const sorted = [...tests];
        
        sorted.sort((a, b) => {
            let aValue: any;
            let bValue: any;
            
            switch (sortField) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'type':
                    aValue = a.is_survey ? 'опрос' : 'тест';
                    bValue = b.is_survey ? 'опрос' : 'тест';
                    break;
                case 'questions_count':
                    aValue = a.questions_count || 0;
                    bValue = b.questions_count || 0;
                    break;
                case 'attempts_count':
                    aValue = a.attempts_count || 0;
                    bValue = b.attempts_count || 0;
                    break;
                case 'average_rating':
                    aValue = a.average_rating || 0;
                    bValue = b.average_rating || 0;
                    break;
                case 'is_open':
                    aValue = a.is_open;
                    bValue = b.is_open;
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    };

    // Генерация ссылки в зависимости от того, свой это профиль или чужой
    const getTestLink = (test: Test) => {
        // Если это свои тесты (владелец профиля) - ссылка на статистику
        if (isOwnProfile) {
            return `/test/${test.id}/stats`;
        }
        // Если это чужие тесты - ссылка на прохождение
        if (!test.is_open && test.access_token) {
            return `/test/${test.id}?token=${test.access_token}`;
        }
        return `/test/${test.id}`;
    };

    const getRating = (rating: number | null) => {
        if (rating === null || rating === undefined) return '0';
        return rating.toFixed(1);
    };

    const sortedTests = getSortedTests();

    if (loading) {
        return <div className={styles.loading}>Загрузка тестов...</div>;
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>Ошибка: {error}</p>
                <button onClick={loadCreatedTests} className={styles.retryButton}>
                    Повторить попытку
                </button>
            </div>
        );
    }

    if (tests.length === 0) {
        return (
            <div className={styles.empty}>
                <p>Нет созданных тестов</p>
                {isOwnProfile && (
                    <Link to="/create" className={styles.createButton}>
                        Создать первый тест
                    </Link>
                )}
            </div>
        );
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
                            <th onClick={() => handleSort('title')} className={styles.sortable}>
                                Название теста
                            </th>
                            <th onClick={() => handleSort('type')} className={styles.sortable}>
                                Тип
                            </th>
                            <th onClick={() => handleSort('questions_count')} className={styles.sortable}>
                                Вопросов
                            </th>
                            <th onClick={() => handleSort('attempts_count')} className={styles.sortable}>
                                Прошло человек
                            </th>
                            <th onClick={() => handleSort('average_rating')} className={styles.sortable}>
                                Рейтинг
                            </th>
                            <th onClick={() => handleSort('is_open')} className={styles.sortable}>
                                Доступ
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTests.map((test) => (
                            <tr key={test.id}>
                                <td className={styles.testLink}>
                                    <Link to={getTestLink(test)}>
                                        <div className={styles.testInfo}>
                                            <strong>{test.title}</strong>
                                            {test.description && (
                                                <span className={styles.testDescription}>{test.description}</span>
                                            )}
                                        </div>
                                    </Link>
                                </td>
                                <td>{test.is_survey ? 'опрос' : 'тест'}</td>
                                <td>{test.questions_count || 0}</td>
                                <td>{test.attempts_count || 0}</td>
                                <td className={styles.rating}>★ {getRating(test.average_rating)}</td>
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