import React, { useState } from 'react';
import styles from './QuestionBuilder.module.css';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description: string) => Promise<void>;
}

const CreatePoolModal: React.FC<CreatePoolModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Введите название пула');
      return;
    }
    await onCreate(title, description);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className={styles.createPoolModalOverlay} onClick={onClose}>
      <div className={styles.createPoolModal} onClick={(e) => e.stopPropagation()}>
        <h3>создать новый пул вопросов</h3>
        <input 
          type="text" 
          maxLength={50}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="название пула"
        />
        <textarea 
          maxLength={200}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="описание пула"
          rows={3}
        />
        <div className={styles.modalButtons}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>отмена</button>
          <button type="button" className={styles.confirmBtn} onClick={handleSubmit}>создать</button>
        </div>
      </div>
    </div>
  );
};

export default CreatePoolModal;