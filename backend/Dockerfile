# ===== [1] BUILD STAGE =====
# Беремо Node для збірки (компіляція TS -> JS, встановлення dev-залежностей)
FROM node:20-alpine AS build

# [2] Робоча папка всередині контейнера
WORKDIR /app

# [3] Спочатку копіюємо тільки package-файли, щоб Docker кешував npm install
COPY package*.json ./

# [4] Ставимо залежності (включно з dev), щоб зібрати TypeScript
RUN npm ci

# [5] Копіюємо весь код
COPY . .

# [6] Збірка (tsc -> dist)
RUN npm run build


# ===== [7] RUNTIME STAGE =====
# Другий етап: мінімальний контейнер тільки для запуску (без dev-залежностей)
FROM node:20-alpine

WORKDIR /app

# [8] Встановимо тільки production-залежності
COPY package*.json ./
RUN npm ci --omit=dev

# [9] Копіюємо зібраний dist з build-етапу
COPY --from=build /app/dist ./dist

# (опційно) якщо треба ще щось з білду: наприклад public/, views/, migrations/
# COPY --from=build /app/public ./public

# [10] Інформаційно: порт, який слухає твій сервер
EXPOSE 3000

# [11] Запуск сервера
CMD ["node", "dist/server.js"]