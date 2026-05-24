import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import { createTest, uploadImage, createQuestionsBatch, createQuestion } from '../../../api/tests';
import styles from './CreateMain.module.css';
import QuestionBuilder from './Questions/QuestionBuilder';

interface CreateTestOrSurveyProps {
  type: 'test' | 'survey';
}

interface Question {
  id: number;
  questionText: string;
  questionImage: File | null;
  rightAnswer: string;
  wrongAnswers: string[];
  isTextInput: boolean;
  textAnswer: string;
}

const CreateTestOrSurvey: React.FC<CreateTestOrSurveyProps> = ({ type }) => {
  const navigate = useNavigate();
  const isSurvey = type === 'survey';
  
  // Проверка бана
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banUntil, setBanUntil] = useState<string | null>(null);
  const [banPermanent, setBanPermanent] = useState(false);
  const [checkingBan, setCheckingBan] = useState(true);
  
  // Базовые поля
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [topics, setTopics] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  // Только для теста
  const [timeLimit, setTimeLimit] = useState('');
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [passingScore, setPassingScore] = useState('70');
  const [attemptsLimit, setAttemptsLimit] = useState(''); // НОВОЕ ПОЛЕ
  const [noAttemptsLimit, setNoAttemptsLimit] = useState(false); // Без ограничения попыток
  
  // Вопросы
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, questionText: '', questionImage: null, rightAnswer: '', wrongAnswers: ['', '', ''], isTextInput: false, textAnswer: '' }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const topicsList = ['наука', 'спорт', 'сериалы', 'анимации', 'игры'];

  useEffect(() => {
    checkBanStatus();
  }, []);

  const checkBanStatus = async () => {
    try {
      const profile = await api.get('/auth/profile/');
      if (profile.data.is_banned) {
        setIsBanned(true);
        setBanReason(profile.data.ban_reason || '');
        setBanUntil(profile.data.ban_until);
        setBanPermanent(profile.data.ban_permanent || false);
      }
    } catch (error) {
      console.error('Ошибка проверки бана:', error);
    } finally {
      setCheckingBan(false);
    }
  };

  const getBanUntilText = () => {
    if (!banUntil) return '';
    const date = new Date(banUntil);
    return date.toLocaleString('ru-RU');
  };

  const toggleTopic = (topic: string) => {
    setTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);
  };

  // Валидация
  const validateForm = (): boolean => {
    if (!title.trim()) {
      alert(`Введите название ${isSurvey ? 'опроса' : 'теста'}`);
      return false;
    }
    
    if (!isSurvey) {
      if (title.trim().length < 6) {
        alert('Название должно содержать минимум 6 символов');
        return false;
      }
      if (description.trim().length < 10) {
        alert('Описание должно содержать минимум 10 символов');
        return false;
      }
      if (!coverImage) {
        alert('Добавьте обложку для теста');
        return false;
      }
    } else {
      if (description.trim().length < 10) {
        alert('Описание должно содержать минимум 10 символов');
        return false;
      }
    }
    
    // Валидация вопросов
    if (questions.length < 4) {
      alert(`Минимум 4 вопроса необходимо для создания ${isSurvey ? 'опроса' : 'теста'}`);
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.questionText.trim()) {
        alert(`Вопрос ${i + 1}: Заполните текст вопроса`);
        return false;
      }
      
      if (!isSurvey) {
        if (q.questionText.trim().length < 10) {
          alert(`Вопрос ${i + 1}: Текст вопроса должен содержать минимум 10 символов`);
          return false;
        }
      }
      
      if (!isSurvey) {
        if (q.isTextInput) {
          if (!q.textAnswer.trim()) {
            alert(`Вопрос ${i + 1}: Введите правильный текстовый ответ`);
            return false;
          }
        } else {
          if (!q.rightAnswer.trim()) {
            alert(`Вопрос ${i + 1}: Введите правильный ответ`);
            return false;
          }
          
          const hasWrongAnswer = q.wrongAnswers.some(a => a.trim().length > 0);
          if (!hasWrongAnswer) {
            alert(`Вопрос ${i + 1}: Добавьте хотя бы один неправильный вариант ответа`);
            return false;
          }
        }
      } else {
        // Для опроса - проверяем что заполнен хотя бы один вариант ответа ИЛИ включен текстовый ввод
        const hasRightAnswer = q.rightAnswer.trim().length > 0;
        const hasWrongAnswer = q.wrongAnswers.some(a => a.trim().length > 0);
        
        if (!hasRightAnswer && !hasWrongAnswer && !q.isTextInput) {
          alert(`Вопрос ${i + 1}: Заполните хотя бы один вариант ответа или включите "текстовый ввод ответа"`);
          return false;
        }
      }
    }
    
    if (topics.length === 0) {
      alert('Выберите хотя бы одну тему');
      return false;
    }
    
    if (!isSurvey) {
      if (!noTimeLimit && (!timeLimit || parseInt(timeLimit) <= 0)) {
        alert('Укажите ограничение времени или отметьте "без ограничения"');
        return false;
      }
      
      if (!passingScore || parseInt(passingScore) < 0 || parseInt(passingScore) > 100) {
        alert('Укажите проходной балл (от 0 до 100)');
        return false;
      }
      
      // Валидация лимита попыток
      if (!noAttemptsLimit && (!attemptsLimit || parseInt(attemptsLimit) <= 0)) {
        alert('Укажите ограничение попыток или отметьте "без ограничения"');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isModalOpen) return;
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Загружаем обложку
      let coverImageUrl = null;
      if (coverImage) {
        coverImageUrl = await uploadImage(coverImage, 'test');
      }
      
      // 2. Создаем вопросы
      const questionsData = [];
      
      for (const q of questions) {
        let answers: any[] = [];
        let textAnswer = '';
        let isTextInput = false;
        
        if (isSurvey) {
          // Для опроса
          isTextInput = q.isTextInput;
          
          if (q.isTextInput) {
            // Текстовый ввод - no answers
            answers = [];
            textAnswer = '';
          } else {
            // Обычные варианты ответов
            if (q.rightAnswer.trim()) {
              answers.push({ text: q.rightAnswer, is_correct: true, order_index: 0 });
            }
            q.wrongAnswers.forEach((answer, idx) => {
              if (answer.trim()) {
                answers.push({ text: answer, is_correct: false, order_index: idx + 1 });
              }
            });
            textAnswer = '';
          }
        } else {
          // Для теста
          isTextInput = q.isTextInput;
          
          if (q.isTextInput) {
            textAnswer = q.textAnswer;
            answers = [{ text: q.textAnswer, is_correct: true, order_index: 0 }];
          } else {
            answers.push({ text: q.rightAnswer, is_correct: true, order_index: 0 });
            q.wrongAnswers.forEach((answer, idx) => {
              if (answer.trim()) {
                answers.push({ text: answer, is_correct: false, order_index: idx + 1 });
              }
            });
          }
        }
        
        // Картинку вопроса загружаем через uploadImage
        let questionImageUrl = null;
        if (q.questionImage) {
          questionImageUrl = await uploadImage(q.questionImage, 'question');
        }
        
        questionsData.push({
          text: q.questionText,
          image: questionImageUrl,
          difficulty: 1,
          explanation: '',
          is_text_input: isTextInput,
          text_answer: textAnswer,
          answers: answers
        });
      }
      
      // 3. Создаем вопросы в БД
      let questionIds: number[] = [];
      
      if (isSurvey) {
        for (const qData of questionsData) {
          const createdQuestion = await createQuestion(qData as any);
          questionIds.push(createdQuestion.id);
        }
      } else {
        const createdQuestions = await createQuestionsBatch(questionsData);
        if (!createdQuestions?.created?.length) {
          throw new Error('Ошибка при создании вопросов');
        }
        questionIds = createdQuestions.created.map((q: any) => q.id);
      }
      
      // 4. Создаем тест/опрос
      const testData = {
        title: title,
        description: description,
        is_open: visibility === 'public',
        is_survey: isSurvey,
        time_limit: isSurvey ? 0 : (noTimeLimit ? 0 : (parseInt(timeLimit) || 0)),
        passing_score: isSurvey ? 0 : parseInt(passingScore),
        attempts_limit: isSurvey ? 0 : (noAttemptsLimit ? 0 : (parseInt(attemptsLimit) || 0)), // ДОБАВЛЕНО
        image: coverImageUrl,
        topics: topics,
        question_ids: questionIds
      };
      
      await createTest(testData);
      alert(`${isSurvey ? 'Опрос' : 'Тест'} успешно создан!`);
      navigate('/testlist');
      
    } catch (error: any) {
      console.error('Ошибка:', error);
      alert(`Ошибка: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если проверка бана ещё идёт
  if (checkingBan) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  // Если пользователь забанен - показываем сообщение
  if (isBanned) {
    return (
      <div className={styles.container}>
        <div className={styles.bannedMessage}>
          <div className={styles.bannedText}>Ваш аккаунт забанен</div>
          {banReason && <div className={styles.bannedReason}>Причина: {banReason}</div>}
          {banUntil && !banPermanent && (
            <div className={styles.bannedUntil}>До: {getBanUntilText()}</div>
          )}
          {banPermanent && <div className={styles.bannedPermanent}>Перманентно</div>}
          <button 
            className={styles.backButton}
            onClick={() => navigate('/')}
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>создание {isSurvey ? 'опроса' : 'теста'}</h2>
      <form onSubmit={handleSubmit} className={styles.createForm}>
        
        {/* Название */}
        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <span>введите название {!isSurvey && '(мин 6)'}</span>
            <span>максимум 50 символов</span>
          </div>
          <input 
            maxLength={50} 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            placeholder={`пример: ${isSurvey ? 'опрос' : 'тест'} iq`}
          />
        </div>

        {/* Описание */}
        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <span>введите описание (мин 10)</span>
            <span>максимум 200 символов</span>
          </div>
          <textarea 
            maxLength={200} 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder={`пример: ${isSurvey ? 'опрос' : 'тест'} iq`}
            rows={4}
          />
        </div>

        {/* Обложка */}
        <div className={styles.formGroup}>
          <span className={styles.groupLabel}>картинка для обложки {!isSurvey && '*'}</span>
          <div className={styles.coverUpload} onClick={() => document.getElementById('coverInput')?.click()}>
            {coverImagePreview ? (
              <img src={coverImagePreview} alt="cover" className={styles.imagePreview} />
            ) : (
              <div className={styles.plusIcon}>+</div>
            )}
            <input 
              id="coverInput" 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={e => {
                const file = e.target.files?.[0] || null;
                if (file) {
                  setCoverImage(file);
                  setCoverImagePreview(URL.createObjectURL(file));
                }
              }} 
            />
          </div>
        </div>

        {/* Видимость */}
        <div className={styles.formGroup}>
          <span className={styles.groupLabel}>видимость</span>
          <div className={styles.rowButtons}>
            <button 
              type="button" 
              className={visibility === 'public' ? styles.active : ''} 
              onClick={() => setVisibility('public')}
            >
              публичный
            </button>
            <button 
              type="button" 
              className={visibility === 'private' ? styles.active : ''} 
              onClick={() => setVisibility('private')}
            >
              приватный
            </button>
          </div>
        </div>

        {/* Только для теста */}
        {!isSurvey && (
          <>
            <div className={styles.formGroup}>
              <span className={styles.groupLabel}>ограничение времени (минуты)</span>
              <input 
                type="number" 
                value={timeLimit} 
                onChange={e => setTimeLimit(e.target.value)} 
                placeholder="например: 30" 
                disabled={noTimeLimit}
              />
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={noTimeLimit} onChange={e => setNoTimeLimit(e.target.checked)} />
                <span>без ограничения по времени</span>
              </label>
            </div>

            <div className={styles.formGroup}>
              <span className={styles.groupLabel}>проходной балл (%)</span>
              <input 
                type="number" 
                value={passingScore} 
                onChange={e => setPassingScore(e.target.value)} 
                placeholder="например: 70" 
                min="0" 
                max="100" 
              />
            </div>

            {/* НОВОЕ ПОЛЕ - ограничение попыток */}
            <div className={styles.formGroup}>
              <span className={styles.groupLabel}>ограничение попыток</span>
              <input 
                type="number" 
                value={attemptsLimit} 
                onChange={e => setAttemptsLimit(e.target.value)} 
                placeholder="например: 3" 
                disabled={noAttemptsLimit}
                min="1"
              />
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={noAttemptsLimit} onChange={e => setNoAttemptsLimit(e.target.checked)} />
                <span>без ограничения попыток</span>
              </label>
            </div>
          </>
        )}

        {/* Темы */}
        <div className={styles.formGroup}>
          <span className={styles.groupLabel}>выберите темы</span>
          <div className={styles.topicsGrid}>
            {topicsList.map(t => (
              <button 
                key={t} 
                type="button" 
                className={topics.includes(t) ? styles.active : ''} 
                onClick={() => toggleTopic(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Вопросы */}
        <div className={styles.formGroup}>
          <span className={styles.groupLabel}>
            вопросы * (минимум 4{!isSurvey && ', каждый с картинкой'})
          </span>
          <QuestionBuilder 
            questions={questions}
            onQuestionsChange={setQuestions}
            isSurvey={isSurvey}
            onModalOpenChange={setIsModalOpen}
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? `СОЗДАНИЕ ${isSurvey ? 'ОПРОСА' : 'ТЕСТА'}...` : `СОЗДАТЬ ${isSurvey ? 'ОПРОС' : 'ТЕСТ'}`}
        </button>
      </form>
    </div>
  );
};

export default CreateTestOrSurvey;