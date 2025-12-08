import { Task, TaskFormData } from '../types';

/* 
  NOTE: In a real production environment, this service would make HTTP requests 
  to a Node.js/Python backend connected to a SQLite database.
*/

const DB_KEY = 'nre_task_manager_db';

// Generate a random ID (Simple UUID v4 mock)
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const dbService = {
  getAllTasks: async (): Promise<Task[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : [];
  },

  addTask: async (taskData: TaskFormData): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const tasks = await dbService.getAllTasks();
    
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: Date.now(),
    };

    const updatedTasks = [newTask, ...tasks];
    localStorage.setItem(DB_KEY, JSON.stringify(updatedTasks));
    return newTask;
  },

  updateTask: async (task: Task): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const tasks = await dbService.getAllTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      const updatedTasks = [...tasks];
      updatedTasks[index] = task;
      localStorage.setItem(DB_KEY, JSON.stringify(updatedTasks));
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const tasks = await dbService.getAllTasks();
    const updatedTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem(DB_KEY, JSON.stringify(updatedTasks));
  },
  
  // Seed data if empty
  initialize: () => {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
        const seedData: Task[] = [
            {
                id: generateId(),
                name: "Camera Driver Optimization",
                owner: "唐晓磊",
                deviceType: "NLS-MT93",
                startDate: "2023-10-01",
                endDate: "2023-10-15",
                nreNumber: "NRE-2023-001",
                status: "Completed",
                platform: "Mediatek 8781",
                androidVersion: "Android 13",
                taskType: "维护任务",
                workHours: 120,
                content: "### Objectives\n- Optimize camera HAL for low light performance.\n- Reduce shutter lag by 20%.\n\n### Status\nAll tests passed on EVT2 units.",
                createdAt: Date.now()
            },
            {
                id: generateId(),
                name: "System UI Customization",
                owner: "陈雯雯",
                deviceType: "NLS-NQuire",
                startDate: "2023-11-05",
                endDate: "2023-12-20",
                nreNumber: "NRE-2023-042",
                status: "In Progress",
                platform: "Qualcomm 6490",
                androidVersion: "Android 14",
                taskType: "国内NRE",
                workHours: 85,
                content: "Customizing launcher layout for enterprise customers.\n\n**Requirements:**\n1. Kiosk mode support\n2. Hidden settings menu",
                createdAt: Date.now() - 10000
            },
            {
                id: generateId(),
                name: "IoT Gateway Security Patch",
                owner: "林源",
                deviceType: "NLS-WD1",
                startDate: "2023-12-01",
                endDate: "2023-12-10",
                nreNumber: "NRE-2023-055",
                status: "Testing",
                platform: "Unisoc 7885",
                androidVersion: "Android 11",
                taskType: "临时任务",
                workHours: 40,
                content: "Applying December 2023 SPL.\n\n- Validated on EVB.\n- Pending customer verification.",
                createdAt: Date.now() - 20000
            }
        ];
        localStorage.setItem(DB_KEY, JSON.stringify(seedData));
    }
  }
};