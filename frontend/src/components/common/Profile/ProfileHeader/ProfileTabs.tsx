import React from 'react';
import styles from './ProfileTabs.module.css';

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'statistics', label: 'Статистика' },
    { id: 'tests', label: 'Мои тесты' },
    { id: 'friends', label: 'Друзья' }
  ];

  return (
    <div className={styles.profileInfoBlockBottom}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={activeTab === tab.id ? styles.active : ''}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;