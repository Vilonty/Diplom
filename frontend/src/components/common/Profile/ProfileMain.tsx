import React, { useState } from 'react';
import ProfileHeader from './ProfileHeader/ProfileHeader';
import ProfileTabs from './ProfileHeader/ProfileTabs';
import ProfileStatsBlock from './StatsBlock/ProfileStatsBlock';
import styles from './profile.module.css';

interface ProfileMainProps {
    isOwnProfile: boolean;  
    userId: number | null;   
}

const ProfileMain: React.FC<ProfileMainProps> = ({ isOwnProfile, userId }) => {
    const [activeTab, setActiveTab] = useState('statistics');
    
    console.log('ProfileMain - userId:', userId);  // Добавь отладку
    console.log('ProfileMain - isOwnProfile:', isOwnProfile);

    return (
        <>
            <div className={styles.topProfile}>
                <div className={styles.profileInfoBlock}>
                    <ProfileHeader isOwnProfile={isOwnProfile} userId={userId} />
                    <div className={styles.hr}><hr /></div>
                    <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>
            <ProfileStatsBlock activeTab={activeTab} isOwnProfile={isOwnProfile} userId={userId} />
        </>
    );
};

export default ProfileMain;