import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getQuestion } from '../../../api/tests';
import QuestionPage from '../../../components/common/Question/QuestionPage';
import QuestionInputPage from '../../../components/common/Question/QuestionInputPage';

const QuestionRouter = () => {
    const { testId, questionIndex } = useParams();
    const location = useLocation();
    const [questionType, setQuestionType] = useState<'choice' | 'input'>('choice');
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        const state = location.state as any;
        if (state?.timeLeft) {
            setTimeLeft(state.timeLeft);
        }
    }, [location]);

    useEffect(() => {
        loadQuestionType();
    }, [testId, questionIndex]);

    const loadQuestionType = async () => {
        setLoading(true);
        try {
            const data = await getQuestion(Number(testId), Number(questionIndex));
            if (data.is_text_input) {
                setQuestionType('input');
            } else {
                setQuestionType('choice');
            }
        } catch (error) {
            console.error('Ошибка загрузки типа вопроса:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (questionType === 'input') {
        return <QuestionInputPage initialTimeLeft={timeLeft} />;
    } else {
        return <QuestionPage initialTimeLeft={timeLeft} />;
    }
};

export default QuestionRouter;