
export interface TimePeriod {
  id: string;
  startDate: string;
  endDate: string;
  actualEndDate: string;
  isPaused?: boolean;
  pauseStartDate?: string;
  pausedDays?: number;
  delayDays?: number;
}

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
  content: string; // Markdown content
  createdAt: number;
  periods: TimePeriod[];
  delayCount?: number;
  delayDuration?: number;
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

export const getPeriodDelay = (period: { 
  endDate: string; 
  actualEndDate?: string; 
  isPaused?: boolean; 
  pauseStartDate?: string; 
  pausedDays?: number; 
}): number => {
  if (!period.endDate) return 0;
  
  const end = new Date(period.endDate);
  if (isNaN(end.getTime())) return 0;
  
  let actualEnd = new Date();
  
  // If the period is currently paused, we use the pauseStartDate as the cutoff for delay calculation!
  if (period.isPaused && period.pauseStartDate) {
    const parsedPause = new Date(period.pauseStartDate);
    if (!isNaN(parsedPause.getTime())) {
      actualEnd = parsedPause;
    }
  } else if (period.actualEndDate) {
    const parsed = new Date(period.actualEndDate);
    if (!isNaN(parsed.getTime())) {
      actualEnd = parsed;
    }
  }
  
  end.setHours(0, 0, 0, 0);
  actualEnd.setHours(0, 0, 0, 0);
  
  let delayDays = 0;
  if (actualEnd > end) {
    const diffTime = actualEnd.getTime() - end.getTime();
    delayDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // Deduct manually specified paused days
  if (period.pausedDays && period.pausedDays > 0) {
    delayDays = Math.max(0, delayDays - period.pausedDays);
  }
  
  return delayDays;
};

export const getTaskDelayStats = (periods: { 
  endDate: string; 
  actualEndDate?: string; 
  isPaused?: boolean; 
  pauseStartDate?: string; 
  pausedDays?: number; 
}[] = []) => {
  let delayCount = 0;
  let totalDelayDays = 0;
  
  periods.forEach(p => {
    const delay = getPeriodDelay(p);
    if (delay > 0) {
      delayCount++;
      totalDelayDays += delay;
    }
  });
  
  return { delayCount, totalDelayDays };
};
