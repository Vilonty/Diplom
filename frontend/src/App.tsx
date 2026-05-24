import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './api/auth';
import Home from './pages/home/Home';
import Register from './pages/register/Register';
import Login from './pages/login/Login';
import Profile from './pages/profile/Profile';
import Create from './pages/create/Create';
import CreateMain from './pages/create/CreateMain';
import TestPage from './pages/test/testpage/TestPage';
import AdminPanel from './pages/admin/AdminPanel';
import TestList from './pages/testlist/TestList';
import TestResult from './pages/test/result/TestResultPage';
import TestStastPage from './pages/teststatspage/TestStatsPage';
import QuestionRouter from './pages/test/questions/QuestionRouter';
import './App.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/profile/:identifier" element={<Profile />} />

                {/* Страница выбора типа */}
                <Route path="/create" element={<PrivateRoute><Create /></PrivateRoute>} />
                
                {/* Страница создания теста/опроса с параметром типа */}
                <Route path="/create/:type" element={<PrivateRoute><CreateMain /></PrivateRoute>} />

                <Route path="/test/:testId" element={<TestPage />} />
                <Route path="/survey/:testId" element={<TestPage />} />
                <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
                <Route path="/testlist" element={<TestList />} />
                <Route path="/test/:testId/result" element={<TestResult />} />
                <Route path="/test/:testId/question/:questionIndex" element={<QuestionRouter />} />

                <Route path="/test/:testId/stats" element={<TestStastPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;