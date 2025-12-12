
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

export const DEFAULT_OPTIONS: DropdownOptions = {
    owners: DEFAULT_OWNERS,
    deviceTypes: DEFAULT_DEVICE_TYPES,
    platforms: DEFAULT_PLATFORMS,
    androidVersions: DEFAULT_ANDROID_VERSIONS,
    taskTypes: DEFAULT_TASK_TYPES
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
