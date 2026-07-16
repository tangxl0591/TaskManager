import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DEFAULT_PORT = 3001;

// --- Config Management ---
// USER_DATA_PATH is set by Electron main.js to be the Executable Dir (Prod) or Project Root (Dev)
const appDataPath = process.env.USER_DATA_PATH || __dirname;
const dbDir = path.join(appDataPath, 'DB');
const configPath = path.join(dbDir, 'config.json');
// Legacy path support checking
const legacyDbDir = path.join(appDataPath, 'Database');
const legacyTasksPath = path.join(legacyDbDir, 'tasks.json');

console.log('-----------------------------------');
console.log('STORAGE LOCATION:', dbDir);
console.log('-----------------------------------');

// Ensure DB directory exists
if (!fs.existsSync(dbDir)) {
    try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('Created Data directory at:', dbDir);
        
        // Migration: If legacy Database folder exists, copy/move files to new DB folder
        if (fs.existsSync(legacyDbDir)) {
             console.log('Detected legacy "Database" folder, attempting migration to "DB"...');
             try {
                const files = fs.readdirSync(legacyDbDir);
                files.forEach(file => {
                    const src = path.join(legacyDbDir, file);
                    const dest = path.join(dbDir, file);
                    if (!fs.existsSync(dest)) {
                        fs.copyFileSync(src, dest);
                    }
                });
                console.log('Migration to "DB" folder successful.');
             } catch (e) {
                 console.error("Migration warning:", e.message);
             }
        }

    } catch (e) {
        console.error('Error creating Data directory:', e.message);
    }
}

// Default Data
const DEFAULT_LISTS = {
  owners: [
    '唐晓磊', '付帅', '陈雯雯', '林源', '陈名舜', '林道疆', '林栎雨', 
    '于国杰', '吴和志', '郑宏林', '李志雄', '朱成华', '林杰君', '任奕霖'
  ],
  deviceTypes: [
    'NLS-MT93', 'NLS-MT95', 'NLS-NQuire', 'NLS-N7', 'NLS-MT67', 
    'NLS-NFT10', 'NLS-NW30', 'NLS-WD1', 'NLS-WD5'
  ],
  platforms: [
    'Unisoc 7885', 'Mediatek 8781', 'Mediatek 8786', 'Mediatek 8791', 
    'Mediatek 6762', 'Qualcomm 6490', 'Qualcomm 6690'
  ],
  androidVersions: [
    'Android 9', 'Android 10', 'Android 11', 'Android 12', 
    'Android 13', 'Android 14', 'Android 15', 'Android 16', 'Android 17'
  ],
  taskTypes: [
    '维护任务', '国内NRE', '海外NRE', '技术预研', '临时任务', '新项目'
  ],
  statuses: [
    { value: 'Pending', labelZh: 'Pending', labelEn: 'Pending', color: 'bg-gray-100 text-gray-800' },
    { value: 'In Progress', labelZh: 'In Progress', labelEn: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'Testing', labelZh: 'Testing', labelEn: 'Testing', color: 'bg-purple-100 text-purple-800' },
    { value: 'Customer Testing', labelZh: 'Customer Testing', labelEn: 'Customer Testing', color: 'bg-pink-100 text-pink-800' },
    { value: 'Completed', labelZh: 'Completed', labelEn: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'Blocked', labelZh: 'Blocked', labelEn: 'Blocked', color: 'bg-red-100 text-red-800' }
  ]
};

// Helper: Read Config
const readConfig = () => {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const conf = JSON.parse(data);
            return {
                port: conf.port || DEFAULT_PORT,
                lists: { ...DEFAULT_LISTS, ...(conf.lists || {}) }
            };
        }
    } catch (e) {
        console.error("Error reading config:", e.message);
    }
    return { port: DEFAULT_PORT, lists: DEFAULT_LISTS };
};

// Helper: Save Config
const saveConfig = (newConfig) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    } catch (e) {
        console.error("Error writing config:", e.message);
    }
};

// Initial Config Load/Create
let currentConfig = readConfig();
saveConfig(currentConfig);

