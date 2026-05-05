import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getTestDetails, startTest, getComments, addComment, submitReport, getTestRating } from '../../../api/tests';
import ReportModal from '../../../components/common/ReportModal/ReportModal';
import AuthorChip from '../../../components/common/Chip/userChip/AuthorChip';
import styles from './TestPage.module.css';

const TestPage = () => {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const [test, setTest] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [testRating, setTestRating] = useState<{ average_rating: number; ratings_count: number; user_rating: number | null }>({
        average_rating: 0,
        ratings_count: 0,
        user_rating: null
    });
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [currentReportType, setCurrentReportType] = useState<'test' | 'comment' | null>(null);
    const [currentCommentId, setCurrentCommentId] = useState<number | null>(null);
    const [newComment, setNewComment] = useState('');

    const BASE_URL = 'http://localhost:8000';

    const testReportReasons = [
        "Несоответствие теме",
        "Неприемлемый контент",
        "Спам",
        "Другое"
    ];

    const commentReportReasons = [
        "Оскорбительное поведение",
        "Спам",
        "Другое"
    ];

    useEffect(() => {
        if (testId) {
            loadTestData();
            loadComments();
            loadTestRating();
        }
    }, [testId]);

    const loadTestData = async () => {
        try {
            const data = await getTestDetails(Number(testId));
            console.log('Загружен тест:', data);
            console.log('URL картинки теста:', data.image);
            setTest(data);
        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            const data = await getComments(Number(testId));
            setComments(data);
        } catch (error) {
            console.error('Ошибка загрузки комментариев:', error);
        }
    };

    const loadTestRating = async () => {
        try {
            const data = await getTestRating(Number(testId));
            setTestRating(data);
        } catch (error) {
            console.error('Ошибка загрузки рейтинга:', error);
        }
    };

    const handleStart = async () => {
        console.log('Нажата кнопка старт, testId:', testId);
        try {
            const response = await startTest(Number(testId));
            console.log('Ответ от сервера:', response);
            navigate(`/test/${testId}/question/1`, { state: { attemptId: response.attempt_id } });
        } catch (error: any) {
            console.error('Ошибка:', error);
            alert(`Не удалось начать тест: ${error.response?.data?.error || 'Неизвестная ошибка'}`);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await addComment(Number(testId), newComment);
            setNewComment('');
            await loadComments();
        } catch (error) {
            console.error('Ошибка добавления комментария:', error);
            alert('Не удалось добавить комментарий');
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
                alert(`Ошибка при отправке жалобы: ${error.response?.data?.error || error.message}`);
            }
        }
    };

    const getModalProps = () => {
        if (currentReportType === 'test') {
            return {
                title: 'Пожаловаться на тест',
                reasons: testReportReasons
            };
        } else {
            return {
                title: 'Пожаловаться на комментарий',
                reasons: commentReportReasons
            };
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (!test) {
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.error}>Тест не найден</div>
                </div>
            </div>
        );
    }

    const displayAuthor = test.author_info?.full_name || test.author_info?.login || 'автор';
    const timeDisplay = test.time_limit ? `${test.time_limit} минут` : 'без ограничения';
    const typeDisplay = test.is_survey ? 'опрос' : 'тест';
    const averageRating = testRating.average_rating || 0;
    const ratingsCount = testRating.ratings_count || 0;
    
    const imageFullUrl = test.image ? `${BASE_URL}${test.image}` : null;

    const modalProps = getModalProps();

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.testInfoBlock}>
                    <div className={styles.imageContainer}>
                        {imageFullUrl ? (
                            <img 
                                src={imageFullUrl} 
                                alt={test.title} 
                                className={styles.testImage}
                                onError={(e) => {
                                    console.error('Ошибка загрузки картинки теста:', imageFullUrl);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className={styles.imagePlaceholder} />
                        )}
                        <button className={styles.reportButton} onClick={() => openReportModal('test')}>
                            !
                        </button>
                    </div>

                    <div className={styles.authorStatsRow}>
                        <AuthorChip 
                            authorId={test.author_info?.id} 
                            authorName={displayAuthor} 
                            authorAvatar={test.author_info?.avatar} 
                        />
                        <div className={styles.statsInfo}>
                            <span>⭐ {averageRating.toFixed(1)}/5 ({ratingsCount})</span>
                            <span>👤 0</span>
                        </div>
                    </div>

                    <div className={styles.titleSection}>
                        <h2 className={styles.testTitle}>{test.title}</h2>
                        <span className={styles.testDescription}>{test.description || 'Нет описания'}</span>
                        <button onClick={handleStart} className={styles.startButton}>
                            начать
                        </button>
                    </div>

                    <hr className={styles.divider} />

                    <div className={styles.testDetails}>
                        <span>⏱️ {timeDisplay}</span>
                        <span>📋 {test.questions_count} вопросов</span>
                        <span>📊 {typeDisplay}</span>
                    </div>
                </div>

                <div className={styles.commentsBlock}>
                    <h3 className={styles.commentsTitle}>Комментарии</h3>
          
                    <div className={styles.commentsList}>
                        {comments.length === 0 ? (
                            <div className={styles.noComments}>Нет комментариев. Будьте первым!</div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className={styles.commentItem}>
                                    <div className={styles.commentTop}>
                                        <Link to={`/profile/${comment.user_id || comment.user_info?.id}`} className={styles.commentUserLink}>
                                            <div className={styles.testCommentUser}>
                                                <div className={styles.avatarComment}>
                                                    {comment.user_info?.avatar ? (
                                                        <img 
                                                            src={comment.user_info.avatar.startsWith('http') ? comment.user_info.avatar : `${BASE_URL}${comment.user_info.avatar}`}
                                                            alt={comment.user_info?.full_name || comment.user_info?.login}
                                                            className={styles.avatarImageSmall}
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholderComment} />
                                                    )}
                                                </div>
                                                <span>{comment.user_info?.full_name || comment.user_info?.login}</span>
                                            </div>
                                        </Link>
                                        <button 
                                            className={styles.reportCommentButton}
                                            onClick={() => openReportModal('comment', comment.id)}
                                        >
                                            !
                                        </button>
                                    </div>
                                    <div className={styles.commentBody}>
                                        <span>{comment.text}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={closeReportModal}
                onSubmit={handleSubmitReport}
                title={modalProps.title}
                reasons={modalProps.reasons}
            />
        </div>
    );
};

export default TestPage;