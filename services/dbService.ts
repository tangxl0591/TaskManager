import { Task, TaskFormData } from '../types';

// Use 127.0.0.1 to force IPv4 and avoid "NetworkError" due to Node/Browser IPv6 mismatch on localhost
const API_URL = 'http://127.0.0.1:3001/api/tasks';

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
      const res = await fetch(API_URL);
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
        const res = await fetch(API_URL, {
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
        const res = await fetch(`${API_URL}/${task.id}`, {
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
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete task');
    } catch (error) {
        console.error('API Error (deleteTask):', error);
        throw error;
    }
  },
  
  initialize: () => {
    console.log("DB Service Initialized (API Mode)");
  }
};