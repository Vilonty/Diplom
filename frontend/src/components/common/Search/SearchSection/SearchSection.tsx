import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Chip from '../../Chip/Chip';
import api from '../../../../api/axios';
import styles from './SearchSection.module.css';

interface SearchSectionProps {
  onTypeChange?: (type: 'tests' | 'surveys') => void;
  showTypeSelector?: boolean;
  isMobile?: boolean;
  onTopicsClick?: () => void;
  selectedTopicsCount?: number;
}

const SearchSection = ({ 
  onTypeChange, 
  showTypeSelector = false, 
  isMobile = false,
  onTopicsClick,
  selectedTopicsCount = 0
}: SearchSectionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedType, setSelectedType] = useState<'tests' | 'surveys'>('tests');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const userSearchRef = useRef<HTMLDivElement>(null);

  const BASE_URL = 'http://localhost:8000';

  // Функция для получения полного URL аватара
  const getAvatarUrl = (avatar: string | null) => {
    if (!avatar) return null;
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
      return avatar;
    }
    return `${BASE_URL}${avatar}`;
  };

  // Чтение параметров из URL при загрузке
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    const type = params.get('type');
    
    if (search) setSearchQuery(search);
    if (type === 'test') setSelectedType('tests');
    if (type === 'survey') setSelectedType('surveys');
  }, []);

  // Поиск пользователей
  useEffect(() => {
    const searchUsersDebounce = setTimeout(async () => {
      if (userSearchQuery.length >= 2) {
        try {
          const response = await api.get(`/users/search/?search=${userSearchQuery}`);
          setSearchUsers(response.data);
        } catch (error) {
          console.error('Ошибка поиска пользователей:', error);
        }
      } else {
        setSearchUsers([]);
      }
    }, 300);
    
    return () => clearTimeout(searchUsersDebounce);
  }, [userSearchQuery]);

  // Закрытие поиска пользователей при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target as Node)) {
        setShowUserSearch(false);
        setUserSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeSelect = (type: 'tests' | 'surveys') => {
    setSelectedType(type);
    setIsDropdownOpen(false);
    if (onTypeChange) {
      onTypeChange(type);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedType === 'tests') params.append('type', 'test');
    if (selectedType === 'surveys') params.append('type', 'survey');
    
    navigate(`/testlist?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUserClick = (userId: number) => {
    setShowUserSearch(false);
    setUserSearchQuery('');
    navigate(`/profile/${userId}`);
  };

  return (
    <section className={styles.section}>
      <div className={styles.searchWrapper}>
        <input 
          placeholder='🔍 поиск тестов...'
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button className={styles.searchButton} onClick={handleSearch}>
          НАЙТИ
        </button>
        
        {/* Кнопка поиска пользователей */}
        <div className={styles.userSearchContainer} ref={userSearchRef}>
          <button 
            className={styles.searchButton}
            onClick={() => setShowUserSearch(!showUserSearch)}
          >
            👤
          </button>
          {showUserSearch && (
            <div className={styles.userSearchDropdown}>
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className={styles.userSearchInput}
                autoFocus
              />
              <div className={styles.userSearchResults}>
                {searchUsers.length === 0 && userSearchQuery.length >= 2 && (
                  <div className={styles.noUsers}>Пользователи не найдены</div>
                )}
                {searchUsers.map(user => {
                  const avatarUrl = getAvatarUrl(user.avatar);
                  const userName = user.full_name || user.login;
                  const firstLetter = userName.charAt(0).toUpperCase();
                  
                  return (
                    <div 
                      key={user.id} 
                      className={styles.userResult}
                      onClick={() => handleUserClick(user.id)}
                    >
                      <div className={styles.userAvatar}>
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={user.login}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.querySelector('.avatarPlaceholder')?.classList.add(styles.show);
                            }}
                          />
                        ) : null}
                        <div className={`${styles.avatarPlaceholder} ${!avatarUrl ? styles.show : ''}`}>
                          {firstLetter}
                        </div>
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>{userName}</div>
                        <div className={styles.userLogin}>@{user.login}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.chipContainer}>
        <div className={styles.tags}>
          <Chip 
            label="НОВЫЕ" 
            type="tag" 
            onClick={() => {
              const params = new URLSearchParams();
              if (searchQuery) params.append('search', searchQuery);
              params.append('sort', 'new');
              if (selectedType === 'tests') params.append('type', 'test');
              if (selectedType === 'surveys') params.append('type', 'survey');
              navigate(`/testlist?${params.toString()}`);
            }}
          />
          <Chip 
            label="ЛУЧШИЕ" 
            type="tag" 
            onClick={() => {
              const params = new URLSearchParams();
              if (searchQuery) params.append('search', searchQuery);
              params.append('sort', 'popular');
              if (selectedType === 'tests') params.append('type', 'test');
              if (selectedType === 'surveys') params.append('type', 'survey');
              navigate(`/testlist?${params.toString()}`);
            }}
          />
          <Chip 
            label="СТАРЫЕ" 
            type="tag" 
            onClick={() => {
              const params = new URLSearchParams();
              if (searchQuery) params.append('search', searchQuery);
              params.append('sort', 'old');
              if (selectedType === 'tests') params.append('type', 'test');
              if (selectedType === 'surveys') params.append('type', 'survey');
              navigate(`/testlist?${params.toString()}`);
            }}
          />
          <Chip 
            label={`ТЕМЫ${selectedTopicsCount ? ` (${selectedTopicsCount})` : ''}`} 
            type="tag" 
            onClick={onTopicsClick}
          />
        </div>
        
        {!isMobile && (
          <div className={styles.rightGroup}>
            <div className={styles.filters}>
              {showTypeSelector && (
                <div className={styles.typeSelector}>
                  <button
                    className={styles.typeButton}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    ТИПЫ ТЕСТОВ: {selectedType === 'tests' ? 'ТЕСТ' : 'ОПРОС'}
                  </button>
                  
                  {isDropdownOpen && (
                    <div className={styles.dropdown}>
                      <button
                        className={`${styles.dropdownItem} ${selectedType === 'tests' ? styles.active : ''}`}
                        onClick={() => handleTypeSelect('tests')}
                      >
                        ТИПЫ ТЕСТОВ: ТЕСТ
                      </button>
                      <button
                        className={`${styles.dropdownItem} ${selectedType === 'surveys' ? styles.active : ''}`}
                        onClick={() => handleTypeSelect('surveys')}
                      >
                        ТИПЫ ТЕСТОВ: ОПРОС
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <Chip 
                label="А⭣Я" 
                type="filter"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (searchQuery) params.append('search', searchQuery);
                  params.append('sort', 'az');
                  if (selectedType === 'tests') params.append('type', 'test');
                  if (selectedType === 'surveys') params.append('type', 'survey');
                  navigate(`/testlist?${params.toString()}`);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchSection;