import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import os from 'os';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    // Filter out static asset noise logs if needed
    if (!req.url.startsWith('/assets')) {
        console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    }
    next();
});

// --- Database Setup ---
// In Electron, we cannot write to the application directory (it's read-only in Program Files).
// We check if a custom user data path is provided (via env from electron/main.js), otherwise use local folder.
const appDataPath = process.env.USER_DATA_PATH || __dirname;
const dbDir = path.join(appDataPath, 'Database');

if (!fs.existsSync(dbDir)){
    try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('Created Database directory at:', dbDir);
    } catch (e) {
        console.error('Error creating Database directory:', e);
    }
}

const dbPath = path.join(dbDir, 'nre_tasks.db');
let db;

try {
    db = new Database(dbPath);
    console.log('Connected to SQLite database at ' + dbPath);
    // Enable WAL mode for better concurrency and performance
    db.pragma('journal_mode = WAL');
} catch (err) {
    console.error('DB Connection Error:', err.message);
}

// Initialize Table
try {
    db.exec(`CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT,
        owner TEXT,
        deviceType TEXT,
        startDate TEXT,
        endDate TEXT,
        nreNumber TEXT,
        status TEXT,
        platform TEXT,
        androidVersion TEXT,
        taskType TEXT,
        workHours REAL,
        content TEXT,
        createdAt INTEGER
    )`);
} catch (err) {
    console.error("Error creating table:", err);
}

// --- API Routes ---

// Get Network Info (LAN IP)
app.get('/api/network-info', (req, res) => {
    const interfaces = os.networkInterfaces();
    let ipAddress = '127.0.0.1';

    // Iterate over interfaces to find a non-internal IPv4 address
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if ('IPv4' !== iface.family || iface.internal) {
                continue;
            }
            ipAddress = iface.address;
            break;
        }
        if (ipAddress !== '127.0.0.1') break;
    }

    res.json({ ip: ipAddress, port: PORT });
});

app.get('/api/tasks', (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM tasks ORDER BY createdAt DESC").all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.post('/api/tasks', (req, res) => {
    const t = req.body;
    try {
        const sql = `INSERT INTO tasks (id, name, owner, deviceType, startDate, endDate, nreNumber, status, platform, androidVersion, taskType, workHours, content, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        const stmt = db.prepare(sql);
        stmt.run(t.id, t.name, t.owner, t.deviceType, t.startDate, t.endDate, t.nreNumber, t.status, t.platform, t.androidVersion, t.taskType, t.workHours, t.content, t.createdAt);
        res.json(t);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.put('/api/tasks/:id', (req, res) => {
    const t = req.body;
    const { id } = req.params;
    try {
        const sql = `UPDATE tasks SET name=?, owner=?, deviceType=?, startDate=?, endDate=?, nreNumber=?, status=?, platform=?, androidVersion=?, taskType=?, workHours=?, content=? WHERE id=?`;
        const stmt = db.prepare(sql);
        stmt.run(t.name, t.owner, t.deviceType, t.startDate, t.endDate, t.nreNumber, t.status, t.platform, t.androidVersion, t.taskType, t.workHours, t.content, id);
        res.json(t);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    try {
        const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
        stmt.run(id);
        res.json({message: "Deleted"});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// --- Static Files (Frontend) ---
// Serve the React build output in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log('Serving static files from:', distPath);
    app.use(express.static(distPath));

    // Handle SPA routing: return index.html for any unknown route
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});