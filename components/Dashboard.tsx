
import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task, TaskStatus, DropdownOptions } from '../types';
import { translations, Language } from '../translations';

interface DashboardProps {
  tasks: Task[];
  lang: Language;
  options: DropdownOptions;
}

// Colors for charts
const STATUS_CHART_COLORS = {
  [TaskStatus.PENDING]: '#9ca3af',
  [TaskStatus.IN_PROGRESS]: '#3b82f6',
  [TaskStatus.TESTING]: '#a855f7',
  [TaskStatus.COMPLETED]: '#22c55e',
  [TaskStatus.BLOCKED]: '#ef4444',
};

// Colors for Device types in stacked bar
const DEVICE_COLORS = [
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899'  // Pink
];

// Colors for Pie Chart sectors
const PIE_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#64748b', '#22c55e'
];

const Dashboard: React.FC<DashboardProps> = ({ tasks, lang, options }) => {
  const t = translations[lang];
  const [distView, setDistView] = useState<'taskType' | 'deviceType'>('taskType');

  // 1. Status Distribution
  const statusData = Object.values(TaskStatus).map(status => ({
    name: status,
    value: tasks.filter(t => t.status === status).length
  })).filter(item => item.value > 0);

  // 2. Owner Distribution
  const ownerMap = tasks.reduce((acc, task) => {
    acc[task.owner] = (acc[task.owner] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const ownerData = Object.keys(ownerMap).map(owner => ({
    name: owner,
    tasks: ownerMap[owner]
  })).sort((a, b) => b.tasks - a.tasks);

  // 3. Work Hours by Owner & Device (Stacked Bar Chart)
  const uniqueOwners = Array.from(new Set(tasks.map(t => t.owner)));
  const workHoursByOwnerDeviceData = uniqueOwners.map(owner => {
    const dataPoint: any = { name: owner };
    let total = 0;
    
    options.deviceTypes.forEach(device => {
      const hours = tasks
        .filter(t => t.owner === owner && t.deviceType === device)
        .reduce((sum, t) => sum + (t.workHours || 0), 0);
      
      if (hours > 0) {
        dataPoint[device] = hours;
        total += hours;
      }
    });
    
    return { ...dataPoint, total };
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

  // 4. Overall Work Hours Distribution (Dynamic based on distView)
  const getWorkHoursDistribution = () => {
    if (distView === 'taskType') {
      return options.taskTypes.map(type => ({
        name: type,
        value: tasks.filter(t => t.taskType === type).reduce((sum, t) => sum + (t.workHours || 0), 0)
      })).filter(d => d.value > 0);
    } else {
      return options.deviceTypes.map(device => ({
        name: device,
        value: tasks.filter(t => t.deviceType === device).reduce((sum, t) => sum + (t.workHours || 0), 0)
      })).filter(d => d.value > 0);
    }
  };

  const distributionData = getWorkHoursDistribution();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in fade-in duration-500">
      
      {/* Row 1: Status & Owner Count */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.statusDist}</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_CHART_COLORS[entry.name as TaskStatus] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.ownerDist}</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ownerData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="tasks" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Work Hours Analytics */}
      
      {/* Stacked Bar: Work Hours by Owner & Device */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.workHoursByOwnerDevice}</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
             <BarChart
              data={workHoursByOwnerDeviceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={true} />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {options.deviceTypes.map((device, index) => (
                 <Bar 
                   key={device} 
                   dataKey={device} 
                   stackId="a" 
                   fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} 
                 />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart: Total Work Hours Distribution (Toggle) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800">{t.workHoursDist}</h3>
          
          <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
            <button
              onClick={() => setDistView('taskType')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                distView === 'taskType' 
                  ? 'bg-white shadow text-indigo-600 font-medium' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.byTaskType}
            </button>
            <button
              onClick={() => setDistView('deviceType')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                distView === 'deviceType' 
                  ? 'bg-white shadow text-indigo-600 font-medium' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.byDeviceType}
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, value }) => `${name}: ${value}h`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} hours`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
