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
  isSearching: boolean;
  quickPlayError: string | null; // 👈 NEW
  setQuickPlayError: (msg: string | null) => void; // 👈 NEW
  identify: (name: string, code: string) => void;
  createRoom: (name: string, config: any) => Promise<void>;
  quickPlay: (name: string) => void;
  leaveGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(localStorage.getItem('kp_room_code'));
  const [serverOffset, setServerOffset] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [quickPlayError, setQuickPlayError] = useState<string | null>(null); //
  const socketRef = useRef<Socket | null>(null);
  const leavingRef = useRef(false);

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

    socket.on('connect', () => {
      if (leavingRef.current) return;
      const savedName = localStorage.getItem('kp_username');
      const savedRoom = localStorage.getItem('kp_room_code');
      if (savedName && savedRoom) {
        socket.emit('identify', { clientId, name: savedName, roomCode: savedRoom });
      }
    });

    socket.on('quick_play_found', ({ roomCode }: { roomCode: string }) => {
      setIsSearching(false);
      setQuickPlayError(null); // Clear errors on success
      const savedName = localStorage.getItem('kp_username');
      if (savedName) {
        identify(savedName, roomCode);
      }
    });

    socket.on('init_sync', ({ serverTime }: { serverTime: number }) => {
      setServerOffset(serverTime - Date.now());
    });

    socket.on('game_update', (state: GameState) => {
      if (leavingRef.current) return;
      if (state) {
        setGameState(state);
        if (state.roomCode) {
          setRoomCode(state.roomCode);
          localStorage.setItem('kp_room_code', state.roomCode);
        }
      }
    });

    socket.on('error', (msg: string) => {
      if (msg.includes('No public games available')) {
        setIsSearching(false);
        setQuickPlayError('No public rooms available right now. Why not host one?'); //
        return;
      }
      if (msg === 'Game not found' || msg === 'Host closed the room') {
        handleCleanState();
      }
      alert(msg);
    });

    return () => { socket.disconnect(); };
  }, [clientId]);

  const handleCleanState = () => {
    localStorage.removeItem('kp_room_code');
    setGameState(null);
    setRoomCode(null);
  };

  const createRoom = async (hostName: string, config: any) => {
    try {
      leavingRef.current = false;
      const res = await fetch('http://localhost:3001/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName, hostClientId: clientId, config })
      });
      const data = await res.json();
      identify(hostName, data.roomCode);
    } catch (err) {
      console.error("Failed to create room:", err);
      alert("Server connection failed");
    }
  };

  const quickPlay = (name: string) => {
    setIsSearching(true);
    setQuickPlayError(null); // Reset error state when starting search
    leavingRef.current = false;
    localStorage.setItem('kp_username', name);
    socketRef.current?.emit('quick_play', { clientId, name });
  };

  const identify = (name: string, code: string) => {
    leavingRef.current = false;
    const upperCode = code.toUpperCase();
    setRoomCode(upperCode);
    localStorage.setItem('kp_username', name);
    localStorage.setItem('kp_room_code', upperCode);
    socketRef.current?.emit('identify', { clientId, name, roomCode: upperCode });
  };

  const leaveGame = () => {
    leavingRef.current = true;
    if (socketRef.current && roomCode) {
      socketRef.current.emit('leave_game', { clientId, roomCode });
    }
    handleCleanState();
    setTimeout(() => { leavingRef.current = false; }, 500);
  };

  return (
    <GameContext.Provider value={{ 
      socket: socketRef.current, 
      gameState, 
      clientId, 
      serverOffset, 
      roomCode, 
      isSearching,
      quickPlayError, //
      setQuickPlayError, //
      identify, 
      createRoom,
      quickPlay,
      leaveGame 
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