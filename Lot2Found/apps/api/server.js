require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected via WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start Database & Server
async function startServer() {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`\nServer running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Critical Startup Error:', error);
    process.exit(1);
  }
}

startServer();

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Closing resources...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
      process.exit(1);
    }
    console.log('HTTP server closed.');

    mongoose.connection.close(false).then(() => {
      console.log('MongoDb connection closed.');
      process.exit(0);
    }).catch((err) => {
      console.error('Error closing MongoDb:', err);
      process.exit(1);
    });
  });

  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); 
});
