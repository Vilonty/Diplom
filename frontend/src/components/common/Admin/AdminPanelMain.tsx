import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../api/axios';
import styles from "./AdminPanel.module.css";
import { isAdmin } from '../../../api/auth';

interface Report {
    id: number;
    target_type: string;
    target_id: number;
    user: number;
    user_info: {
        id: number;
        login: string;
        full_name: string;
        avatar: string | null;
    };
    reason: string;
    comment: string;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
}

const AdminMain = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>('all');

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const adminStatus = await isAdmin();
                if (!adminStatus) {
                    navigate('/');
                }
                await loadReports();
                setLoading(false);
            } catch (error) {
                console.error('Ошибка проверки прав:', error);
                navigate('/');
            }
        };
        checkAdmin();
    }, [navigate]);

    const loadReports = async () => {
        try {
            const response = await api.get('/reports/list/');
            console.log('Загружены репорты:', response.data);
            setReports(response.data);
            setFilteredReports(response.data);
        } catch (error) {
            console.error('Ошибка загрузки репортов:', error);
        }
    };

    const updateReportStatus = async (reportId: number, status: string) => {
        try {
            await api.patch(`/reports/${reportId}/`, { status });
            await loadReports();
            alert('Статус обновлен');
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            alert('Ошибка при обновлении статуса');
        }
    };

    const filterByStatus = (status: string) => {
        setActiveFilter(status);
        if (status === 'all') {
            setFilteredReports(reports);
        } else {
            setFilteredReports(reports.filter(report => report.status === status));
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'pending': return styles.openReport;
            case 'reviewed': return styles.reviewedReport;
            case 'resolved': return styles.closedReport;
            default: return '';
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'test': return 'Тест';
            case 'comment': return 'Комментарий';
            case 'user': return 'Пользователь';
            default: return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    const getAvatarUrl = (avatar: string | null) => {
        if (!avatar) return null;
        if (avatar.startsWith('http')) return avatar;
        return `http://localhost:8000${avatar}`;
    };

    const getStatusCount = (status: string) => {
        if (status === 'all') return reports.length;
        return reports.filter(r => r.status === status).length;
    };

    const getTargetLink = (report: Report) => {
        if (report.target_type === 'user') {
            return `/profile/${report.target_id}`;
        }
        if (report.target_type === 'comment') {
            // Для комментариев используем test_id, если есть, иначе target_id
            return `/test/${report.test_id || report.target_id}`;
        }
        return `/test/${report.target_id}`;
    };
    
    const getButtonText = (report: Report) => {
        if (report.target_type === 'user') {
            return 'Перейти к профилю';
        }
        return 'Перейти к тесту';
    };

    if (loading) {
        return <div className={styles.loading}>Проверка прав...</div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>РЕПОРТЫ</h1>
                </div>
                
                <div className={styles.filterBar}>
                    <button 
                        className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.activeFilter : ''}`}
                        onClick={() => filterByStatus('all')}
                    >
                        Все ({getStatusCount('all')})
                    </button>
                    <button 
                        className={`${styles.filterBtn} ${activeFilter === 'pending' ? styles.activeFilter : ''}`}
                        onClick={() => filterByStatus('pending')}
                    >
                        На рассмотрении ({getStatusCount('pending')})
                    </button>
                    <button 
                        className={`${styles.filterBtn} ${activeFilter === 'reviewed' ? styles.activeFilter : ''}`}
                        onClick={() => filterByStatus('reviewed')}
                    >
                        Проверено ({getStatusCount('reviewed')})
                    </button>
                    <button 
                        className={`${styles.filterBtn} ${activeFilter === 'resolved' ? styles.activeFilter : ''}`}
                        onClick={() => filterByStatus('resolved')}
                    >
                        Решено ({getStatusCount('resolved')})
                    </button>
                </div>
                
                <div className={styles.adminMain}>
                    <div className={styles.reportList}>
                        {filteredReports.length === 0 ? (
                            <div className={styles.noReports}>Нет жалоб</div>
                        ) : (
                            filteredReports.map((report) => {
                                const user = report.user_info;
                                const userName = user?.full_name || user?.login || 'Пользователь';
                                const userAvatar = user?.avatar;
                                
                                return (
                                    <div 
                                        key={report.id} 
                                        className={`${styles.reportCard} ${getStatusClass(report.status)}`}
                                    >
                                        <div className={styles.userSection}>
                                            <div className={styles.userLabel}>Пользователь</div>
                                            <Link to={`/profile/${user?.id}`} className={styles.userCardLink}>
                                                <div className={styles.userCard}>
                                                    {userAvatar ? (
                                                        <img 
                                                            src={getAvatarUrl(userAvatar)} 
                                                            alt="avatar"
                                                            className={styles.userAvatar}
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement?.querySelector('.avatarPlaceholder')?.classList.add(styles.show);
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`${styles.userAvatar} ${styles.avatarPlaceholder} ${!userAvatar ? styles.show : ''}`}>
                                                        {userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className={styles.userInfo}>
                                                        <div className={styles.username}>
                                                            {userName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className={styles.reportDate}>
                                                {formatDate(report.created_at)}
                                            </div>
                                        </div>

                                        <div className={styles.reportType}>
                                            <div className={styles.label}>Тип</div>
                                            <div className={styles.value}>{getTypeText(report.target_type)}</div>
                                        </div>

                                        <div className={styles.reportReason}>
                                            <div className={styles.label}>Причина</div>
                                            <div className={styles.value}>{report.reason}</div>
                                            {report.comment && (
                                                <div className={styles.reportCommentInline}>
                                                    <div className={styles.commentLabel}>Комментарий:</div>
                                                    <div className={styles.commentValue}>{report.comment}</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.reportStatus}>
                                            <div className={styles.label}>Статус</div>
                                            <select 
                                                className={styles.statusSelect}
                                                value={report.status}
                                                onChange={(e) => updateReportStatus(report.id, e.target.value)}
                                            >
                                                <option value="pending">На рассмотрении</option>
                                                <option value="reviewed">Проверено</option>
                                                <option value="resolved">Решено</option>
                                            </select>
                                        </div>

                                        <button 
                                            className={styles.linkButton}
                                            onClick={() => {
                                                navigate(getTargetLink(report));
                                            }}
                                        >
                                            {getButtonText(report)}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminMain;