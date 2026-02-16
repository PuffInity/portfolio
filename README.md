# Puffinity Portfolio Platform

Повноцінний веб-проєкт портфоліо з публічним сайтом, адмін-панеллю, API, кешем, сесіями, завантаженням зображень, e-mail формою та метриками.

## 1. Про проєкт

`Puffinity Portfolio Platform` — це контентно-керований сайт для презентації послуг розробника з окремою адмін-панеллю.

Проєкт закриває задачі:
- публічне відображення головної сторінки та сторінок сервісів;
- централізоване редагування контенту через адмінку;
- керування FAQ, відгуками, контактами, hero/галереями;
- безпечний вхід адміністратора через сесії;
- зберігання та віддача зображень;
- базова спостережуваність через `/metrics`.

## 2. Для кого підійде

- фрилансеру або агенції для власного сайту-портфоліо;
- малим командам, яким потрібна проста CMS-подібна адмінка без важкого фреймворка;
- pet/commercial MVP, де важливі швидкий запуск і контроль контенту.

## 3. Архітектура

### Frontend
- Стек: `HTML + CSS + Vanilla JS + Bootstrap 5`.
- Працює через `Nginx`.
- Має публічні сторінки сервісів, головну, портфоліо, login, admin panel UI.

### Backend
- Стек: `Node.js + Express + TypeScript`.
- База: `PostgreSQL`.
- Кеш/сесії/анті-брутфорс: `Redis`.
- Валідація: `Zod`.
- Upload: `Multer` (до 2 МБ).
- Логи: `Winston`.
- Метрики: `prom-client` (`/metrics`).
- Міграції: власний раннер (`backend/migration`).

### Інфраструктура
- `Docker + Docker Compose`.
- Ролі контейнерів: `frontend (nginx)`, `backend (node)`, `postgres`, `redis`.

## 4. Основний функціонал

- Динамічна головна сторінка (`hero`, `services`, `pricing`, `about`, `testimonials`, `faq`, `contacts`).
- Окремі сторінки сервісів (`debug`, `turnkey`, `integrations`).
- Адмін-панель з авторизацією через сесію.
- Керування FAQ/відгуками/контактами.
- Керування галереями сервісів і ключовими фото.
- E-mail форма зворотного зв’язку.
- Роздача картинок через `/uploads`.
- Захищений доступ до `/adminPanel` через `auth_request` в Nginx.

## 5. API (коротко)

### Публічні
- `GET /main` — головна сторінка.
- `GET /main/:path` — дані сторінки сервісу.
- `POST /work/testimonials` — створення відгуку.
- `POST /work/send-letter` — відправка листа.

### Адмін-авторизація
- `POST /admin/adminLog` — вхід.
- `POST /admin/adminLogout` — вихід.
- `GET /admin/check-session` — перевірка сесії для фронтенду.
- `GET /admin/check-session-for-nginx` — перевірка сесії для Nginx.

### Адмін-контент
- `GET /panel/category`
- `POST /panel/main`
- `POST /panel/services`
- `POST /panel/contacts`
- `GET /panel/testimonials`
- `POST /panel/turnOnTestimonials`
- `POST /panel/turnOffTestimonials`
- `POST /panel/deleteTestimonials`
- `POST /panel/sendFaq`
- `POST /panel/createFaq`
- `POST /panel/editFaq`
- `POST /panel/deleteFaq`
- `POST /panel/onFaq`
- `POST /panel/offFaq`
- `POST /panel/sendGallery`
- `POST /panel/save-gallery1`
- `POST /panel/save-gallery2`
- `POST /panel/save-gallery3`
- `POST /panel/save-main-gallery`
- `POST /panel/save-aboutMe-gallery`

### Метрики
- `GET /metrics`

## 6. Структура репозиторію

```text
PortfolioProject/
├─ backend/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ routes/
│  ├─ module/
│  ├─ helpers/
│  ├─ middlewares/
│  ├─ migration/
│  ├─ config/
│  └─ validator/
├─ frontend/
│  ├─ pages/
│  ├─ css/
│  ├─ js/
│  ├─ nginx.conf
│  └─ Dockerfile
└─ docker-compose.yml
```

Також у репозиторії є гілки з декомпозицією по доменах (`backend/*`, `frontend/*`) та агреговані (`*/all-ready`).

## 7. Вимоги до середовища

- `Node.js >= 20`
- `npm >= 10`
- `Docker` + `Docker Compose` (рекомендовано)
- `PostgreSQL 16`
- `Redis 7`

## 8. Встановлення з GitHub

```bash
git clone <URL_РЕПОЗИТОРІЮ>
cd PortfolioProject
```

> Рекомендовано працювати з гілками, де повний стек вже зібраний (`backend/all-ready`, `frontend/all-ready`) або з вашою інтеграційною гілкою.

## 9. Налаштування `.env`

У backend використовуються щонайменше такі змінні:

### PostgreSQL
- `PG_HOST`
- `PG_PORT`
- `PG_DATABASE`
- `PG_USER`
- `PG_PASSWORD`
- `PG_SSL`
- `PG_POOL_MAX`
- `PG_POOL_MIN`
- `PG_CONN_TIMEOUT_MS`
- `PG_IDLE_TIMEOUT_MS`
- `PG_STATEMENT_TIMEOUT_MS`
- `PG_QUERY_TIMEOUT_MS`

