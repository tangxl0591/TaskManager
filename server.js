import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware - Allow all origins to prevent CORS issues
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// Ensure Database directory exists
const dbDir = path.join(__dirname, 'Database');
if (!fs.existsSync(dbDir)){
    try {
        fs.mkdirSync(dbDir);
        console.log('Created Database directory');
    } catch (e) {
        console.error('Error creating Database directory:', e);
    }
}

// Connect to SQLite Database
const dbPath = path.join(dbDir, 'nre_tasks.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('DB Connection Error:', err.message);
    else console.log('Connected to SQLite database at ' + dbPath);
});

// Initialize Table
db.run(`CREATE TABLE IF NOT EXISTS tasks (
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
)`, (err) => {
    if (err) console.error("Error creating table:", err);
    else console.log("Tasks table initialized");
});

// --- API Routes ---

// Get All Tasks
app.get('/api/tasks', (req, res) => {
    db.all("SELECT * FROM tasks ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) {
            console.error("Error fetching tasks:", err);
            return res.status(500).json({error: err.message});
        }
        res.json(rows);
    });
});

// Create Task
app.post('/api/tasks', (req, res) => {
    const t = req.body;
    console.log("Creating task:", t.name);
    const sql = `INSERT INTO tasks (id, name, owner, deviceType, startDate, endDate, nreNumber, status, platform, androidVersion, taskType, workHours, content, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [t.id, t.name, t.owner, t.deviceType, t.startDate, t.endDate, t.nreNumber, t.status, t.platform, t.androidVersion, t.taskType, t.workHours, t.content, t.createdAt];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error creating task:", err);
            return res.status(500).json({error: err.message});
        }
        res.json(t);
    });
});

// Update Task
app.put('/api/tasks/:id', (req, res) => {
    const t = req.body;
    const { id } = req.params;
    const sql = `UPDATE tasks SET name=?, owner=?, deviceType=?, startDate=?, endDate=?, nreNumber=?, status=?, platform=?, androidVersion=?, taskType=?, workHours=?, content=? WHERE id=?`;
    const params = [t.name, t.owner, t.deviceType, t.startDate, t.endDate, t.nreNumber, t.status, t.platform, t.androidVersion, t.taskType, t.workHours, t.content, id];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error updating task:", err);
            return res.status(500).json({error: err.message});
        }
        res.json(t);
    });
});

// Delete Task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    console.log("Deleting task:", id);
    db.run("DELETE FROM tasks WHERE id = ?", id, function(err) {
        if (err) {
            console.error("Error deleting task:", err);
            return res.status(500).json({error: err.message});
        }
        res.json({message: "Deleted"});
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});