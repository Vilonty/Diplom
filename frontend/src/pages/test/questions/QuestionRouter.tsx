import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getQuestion } from '../../../api/tests';
import QuestionPage from '../../../components/common/Question/type1/QuestionPage';
import QuestionInputPage from '../../../components/common/Question/type2/QuestionInputPage';

const QuestionRouter = () => {
    const { testId, questionIndex } = useParams();
    const location = useLocation();
    const [questionType, setQuestionType] = useState<'choice' | 'input'>('choice');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuestionType();
    }, [testId, questionIndex]);

    const loadQuestionType = async () => {
        setLoading(true);
        try {
            const data = await getQuestion(Number(testId), Number(questionIndex));
            // Определяем тип вопроса по полю is_text_input
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

    // Передаём location.state дальше
    if (questionType === 'input') {
        return <QuestionInputPage />;
    } else {
        return <QuestionPage />;
    }
};

export default QuestionRouter;