import React, { useEffect, useState } from 'react';
import { CapacityRecord, CapacityView, normalizeApprovalStatus } from '../types';

interface CapacityTableProps {
  data: CapacityRecord[];
  view: CapacityView;
  onDetailClick?: (id: string) => void;
  onRelatedLevelFourClick?: (id: string) => void;
}

interface LocalCapacityRecord extends CapacityRecord {
  originalStatus: string;
}

const statusColorMap: Record<string, string> = {
  '待确认': 'bg-amber-100 text-amber-700',
  '待调整': 'bg-amber-100 text-amber-700',
  '待审核': 'bg-sky-100 text-sky-700',
  '已通过': 'bg-emerald-100 text-emerald-700',
  '待提交': 'bg-amber-100 text-amber-700',
  '待上传发票': 'bg-cyan-100 text-cyan-700',
  '已归档': 'bg-emerald-100 text-emerald-700',
  '已驳回': 'bg-rose-100 text-rose-700',
  '回款中': 'bg-orange-100 text-orange-700',
  '已回清待确认': 'bg-cyan-100 text-cyan-700',
  '已生效': 'bg-emerald-100 text-emerald-700',
  '已撤销': 'bg-rose-100 text-rose-700',
};

const isProcessingStatus = (status: string) => {
  return !['已通过', '已归档', '已生效', '已撤销'].includes(status);
};

export const CapacityTable = ({ data, view, onDetailClick, onRelatedLevelFourClick }: CapacityTableProps) => {
  const [rows, setRows] = useState<LocalCapacityRecord[]>(() =>
    data.map((item) => ({
      ...item,
      status: normalizeApprovalStatus(item.status),
      originalStatus: normalizeApprovalStatus(item.status),
    })),
  );

  useEffect(() => {
    setRows(
      data.map((item) => ({
        ...item,
        status: normalizeApprovalStatus(item.status),
        originalStatus: normalizeApprovalStatus(item.status),
      })),
    );
  }, [data]);

  const updateTime = () => {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  const handleRevoke = (id: string) => {
    setRows((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: view === 'level4' ? '待提交' : '已撤销',
              updatedAt: updateTime(),
            }
          : item,
      ),
    );
  };

  const handleRestart = (id: string) => {
    setRows((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.originalStatus,
              updatedAt: updateTime(),
            }
          : item,
      ),
    );
  };

  const showPeriodColumn = view === 'level3';

  return (
    <div className="admin-card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1180px]">
          <thead>
            <tr className="border-b border-outline-variant text-sm font-semibold text-on-surface bg-surface-container-low">
              <th className="px-4 py-3">单据编号</th>
              {showPeriodColumn && <th className="px-4 py-3">所属周期</th>}
              <th className="px-4 py-3">客户</th>
              <th className="px-4 py-3">合同</th>
              <th className="px-4 py-3">运营中心</th>
              <th className="px-4 py-3">产能人天</th>
              <th className="px-4 py-3">金额</th>
              {view === 'level5' && <th className="px-4 py-3">关联四级批次</th>}
              {view === 'level5' && <th className="px-4 py-3">审批层级</th>}
              {view === 'level4' && <th className="px-4 py-3">发票状态</th>}
              {view === 'level5' && <th className="px-4 py-3">回款状态</th>}
              <th className="px-4 py-3">当前状态</th>
              <th className="px-4 py-3">办理人</th>
              <th className="px-4 py-3">更新时间</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {rows.map((item) => (
              <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-4 py-4 font-semibold text-on-surface">{item.id}</td>
                {showPeriodColumn && <td className="px-4 py-4 text-on-surface-variant whitespace-nowrap">{item.period}</td>}
                <td className="px-4 py-4 text-on-surface-variant">{item.customer}</td>
                <td className="px-4 py-4 text-on-surface-variant">{item.contract}</td>
                <td className="px-4 py-4 text-on-surface-variant">{item.operationCenter}</td>
                <td className="px-4 py-4 text-on-surface font-medium">{item.workDays}</td>
                <td className="px-4 py-4 text-on-surface font-medium">¥{item.amount.toLocaleString()}</td>
                {view === 'level5' && (
                  <td className="px-4 py-4">
                    {item.relatedLevelFourId ? (
                      <button
                        type="button"
                        onClick={() => onRelatedLevelFourClick?.(item.relatedLevelFourId!)}
                        className="text-primary hover:underline transition-colors"
                      >
                        {item.relatedLevelFourId}
                      </button>
                    ) : (
                      <span className="text-on-surface-variant">--</span>
                    )}
                  </td>
                )}
                {view === 'level5' && <td className="px-4 py-4 text-on-surface-variant">{item.approverLevel || '--'}</td>}
                {view === 'level4' && <td className="px-4 py-4 text-on-surface-variant">{item.invoiceStatus || '--'}</td>}
                {view === 'level5' && <td className="px-4 py-4 text-on-surface-variant">{item.receiptStatus || '--'}</td>}
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColorMap[item.status] || 'bg-cyan-100 text-primary'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-on-surface-variant">{item.handler}</td>
                <td className="px-4 py-4 text-on-surface-variant text-xs whitespace-nowrap">{item.updatedAt}</td>
                <td className="px-4 py-4 text-center whitespace-nowrap">
                  <button
                    onClick={() => onDetailClick?.(item.id)}
                    className="text-primary hover:underline text-sm mr-3 transition-colors"
                  >
                    详情
                  </button>
                  {isProcessingStatus(item.status) && (
                    <button
                      onClick={() => handleRevoke(item.id)}
                      className="text-amber-600 hover:underline text-sm mr-3 transition-colors"
                    >
                      撤销
                    </button>
                  )}
                  {item.status === '已撤销' && (
                    <button
                      onClick={() => handleRestart(item.id)}
                      className="text-primary hover:underline text-sm mr-3 transition-colors"
                    >
                      重新发起
                    </button>
                  )}
                  <button className="text-red-500 hover:underline text-sm transition-colors">导出</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant px-4 py-3 bg-white">
        <div className="text-sm text-on-surface-variant">
          共 <span className="text-on-surface font-medium">{rows.length}</span> 条记录，每页显示 10 条
        </div>
        <div className="flex items-center gap-1.5">
          <button className="h-7 w-7 flex items-center justify-center rounded border border-outline-variant bg-white text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">&lt;</button>
          <button className="h-7 min-w-[28px] px-2 rounded bg-primary text-white text-sm font-medium">1</button>
          <button className="h-7 min-w-[28px] px-2 rounded border border-outline-variant bg-white text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">2</button>
          <button className="h-7 w-7 flex items-center justify-center rounded border border-outline-variant bg-white text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">&gt;</button>
        </div>
      </div>
    </div>
  );
};