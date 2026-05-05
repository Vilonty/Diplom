import React from 'react';
import { QuestionPool } from '../../../../hooks/usePools';
import styles from './QuestionBuilder.module.css';

interface AddToPoolModalProps {
  isOpen: boolean;
  pools: QuestionPool[];
  selectedPoolId: number | null;
  onClose: () => void;
  onSelectPool: (poolId: number) => void;
  onConfirm: () => void;
  onCreatePool: () => void;  // Добавляем пропс для создания пула
}

const AddToPoolModal: React.FC<AddToPoolModalProps> = ({
  isOpen,
  pools,
  selectedPoolId,
  onClose,
  onSelectPool,
  onConfirm,
  onCreatePool  // Добавляем
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.poolModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>выберите пул для сохранения вопроса</h3>
          <button className={styles.closeModalBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.poolsList}>
          {pools.map(pool => (
            <div 
              key={pool.id} 
              className={`${styles.poolCard} ${selectedPoolId === pool.id ? styles.selected : ''}`} 
              onClick={() => onSelectPool(pool.id)}
            >
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
        <div className={styles.modalButtons}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>отмена</button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm}>добавить</button>
        </div>
      </div>
    </div>
  );
};

export default AddToPoolModal;