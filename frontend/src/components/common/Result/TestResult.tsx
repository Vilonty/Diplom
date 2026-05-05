import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getAttemptResults, rateTest, getComments, addComment, getTestDetails, submitReport } from '../../../api/tests';
import ReportModal from '../../../components/common/ReportModal/ReportModal';
import AuthorChip from '../../../components/common/Chip/userChip/AuthorChip';
import styles from './TestResult.module.css';

const TestResult = () => {
    const { testId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState<any>(null);
    const [test, setTest] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userRating, setUserRating] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<any[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [currentReportType, setCurrentReportType] = useState<'test' | 'comment' | null>(null);
    const [currentCommentId, setCurrentCommentId] = useState<number | null>(null);

    const commentReportReasons = [
        "Оскорбительное поведение",
        "Спам",
        "Другое"
    ];

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(!!token);
        
        const state = location.state as any;
        if (state?.attemptId) {
            loadResults(state.attemptId);
        } else {
            navigate(`/test/${testId}`);
        }
    }, [location]);

    useEffect(() => {
        if (testId) {
            loadComments();
            loadTestDetails();
        }
    }, [testId]);

    const loadComments = async () => {
        try {
            const data = await getComments(Number(testId));
            setComments(data);
        } catch (error) {
            console.error('Ошибка загрузки комментариев:', error);
        }
    };

    const loadTestDetails = async () => {
        try {
            const data = await getTestDetails(Number(testId));
            setTest(data);
        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
        }
    };

    const loadResults = async (attemptId: number) => {
        try {
            const data = await getAttemptResults(attemptId);
            setAttempt(data);
        } catch (error) {
            console.error('Ошибка загрузки результатов:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRate = async (rating: number) => {
        if (!isAuthenticated) {
            alert('Оценивать тест могут только авторизованные пользователи');
            return;
        }
        
        setUserRating(rating);
        try {
            await rateTest(Number(testId), rating);
            alert('Спасибо за оценку!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Ошибка при оценке');
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            alert('Комментарии могут оставлять только авторизованные пользователи');
            return;
        }
        
        if (!comment.trim()) return;
        
        try {
            await addComment(Number(testId), comment);
            setComment('');
            await loadComments();
            alert('Комментарий добавлен');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Ошибка при добавлении комментария');
        }
    };

    const openReportModal = (type: 'test' | 'comment', commentId?: number) => {
        setCurrentReportType(type);
        if (commentId) setCurrentCommentId(commentId);
        setIsReportModalOpen(true);
    };

    const closeReportModal = () => {
        setIsReportModalOpen(false);
        setCurrentReportType(null);
        setCurrentCommentId(null);
    };

    const handleSubmitReport = async (reason: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            const confirm = window.confirm('Вы не авторизованы. Хотите перейти на страницу входа?');
            if (confirm) {
                navigate('/login');
            }
            return;
        }
        
        try {
            await submitReport({
                target_type: currentReportType === 'test' ? 'test' : 'comment',
                target_id: currentReportType === 'test' ? Number(testId) : currentCommentId!,
                reason: reason
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
                alert(`Ошибка: ${error.response?.data?.error || error.message}`);
            }
        }
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (!attempt || !test) {
        return <div className={styles.error}>Результаты не найдены</div>;
    }

    const authorInfo = test.author_info || {};
    const authorId = authorInfo.id;
    const authorName = authorInfo.full_name || authorInfo.login || 'автор';
    const authorAvatar = authorInfo.avatar;
    
    const scorePercent = attempt.score;
    const passingScore = test.passing_score || 70;
    const isSurvey = test.is_survey;
    
    // Для опроса - всегда "ОПРОС ПРОЙДЕН", без процентов
    const scoreText = isSurvey ? 'ОПРОС ПРОЙДЕН' : (scorePercent >= passingScore ? 'ПРОЙДЕН' : 'НЕ ПРОЙДЕН');
    const typeDisplay = isSurvey ? 'ОПРОС' : 'ТЕСТ';

    return (
        <div className={styles.testResult}>
            <div className={styles.mainResultBlock}>
                <div className={styles.testName}>
                    <h3>{test.title}</h3>
                </div>
                
                <div className={styles.statsResult}>
                    <span>Пройдено: {new Date(attempt.finished_at || attempt.started_at).toLocaleDateString()}</span>
                    <div className={styles.typeBadge}>{typeDisplay}</div>
                    
                    <AuthorChip 
                        authorId={authorId} 
                        authorName={authorName} 
                        authorAvatar={authorAvatar} 
                    />
                </div>
                
                <div className={styles.resultResult}>
                    {!isSurvey ? (
                        <>
                            <h2 className={styles.resultPercent}>РЕЗУЛЬТАТ {scorePercent}%</h2>
                            <p className={styles.resultText}>{scoreText}</p>
                        </>
                    ) : (
                        <>
                            <h2 className={styles.resultText} style={{ fontSize: '48px', fontWeight: 'bold' }}>{scoreText}</h2>
                        </>
                    )}
                </div>
                
                {isAuthenticated && (
                    <div className={styles.ratingSection}>
                        <span>Оцените тест:</span>
                        <div className={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className={`${styles.star} ${userRating && star <= userRating ? styles.active : ''}`}
                                    onClick={() => handleRate(star)}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className={styles.commentSections}>
                <span className={styles.commentTitle}>КОММЕНТАРИИ</span>
                
                {isAuthenticated && (
                    <div className={styles.commentForm}>
                        <span className={styles.formTitle}>оставить комментарий</span>
                        <form onSubmit={handleSubmitComment}>
                            <input 
                                name="comment" 
                                placeholder="ПРИМЕР: КЛАССНЫЙ ТЕСТ"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className={styles.commentInput}
                            />
                            <button type="submit" className={styles.submitButton}>ОТПРАВИТЬ</button>
                        </form>
                    </div>
                )}
                
                <div className={styles.commentsList}>
                    {comments.length === 0 ? (
                        <div className={styles.noComments}>Нет комментариев. Будьте первым!</div>
                    ) : (
                        comments.map((c) => (
                            <div key={c.id} className={styles.commentItem}>
                                <div className={styles.commentHeader}>
                                    <div className={styles.commentAuthor}>
                                        <span>{c.user_info?.full_name || c.user_info?.login || 'Пользователь'}</span>
                                    </div>
                                    <button 
                                        className={styles.reportCommentButton}
                                        onClick={() => openReportModal('comment', c.id)}
                                    >
                                        !
                                    </button>
                                </div>
                                <div className={styles.commentDate}>
                                    {new Date(c.created_at).toLocaleDateString()}
                                </div>
                                <div className={styles.commentText}>{c.text}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={closeReportModal}
                onSubmit={handleSubmitReport}
                title="Пожаловаться на комментарий"
                reasons={commentReportReasons}
            />
        </div>
    );
};

export default TestResult;