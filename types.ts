
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

export enum PriorityQuadrant {
  Q1 = 'Q1_IMPORTANT_URGENT',
  Q2 = 'Q2_IMPORTANT_NOT_URGENT',
  Q3 = 'Q3_NOT_IMPORTANT_URGENT',
  Q4 = 'Q4_NOT_IMPORTANT_NOT_URGENT'
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
  priorityQuadrant?: string;
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt'>;

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  TESTING = 'Testing',
  CUSTOMER_TESTING = 'Customer Testing',
  COMPLETED = 'Completed',
  BLOCKED = 'Blocked'
}

export const StatusColorMap: Record<string, string> = {
  [TaskStatus.PENDING]: 'bg-gray-100 text-gray-800',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TaskStatus.TESTING]: 'bg-purple-100 text-purple-800',
  [TaskStatus.CUSTOMER_TESTING]: 'bg-pink-100 text-pink-800',
  [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [TaskStatus.BLOCKED]: 'bg-red-100 text-red-800',
};

export const getStatusColor = (status: string, optionsStatuses?: StatusOption[]): string => {
  if (optionsStatuses && optionsStatuses.length > 0) {
    const found = optionsStatuses.find(s => s.value === status);
    if (found) return found.color;
  }
  return StatusColorMap[status] || 'bg-gray-100 text-gray-800';
};

export interface StatusOption {
  value: string;
  labelZh?: string;
  labelEn?: string;
  color: string;
}

export interface DropdownOptions {
  owners: string[];
  deviceTypes: string[];
  platforms: string[];
  androidVersions: string[];
  taskTypes: string[];
  statuses?: StatusOption[];
}

export interface AppConfig {
  port: number;
  lists?: DropdownOptions;
}

export const parseLocalDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-/]/);
  if (parts.length < 3) {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
};

export const getPeriodDelay = (
  period: { 
    endDate: string; 
    actualEndDate?: string; 
    isPaused?: boolean; 
    pauseStartDate?: string; 
    pausedDays?: number; 
  }, 
  taskStatus?: string
): number => {
  if (!period.endDate) return 0;
  
  const end = parseLocalDate(period.endDate);
  if (!end) return 0;
  
  let actualEnd = new Date();
  
  if (period.actualEndDate) {
    const parsed = parseLocalDate(period.actualEndDate);
    if (parsed) {
      actualEnd = parsed;
    }
  } else if (taskStatus === 'Completed' || taskStatus === '已完成') {
    // If overall task is completed, but this period does not have an actualEndDate,
    // we should NOT use today's date (which keeps moving). We assume it completed on time.
    actualEnd = end;
  } else if (period.isPaused && period.pauseStartDate) {
    // If the period is currently paused, we use the pauseStartDate as the cutoff for delay calculation
    const parsedPause = parseLocalDate(period.pauseStartDate);
    if (parsedPause) {
      actualEnd = parsedPause;
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

export const getTaskDelayStats = (
  periods: { 
    endDate: string; 
    actualEndDate?: string; 
    isPaused?: boolean; 
    pauseStartDate?: string; 
    pausedDays?: number; 
  }[] = [],
  taskStatus?: string
) => {
  let delayCount = 0;
  let totalDelayDays = 0;
  
  periods.forEach(p => {
    const delay = getPeriodDelay(p, taskStatus);
    if (delay > 0) {
      delayCount++;
      totalDelayDays += delay;
    }
  });
  
  return { delayCount, totalDelayDays };
};
