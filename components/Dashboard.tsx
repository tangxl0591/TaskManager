
import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task, TaskStatus, DropdownOptions, getTaskDelayStats } from '../types';
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

const Dashboard: React.FC<DashboardProps> = ({ tasks, lang, options }) => {
  const t = translations[lang];

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

  // 3. Owner Status & Delay Statistics (Requirement 4)
  const ownerStatsData = options.owners.map(owner => {
    const ownerTasks = tasks.filter(t => t.owner === owner);
    const total = ownerTasks.length;
    const completed = ownerTasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === 'Completed' || t.status === '已完成').length;
    
    // Delayed task count: task is counted as delayed if its total delay duration > 0
    const delayed = ownerTasks.filter(t => {
      const { totalDelayDays } = getTaskDelayStats(t.periods);
      return totalDelayDays > 0;
    }).length;

    const inProgress = total - completed;

    return {
      name: owner,
      total,
      completed,
      delayed,
      inProgress
    };
  }).filter(d => d.total > 0)
    .sort((a, b) => b.total - a.total);

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

      {/* Row 2: Owner Task Statistics (Grouped Bar Chart) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.ownerStats || '负责人任务完成与延误统计'}</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
             <BarChart
              data={ownerStatsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} label={{ value: lang === 'en' ? 'Task Count' : '任务数', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name={lang === 'en' ? 'Total' : '总任务'} fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name={t.completedTasks || '已完成'} fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delayed" name={t.delayedTasks || '已延误'} fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="inProgress" name={t.activeTasks || '进行中'} fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Owner Statistics Detail Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{lang === 'en' ? 'Owner Performance Table' : '负责人执行数据表'}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{t.owner}</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{lang === 'en' ? 'Total Tasks' : '总任务数'}</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-green-600">{t.completedTasks || '已完成'}</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-amber-500">{t.activeTasks || '进行中'}</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-red-500">{t.delayedTasks || '已延误'}</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{lang === 'en' ? 'Delay Rate' : '延误率'}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {ownerStatsData.map((row) => {
                const delayRate = row.total > 0 ? Math.round((row.delayed / row.total) * 100) : 0;
                return (
                  <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{row.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">{row.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-green-600">{row.completed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-amber-500">{row.inProgress}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-red-500">
                      <span className={row.delayed > 0 ? "bg-red-50 px-2 py-1 rounded" : ""}>
                        {row.delayed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">
                      <span className={delayRate > 50 ? "text-red-600" : delayRate > 0 ? "text-amber-500" : "text-gray-400"}>
                        {delayRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
