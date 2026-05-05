import React from 'react';
import styles from './QuestionBuilder.module.css';

interface Question {
  id: number;
  questionText: string;
  questionImage: File | null;
  rightAnswer: string;
  wrongAnswers: string[];
  isTextInput: boolean;
  textAnswer: string;
}

interface QuestionItemProps {
  question: Question;
  index: number;
  isLast: boolean;
  imagePreview?: string;
  isSurvey: boolean;
  onUpdate: (id: number, field: string, value: any) => void;
  onUpdateWrongAnswer: (qId: number, idx: number, value: string) => void;
  onRemove: (id: number) => void;
  onOpenPool: (id: number) => void;
  onAddToPool: (id: number) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  isLast,
  imagePreview,
  isSurvey,
  onUpdate,
  onUpdateWrongAnswer,
  onRemove,
  onOpenPool,
  onAddToPool
}) => {
  const handleOpenPool = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenPool(id);
  };

  const handleAddToPool = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToPool(id);
  };

  const handleRemove = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(id);
  };

  return (
    <div className={styles.questionBlock}>
      <div className={styles.questionHead}>
        <h3>вопрос {index + 1}</h3>
        {!isLast && (
          <button 
            type="button" 
            className={styles.deleteBtn} 
            onClick={(e) => handleRemove(e, question.id)}
          >
            ✕
          </button>
        )}
      </div>

      <div className={styles.questionInner}>
        <div className={styles.questionLeft}>
          <span>картинка вопроса {!isSurvey && '*'}</span>
          <div 
            className={styles.smallUpload} 
            onClick={() => document.getElementById(`qImg_${question.id}`)?.click()}
          >
            {(imagePreview || question.questionImage) ? (
              <img 
                src={imagePreview || URL.createObjectURL(question.questionImage!)} 
                alt="question" 
                className={styles.imagePreview} 
              />
            ) : (
              <div className={styles.smallPlus}>+</div>
            )}
            <input
              id={`qImg_${question.id}`}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => onUpdate(question.id, 'questionImage', e.target.files?.[0] || null)}
            />
          </div>
          <button 
            type="button" 
            className={styles.poolBtn} 
            onClick={(e) => handleOpenPool(e, question.id)}
          >
            выбрать из пула
          </button>
          <button 
            type="button" 
            className={styles.poolBtn} 
            onClick={(e) => handleAddToPool(e, question.id)}
          >
            сохранить в пул
          </button>
        </div>

        <div className={styles.questionRight}>
          <input
            maxLength={100}
            value={question.questionText}
            onChange={e => onUpdate(question.id, 'questionText', e.target.value)}
            placeholder={`текст вопроса${!isSurvey ? ' (мин 10 символов)' : ''}`}
          />

          <div className={styles.answersBox}>
            {!isSurvey ? (
              <>
                <span>правильный ответ *</span>
                <input
                  value={question.rightAnswer}
                  onChange={e => onUpdate(question.id, 'rightAnswer', e.target.value)}
                  placeholder="введите правильный ответ"
                  disabled={question.isTextInput}
                />

                <span>неправильные ответы (хотя бы один)</span>
                {question.wrongAnswers.map((ans, i) => (
                  <input
                    key={i}
                    value={ans}
                    onChange={e => onUpdateWrongAnswer(question.id, i, e.target.value)}
                    placeholder={`вариант ${i + 1}`}
                    disabled={question.isTextInput}
                  />
                ))}

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={question.isTextInput}
                    onChange={e => onUpdate(question.id, 'isTextInput', e.target.checked)}
                  />
                  <span>текстовый ввод ответа</span>
                </label>

                {question.isTextInput && (
                  <input
                    value={question.textAnswer}
                    onChange={e => onUpdate(question.id, 'textAnswer', e.target.value)}
                    placeholder="правильный текстовый ответ"
                  />
                )}
              </>
            ) : (
              <>
                <span>варианты ответов</span>
                <input
                  value={question.rightAnswer}
                  onChange={e => onUpdate(question.id, 'rightAnswer', e.target.value)}
                  placeholder="вариант 1"
                  disabled={question.isTextInput}
                />
                {question.wrongAnswers.map((ans, i) => (
                  <input
                    key={i}
                    value={ans}
                    onChange={e => onUpdateWrongAnswer(question.id, i, e.target.value)}
                    placeholder={`вариант ${i + 2}`}
                    disabled={question.isTextInput}
                  />
                ))}

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={question.isTextInput}
                    onChange={e => onUpdate(question.id, 'isTextInput', e.target.checked)}
                  />
                  <span>текстовый ввод ответа</span>
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionItem;