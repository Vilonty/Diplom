import { useState, useEffect } from 'react';
import { getPools, createPool, addQuestionToPool, createQuestion, uploadImage } from '../api/tests';

export interface PoolQuestion {
  id: number;
  questionText: string;
  questionImage: string | null;
  rightAnswer: string;
  wrongAnswers: string[];
  isTextInput: boolean;
  textAnswer: string;
}

export interface QuestionPool {
  id: number;
  title: string;
  description: string;
  questions: PoolQuestion[];
}

export interface Question {
  id: number;
  questionText: string;
  questionImage: File | null;
  rightAnswer: string;
  wrongAnswers: string[];
  isTextInput: boolean;
  textAnswer: string;
}

export const usePools = () => {
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPools = async () => {
    setLoading(true);
    try {
      const pools = await getPools();
      const formattedPools = pools.map((pool: any) => ({
        id: pool.id,
        title: pool.name,
        description: pool.description,
        questions: (pool.questions || []).map((q: any) => ({
          id: q.id,
          questionText: q.text,
          questionImage: q.image,
          rightAnswer: q.answers?.find((a: any) => a.is_correct)?.text || '',
          wrongAnswers: q.answers?.filter((a: any) => !a.is_correct).map((a: any) => a.text) || ['', '', ''],
          isTextInput: q.is_text_input || false,
          textAnswer: q.text_answer || ''
        }))
      }));
      setQuestionPools(formattedPools);
    } catch (error) {
      console.error('Ошибка загрузки пулов:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewPool = async (title: string, description: string): Promise<QuestionPool | null> => {
    try {
      const newPool = await createPool({ name: title, description });
      const formattedPool = {
        id: newPool.id,
        title: newPool.name,
        description: newPool.description,
        questions: []
      };
      setQuestionPools(prev => [...prev, formattedPool]);
      return formattedPool;
    } catch (error) {
      console.error('Ошибка создания пула:', error);
      return null;
    }
  };

  const addQuestionToPoolById = async (poolId: number, question: Question): Promise<boolean> => {
    try {
      let answers: any[] = [];
      let textAnswer = '';
      let isTextInput = question.isTextInput;
      
      if (question.isTextInput) {
        textAnswer = question.textAnswer;
        answers = [{ text: question.textAnswer, is_correct: true, order_index: 0 }];
      } else {
        answers.push({ text: question.rightAnswer, is_correct: true, order_index: 0 });
        question.wrongAnswers.forEach((answer, idx) => {
          if (answer.trim()) {
            answers.push({ text: answer, is_correct: false, order_index: idx + 1 });
          }
        });
      }
      
      // Картинку загружаем через uploadImage
      let questionImageUrl = null;
      if (question.questionImage) {
        questionImageUrl = await uploadImage(question.questionImage, 'question');
      }
      
      const questionData = {
        text: question.questionText,
        image: questionImageUrl,
        difficulty: 1,
        explanation: '',
        is_text_input: isTextInput,
        text_answer: textAnswer,
        answers: answers
      };
      
      const createdQuestion = await createQuestion(questionData);
      await addQuestionToPool(poolId, createdQuestion.id);
      await loadPools();
      return true;
    } catch (error) {
      console.error('Ошибка добавления вопроса в пул:', error);
      return false;
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  return { questionPools, loading, loadPools, createNewPool, addQuestionToPoolById };
};