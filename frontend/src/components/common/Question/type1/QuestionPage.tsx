import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { getQuestion, submitAnswer, finishTest } from '../../../../api/tests';
import styles from './Question.module.css';

const QuestionPage = () => {
    const { testId, questionIndex } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [question, setQuestion] = useState<any>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const BASE_URL = 'http://localhost:8000';

    useEffect(() => {
        const state = location.state as any;
        if (state?.attemptId) {
            setAttemptId(state.attemptId);
        }
    }, [location]);

    useEffect(() => {
        if (testId && questionIndex && attemptId) {
            loadQuestion();
        }
    }, [testId, questionIndex, attemptId]);

    useEffect(() => {
        if (question?.time_limit && question.time_limit > 0) {
            setTimeLeft(question.time_limit * 60);
        }
    }, [question]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        handleTimeOut();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const loadQuestion = async () => {
        setLoading(true);
        try {
            const data = await getQuestion(Number(testId), Number(questionIndex));
            console.log('Загружен вопрос:', data);
            console.log('URL картинки вопроса:', data.question_image);
            setQuestion(data);
        } catch (error) {
            console.error('Ошибка загрузки вопроса:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTimeOut = async () => {
        if (attemptId) {
            await finishTest(attemptId);
            navigate(`/test/${testId}/result`, { state: { attemptId } });
        }
    };

    const handleAnswerClick = async (answerId: string) => {
        setSelectedAnswer(answerId);
        
        if (attemptId && question?.question_id) {
            try {
                await submitAnswer(attemptId, question.question_id, answerId);
                
                const nextIndex = Number(questionIndex) + 1;
                if (nextIndex <= question.total) {
                    navigate(`/test/${testId}/question/${nextIndex}`, { state: { attemptId } });
                } else {
                    const result = await finishTest(attemptId);
                    navigate(`/test/${testId}/result`, { state: { attemptId, score: result.score } });
                }
            } catch (error) {
                console.error('Ошибка отправки ответа:', error);
                alert('Ошибка при отправке ответа');
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) {
        return <div className={styles.loading}>Загрузка...</div>;
    }

    if (!question) {
        return <div className={styles.error}>Вопрос не найден</div>;
    }

    const leftAnswers = question.answers?.filter((_: any, i: number) => i % 2 === 0) || [];
    const rightAnswers = question.answers?.filter((_: any, i: number) => i % 2 === 1) || [];
    const imageFullUrl = question.question_image ? `${BASE_URL}${question.question_image}` : null;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.questionCounter}>
                    Вопрос {question.current}/{question.total}
                </div>
                <div className={styles.title}>
                    {question.test_title}
                </div>
                <Link to="/" className={styles.exitButton}>
                    Выход
                </Link>
            </header>

            {timeLeft !== null && (
                <div className={styles.timer}>
                    ⏱️ {formatTime(timeLeft)}
                </div>
            )}

            <div className={styles.mainContainer}>
                <div className={styles.questionBlock}>
                    {/* КАРТИНКА СВЕРХУ */}
                    {imageFullUrl && (
                        <div className={styles.imageContainer}>
                            <img 
                                src={imageFullUrl} 
                                alt="question" 
                                className={styles.questionImage}
                                onError={(e) => {
                                    console.error('Ошибка загрузки картинки вопроса:', imageFullUrl);
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* ТЕКСТ ВОПРОСА СНИЗУ */}
                    <div className={styles.questionText}>
                        {question.question_text}
                    </div>

                    <div className={styles.answersContainer}>
                        <div className={styles.answersColumn}>
                            {leftAnswers.map((answer: any) => (
                                <button
                                    key={answer.id}
                                    className={`${styles.answerButton} ${selectedAnswer === answer.id.toString() ? styles.selected : ''}`}
                                    onClick={() => handleAnswerClick(answer.id.toString())}
                                >
                                    {answer.text}
                                </button>
                            ))}
                        </div>
                        <div className={styles.answersColumn}>
                            {rightAnswers.map((answer: any) => (
                                <button
                                    key={answer.id}
                                    className={`${styles.answerButton} ${selectedAnswer === answer.id.toString() ? styles.selected : ''}`}
                                    onClick={() => handleAnswerClick(answer.id.toString())}
                                >
                                    {answer.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionPage;