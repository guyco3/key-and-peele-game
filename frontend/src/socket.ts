import { io, Socket } from 'socket.io-client';

// Use Vite env variable or fallback to localhost
const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
export const socket: Socket = io(URL, { autoConnect: false });
