import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchSection from '../Search/SearchSection/SearchSection';
import Card from '../Card/TestCard/Card';
import { getTests, getSurveys, getTestRating } from '../../../api/tests';
import styles from './TestsList.module.css';

const TestsList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'tests' | 'surveys'>('tests');
  const [displayedCards, setDisplayedCards] = useState(12);
  const [allCards, setAllCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTopicsModalOpen, setIsTopicsModalOpen] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const BASE_URL = 'http://localhost:8000';

  const topicsList = ['наука', 'спорт', 'сериалы', 'анимации', 'игры'];

  // Чтение параметров из URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    const search = params.get('search');
    const sort = params.get('sort');
    const topics = params.get('topics');
    
    if (type === 'test') setSelectedType('tests');
    if (type === 'survey') setSelectedType('surveys');
    if (topics) setSelectedTopics(topics.split(','));
    
    loadCards(search, sort, topics);
  }, [location.search]);

  // Загружаем карточки при изменении selectedType
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search');
    const sort = params.get('sort');
    const topics = params.get('topics');
    loadCards(search, sort, topics);
  }, [selectedType]);

  const loadCards = async (search?: string | null, sort?: string | null, topics?: string | null) => {
    setLoading(true);
    try {
      let data;
      if (selectedType === 'tests') {
        data = await getTests();
      } else {
        data = await getSurveys();
      }
      
      // Фильтрация по поиску
      let filteredData = data;
      if (search) {
        filteredData = data.filter((test: any) => 
          test.title.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Фильтрация по темам
      if (topics) {
        const topicArray = topics.split(',');
        filteredData = filteredData.filter((test: any) => 
          test.topics && topicArray.some(topic => test.topics.includes(topic))
        );
      }
      
      // Сортировка
      if (sort === 'new') {
        filteredData = filteredData.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sort === 'old') {
        filteredData = filteredData.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      } else if (sort === 'popular') {
        filteredData = filteredData.sort((a: any, b: any) => 
          (b.attempts_count || 0) - (a.attempts_count || 0)
        );
      } else if (sort === 'az') {
        filteredData = filteredData.sort((a: any, b: any) => 
          a.title.localeCompare(b.title)
        );
      }
      
      // Добавляем рейтинг и полный URL картинки для каждого теста
      const cardsWithData = await Promise.all(filteredData.map(async (test: any) => {
        try {
          const ratingData = await getTestRating(test.id);
          
          const imageFullUrl = test.image ? 
            (test.image.startsWith('http') ? test.image : `${BASE_URL}${test.image}`) : null;
          
          let authorAvatarUrl = null;
          if (test.author_info?.avatar) {
            if (test.author_info.avatar.startsWith('http') || test.author_info.avatar.startsWith('data:image')) {
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
          const imageFullUrl = test.image ? 
            (test.image.startsWith('http') ? test.image : `${BASE_URL}${test.image}`) : null;
          
          let authorAvatarUrl = null;
          if (test.author_info?.avatar) {
            if (test.author_info.avatar.startsWith('http') || test.author_info.avatar.startsWith('data:image')) {
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
      
      setAllCards(cardsWithData);
      setDisplayedCards(12);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: 'tests' | 'surveys') => {
    setSelectedType(type);
    const params = new URLSearchParams(location.search);
    params.set('type', type === 'tests' ? 'test' : 'survey');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleTopicsApply = () => {
    const params = new URLSearchParams(location.search);
    if (selectedTopics.length > 0) {
      params.set('topics', selectedTopics.join(','));
    } else {
      params.delete('topics');
    }
    navigate(`?${params.toString()}`, { replace: true });
    setIsTopicsModalOpen(false);
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  // Бесконечный скролл
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCards < allCards.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setDisplayedCards(prev => Math.min(prev + 8, allCards.length));
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayedCards, allCards.length, isLoadingMore]);

  const visibleCards = allCards.slice(0, displayedCards);

  if (loading) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loading}>Загрузка...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.hideOnMobile}>
            <SearchSection 
              onTypeChange={handleTypeChange} 
              showTypeSelector={true}
              onTopicsClick={() => setIsTopicsModalOpen(true)}
              selectedTopicsCount={selectedTopics.length}
            />
          </div>
          
          <div className={styles.container}>
            <div className={styles.cardsGrid}>
              {visibleCards.map((card) => (
                <Card
                  key={card.id}
                  title={card.title}
                  description={card.description}
                  author={card.author_info?.full_name || card.author_info?.login || 'Неизвестный автор'}
                  rating={`${card.average_rating || 0}/5`}
                  users={card.ratings_count?.toString() || '0'}
                  questions={card.questions_count?.toString() || '0'}
                  type={card.is_survey ? 'survey' : 'test'}
                  testId={card.id.toString()}
                  authorId={card.author_info?.id?.toString() || ''}
                  imageUrl={card.full_image_url || undefined}
                  authorAvatar={card.full_avatar_url}
                />
              ))}
            </div>
            
            {displayedCards < allCards.length && (
              <div ref={loadMoreRef} className={styles.loadMore}>
                {isLoadingMore ? 'Загрузка...' : 'Загрузить ещё'}
              </div>
            )}
            
            <div className={styles.loadingStatus}>
              Показано {visibleCards.length} из {allCards.length}
            </div>
          </div>
        </main>
      </div>

      {/* Модальное окно выбора тем */}
      {isTopicsModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsTopicsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Выберите темы</h3>
            <div className={styles.topicsGrid}>
              {topicsList.map(topic => (
                <button
                  key={topic}
                  className={`${styles.topicButton} ${selectedTopics.includes(topic) ? styles.active : ''}`}
                  onClick={() => toggleTopic(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
            <div className={styles.modalButtons}>
              <button 
                className={styles.clearButton}
                onClick={() => setSelectedTopics([])}
              >
                Очистить
              </button>
              <button 
                className={styles.applyButton}
                onClick={handleTopicsApply}
              >
                Применить ({selectedTopics.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestsList;