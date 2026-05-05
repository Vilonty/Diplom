import React from 'react';
import { QuestionPool, PoolQuestion } from '../../../../hooks/usePools';
import styles from './QuestionBuilder.module.css';

interface PoolModalProps {
  isOpen: boolean;
  pools: QuestionPool[];
  selectedPoolId: number | null;
  onClose: () => void;
  onSelectPool: (poolId: number) => void;
  onBack: () => void;
  onSelectQuestion: (question: PoolQuestion) => void;
  onCreatePool: () => void;
}

const PoolModal: React.FC<PoolModalProps> = ({
  isOpen,
  pools,
  selectedPoolId,
  onClose,
  onSelectPool,
  onBack,
  onSelectQuestion,
  onCreatePool
}) => {
  if (!isOpen) return null;

  const selectedPool = pools.find(p => p.id === selectedPoolId);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.poolModal} onClick={(e) => e.stopPropagation()}>
        {selectedPoolId === null ? (
          <>
            <div className={styles.modalHeader}>
              <h3>выберите пул вопросов</h3>
              <button className={styles.closeModalBtn} onClick={onClose}>✕</button>
            </div>
            <div className={styles.poolsList}>
              {pools.map(pool => (
                <div key={pool.id} className={styles.poolCard} onClick={() => onSelectPool(pool.id)}>
                  <div className={styles.poolCardHeader}>
                    <h4>{pool.title}</h4>
                    <span className={styles.questionsCount}>{pool.questions.length} вопросов</span>
                  </div>
                  <p className={styles.poolDescription}>{pool.description}</p>
                </div>
              ))}
            </div>
            <button className={styles.createPoolBtn} onClick={onCreatePool}>
              + создать новый пул вопросов
            </button>
          </>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <button className={styles.backBtn} onClick={onBack}>←</button>
              <h3>{selectedPool?.title}</h3>
              <button className={styles.closeModalBtn} onClick={onClose}>✕</button>
            </div>
            <p className={styles.poolDescriptionFull}>{selectedPool?.description}</p>
            <div className={styles.questionsList}>
              {selectedPool?.questions.map((question, idx) => (
                <div key={question.id} className={styles.poolQuestionCard} onClick={() => onSelectQuestion(question)}>
                  <div className={styles.questionCardHeader}>
                    <span className={styles.questionNumber}>Вопрос {idx + 1}</span>
                    <button className={styles.selectQuestionBtn}>выбрать</button>
                  </div>
                  <p className={styles.questionCardText}>{question.questionText}</p>
                  <div className={styles.answersPreview}>
                    <div className={`${styles.previewAnswer} ${styles.correct}`}>
                      ✓ {question.rightAnswer}
                    </div>
                    {question.wrongAnswers.map((answer, i) => (
                      answer && (
                        <div key={i} className={styles.previewAnswer}>
                          ✗ {answer}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PoolModal;