### Redis
- `REDIS_SESSION_HOST`
- `REDIS_SESSION_PORT`
- `REDIS_SESSION_DB`
- `REDIS_SESSION_TTL`
- `REDIS_SESSION_TOUCH`
- `REDIS_CACHE_HOST`
- `REDIS_CACHE_PORT`
- `REDIS_CACHE_DB`
- `REDIS_CACHE_TTL`
- `REDIS_CACHE_MAX_SIZE`
- `REDIS_CACHE_COMPRESS`
- `REDIS_PASSWORD`

### SMTP / Mail
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_POOL`
- `SMTP_POOL_MAX_CONNECTIONS`
- `SMTP_POOL_MAX_MESSAGES`
- `SMTP_KEEP_ALIVE`
- `SMTP_CONNECTION_TIMEOUT_MS`
- `SMTP_GREETING_TIMEOUT_MS`
- `SMTP_SOCKET_TIMEOUT_MS`
- `SMTP_TLS_REJECT_UNAUTHORIZED`
- `MAIL_FROM`
- `RATE_LIMIT`

### Security / App
- `SESSION_SECRET`
- `CORS_ORIGINS`
- `NODE_ENV`
- `PORT`
- `DOCKER`

## 10. Запуск (рекомендовано: Docker)

```bash
docker compose up --build -d
```

Після старту:
- Frontend: `http://localhost:8080/main`
- Login: `http://localhost:8080/login`
- Admin Panel: `http://localhost:8080/adminPanel`
- Backend API: `http://localhost:3000`
- Metrics: `http://localhost:3000/metrics`

## 11. Міграції та адміністратор

Запускати з каталогу `backend`:

```bash
npm install
npm run build
npm run migrate
```

Створити адміністратора:

```bash
npm run create -- <login> <password>
```

Додатково:

```bash
npm run ifExist -- <login>
npm run delete -- <login>
npm run status
npm run rollback
```

## 12. Локальний запуск без Docker (опційно)

1. Підняти окремо `PostgreSQL` і `Redis`.
2. Налаштувати `backend/.env.local`.
3. Запустити backend:

```bash
cd backend
npm install
npm run start
```

4. Віддати frontend через будь-який статичний сервер (наприклад nginx або `npx serve`) на порт `8080`.

## 13. Upload обмеження

Для галерей/фото дозволені:
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

Ліміт файлу: `2MB` (Multer).

## 14. Безпека

- `helmet`, `cors`, `hpp`, `rate-limit`.
- Сесії в Redis (`connect-redis`).
- Захист адмінки через Nginx `auth_request`.
- Валідація payload через `zod`.

## 15. Типовий flow роботи контент-менеджера

1. Логін через `/login`.
2. Перехід в `/adminPanel`.
3. Редагування потрібної секції.
4. Збереження даних або окремих галерейних блоків.
5. Перевірка змін на публічних сторінках.

## 16. Troubleshooting

- `500` при `docker compose build` (auth.docker.io): перевірити мережу/VPN та зробити повтор збірки.
- Якщо `/adminPanel` перекидає на `/login`: перевірити cookie/session, `SESSION_SECRET`, Redis і `/_auth_admin`.
- Якщо не грузяться картинки: перевірити volume `upload-images` і доступність `/uploads/*`.
- Якщо не приходять листи: перевірити SMTP конфіг (`SMTP_*`) і логи backend.

## 17. Ліцензія

MIT License

---

# English Version

## 1. About the Project

`Puffinity Portfolio Platform` is a full-stack portfolio website with a public frontend, admin panel, API, caching, session-based authentication, image uploads, contact e-mail flow, and metrics.

The project is designed to:
- present services and portfolio pages publicly;
- let admins manage content from a dedicated admin panel;
- support FAQ, testimonials, contacts, hero blocks, and galleries;
- provide secure admin login/logout with Redis-backed sessions;
- serve uploaded images through Nginx;
- expose operational metrics via `/metrics`.

## 2. Important Language Note

- The entire project is written in **Ukrainian**.
- All code comments are written in **Ukrainian**.
- UI labels and domain terminology are Ukrainian-first.

## 3. Tech Stack

- Frontend: `HTML`, `CSS`, `Vanilla JS`, `Bootstrap 5`, `Nginx`
- Backend: `Node.js`, `Express`, `TypeScript`
- Database: `PostgreSQL`
- Cache/Sessions: `Redis`
- Validation: `Zod`
- Uploads: `Multer`
- Logging: `Winston`
- Metrics: `prom-client`
- Orchestration: `Docker Compose`

## 4. Quick Start

```bash
git clone <REPOSITORY_URL>
cd PortfolioProject
docker compose up --build -d
```

Main URLs:
- Frontend: `http://localhost:8080/main`
- Login: `http://localhost:8080/login`
- Admin panel: `http://localhost:8080/adminPanel`
- Backend API: `http://localhost:3000`
- Metrics: `http://localhost:3000/metrics`

## 5. Admin Auth Contract

- `POST /admin/adminLog` — login
- `POST /admin/adminLogout` — logout
- `GET /admin/check-session` — frontend session check
- `GET /admin/check-session-for-nginx` — Nginx auth check for protected admin route

## 6. Upload Constraints

Allowed image MIME types:
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

Max file size: `2MB`.
