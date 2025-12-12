
export interface Task {
  id: string;
  name: string;
  owner: string;
  deviceType: string;
  startDate: string;
  endDate: string;
  nreNumber: string;
  status: string;
  platform: string;
  androidVersion: string;
  taskType: string;
  workHours: number;
  content: string; // Markdown content
  createdAt: number;
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt'>;

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  TESTING = 'Testing',
  COMPLETED = 'Completed',
  BLOCKED = 'Blocked'
}

export const StatusColorMap: Record<string, string> = {
  [TaskStatus.PENDING]: 'bg-gray-100 text-gray-800',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TaskStatus.TESTING]: 'bg-purple-100 text-purple-800',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [TaskStatus.BLOCKED]: 'bg-red-100 text-red-800',
};

export interface DropdownOptions {
  owners: string[];
  deviceTypes: string[];
  platforms: string[];
  androidVersions: string[];
  taskTypes: string[];
}

export interface AppConfig {
  port: number;
  lists?: DropdownOptions;
}
