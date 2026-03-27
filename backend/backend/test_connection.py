import psycopg2
import sys

# Параметры подключения
params = {
    'dbname': 'diplom_db',
    'user': 'diplom_users',
    'password': '123456',
    'host': '127.0.0.1',
    'port': '5432',
}

# Выводим параметры для проверки
print("Параметры подключения:")
for key, value in params.items():
    print(f"  {key}: {value}")
    # Выводим каждый символ, чтобы найти скрытые
    if key == 'password':
        print(f"    Длина: {len(value)}")
        for i, ch in enumerate(value):
            print(f"    Символ {i}: '{ch}' (ord: {ord(ch)})")

print("\nПопытка подключения...")

try:
    conn = psycopg2.connect(**params)
    print("✅ Подключение успешно!")
    conn.close()
except Exception as e:
    print(f"❌ Ошибка: {e}")
    print(f"Тип ошибки: {type(e).__name__}")
    
    # Проверяем, есть ли в пароле скрытые символы
    if 'password' in str(e):
        print("\nПроблема в пароле!")
        password = '123456'
        print(f"Пароль в коде: '{password}'")
        print(f"Длина: {len(password)}")
        for i, ch in enumerate(password):
            print(f"Символ {i}: '{ch}' (код: {ord(ch)})")