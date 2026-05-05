// Ответы
export interface Answer {
  id: number;
  text: string;
  is_correct: boolean;
  order_index: number;
}

export interface AnswerCreate {
  text: string;
  is_correct: boolean;
  order_index: number;
}

// Вопросы
export interface Question {
  id: number;
  text: string;
  author: number;
  author_info?: {
    id: number;
    login: string;
    full_name: string;
  };
  difficulty: number;
  explanation: string;
  usage_count: number;
  answers: Answer[];
  created_at: string;
  updated_at: string;
}

export interface QuestionCreate {
  text: string;
  difficulty: number;
  explanation: string;
  answers: AnswerCreate[];
}

// Пулы
export interface Pool {
  id: number;
  name: string;
  description: string;
  user: number;
  user_info?: {
    id: number;
    login: string;
    full_name: string;
  };
  questions_count: number;
  questions?: Question[];
  created_at: string;
  updated_at: string;
}

export interface PoolCreate {
  name: string;
  description: string;
}

// Тесты и опросы
export interface Test {
  id: number;
  title: string;
  description: string;
  author: number;
  author_info?: {
    id: number;
    login: string;
    full_name: string;
  };
  is_open: boolean;
  is_survey: boolean;
  time_limit: number | null;
  passing_score: number;
  attempts_limit: number;
  image: string | null;
  topics: string[];
  questions_count: number;
  questions?: Question[];
  created_at: string;
  updated_at: string;
}

export interface TestCreate {
  title: string;
  description: string;
  is_open: boolean;
  is_survey: boolean;
  time_limit: number | null;
  passing_score: number;
  attempts_limit: number;
  image: string | null;
  topics: string[];
  question_ids: number[];
}