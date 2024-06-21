import { createServer } from 'http'
import app from './src/app'
import socketio from './src/sockets/'
import { logger } from './src/sockets/logger';

// Socket communication
const server = createServer(app);
socketio(server);

/**
 * start Express server
 */
server.listen(app.get('port'), () => {
  logger.info('  App is running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
})

export default server;