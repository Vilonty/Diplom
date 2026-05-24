import React from 'react';
import StatisticsTab from './StatisticsTab';
import MyTestsTab from './MyTestsTab';
import FriendsTab from './FriendsTab';
import styles from './ProfileStatsBlock.module.css';

interface ProfileStatsBlockProps {
    activeTab: string;
    isOwnProfile?: boolean;
    userId?: number | null;
}

const ProfileStatsBlock: React.FC<ProfileStatsBlockProps> = ({ activeTab, isOwnProfile = true, userId = null }) => {
    const renderContent = () => {
        switch(activeTab) {
            case 'statistics':
                return <StatisticsTab userId={userId} isOwnProfile={isOwnProfile} />;
            case 'tests':
                return <MyTestsTab userId={userId} isOwnProfile={isOwnProfile} />;
            case 'friends':
                return <FriendsTab isOwnProfile={isOwnProfile} userId={userId} />;
            default:
                return null;
        }
    };

    return (
        <div className={styles.bottomProfile}>
            <div className={styles.profileStatsBlock}>
                {renderContent()}
            </div>
        </div>
    );
};

export default ProfileStatsBlock;