// Helper: Get Year from Date String (YYYY-MM-DD)
const getYear = (dateStr) => {
    if (!dateStr) return new Date().getFullYear().toString();
    return dateStr.split('-')[0] || new Date().getFullYear().toString();
};

// --- Migration Logic (Files inside DB folder) ---
const migrateLegacyData = () => {
    // Check for old tasks.json in the NEW dbDir
    const localLegacyTasksPath = path.join(dbDir, 'tasks.json');
    
    if (fs.existsSync(localLegacyTasksPath)) {
        console.log('Migrating legacy tasks.json to yearly files...');
        try {
            const data = fs.readFileSync(localLegacyTasksPath, 'utf8');
            const tasks = JSON.parse(data) || [];
            
            // Group by year
            const tasksByYear = {};
            tasks.forEach(t => {
                const y = getYear(t.startDate);
                if (!tasksByYear[y]) tasksByYear[y] = [];
                tasksByYear[y].push(t);
            });

            // Write files
            Object.keys(tasksByYear).forEach(y => {
                const p = path.join(dbDir, `tasks_${y}.json`);
                let existing = [];
                if (fs.existsSync(p)) {
                    try {
                        existing = JSON.parse(fs.readFileSync(p, 'utf8'));
                    } catch (e) {}
                }
                
                // Merge and Deduplicate by ID
                const combined = [...existing, ...tasksByYear[y]];
                const uniqueMap = new Map();
                combined.forEach(item => uniqueMap.set(item.id, item));
                const unique = Array.from(uniqueMap.values());
                
                fs.writeFileSync(p, JSON.stringify(unique, null, 2));
                console.log(`Saved ${unique.length} tasks to tasks_${y}.json`);
            });

            // Rename legacy file
            fs.renameSync(localLegacyTasksPath, path.join(dbDir, 'tasks.json.bak'));
            console.log('Migration complete. tasks.json renamed to tasks.json.bak');
        } catch (e) {
            console.error('Migration failed:', e);
        }
    }
};

// Run Migration
migrateLegacyData();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    if (!req.url.startsWith('/assets')) {
        console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    }
    next();
});

// --- File Operations Helpers ---

const getTaskFilePath = (year) => path.join(dbDir, `tasks_${year}.json`);

const readYearFile = (year) => {
    const p = getTaskFilePath(year);
    if (!fs.existsSync(p)) return [];
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8')) || [];
    } catch (e) {
        console.error(`Error reading ${p}:`, e.message);
        return [];
    }
};

const writeYearFile = (year, tasks) => {
    const p = getTaskFilePath(year);
    try {
        fs.writeFileSync(p, JSON.stringify(tasks, null, 2));
    } catch (e) {
        console.error(`Error writing ${p}:`, e.message);
        throw e;
    }
};

const getAllTasks = () => {
    const files = fs.readdirSync(dbDir).filter(f => f.startsWith('tasks_') && f.endsWith('.json'));
    let all = [];
    files.forEach(f => {
        try {
            const data = fs.readFileSync(path.join(dbDir, f), 'utf8');
            const json = JSON.parse(data);
            if (Array.isArray(json)) all = all.concat(json);
        } catch (e) {
            console.error(`Error reading ${f}`, e.message);
        }
    });
    return all;
};

// --- API Routes ---

// Lists API
app.get('/api/lists', (req, res) => {
    const conf = readConfig();
    res.json(conf.lists);
});

