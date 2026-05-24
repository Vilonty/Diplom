import React from 'react';
import styles from './ReportButton.module.css';

interface ReportButtonProps {
    onClick: () => void;
}

const ReportButton: React.FC<ReportButtonProps> = ({ onClick }) => {
    return (
        <button 
            className={styles.reportButton}
            onClick={onClick}
        >
            !
        </button>
    );
};

export default ReportButton;