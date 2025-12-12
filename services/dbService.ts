
import { Task, TaskFormData, AppConfig, DropdownOptions } from '../types';

// Use relative path. 
// In Vite Dev: Proxy handles this to localhost:3001.
// In Prod (Web/Electron): The UI is served by the same express server, so relative path works.
const API_BASE = '/api';

// Generate a random ID (Simple UUID v4 mock) for frontend generation if needed
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const dbService = {
  getAllTasks: async (): Promise<Task[]> => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch tasks: ${res.status} ${text}`);
      }
      return await res.json();
    } catch (error) {
      console.error('API Error (getAllTasks):', error);
      throw error;
    }
  },

  addTask: async (taskData: TaskFormData): Promise<Task> => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: Date.now(),
    };

    try {
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });
        
        if (!res.ok) throw new Error('Failed to add task');
        return await res.json();
    } catch (error) {
        console.error('API Error (addTask):', error);
        throw error;
    }
  },

  updateTask: async (task: Task): Promise<void> => {
    try {
        const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!res.ok) throw new Error('Failed to update task');
    } catch (error) {
        console.error('API Error (updateTask):', error);
        throw error;
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    try {
        const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete task');
    } catch (error) {
        console.error('API Error (deleteTask):', error);
        throw error;
    }
  },

  getConfig: async (): Promise<AppConfig> => {
    try {
        const res = await fetch(`${API_BASE}/config`);
        if (!res.ok) throw new Error('Failed to fetch config');
        return await res.json();
    } catch (error) {
        console.error('API Error (getConfig):', error);
        throw error;
    }
  },

  updateConfig: async (config: AppConfig): Promise<void> => {
    try {
        const res = await fetch(`${API_BASE}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        if (!res.ok) throw new Error('Failed to update config');
    } catch (error) {
        console.error('API Error (updateConfig):', error);
        throw error;
    }
  },

  getLists: async (): Promise<DropdownOptions> => {
    try {
      const res = await fetch(`${API_BASE}/lists`);
      if (!res.ok) throw new Error('Failed to fetch lists');
      return await res.json();
    } catch (error) {
      console.error('API Error (getLists):', error);
      throw error;
    }
  },

  saveLists: async (lists: DropdownOptions): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lists)
      });
      if (!res.ok) throw new Error('Failed to save lists');
    } catch (error) {
      console.error('API Error (saveLists):', error);
      throw error;
    }
  },
  
  initialize: () => {
    console.log("DB Service Initialized (Universal Mode)");
  }
};
