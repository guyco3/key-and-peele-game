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
  leaveGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(localStorage.getItem('kp_room_code'));
  const [serverOffset, setServerOffset] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Initialize or Retrieve Persistent Client ID
  const [clientId] = useState(() => {
    const saved = localStorage.getItem('kp_client_id');
    if (saved) return saved;
    const newId = uuidv4();
    localStorage.setItem('kp_client_id', newId);
    return newId;
  });

  useEffect(() => {
    // Connect to Backend
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      // Auto-reconnect logic: If we have session data, resume immediately
      const savedName = localStorage.getItem('kp_username');
      const savedRoom = localStorage.getItem('kp_room_code');
      if (savedName && savedRoom) {
        socket.emit('identify', { clientId, name: savedName, roomCode: savedRoom });
      }
    });

    // Handle Time Sync
    socket.on('init_sync', ({ serverTime }: { serverTime: number }) => {
      setServerOffset(serverTime - Date.now());
    });

    // Handle State Updates
    socket.on('game_update', (state: GameState) => {
      setGameState(state);
      if (state.roomCode) {
         setRoomCode(state.roomCode);
         localStorage.setItem('kp_room_code', state.roomCode);
      }
    });

    // Handle Errors (e.g., room expired or closed)
    socket.on('error', (msg: string) => {
        if (msg === 'Game not found' || msg === 'Host closed the room') {
            handleCleanState();
        }
        alert(msg);
    });

    return () => { socket.disconnect(); };
  }, [clientId]);

  /**
   * Internal Helper to wipe local session
   */
  const handleCleanState = () => {
    localStorage.removeItem('kp_room_code');
    setGameState(null);
    setRoomCode(null);
  };

  /**
   * Action: Create a new room
   */
  const createRoom = async (hostName: string, config: any) => {
    try {
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

  /**
   * Action: Identify as a player in a room
   */
  const identify = (name: string, code: string) => {
    const upperCode = code.toUpperCase();
    setRoomCode(upperCode);
    localStorage.setItem('kp_username', name);
    localStorage.setItem('kp_room_code', upperCode);
    socketRef.current?.emit('identify', { clientId, name, roomCode: upperCode });
  };

  /**
   * Action: Intentional Leave
   */
  const leaveGame = () => {
    if (socketRef.current && roomCode) {
      socketRef.current.emit('leave_game', { clientId, roomCode });
    }
    handleCleanState();
  };

  return (
    <GameContext.Provider value={{ 
      socket: socketRef.current, 
      gameState, 
      clientId, 
      serverOffset, 
      roomCode, 
      identify, 
      createRoom,
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