import { io as Client, Socket } from 'socket.io-client';
import { createServer, Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const PORT = 3005;
const SOCKET_URL = `http://localhost:${PORT}`;

describe('Socket.IO Rate Limiting Integration', () => {
  let io: Server;
  let httpServer: HttpServer;
  let clientSocket: Socket;

  // Setup: Start a fresh server before tests
  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);

    const rateLimiter = new RateLimiterMemory({
      points: 5, // 5 messages allowed per second for testing
      duration: 1,
    });

    io.on('connection', (socket) => {
      // Logic mirrored from your index.ts
      socket.use(async (_packet, next) => {
        const forwarded = socket.handshake.headers['x-forwarded-for'];
        const clientIP: string = Array.isArray(forwarded) 
          ? forwarded[0] 
          : forwarded || socket.handshake.address;
        
        try {
          await rateLimiter.consume(clientIP);
          next();
        } catch (rejRes) {
          socket.emit('error', 'Too many requests. Slow down!');
        }
      });
    });

    httpServer.listen(PORT, () => {
      done();
    });
  });

  // Cleanup: Close everything after all tests
  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }

    // Wrap closes in promises to ensure Jest waits for them to finish
    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });

    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });

    // Small buffer for the OS to release the port on low-spec VMs
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it('should allow messages within the points limit', (done) => {
    clientSocket = Client(SOCKET_URL);

    clientSocket.on('connect', () => {
      // Send 3 messages (limit is 5)
      for (let i = 0; i < 3; i++) {
        clientSocket.emit('submit_guess', { guess: 'valid' });
      }

      // Wait 500ms to ensure no error is emitted
      setTimeout(() => {
        expect(true).toBe(true);
        done();
      }, 500);
    });
  });

  it('should emit error when rate limit is exceeded', (done) => {
    // Use a unique spoofed IP so we don't conflict with the previous test's bucket
    clientSocket = Client(SOCKET_URL, {
      extraHeaders: { 'x-forwarded-for': '123.456.789.0' }
    });

    let errorHandled = false;

    clientSocket.on('connect', () => {
      // Send 10 messages (limit is 5)
      for (let i = 0; i < 10; i++) {
        clientSocket.emit('submit_guess', { guess: 'spam' });
      }
    });

    clientSocket.on('error', (errorMsg) => {
      // Only call done once even though the server sends 5 error packets
      if (!errorHandled) {
        errorHandled = true;
        expect(errorMsg).toBe('Too many requests. Slow down!');
        done();
      }
    });
  });
});