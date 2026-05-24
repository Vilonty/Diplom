import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/axios';
import styles from './TestStatsPageMain.module.css';

interface AnswerDetail {
    question_id: number;
    question_text: string;
    user_answer: string;
    is_correct: boolean;
    correct_answer?: string;
}

interface Attempt {
    id: number;
    user: {
        id: number;
        login: string;
        full_name: string;
        avatar: string | null;
    };
    score: number;
    is_passed: boolean;
    started_at: string;
    finished_at: string | null;
    answers: any;
    answers_details?: AnswerDetail[];
}

interface TestStats {
    id: number;
    title: string;
    description: string;
    is_survey: boolean;
    questions_count: number;
    total_attempts: number;
    passed_attempts: number;
    average_score: number;
    attempts: Attempt[];
}

type SortField = 'user' | 'result' | 'date';
type SortOrder = 'asc' | 'desc';

const TestStatsPageMain = () => {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const [stats, setStats] = useState<TestStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    useEffect(() => {
        if (testId) {
            loadStats();
        }
    }, [testId]);

    const loadStats = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setError('Для просмотра статистики необходимо авторизоваться');
            setLoading(false);
            return;
        }
        
        try {
            const response = await api.get(`/tests/${testId}/stats/`);
            setStats(response.data);
        } catch (err: any) {
            console.error('Ошибка загрузки статистики:', err);
            if (err.response?.status === 401) {
                setError('Сессия истекла. Пожалуйста, войдите заново');
            } else if (err.response?.status === 403) {
                setError('У вас нет прав для просмотра статистики этого теста');
            } else {
                setError('Не удалось загрузить статистику');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadAttemptDetails = async (attemptId: number) => {
        setLoadingDetails(true);
        try {
            const response = await api.get(`/attempts/${attemptId}/details/`);
            const details = response.data.answers_details || [];
            
            if (stats && !stats.is_survey) {
                const questionsResponse = await api.get(`/tests/${testId}/`);
                const testData = questionsResponse.data;
                const questionsMap = new Map();
                testData.questions.forEach((q: any) => {
                    const correctAnswer = q.answers.find((a: any) => a.is_correct);
                    questionsMap.set(q.id, {
                        correct_answer: correctAnswer ? correctAnswer.text : q.text_answer
                    });
                });
                
                return details.map((d: any) => ({
                    ...d,
                    correct_answer: questionsMap.get(d.question_id)?.correct_answer
                }));
            }
            return details;
        } catch (err) {
            console.error('Ошибка загрузки деталей:', err);
            return [];
        } finally {
            setLoadingDetails(false);
        }
    };

    const openAttemptModal = async (attempt: Attempt) => {
        setSelectedAttempt(attempt);
        setIsModalOpen(true);
        
        const details = await loadAttemptDetails(attempt.id);
        setSelectedAttempt(prev => prev ? { ...prev, answers_details: details } : prev);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedAttempt(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return '';
        return sortOrder === 'asc' ? ' ' : ' ↓';
    };

    const getSortedAttempts = () => {
        if (!stats) return [];
        
        const sorted = [...stats.attempts];
        
        sorted.sort((a, b) => {
            let aVal: any;
            let bVal: any;
            
            switch (sortField) {
                case 'user':
                    aVal = (a.user.full_name || a.user.login).toLowerCase();
                    bVal = (b.user.full_name || b.user.login).toLowerCase();
                    break;
                case 'result':
                    aVal = a.score;
                    bVal = b.score;
                    break;
                case 'date':
                    aVal = new Date(a.finished_at || a.started_at);
                    bVal = new Date(b.finished_at || b.started_at);
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    };

    const sortedAttempts = getSortedAttempts();

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.loadingContainer}>
                        <img 
                            src="http://localhost:8000/media/mainpage/loading.jpg" 
                            alt="Загрузка" 
                            className={styles.loadingImage}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <div className={styles.loadingText}>ЗАГРУЗКА СТАТИСТИКИ</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                    <button onClick={() => navigate('/profile')} className={styles.backButton}>
                        Вернуться к профилю
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.error}>Статистика не найдена</div>
                </div>
            </div>
        );
    }

    const passRate = stats.total_attempts > 0 
        ? Math.round((stats.passed_attempts / stats.total_attempts) * 100) 
        : 0;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button onClick={() => navigate('/profile')} className={styles.backLink}>
                        Назад к профилю
                    </button>
                    <Link to={`/test/${stats.id}`} className={styles.testLink}>
                        <h1 className={styles.title}>{stats.title}</h1>
                    </Link>
                    <div className={styles.testType}>
                        {stats.is_survey ? 'ОПРОС' : 'ТЕСТ'}
                    </div>
                </div>

                {stats.description && (
                    <div className={styles.description}>
                        {stats.description}
                    </div>
                )}

                <div className={styles.statsCards}>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.total_attempts}</div>
                        <div className={styles.statLabel}>Всего прохождений</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.passed_attempts}</div>
                        <div className={styles.statLabel}>Успешно пройдено</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{passRate}%</div>
                        <div className={styles.statLabel}>Процент успеха</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.average_score.toFixed(1)}%</div>
                        <div className={styles.statLabel}>Средний результат</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statValue}>{stats.questions_count}</div>
                        <div className={styles.statLabel}>Вопросов</div>
                    </div>
                </div>

                <div className={styles.attemptsSection}>
                    <h2 className={styles.sectionTitle}>История прохождений</h2>
                    {sortedAttempts.length === 0 ? (
                        <div className={styles.empty}>Нет прохождений</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.attemptsTable}>
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('user')} className={styles.sortable}>
                                            Пользователь{getSortIcon('user')}
                                        </th>
                                        <th onClick={() => handleSort('result')} className={styles.sortable}>
                                            Результат{getSortIcon('result')}
                                        </th>
                                        <th onClick={() => handleSort('date')} className={styles.sortable}>
                                            Дата прохождения{getSortIcon('date')}
                                        </th>
                                        <th>Детали</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedAttempts.map((attempt) => {
                                        const isAnonymous = attempt.user.id === 0;
                                        const userName = attempt.user.full_name || attempt.user.login;
                                        
                                        return (
                                            <tr key={attempt.id}>
                                                <td className={styles.userCell}>
                                                    {isAnonymous ? (
                                                        <div className={styles.userLinkDisabled}>
                                                            <div className={styles.userAvatar}>
                                                                <div className={styles.avatarPlaceholder}>
                                                                    А
                                                                </div>
                                                            </div>
                                                            <span>{userName}</span>
                                                        </div>
                                                    ) : (
                                                        <Link to={`/profile/${attempt.user.id}`} className={styles.userLink}>
                                                            <div className={styles.userAvatar}>
                                                                {attempt.user.avatar ? (
                                                                    <img 
                                                                        src={attempt.user.avatar.startsWith('http') ? attempt.user.avatar : `http://localhost:8000${attempt.user.avatar}`}
                                                                        alt={attempt.user.login}
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className={styles.avatarPlaceholder}>
                                                                        {userName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span>{userName}</span>
                                                        </Link>
                                                    )}
                                                </td>
                                                <td>
                                                    {stats.is_survey ? (
                                                        <span className={styles.passed}>Пройден</span>
                                                    ) : (
                                                        <span className={styles.score}>
                                                            {attempt.score}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{formatDate(attempt.finished_at || attempt.started_at)}</td>
                                                <td>
                                                    <button 
                                                        className={styles.detailsButton}
                                                        onClick={() => openAttemptModal(attempt)}
                                                    >
                                                        Подробнее
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && selectedAttempt && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Детали прохождения</h3>
                            <button className={styles.closeModal} onClick={closeModal}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.modalUserInfo}>
                                <p><strong>Пользователь:</strong> {selectedAttempt.user.full_name || selectedAttempt.user.login}</p>
                                <p><strong>Дата:</strong> {formatDate(selectedAttempt.finished_at || selectedAttempt.started_at)}</p>
                                {!stats?.is_survey && (
                                    <p><strong>Результат:</strong> {selectedAttempt.score}%</p>
                                )}
                                <p><strong>Статус:</strong> {selectedAttempt.is_passed ? 'Пройден' : 'Не пройден'}</p>
                            </div>
                            
                            {loadingDetails ? (
                                <div className={styles.loadingAnswers}>Загрузка ответов...</div>
                            ) : selectedAttempt.answers_details && selectedAttempt.answers_details.length > 0 ? (
                                <div className={styles.answersSection}>
                                    <h4>Ответы на вопросы:</h4>
                                    <div className={styles.answersList}>
                                        {selectedAttempt.answers_details.map((answer, index) => (
                                            <div key={answer.question_id} className={styles.answerItem}>
                                                <div className={styles.questionNumber}>Вопрос {index + 1}</div>
                                                <div className={styles.questionText}>{answer.question_text}</div>
                                                <div className={styles.userAnswer}>
                                                    <div className={styles.answerRow}>
                                                        <span className={styles.answerLabel}>Ответ пользователя:</span>
                                                        <span className={answer.is_correct ? styles.correctAnswer : styles.wrongAnswer}>
                                                            {answer.user_answer || '(не указан)'}
                                                        </span>
                                                    </div>
                                                    {!stats?.is_survey && answer.correct_answer && (
                                                        <div className={styles.answerRow}>
                                                            <span className={styles.answerLabel}>Правильный ответ:</span>
                                                            <span className={styles.correctAnswerText}>
                                                                {answer.correct_answer}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={answer.is_correct ? styles.answerStatusCorrect : styles.answerStatusWrong}>
                                                    {answer.is_correct ? 'Верно' : 'Неверно'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.noAnswers}>Нет данных об ответах</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestStatsPageMain;