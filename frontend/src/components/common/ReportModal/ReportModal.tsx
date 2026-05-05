import React, { useState } from 'react';
import styles from './ReportModal.module.css';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    title?: string;
    reasons?: string[];
}

const ReportModal: React.FC<ReportModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit,
    title = "Пожаловаться",
    reasons = [
        "Несоответствие теме",
        "Неприемлемый контент",
        "Спам",
        "Другое"
    ]
}) => {
    const [selectedReason, setSelectedReason] = useState('');

    const handleSubmit = () => {
        if (!selectedReason) {
            alert('Выберите причину жалобы');
            return;
        }
        onSubmit(selectedReason);
        setSelectedReason('');
    };

    const handleClose = () => {
        setSelectedReason('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>{title}</h3>
                <div className={styles.modalReasons}>
                    {reasons.map((reason) => (
                        <label key={reason} className={styles.radioLabel}>
                            <input
                                type="radio"
                                name="reportReason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                            />
                            <span>{reason}</span>
                        </label>
                    ))}
                </div>
                <div className={styles.modalButtons}>
                    <button className={styles.cancelButton} onClick={handleClose}>
                        Отмена
                    </button>
                    <button className={styles.submitButton} onClick={handleSubmit}>
                        Отправить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;