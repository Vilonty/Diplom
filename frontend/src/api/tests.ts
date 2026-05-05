import api from './axios';

// ============ ЗАГРУЗКА КАРТИНОК НА СЕРВЕР ============
export const uploadImage = async (file: File, type: 'question' | 'test' = 'question'): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    const response = await api.post('/upload/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data.url;
};

export const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// ============ ПУЛЫ ============
export const getPools = async () => {
    const response = await api.get('/pools/');
    return response.data;
};

export const getPool = async (id: number) => {
    const response = await api.get(`/pools/${id}/`);
    return response.data;
};

export const createPool = async (data: { name: string; description: string }) => {
    const response = await api.post('/pools/', data);
    return response.data;
};

export const addQuestionToPool = async (poolId: number, questionId: number) => {
    const response = await api.post(`/pools/${poolId}/questions/`, { question_id: questionId });
    return response.data;
};

// ============ ВОПРОСЫ ============
export const createQuestion = async (questionData: any) => {
    const response = await api.post('/questions/', questionData);
    return response.data;
};

export const createTest = async (testData: any) => {
    const response = await api.post('/tests/', testData);
    return response.data;
};

export const createQuestionsBatch = async (questionsData: any[]) => {
    const response = await api.post('/questions/batch/', { questions: questionsData });
    return response.data;
};

// ============ ДЛЯ ВЫВОДА ============
export const getAllTests = async () => {
    const response = await api.get('/tests/');
    return response.data;
};

export const getTests = async () => {
    const all = await getAllTests();
    return all.filter((item: any) => !item.is_survey);
};

export const getSurveys = async () => {
    const all = await getAllTests();
    return all.filter((item: any) => item.is_survey);
};

export const getTestDetails = async (testId: number) => {
    const response = await api.get(`/tests/${testId}/`);
    return response.data;
};

export const getRecentTests = async (limit: number = 8) => {
    const tests = await getTests();
    return tests.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit);
};

export const getPopularTests = async (limit: number = 8) => {
    const tests = await getTests();
    return tests.sort((a: any, b: any) => 
        (b.attempts_count || 0) - (a.attempts_count || 0)
    ).slice(0, limit);
};

export const getRecentSurveys = async (limit: number = 8) => {
    const surveys = await getSurveys();
    return surveys.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit);
};

export const getTopUsers = async (limit: number = 10) => {
    const response = await api.get('/users/top/');
    return response.data.slice(0, limit);
};

// ============ ДЛЯ ПРОХОЖДЕНИЯ ТЕСТА ============
export const startTest = async (testId: number) => {
    const response = await api.post(`/tests/${testId}/start/`);
    return response.data;
};

export const getQuestion = async (testId: number, questionIndex: number) => {
    const response = await api.get(`/tests/${testId}/question/${questionIndex}/`);
    return response.data;
};

export const submitAnswer = async (attemptId: number, questionId: number, answer: any) => {
    const response = await api.post(`/attempts/${attemptId}/answer/${questionId}/`, { answer });
    return response.data;
};

export const finishTest = async (attemptId: number) => {
    const response = await api.post(`/attempts/${attemptId}/finish/`);
    return response.data;
};

export const rateTest = async (testId: number, rating: number) => {
    const response = await api.post(`/tests/${testId}/rate/`, { rating });
    return response.data;
};

export const getAttemptResults = async (attemptId: number) => {
    const response = await api.get(`/attempts/${attemptId}/`);
    return response.data;
};

// ============ ДЛЯ КОММЕНТАРИЕВ ============
export const getComments = async (testId: number) => {
    const response = await api.get(`/tests/${testId}/comments/`);
    return response.data;
};

export const addComment = async (testId: number, text: string) => {
    const response = await api.post(`/tests/${testId}/comments/`, { text });
    return response.data;
};

export const submitReport = async (data: {
    target_type: 'test' | 'comment';
    target_id: number;
    reason: string;
}) => {
    const response = await api.post('/reports/', data);
    return response.data;
};

export const getTestRating = async (testId: number) => {
    const response = await api.get(`/tests/${testId}/rate/`);
    return response.data;
};