'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

export function useSocket(): Socket {
  const socketRef = useRef<Socket | null>(null);

  if (!socketRef.current) {
    if (!globalSocket || !globalSocket.connected) {
      globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? '', {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    socketRef.current = globalSocket;
  }

  useEffect(() => {
    return () => {
      // Don't disconnect on unmount — keep singleton alive
    };
  }, []);

  return socketRef.current;
}
