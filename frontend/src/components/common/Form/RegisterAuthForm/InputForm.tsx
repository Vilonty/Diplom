import React from 'react';
import styles from './InputForm.module.css';

interface InputFormProps {
    names: string;
    pl: string;
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ 
    names, 
    pl, 
    type = 'text',
    value,
    onChange,
    required = true
}) => {
    return (
        <div className={styles.inputWrapper}>
            <input
                type={type}
                name={names}
                placeholder={pl}
                className={styles.input}
                value={value}
                onChange={onChange}
                required={required}
            />
        </div>
    );
};

export default InputForm;