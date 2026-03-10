import React from 'react';
import styles from './Chip.module.css';

interface ChipProps {
  label: string;
  type?: 'tag' | 'filter'; 
  onClick?: () => void;
  isActive?: boolean;
}

const Chip = ({ 
  label, 
  type = 'tag', 
  onClick, 
  isActive = false 
}: ChipProps) => {
  return (
    <button 
        className={`${styles.chip} ${type === 'filter' ? styles.filter : styles.tag} ${isActive ? styles.active : ''}`}
        onClick={onClick}
        >
        {label}
    </button>
  );
};

export default Chip;