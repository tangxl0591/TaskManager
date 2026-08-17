
import { TaskStatus, DropdownOptions } from './types';

export const APP_VERSION = '1.1.0';

// Default mock data options (Fallbacks if API fails)
export const DEFAULT_OWNERS = [
  '唐晓磊', '付帅', '陈雯雯', '林源', '陈名舜', '林道疆', '林栎雨', 
  '于国杰', '吴和志', '郑宏林', '李志雄', '朱成华', '林杰君', '任奕霖'
];

export const DEFAULT_DEVICE_TYPES = [
  'NLS-MT93',
  'NLS-MT95',
  'NLS-NQuire',
  'NLS-N7',
  'NLS-MT67',
  'NLS-NFT10',
  'NLS-NW30',
  'NLS-WD1',
  'NLS-WD5'
];

export const DEFAULT_PLATFORMS = [
  'Unisoc 7885', 
  'Mediatek 8781', 
  'Mediatek 8786', 
  'Mediatek 8791', 
  'Mediatek 6762', 
  'Qualcomm 6490', 
  'Qualcomm 6690'
];

export const DEFAULT_ANDROID_VERSIONS = [
  'Android 9', 
  'Android 10', 
  'Android 11', 
  'Android 12', 
  'Android 13', 
  'Android 14', 
  'Android 15', 
  'Android 16', 
  'Android 17'
];

export const DEFAULT_TASK_TYPES = [
  '维护任务', 
  '国内NRE', 
  '海外NRE', 
  '技术预研', 
  '临时任务', 
  '新项目'
];

export const DEFAULT_STATUS_OPTIONS = [
  { value: 'Pending', labelZh: 'Pending', labelEn: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'In Progress', labelZh: 'In Progress', labelEn: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'Testing', labelZh: 'Testing', labelEn: 'Testing', color: 'bg-purple-100 text-purple-800' },
  { value: 'Customer Testing', labelZh: 'Customer Testing', labelEn: 'Customer Testing', color: 'bg-pink-100 text-pink-800' },
  { value: 'Completed', labelZh: 'Completed', labelEn: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'Blocked', labelZh: 'Blocked', labelEn: 'Blocked', color: 'bg-red-100 text-red-800' }
];

export const DEFAULT_OPTIONS: DropdownOptions = {
    owners: DEFAULT_OWNERS,
    deviceTypes: DEFAULT_DEVICE_TYPES,
    platforms: DEFAULT_PLATFORMS,
    androidVersions: DEFAULT_ANDROID_VERSIONS,
    taskTypes: DEFAULT_TASK_TYPES,
    statuses: DEFAULT_STATUS_OPTIONS
};

export const STATUS_OPTIONS = Object.values(TaskStatus);

export const TABLE_HEADERS = [
  'Task Name',
  'Owner',
  'Device',
  'Platform',
  'NRE #',
  'Status',
  'Start Date',
  'End Date',
  'Work Hours',
  'Actions'
];

export const QUADRANT_OPTIONS = [
  {
    key: 'Q1_IMPORTANT_URGENT',
    labelZh: '重要且紧急',
    labelEn: 'Important & Urgent',
    subtitleZh: '优先处理 (Do First)',
    subtitleEn: 'Do First',
    badgeClass: 'bg-red-100 text-red-800 border border-red-200',
    headerBgClass: 'bg-red-600 text-white',
    cardBorderClass: 'border-red-200 hover:border-red-400',
    cardBgClass: 'bg-red-50/40',
    accentColor: '#ef4444'
  },
  {
    key: 'Q2_IMPORTANT_NOT_URGENT',
    labelZh: '重要不紧急',
    labelEn: 'Important & Not Urgent',
    subtitleZh: '制定计划 (Schedule)',
    subtitleEn: 'Schedule',
    badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200',
    headerBgClass: 'bg-amber-500 text-white',
    cardBorderClass: 'border-amber-200 hover:border-amber-400',
    cardBgClass: 'bg-amber-50/40',
    accentColor: '#f59e0b'
  },
  {
    key: 'Q3_NOT_IMPORTANT_URGENT',
    labelZh: '不重要但紧急',
    labelEn: 'Not Important & Urgent',
    subtitleZh: '授权委派 (Delegate)',
    subtitleEn: 'Delegate',
    badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200',
    headerBgClass: 'bg-blue-600 text-white',
    cardBorderClass: 'border-blue-200 hover:border-blue-400',
    cardBgClass: 'bg-blue-50/40',
    accentColor: '#3b82f6'
  },
  {
    key: 'Q4_NOT_IMPORTANT_NOT_URGENT',
    labelZh: '不重要不紧急',
    labelEn: 'Not Important & Not Urgent',
    subtitleZh: '尽量少做 (Eliminate)',
    subtitleEn: 'Eliminate',
    badgeClass: 'bg-gray-100 text-gray-800 border border-gray-200',
    headerBgClass: 'bg-gray-600 text-white',
    cardBorderClass: 'border-gray-200 hover:border-gray-400',
    cardBgClass: 'bg-gray-50/40',
    accentColor: '#6b7280'
  }
];

export const getQuadrantInfo = (quadrantKey?: string) => {
  if (!quadrantKey) return QUADRANT_OPTIONS[1];
  const found = QUADRANT_OPTIONS.find(q => q.key === quadrantKey || q.labelZh === quadrantKey || q.labelEn === quadrantKey);
  return found || QUADRANT_OPTIONS[1];
};
