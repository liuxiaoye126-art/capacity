import React, { useState } from 'react';
import { LEVEL2_DATA } from '../types';

interface LevelTwoListPageProps {
  onDetailClick: (id: string) => void;
}

export const LevelTwoListPage = ({ onDetailClick }: LevelTwoListPageProps) => {
  const [monthFilter, setMonthFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');

  const months = [...new Set(LEVEL2_DATA.map((item) => item.month))];
  const projects = [...new Set(LEVEL2_DATA.map((item) => item.project))];
  const centers = [...new Set(LEVEL2_DATA.map((item) => item.operationCenter))];

  const filtered = LEVEL2_DATA.filter(
    (item) =>
      (!monthFilter || item.month === monthFilter) &&
      (!projectFilter || item.project === projectFilter) &&
      (!centerFilter || item.operationCenter === centerFilter),
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="admin-card mb-4 px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="admin-input"
          >
            <option value="">所属月份：全部</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="admin-input"
          >
            <option value="">项目：全部</option>
            {projects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={centerFilter}
            onChange={(e) => setCenterFilter(e.target.value)}
            className="admin-input"
          >
            <option value="">运营中心：全部</option>
            {centers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => { setMonthFilter(''); setProjectFilter(''); setCenterFilter(''); }}
            className="rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="border-b border-outline-variant text-sm font-semibold text-on-surface bg-surface-container-low">
                <th className="px-4 py-3">单据编号</th>
                <th className="px-4 py-3">所属月份</th>
                <th className="px-4 py-3">客户</th>
                <th className="px-4 py-3">合同</th>
                <th className="px-4 py-3">项目</th>
                <th className="px-4 py-3">运营中心</th>
                <th className="px-4 py-3">产能人天</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-4 font-semibold text-on-surface">{item.id}</td>
                  <td className="px-4 py-4 text-on-surface-variant whitespace-nowrap">{item.month}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{item.customer}</td>
                  <td
                    className="px-4 py-4 text-on-surface-variant max-w-[280px] truncate"
                    title={item.contract}
                  >
                    {item.contract}
                  </td>
                  <td className="px-4 py-4 text-on-surface-variant">{item.project}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{item.operationCenter}</td>
                  <td className="px-4 py-4 text-on-surface font-medium">{item.workDays}</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => onDetailClick(item.id)}
                      className="text-primary hover:underline text-sm transition-colors"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
                    暂无符合条件的记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant px-4 py-3 bg-white">
          <div className="text-sm text-on-surface-variant">
            共 <span className="text-on-surface font-medium">{filtered.length}</span> 条记录，每页显示 10 条
          </div>
          <div className="flex items-center gap-1.5">
            <button className="h-7 w-7 flex items-center justify-center rounded border border-outline-variant bg-white text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">&lt;</button>
            <button className="h-7 min-w-[28px] px-2 rounded bg-primary text-white text-sm font-medium">1</button>
            <button className="h-7 w-7 flex items-center justify-center rounded border border-outline-variant bg-white text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};
