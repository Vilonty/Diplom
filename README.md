По 3 лабораторной ссылка на фигму - https://www.figma.com/design/rjWR6ocpSrm27gitUydsbE/Untitled?node-id=0-1&t=C2KC5cDUR3dANX3i-1

Веб-приложение для создание и прохождения онлайн тестов

Тема: Разработка веб-приложения для прохождения онлайн-тестов

Студент: Котиков Егор Владиславович

Руководитель: Воробьёв Константин Владимирович

Описание
Веб-платформа для создания и прохождения пользовательских тестов. Неавторизованные пользователи могут просматривать и проходить открытые тесты. Авторизованные пользователи могут редактировать профиль, создавать тесты, просматривать статистику прохождений, оставлять комментарии и отправлять жалобы. Модераторы могут удалять контент и ограничивать доступ пользователей.

Стек технологий

Backend: Python 3.10+, Django, Django REST Framework

Frontend: TypeScript 5.0+, React, React Router, Axios

База данных: PostgreSQL

Инструменты: Git, GitHub, pip + requirements.txt, Vite, Docker

Архитектура

Client-Server архитектура. Frontend (React) общается с Backend (Django) через HTTP-запросы в формате JSON.

Структура проекта

/backend — Django проект

/frontend — React + Vite проект

Запуск

Backend: cd backend → python -m venv venv → pip install -r requirements.txt → python manage.py runserver

Frontend: cd frontend → npm install → npm run dev
