import React, { useState } from 'react';
import styles from './MuteBanModal.module.css';

interface MuteBanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, duration: string, durationValue: number | null, durationUnit: string | null) => void;
    title: string;
    actionType: 'mute' | 'ban';
}

const MuteBanModal: React.FC<MuteBanModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    title,
    actionType 
}) => {
    const [reason, setReason] = useState('');
    const [duration, setDuration] = useState('1d');
    const [customDuration, setCustomDuration] = useState('');
    const [customUnit, setCustomUnit] = useState('days');

    const durationOptions = [
        { label: '1 час', value: '1h', duration: 'temporary', value_num: 1, unit: 'hours' },
        { label: '1 день', value: '1d', duration: 'temporary', value_num: 1, unit: 'days' },
        { label: '3 дня', value: '3d', duration: 'temporary', value_num: 3, unit: 'days' },
        { label: '1 неделя', value: '1w', duration: 'temporary', value_num: 1, unit: 'weeks' },
        { label: '1 месяц', value: '1m', duration: 'temporary', value_num: 1, unit: 'months' },
        { label: 'Перманентно', value: 'permanent', duration: 'permanent', value_num: null, unit: null },
        { label: 'Своя длительность', value: 'custom', duration: 'temporary', value_num: null, unit: null },
    ];

    const handleSubmit = () => {
        if (!reason.trim()) {
            alert('Введите причину');
            return;
        }

        let durationType = 'temporary';
        let durationValue: number | null = null;
        let durationUnit: string | null = null;

        const selected = durationOptions.find(opt => opt.value === duration);
        
        if (selected?.value === 'permanent') {
            durationType = 'permanent';
        } else if (selected?.value === 'custom') {
            if (!customDuration || parseInt(customDuration) <= 0) {
                alert('Введите корректную длительность');
                return;
            }
            durationType = 'temporary';
            durationValue = parseInt(customDuration);
            durationUnit = customUnit;
        } else if (selected) {
            durationType = selected.duration;
            durationValue = selected.value_num;
            durationUnit = selected.unit;
        }

        onSubmit(reason, durationType, durationValue, durationUnit);
        setReason('');
        setDuration('1d');
        setCustomDuration('');
        setCustomUnit('days');
        onClose();
    };

    const handleClose = () => {
        setReason('');
        setDuration('1d');
        setCustomDuration('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>{title}</h3>
                
                <div className={styles.formGroup}>
                    <label className={styles.label}>Причина</label>
                    <textarea
                        className={styles.textarea}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Укажите причину..."
                        rows={3}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Длительность</label>
                    <div className={styles.durationButtons}>
                        {durationOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`${styles.durationBtn} ${duration === opt.value ? styles.active : ''}`}
                                onClick={() => setDuration(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {duration === 'custom' && (
                    <div className={styles.customDuration}>
                        <input
                            type="number"
                            className={styles.customInput}
                            value={customDuration}
                            onChange={(e) => setCustomDuration(e.target.value)}
                            placeholder="Число"
                            min="1"
                        />
                        <select
                            className={styles.customSelect}
                            value={customUnit}
                            onChange={(e) => setCustomUnit(e.target.value)}
                        >
                            <option value="hours">Часы</option>
                            <option value="days">Дни</option>
                            <option value="weeks">Недели</option>
                            <option value="months">Месяцы</option>
                        </select>
                    </div>
                )}

                <div className={styles.modalButtons}>
                    <button className={styles.cancelButton} onClick={handleClose}>
                        Отмена
                    </button>
                    <button className={styles.submitButton} onClick={handleSubmit}>
                        {actionType === 'mute' ? 'Замутить' : 'Забанить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MuteBanModal;