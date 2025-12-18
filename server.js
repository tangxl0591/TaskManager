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
const appDataPath = process.env.USER_DATA_PATH || __dirname;
const dbDir = path.join(appDataPath, 'Database');
const configPath = path.join(dbDir, 'config.json');
const tasksFilePath = path.join(dbDir, 'tasks.json');

console.log('-----------------------------------');
console.log('STORAGE LOCATION:', dbDir);
console.log('-----------------------------------');

// Ensure DB directory exists
if (!fs.existsSync(dbDir)) {
    try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('Created Data directory at:', dbDir);
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
  ]
};

// Helper: Read Config
const readConfig = () => {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const conf = JSON.parse(data);
            // Merge with defaults to ensure structure
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
saveConfig(currentConfig); // Ensure file exists with defaults

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

// --- JSON DB Helpers ---

const getTasks = () => {
    try {
        if (!fs.existsSync(tasksFilePath)) {
            return [];
        }
        const data = fs.readFileSync(tasksFilePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (err) {
        console.error("Error reading tasks file:", err.message);
        return [];
    }
};

const saveTasks = (tasks) => {
    try {
        fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
    } catch (err) {
        console.error("Error writing tasks file:", err.message);
        throw err;
    }
};

// --- API Routes ---

// Lists API (Now reads from config.json)
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

app.get('/api/tasks', (req, res) => {
    try {
        const tasks = getTasks();
        tasks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        res.json(tasks);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.post('/api/tasks', (req, res) => {
    try {
        const newTask = req.body;
        const tasks = getTasks();
        tasks.push(newTask);
        saveTasks(tasks);
        res.json(newTask);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.put('/api/tasks/:id', (req, res) => {
    try {
        const updatedData = req.body;
        const { id } = req.params;
        const tasks = getTasks();
        const index = tasks.findIndex(t => t.id === id);
        
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updatedData };
            saveTasks(tasks);
            res.json(tasks[index]);
        } else {
            res.status(404).json({ error: "Task not found" });
        }
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.delete('/api/tasks/:id', (req, res) => {
    try {
        const { id } = req.params;
        let tasks = getTasks();
        const initialLength = tasks.length;
        tasks = tasks.filter(t => t.id !== id);
        
        if (tasks.length !== initialLength) {
            saveTasks(tasks);
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