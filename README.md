# Key & Peele Guessing Game – Monorepo

This monorepo contains the full-stack implementation for the real-time YouTube audio snippet guessing game.

## Structure

- `backend/` – Node.js + Socket.IO server
- `frontend/` – React SPA client
- `shared/` – Shared TypeScript types and data

## Getting Started

1. **Install dependencies:**
    ```sh
    npm install
    ```
2. **Run in development:**
    ```sh
    npm run dev
    ```
    This starts both backend and frontend in watch mode.

3. **Build frontend for production:**
    ```sh
    cd frontend && npm run build
    ```

## Project Spec
See below for the full design and event specification.

---

# key-and-peele-game
try to beat your friends on who the biggest key and peele fan is!
