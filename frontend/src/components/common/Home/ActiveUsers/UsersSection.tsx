import React, { useRef, useState, useEffect } from 'react';
import Card from '../../Card/UserCard/Card';
import api from '../../../../api/axios';
import styles from './UsersSection.module.css';

interface ActiveUsersProps {
  title: string;
}

const ActiveUsers = ({ title }: ActiveUsersProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/top/');
      console.log('API /users/top/ response:', response.data); // Отладка
      
      const formattedUsers = response.data.map((user: any) => {
        // Формируем правильный URL для аватара
        let avatarUrl = null;
        if (user.avatar) {
          if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
            avatarUrl = user.avatar;
          } else if (user.avatar.startsWith('data:image')) {
            avatarUrl = user.avatar;
          } else {
            avatarUrl = `${BASE_URL}${user.avatar}`;
          }
        }
        
        // ВАЖНО: проверяем какие поля приходят с сервера
        console.log('User data:', {
          id: user.id,
          name: user.full_name || user.login,
          avatar: avatarUrl,
          completed_tests: user.completed_tests_count || user.completed_tests || 0,
          created_tests: user.created_tests || user.tests_count || 0
        });
        
        return {
          id: user.id,
          name: user.full_name || user.login,
          avatar: avatarUrl,
          completed_tests: user.completed_tests_count || user.completed_tests || 0,
          created_tests: user.created_tests || user.tests_count || 0
        };
      });
      setUsers(formattedUsers.slice(0, 10));
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      checkScroll();
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [users]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.loading}>Загрузка...</div>
        </div>
      </section>
    );
  }

  if (users.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.empty}>Нет пользователей</div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>{title}</h2>
        
        <div className={styles.wrapper}>
          {showLeftArrow && (
            <button 
              className={styles.scrollButtonLeft} 
              onClick={() => scroll('left')}
            >
              &lt;
            </button>
          )}
          
          <div className={styles.grid} ref={scrollContainerRef}>
            {users.map((user) => (
              <Card 
                key={user.id}
                name={user.name}
                avatar={user.avatar}
                completed={user.completed_tests.toString()}
                created={user.created_tests.toString()}
                userId={user.id.toString()}
              />
            ))}
          </div>
          
          {showRightArrow && (
            <button 
              className={styles.scrollButtonRight} 
              onClick={() => scroll('right')}
            >
              &gt;
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ActiveUsers;