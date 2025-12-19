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
  
  // 🛡️ The Guard: Prevents re-identification during the unmounting/leaving process
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
      // 🛡️ Only auto-reconnect if we aren't intentionally trying to leave
      if (leavingRef.current) return;

      const savedName = localStorage.getItem('kp_username');
      const savedRoom = localStorage.getItem('kp_room_code');
      if (savedName && savedRoom) {
        socket.emit('identify', { clientId, name: savedName, roomCode: savedRoom });
      }
    });

    socket.on('init_sync', ({ serverTime }: { serverTime: number }) => {
      setServerOffset(serverTime - Date.now());
    });

    socket.on('game_update', (state: GameState) => {
        if (leavingRef.current) return;

        // 🛡️ CRITICAL FIX: Only update if the new state actually exists.
        // This prevents the "Flash of Null" that kills the VideoPlayer instance.
        if (state) {
            setGameState(state);
            if (state.roomCode) {
            setRoomCode(state.roomCode);
            localStorage.setItem('kp_room_code', state.roomCode);
            }
        }
    });

    socket.on('error', (msg: string) => {
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
      leavingRef.current = false; // Reset guard in case they previously left
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

  const identify = (name: string, code: string) => {
    leavingRef.current = false; // Reset guard
    const upperCode = code.toUpperCase();
    setRoomCode(upperCode);
    localStorage.setItem('kp_username', name);
    localStorage.setItem('kp_room_code', upperCode);
    socketRef.current?.emit('identify', { clientId, name, roomCode: upperCode });
  };

  const leaveGame = () => {
    // 1. Instantly flip the guard to ignore any incoming 'game_update' messages
    leavingRef.current = true;

    // 2. Notify server
    if (socketRef.current && roomCode) {
      socketRef.current.emit('leave_game', { clientId, roomCode });
    }
    
    // 3. Wipe local state and storage
    handleCleanState();

    // 4. (Optional) Small delay to ensure all re-renders finish before allowing new joins
    setTimeout(() => {
        leavingRef.current = false;
    }, 500);
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