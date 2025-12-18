import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { GameState } from '../../../shared';

interface GameContextType {
  socket: Socket | null;
  gameState: GameState | null;
  clientId: string;
  serverOffset: number;
  roomCode: string | null;
  identify: (name: string, code: string) => void;
  createRoom: (name: string, config: any) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const [clientId] = useState(() => {
    const saved = localStorage.getItem('kp_client_id');
    if (saved) return saved;
    const newId = uuidv4();
    localStorage.setItem('kp_client_id', newId);
    return newId;
  });

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('init_sync', ({ serverTime }: { serverTime: number }) => {
      setServerOffset(serverTime - Date.now());
    });

    socket.on('game_update', (state: GameState) => {
      setGameState(state);
    });

    socket.on('error', (msg: string) => alert(msg));

    return () => { socket.disconnect(); };
  }, []);

  const createRoom = async (hostName: string, config: any) => {
    const res = await fetch('http://localhost:3001/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName, hostClientId: clientId, config })
    });
    const data = await res.json();
    setRoomCode(data.roomCode);
    identify(hostName, data.roomCode);
  };

  const identify = (name: string, code: string) => {
    setRoomCode(code.toUpperCase());
    socketRef.current?.emit('identify', { clientId, name, roomCode: code.toUpperCase() });
  };

  return (
    <GameContext.Provider value={{ 
      socket: socketRef.current, gameState, clientId, serverOffset, roomCode, identify, createRoom 
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};