import React, { useState } from 'react';
import QuestionItem from './QuestionItem';
import PoolModal from './PoolModal';
import CreatePoolModal from './CreatePoolModal';
import AddToPoolModal from './AddToPoolModal';
import { usePools, Question, PoolQuestion } from '../../../../hooks/usePools';
import styles from './QuestionBuilder.module.css';

interface QuestionBuilderProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  isSurvey: boolean;
  onModalOpenChange?: (isOpen: boolean) => void;
}

const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ 
  questions, 
  onQuestionsChange,
  isSurvey,
  onModalOpenChange 
}) => {
  const [nextId, setNextId] = useState(questions.length + 1);
  const [questionImagePreviews, setQuestionImagePreviews] = useState<{ [key: number]: string }>({});
  
  // Модалки
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [isCreatePoolModalOpen, setIsCreatePoolModalOpen] = useState(false);
  const [isAddToPoolModalOpen, setIsAddToPoolModalOpen] = useState(false);
  const [selectedPoolForQuestion, setSelectedPoolForQuestion] = useState<number | null>(null);
  const [currentQuestionForPool, setCurrentQuestionForPool] = useState<number | null>(null);
  
  const { questionPools, createNewPool, addQuestionToPoolById } = usePools();

  const updateQuestion = (id: number, field: string, value: any) => {
    if (field === 'questionImage' && value instanceof File) {
      const preview = URL.createObjectURL(value);
      setQuestionImagePreviews(prev => ({ ...prev, [id]: preview }));
    }
    onQuestionsChange(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateWrongAnswer = (qId: number, idx: number, value: string) => {
    onQuestionsChange(questions.map(q => {
      if (q.id === qId) {
        const newWrong = [...q.wrongAnswers];
        newWrong[idx] = value;
        return { ...q, wrongAnswers: newWrong };
      }
      return q;
    }));
  };

  const addQuestion = () => {
    if (questions.length >= 50) {
      alert('Максимум 50 вопросов');
      return;
    }
    onQuestionsChange([...questions, {
      id: nextId,
      questionText: '',
      questionImage: null,
      rightAnswer: '',
      wrongAnswers: ['', '', ''],
      isTextInput: false,
      textAnswer: ''
    }]);
    setNextId(nextId + 1);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      if (questionImagePreviews[id]) {
        URL.revokeObjectURL(questionImagePreviews[id]);
      }
      onQuestionsChange(questions.filter(q => q.id !== id));
    }
  };

  const openPoolModal = (questionId: number) => {
    onModalOpenChange?.(true);
    setCurrentQuestionId(questionId);
    setIsPoolModalOpen(true);
  };

  const closePoolModal = () => {
    onModalOpenChange?.(false);
    setIsPoolModalOpen(false);
    setSelectedPoolId(null);
    setCurrentQuestionId(null);
  };

  const selectQuestionFromPool = (question: PoolQuestion) => {
    if (currentQuestionId !== null) {
      onQuestionsChange(questions.map(q => {
        if (q.id === currentQuestionId) {
          return {
            ...q,
            questionText: question.questionText,
            rightAnswer: question.rightAnswer,
            isTextInput: question.isTextInput,
            textAnswer: question.textAnswer,
            wrongAnswers: [...question.wrongAnswers]
          };
        }
        return q;
      }));
      closePoolModal();
    }
  };

  const openAddToPoolModal = (questionId: number) => {
    onModalOpenChange?.(true);
    setCurrentQuestionForPool(questionId);
    setIsAddToPoolModalOpen(true);
  };

  const closeAddToPoolModal = () => {
    onModalOpenChange?.(false);
    setIsAddToPoolModalOpen(false);
    setSelectedPoolForQuestion(null);
    setCurrentQuestionForPool(null);
  };

  const handleAddToPool = async () => {
    if (!selectedPoolForQuestion || !currentQuestionForPool) {
      alert('Выберите пул');
      return;
    }
    
    const currentQuestion = questions.find(q => q.id === currentQuestionForPool);
    if (!currentQuestion) return;
    
    if (!currentQuestion.questionText.trim()) {
      alert('Сначала заполните текст вопроса');
      return;
    }
    
    const success = await addQuestionToPoolById(selectedPoolForQuestion, currentQuestion);
    if (success) {
      alert('Вопрос успешно добавлен в пул!');
      closeAddToPoolModal();
    } else {
      alert('Ошибка при добавлении вопроса в пул');
    }
  };

  const handleCreatePool = async (title: string, description: string) => {
    const newPool = await createNewPool(title, description);
    if (newPool) {
      alert('Пул вопросов создан!');
      setIsCreatePoolModalOpen(false);
    }
  };

  return (
    <div>
      {questions.map((q, idx) => (
        <QuestionItem
          key={q.id}
          question={q}
          index={idx}
          isLast={questions.length === 1}
          imagePreview={questionImagePreviews[q.id]}
          isSurvey={isSurvey}
          onUpdate={updateQuestion}
          onUpdateWrongAnswer={updateWrongAnswer}
          onRemove={removeQuestion}
          onOpenPool={openPoolModal}
          onAddToPool={openAddToPoolModal}
        />
      ))}
      
      <button type="button" className={styles.addQuestionBtn} onClick={addQuestion}>
        + добавить вопрос
      </button>

      <PoolModal
        isOpen={isPoolModalOpen}
        pools={questionPools}
        selectedPoolId={selectedPoolId}
        onClose={closePoolModal}
        onSelectPool={setSelectedPoolId}
        onBack={() => setSelectedPoolId(null)}
        onSelectQuestion={selectQuestionFromPool}
        onCreatePool={() => setIsCreatePoolModalOpen(true)}
      />

      <CreatePoolModal
        isOpen={isCreatePoolModalOpen}
        onClose={() => setIsCreatePoolModalOpen(false)}
        onCreate={handleCreatePool}
      />

      <AddToPoolModal
        isOpen={isAddToPoolModalOpen}
        pools={questionPools}
        selectedPoolId={selectedPoolForQuestion}
        onClose={closeAddToPoolModal}
        onSelectPool={setSelectedPoolForQuestion}
        onConfirm={handleAddToPool}
        onCreatePool={() => setIsCreatePoolModalOpen(true)}
      />
    </div>
  );
};

export default QuestionBuilder;