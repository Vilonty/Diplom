import React, { useRef, useState, useEffect } from 'react';
import Card from '../../Card/TestCard/Card';
import { getRecentTests, getPopularTests, getRecentSurveys, getTestRating } from '../../../../api/tests';
import styles from './TestSection.module.css';

interface TestSectionProps {
  title: string;
  type: 'recent' | 'popular' | 'surveys';
}

const TestSection = ({ title, type }: TestSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const BASE_URL = 'http://localhost:8000';

  const loadTests = async () => {
    setLoading(true);
    try {
      let data;
      if (type === 'recent') {
        data = await getRecentTests(8);
      } else if (type === 'popular') {
        data = await getPopularTests(8);
      } else {
        data = await getRecentSurveys(8);
      }
      
      const testsWithRating = await Promise.all(data.map(async (test: any) => {
        try {
          const ratingData = await getTestRating(test.id);
          
          // Формируем полный URL для картинки теста
          let imageFullUrl = null;
          if (test.image) {
            if (test.image.startsWith('http')) {
              imageFullUrl = test.image;
            } else {
              imageFullUrl = `${BASE_URL}${test.image}`;
            }
          } else if (test.image_url) {
            if (test.image_url.startsWith('http')) {
              imageFullUrl = test.image_url;
            } else {
              imageFullUrl = `${BASE_URL}${test.image_url}`;
            }
          }
          
          // Формируем полный URL для аватара автора
          let authorAvatarUrl = null;
          if (test.author_info?.avatar) {
            if (test.author_info.avatar.startsWith('http')) {
              authorAvatarUrl = test.author_info.avatar;
            } else {
              authorAvatarUrl = `${BASE_URL}${test.author_info.avatar}`;
            }
          }
          
          return {
            ...test,
            average_rating: ratingData.average_rating || 0,
            ratings_count: ratingData.ratings_count || 0,
            full_image_url: imageFullUrl,
            full_avatar_url: authorAvatarUrl
          };
        } catch (error) {
          // Формируем полный URL для картинки теста при ошибке
          let imageFullUrl = null;
          if (test.image) {
            if (test.image.startsWith('http')) {
              imageFullUrl = test.image;
            } else {
              imageFullUrl = `${BASE_URL}${test.image}`;
            }
          } else if (test.image_url) {
            if (test.image_url.startsWith('http')) {
              imageFullUrl = test.image_url;
            } else {
              imageFullUrl = `${BASE_URL}${test.image_url}`;
            }
          }
          
          let authorAvatarUrl = null;
          if (test.author_info?.avatar) {
            if (test.author_info.avatar.startsWith('http')) {
              authorAvatarUrl = test.author_info.avatar;
            } else {
              authorAvatarUrl = `${BASE_URL}${test.author_info.avatar}`;
            }
          }
          
          return { 
            ...test, 
            average_rating: 0, 
            ratings_count: 0,
            full_image_url: imageFullUrl,
            full_avatar_url: authorAvatarUrl
          };
        }
      }));

      setTests(testsWithRating);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [type, refreshKey]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadTests();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [type]);

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
  }, [tests]);

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
          <div className={styles.loadingContainer}>
            <img 
              src="http://localhost:8000/media/mainpage/loading.jpg" 
              alt="Загрузка" 
              className={styles.loadingImage}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className={styles.loadingText}>ЗАГРУЗКА</div>
          </div>
        </div>
      </section>
    );
  }

  if (tests.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.empty}>Нет тестов</div>
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
            {tests.map((test) => (
              <Card 
                key={test.id}
                title={test.title}
                description={test.description}
                author={test.author_info?.full_name || test.author_info?.login || 'Неизвестный автор'}
                rating={`${test.average_rating || 0}/5`}
                users={test.ratings_count?.toString() || '0'}
                questions={test.questions_count?.toString() || '0'}
                type={test.is_survey ? 'survey' : 'test'}
                testId={test.id.toString()}
                authorId={test.author_info?.id?.toString() || ''}
                imageUrl={test.full_image_url || undefined}
                authorAvatar={test.full_avatar_url || undefined}
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

export default TestSection;