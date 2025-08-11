# Todo Backend API

A robust backend API for a Todo application built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL (using Neon as a cloud database). Authentication is handled via JWT, and logging is managed with Winston.

> **Note:** This project uses [Neon](https://neon.tech/) for scalable, serverless PostgreSQL hosting.

---

## Features

- **User Authentication:** Register and login with secure password hashing and JWT token issuance.
- **Todo Management:** Create, read, update, and delete todos for authenticated users.
- **Authorization:** All todo routes are protected; users can only access their own data.
- **Input Validation:** Ensures valid data for todos and user actions.
- **Error Handling:** Consistent error responses and a catch-all 404 handler.
- **Logging:** All important actions and errors are logged using Winston (to console and files).
- **Rate Limiting:** Prevents abuse of API endpoints (enabled via middleware).
- **Not Found Handler:** Returns a JSON 404 for undefined routes.
- **Modular Structure:** Clean separation of controllers, middleware, routes, and utilities.
- **Prisma ORM:** Type-safe database access and migrations.
- **Unit Testing:** All core functionalities (login, register, CRUD for todos, not found handler) are covered by Jest test cases for reliability.
- **Environment Configuration:** Uses dotenv for secure environment variable management.
- **Cloud Database:** Neon is used for scalable, serverless PostgreSQL hosting.

---

## Tech Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL (Neon cloud database)
- JWT (jsonwebtoken)
- Winston (logging)
- Jest (testing)

---

## Project Structure

```
├── prisma/
│   └── schema.prisma         # Prisma schema
├── src/
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth, logger, rate limiter
│   ├── routes/               # Express routers
│   ├── utils/                # Logger utility
│   └── generated/prisma/     # Prisma client (auto-generated)
├── logs/                     # Winston log files
├── package.json
├── tsconfig.json
├── jest.config.js
```

---

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/Haseeb7689/Todo-Backend.git
cd Todo-Backend
```

### 2. Install dependencies

```sh
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```
DATABASE_URL=postgresql://<NEON_USER>:<NEON_PASSWORD>@<NEON_HOST>/<NEON_DB>?sslmode=require
JWT_SECRET=your_jwt_secret
```

### 4. Set up the database

- Update `prisma/schema.prisma` as needed.
- Run Prisma migrations:

```sh
npx prisma migrate dev --name init
```

- Generate Prisma client:

```sh
npx prisma generate
```

### 5. Start the server

```sh
npm run dev
```

---

## API Endpoints

### Auth

- `POST /register` — Register a new user
- `POST /login` — Login and get JWT token

### Todos (Protected)

- `GET /todos` — Get all todos for the authenticated user
- `POST /todo` — Create a new todo
- `PATCH /update/:id` — Update a todo
- `DELETE /delete/:id` — Delete a todo

### Not Found

- Any undefined route returns a 404 JSON response

---

## Logging

- Logs are saved in `logs/error.log` and `logs/combined.log` using Winston.

---

## Testing

All major functionalities are covered by unit tests using Jest. The following test files are included:

- `src/test/register.test.ts` — User registration
- `src/test/login.test.ts` — User login
- `src/test/getTodo.test.ts` — Get todos
- `src/test/updateTodo.test.ts` — Update todo
- `src/test/deleteTodo.test.ts` — Delete todo
- `src/test/postTodo.test.ts` — Add todo
- `src/test/handleNotFound.test.ts` — Undefined route
- Each test file covers both positive and negative scenarios, including:

- Valid and invalid input
- Authorization and authentication checks
- Error handling and edge cases
- Database operation mocks

Run all tests with:

```sh
npm test
```

Test coverage ensures reliability for all endpoints and core logic.

---

## License

MIT