app.post('/api/lists', (req, res) => {
    try {
        const newLists = req.body;
        const conf = readConfig();
        conf.lists = newLists;
        saveConfig(conf);
        res.json(conf.lists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Config API
app.get('/api/config', (req, res) => {
    const conf = readConfig();
    res.json({ port: conf.port });
});

app.post('/api/config', (req, res) => {
    try {
        const { port } = req.body;
        if (!port || isNaN(port)) {
             return res.status(400).json({ error: 'Invalid port' });
        }
        const conf = readConfig();
        conf.port = Number(port);
        saveConfig(conf);
        res.json({ message: 'Config saved', port: conf.port });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper for finding LAN IP
const getLanIp = () => {
    const interfaces = os.networkInterfaces();
    let candidates = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) {
                candidates.push({ name, address: iface.address });
            }
        }
    }
    const physical = candidates.filter(c => {
        const n = c.name.toLowerCase();
        return !['vmnet','virtual','wsl','docker','pseudo'].some(x => n.includes(x));
    });
    const targetList = physical.length > 0 ? physical : candidates;
    return targetList.length > 0 ? targetList[0].address : '127.0.0.1';
};

// Network Info
app.get('/api/network-info', (req, res) => {
    const ip = getLanIp();
    const conf = readConfig();
    res.json({ ip, port: conf.port });
});

// Tasks API - Refactored for Yearly Storage

app.get('/api/tasks', (req, res) => {
    try {
        const tasks = getAllTasks();
        // Sort descending by creation time (or start date if preferred)
        tasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        res.json(tasks);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const newTask = req.body;
        const year = getYear(newTask.startDate);
        
        const tasks = readYearFile(year);
        tasks.push(newTask);
        writeYearFile(year, tasks);
        
        res.json(newTask);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.put('/api/tasks/:id', (req, res) => {
    try {
        const updatedData = req.body;
        const { id } = req.params;
        
        // 1. Find existing task
        const files = fs.readdirSync(dbDir).filter(f => f.startsWith('tasks_') && f.endsWith('.json'));
        let found = false;
        let oldYear = null;
        let oldTask = null;

        for (const f of files) {
            const data = fs.readFileSync(path.join(dbDir, f), 'utf8');
            const tasks = JSON.parse(data);
            const taskIndex = tasks.findIndex(t => t.id === id);
            
            if (taskIndex !== -1) {
                oldTask = tasks[taskIndex];
                // Extract year from filename tasks_2024.json -> 2024
                const match = f.match(/tasks_(\d+)\.json/);
                if (match) {
                    oldYear = match[1];
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
             return res.status(404).json({ error: "Task not found" });
        }

        const newYear = getYear(updatedData.startDate);

        if (oldYear === newYear) {
            // Update in place
            const tasks = readYearFile(oldYear);
            const index = tasks.findIndex(t => t.id === id);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...updatedData };
                writeYearFile(oldYear, tasks);
                res.json(tasks[index]);
            } else {
                res.status(500).json({ error: "Concurrency error: Task lost during update" });
            }
        } else {
            // Move: Delete from old, Add to new
            const oldTasks = readYearFile(oldYear);
            const filteredOldTasks = oldTasks.filter(t => t.id !== id);
            writeYearFile(oldYear, filteredOldTasks);

            const newTasks = readYearFile(newYear);
            const mergedTask = { ...oldTask, ...updatedData };
            newTasks.push(mergedTask);
            writeYearFile(newYear, newTasks);
            
            res.json(mergedTask);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({error: err.message});
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    try {
        const { id } = req.params;
        const files = fs.readdirSync(dbDir).filter(f => f.startsWith('tasks_') && f.endsWith('.json'));
        let deleted = false;

        for (const f of files) {
            const p = path.join(dbDir, f);
            const data = fs.readFileSync(p, 'utf8');
            let tasks = JSON.parse(data);
            const initialLen = tasks.length;
            
            tasks = tasks.filter(t => t.id !== id);
            
            if (tasks.length !== initialLen) {
                fs.writeFileSync(p, JSON.stringify(tasks, null, 2));
                deleted = true;
                // Don't break immediately if we assume IDs are unique, but just in case duplicate exists in other files (shouldn't happen), we could continue. 
                // For efficiency, we break.
                break;
            }
        }
        
        if (deleted) {
            res.json({message: "Deleted"});
        } else {
             res.status(404).json({ error: "Task not found" });
        }
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// --- Static Files ---
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    console.log('Serving static files from:', distPath);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// Start Server
const conf = readConfig();
const PORT = process.env.PORT || conf.port || DEFAULT_PORT;

app.listen(PORT, '0.0.0.0', () => {
    const ip = getLanIp();
    console.log(`\n==================================================`);
    console.log(`  Server running on port ${PORT}`);
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://${ip}:${PORT}`);
    console.log(`==================================================\n`);
});