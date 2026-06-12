import { RefreshCw, Search } from 'lucide-react';
import React, { useState } from 'react';
import { LEVEL2_DATA } from '../types';

interface LevelTwoListPageProps {
  onDetailClick: (id: string) => void;
}

const LabelInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm text-on-surface-variant">{label}</span>
    {children}
  </div>
);

export const LevelTwoListPage = ({ onDetailClick }: LevelTwoListPageProps) => {
  const [monthFilter, setMonthFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');

  const [draftMonthFilter, setDraftMonthFilter] = useState('');
  const [draftCustomerFilter, setDraftCustomerFilter] = useState('');
  const [draftContractFilter, setDraftContractFilter] = useState('');

  const months = [...new Set(LEVEL2_DATA.map((item) => item.month))];
  const customers = [...new Set(LEVEL2_DATA.map((item) => item.customer))];
  const contracts = [...new Set(LEVEL2_DATA.map((item) => item.contract))];

  const filtered = LEVEL2_DATA.filter(
    (item) =>
      (!monthFilter || item.month === monthFilter) &&
      (!customerFilter || item.customer === customerFilter) &&
      (!contractFilter || item.contract === contractFilter),
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="admin-card mb-4 px-5 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4 mb-4">
          <LabelInput label="所属月份">
            <select
              value={draftMonthFilter}
              onChange={(e) => setDraftMonthFilter(e.target.value)}
              className="admin-input"
            >
              <option value="">全部月份</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </LabelInput>
          <LabelInput label="客户">
            <select
              value={draftCustomerFilter}
              onChange={(e) => setDraftCustomerFilter(e.target.value)}
              className="admin-input"
            >
              <option value="">全部客户</option>
              {customers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </LabelInput>
          <LabelInput label="合同">
            <select value={draftContractFilter} onChange={(e) => setDraftContractFilter(e.target.value)} className="admin-input">
              <option value="">全部合同</option>
              {contracts.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </LabelInput>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setMonthFilter(draftMonthFilter);
              setCustomerFilter(draftCustomerFilter);
              setContractFilter(draftContractFilter);
            }}
            className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            查询
          </button>
          <button
            onClick={() => {
              setDraftMonthFilter('');
              setDraftCustomerFilter('');
              setDraftContractFilter('');
              setMonthFilter('');
              setCustomerFilter('');
              setContractFilter('');
            }}
            className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
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
                  <td colSpan={6} className="px-4 py-12 text-center text-on-surface-variant">
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
