import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import log from 'electron-log';
import packageJson from '../../package.json';

class ApiServer {
    constructor(port) {
        this.port = port;
        this.app = express();
        this.server = null;
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use((req, res, next) => {
            log.log(`API Request: ${req.method} ${req.url}`);
            next();
        });
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            log.log(`API server running on port ${this.port}`);
            log.log(`API server URL: http://localhost:${this.port}`);
        });

        this.server.on('error', (err) => {
            log.error(`Failed to start API server: ${err.message}`);
        });
        
        return this.port;
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                log.log('API server stopped');
            });
        }
    }

    // --------------------------------------------------------------------
    // API Endpoints
    // --------------------------------------------------------------------
    setupRoutes() {
        // API status
        this.app.get('/info', (req, res) => {
            res.json({ appName: packageJson.name});
        });

        // Add more API endpoints here
    }
}

export default ApiServer;