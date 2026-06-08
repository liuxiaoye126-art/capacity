import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Download, Eye, FileSpreadsheet, RotateCcw, Save, Send, Upload, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { MainFooterPortal } from '../components/layout/Shell';
import { CapacityRecord, LEVEL3_DATA, normalizeApprovalStatus } from '../types';
import { findRecognizedLevelFourAdjustment } from '../utils/levelFourRecognition';

interface LevelFourDetailPageProps {
  record: CapacityRecord;
  onBack: () => void;
  onOpenLevelThreeSource?: (id: string) => void;
}

interface PositionTemplate {
  position: string;
  members: Array<{
    name: string;
    project?: string;
    monthlyDays: number[];
  }>;
}

interface DailyCapacityRow {
  id: string;
  summaryId: string;
  month: string;
  date: string;
  project: string;
  position: string;
  member: string;
  unitPrice: number;
  level3Days: number;
  level4Days: number;
  level3Amount: number;
  level4Amount: number;
  reason: string;
  modified: boolean;
}

interface PersonMonthlyRow {
  id: string;
  month: string;
  project: string;
  position: string;
  member: string;
  unitPrice: number;
  level3Days: number;
  level4Days: number;
  level3Amount: number;
  level4Amount: number;
  hasDiff: boolean;
  modified: boolean;
}

interface DailyDetailDisplayRow {
  id: string;
  date: string;
  isWorkday: boolean;
  level3Days: number;
  level4Days: number;
  level4Amount: number;
  reason: string;
  hasDiff: boolean;
  modified: boolean;
}

interface PositionSummaryRow {
  id: string;
  position: string;
  unitPrice: number;
  level3Days: number;
  level4Days: number;
  level3Amount: number;
  level4Amount: number;
  hasDiff: boolean;
  modified: boolean;
}

interface InvoiceFormState {
  invoiceNumber: string;
  invoiceCode: string;
  invoiceDate: string;
  taxInclusiveAmount: string;
  taxRate: string;
  attachmentName: string;
}

interface UploadedInvoiceItem extends InvoiceFormState {
  id: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface ApprovalLogItem {
  id: string;
  node: string;
  handler: string;
  time: string;
  action: string;
  detail: string;
}

interface RelatedLevelThreeBatch {
  id: string;
  customer: string;
  contract: string;
  operationCenter: string;
  workDays: number;
  amount: number;
  handler: string;
}

const sampleRelatedLevelThreeMap: Record<string, string[]> = {
  'L4-2026Q1-001': ['L3-2026Q1-001', 'L3-2026Q1-004'],
  'L4-2026Q1-002': ['L3-2026Q1-002', 'L3-2026Q1-005'],
  'L4-2026Q1-003': ['L3-2026Q1-003', 'L3-2026Q1-006'],
  'L4-2026Q1-004': ['L3-2026Q1-001', 'L3-2026Q1-004'],
  'L4-2026Q1-005': ['L3-2026Q1-002', 'L3-2026Q1-005'],
  'L4-2026Q1-006': ['L3-2026Q1-003', 'L3-2026Q1-006'],
};

type QuickFilter = 'all' | 'diff' | 'modified';
type DailyDetailFilter = 'all' | 'workday' | 'diff' | 'modified';
type AdjustmentType = 'capacity' | 'amount';

interface AdjustmentRecord {
  id: string;
  summaryId: string;
  type: AdjustmentType;
  beforeValue: number;
  afterValue: number;
  reason: string;
  operator: string;
  time: string;
}

const QUARTER_MONTHS = ['1月', '2月', '3月'];

const statusColorMap: Record<string, string> = {
  '待提交': 'bg-amber-100 text-amber-700',
  '待审核': 'bg-sky-100 text-sky-700',
  '待上传发票': 'bg-cyan-100 text-cyan-700',
  '待归档': 'bg-violet-100 text-violet-700',
  '已归档': 'bg-emerald-100 text-emerald-700',
};

const roundValue = (value: number) => Number(value.toFixed(2));

const formatNumber = (value: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  });

const formatCurrency = (value: number) =>
  `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: Math.abs(value % 1) > 0.001 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;

const nowText = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getPeriodYear = (period: string) => Number(period.match(/(\d{4})/)?.[1] || '2026');

const getSourceLevelThreeId = (record: CapacityRecord) => {
  if (record.customer === '上海银行') {
    return 'L3-2026Q1-001';
  }

  if (record.customer === '浦发银行') {
    return 'L3-2026Q1-002';
  }

  return 'L3-2026Q1-003';
};

const getRelatedLevelThreeBatches = (record: CapacityRecord): RelatedLevelThreeBatch[] => {
  if (record.customer === '中国银行') {
    const relatedIds = record.relatedLevelThreeIds && record.relatedLevelThreeIds.length
      ? record.relatedLevelThreeIds
      : LEVEL3_DATA.filter(
          (item) =>
            item.status === '已通过'
            && item.customer === '中国银行'
            && item.contract === record.contract,
        ).map((item) => item.id);

    const matchedRows = relatedIds
      .map((id) => LEVEL3_DATA.find((item) => item.id === id))
      .filter((item): item is CapacityRecord => Boolean(item));

    const totalWorkDays = roundValue(matchedRows.reduce((sum, item) => sum + item.workDays, 0));
    const totalAmount = roundValue(matchedRows.reduce((sum, item) => sum + item.amount, 0));

    return [
      {
        id: `${record.id}-L3-TOTAL`,
        customer: '中国银行',
        contract: record.contract,
        operationCenter: '总部运营中心',
        workDays: totalWorkDays || record.workDays,
        amount: totalAmount || record.amount,
        handler: record.handler,
      },
    ];
  }

  const sampleIds = sampleRelatedLevelThreeMap[record.id] || [];
  const relatedIds = record.relatedLevelThreeIds && record.relatedLevelThreeIds.length > 1
    ? record.relatedLevelThreeIds
    : sampleIds.length > 1
      ? sampleIds
    : LEVEL3_DATA.filter(
        (item) =>
          item.status === '已通过'
          && item.customer === record.customer
          && item.contract === record.contract
          && item.operationCenter === record.operationCenter
          && Math.abs(item.amount - record.amount) < 0.01
          && Math.abs(item.workDays - record.workDays) < 0.01,
      ).map((item) => item.id);

  const fallbackIds = relatedIds.length ? relatedIds : [getSourceLevelThreeId(record)];

  return fallbackIds
    .map((id) => LEVEL3_DATA.find((item) => item.id === id))
    .filter((item): item is CapacityRecord => Boolean(item))
    .map((item) => ({
      id: item.id,
      customer: item.customer,
      contract: item.contract,
      operationCenter: item.operationCenter,
      workDays: item.workDays,
      amount: item.amount,
      handler: item.handler,
    }));
};

const createWorkdayDates = (year: number, monthNumber: number) => {
  const dates: string[] = [];
  const currentDate = new Date(year, monthNumber - 1, 1);

  while (currentDate.getMonth() === monthNumber - 1) {
    const weekDay = currentDate.getDay();

    if (weekDay !== 0 && weekDay !== 6) {
      dates.push(`${monthNumber}月${String(currentDate.getDate()).padStart(2, '0')}日`);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

const createMonthDates = (year: number, monthNumber: number) => {
  const dates: Array<{ date: string; isWorkday: boolean }> = [];
  const currentDate = new Date(year, monthNumber - 1, 1);

  while (currentDate.getMonth() === monthNumber - 1) {
    const weekDay = currentDate.getDay();

    dates.push({
      date: `${monthNumber}月${String(currentDate.getDate()).padStart(2, '0')}日`,
      isWorkday: weekDay !== 0 && weekDay !== 6,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

const createDailyCapacities = (totalDays: number, workdayCount: number) => {
  const safeTotal = Math.max(0, totalDays);
  const wholeDays = Math.floor(safeTotal);
  const remainder = roundValue(safeTotal - wholeDays);
  const capacities = Array.from({ length: workdayCount }, () => 0);

  for (let index = 0; index < Math.min(wholeDays, workdayCount); index += 1) {
    capacities[index] = 1;
  }

  if (remainder > 0 && wholeDays < workdayCount) {
    capacities[wholeDays] = remainder;
  }

  return capacities;
};

const matchesQuickFilter = ({ hasDiff, modified }: { hasDiff: boolean; modified: boolean }, filter: QuickFilter) => {
  if (filter === 'diff') {
    return hasDiff;
  }

  if (filter === 'modified') {
    return modified;
  }

  return true;
};

const createTemplates = (record: CapacityRecord): PositionTemplate[] => {
  if (record.customer === '中国银行') {
    return [
      {
        position: '高级',
        members: [
          { name: '周子航', project: '中行北京', monthlyDays: [20, 21, 20] },
          { name: '孙雨桐', project: '中行上海', monthlyDays: [19, 20, 21] },
          { name: '韩一鸣', project: '中行武汉', monthlyDays: [20, 20, 20] },
        ],
      },
      {
        position: '中级',
        members: [
          { name: '徐嘉宁', project: '中行珠海', monthlyDays: [19, 20, 20] },
          { name: '魏晨曦', project: '中行深圳', monthlyDays: [20, 19, 20] },
          { name: '许安然', project: '中行成都', monthlyDays: [20, 20, 21] },
        ],
      },
      {
        position: '初级',
        members: [
          { name: '蒋明轩', project: '中行西安', monthlyDays: [20, 19, 19] },
          { name: '沈若溪', project: '中行合肥', monthlyDays: [19, 19, 20] },
        ],
      },
    ];
  }

  if (record.customer === '上海银行') {
    return [
      {
        position: '高级',
        members: [
          { name: '刘晨', monthlyDays: [21, 22, 21] },
          { name: '吴楠', monthlyDays: [20, 21, 22] },
          { name: '程浩', monthlyDays: [19, 20, 21] },
        ],
      },
      {
        position: '中级',
        members: [
          { name: '周颖', monthlyDays: [21, 21, 20] },
          { name: '孙怡', monthlyDays: [20, 21, 21] },
        ],
      },
      {
        position: '初级',
        members: [
          { name: '赵悦', monthlyDays: [22, 21, 20] },
          { name: '唐欣', monthlyDays: [19, 20, 21] },
        ],
      },
    ];
  }

  if (record.position === '资深') {
    return [
      {
        position: '资深',
        members: [
          { name: '黄璐', monthlyDays: [22, 21, 22] },
          { name: '陈卓', monthlyDays: [21, 21, 20] },
          { name: '梁骁', monthlyDays: [20, 21, 21] },
        ],
      },
      {
        position: '高级',
        members: [
          { name: '李彤', monthlyDays: [21, 20, 21] },
          { name: '许铭', monthlyDays: [20, 21, 21] },
        ],
      },
      {
        position: '初级',
        members: [
          { name: '宋倩', monthlyDays: [22, 20, 21] },
          { name: '杨澄', monthlyDays: [19, 21, 20] },
        ],
      },
    ];
  }

  return [
    {
      position: record.position,
      members: [
        { name: '黄璐', monthlyDays: [22, 21, 21] },
        { name: '陈卓', monthlyDays: [21, 21, 20] },
        { name: '徐青', monthlyDays: [20, 22, 21] },
      ],
    },
    {
      position: '高级',
      members: [
        { name: '李彤', monthlyDays: [21, 20, 21] },
        { name: '许铭', monthlyDays: [20, 21, 21] },
      ],
    },
    {
      position: '初级',
      members: [
        { name: '宋倩', monthlyDays: [22, 21, 20] },
        { name: '杨澄', monthlyDays: [19, 20, 21] },
      ],
    },
  ];
};

const createDailyRows = (record: CapacityRecord): DailyCapacityRow[] => {
  const unitPrice = record.workDays ? record.amount / record.workDays : 0;
  const periodYear = getPeriodYear(record.period);

  return createTemplates(record).flatMap((item) =>
    item.members.flatMap((member, memberIndex) =>
      QUARTER_MONTHS.flatMap((month, monthIndex) => {
        const monthNumber = monthIndex + 1;
        const summaryId = `${record.id}-${item.position}-${memberIndex + 1}-${month}`;
        const workdayDates = createWorkdayDates(periodYear, monthNumber);
        const dailyCapacities = createDailyCapacities(member.monthlyDays[monthIndex] || 0, workdayDates.length);

        const baseRows = workdayDates.map((date, dayIndex) => {
          const level3Days = dailyCapacities[dayIndex] || 0;

          return {
            id: `${summaryId}-${dayIndex + 1}`,
            summaryId,
            month,
            date,
            project: member.project || record.project,
            position: item.position,
            member: member.name,
            unitPrice,
            level3Days,
            level4Days: level3Days,
            level3Amount: roundValue(level3Days * unitPrice),
            level4Amount: roundValue(level3Days * unitPrice),
            reason: '',
            modified: false,
          };
        });

        const recognizedAdjustment = findRecognizedLevelFourAdjustment(record.id, member.name, month, item.position);

        if (recognizedAdjustment?.dailyAdjustments?.length) {
          const adjustmentMap = new Map(recognizedAdjustment.dailyAdjustments.map((adjustment) => [adjustment.date, adjustment]));

          return baseRows.map((row) => {
            const matchedAdjustment = adjustmentMap.get(row.date);

            if (!matchedAdjustment) {
              return row;
            }

            const nextLevel4Days = roundValue(Math.max(0, row.level3Days + matchedAdjustment.delta));

            return {
              ...row,
              level4Days: nextLevel4Days,
              level4Amount: roundValue(nextLevel4Days * unitPrice),
              reason: matchedAdjustment.reason || recognizedAdjustment.reason,
              modified: true,
            };
          });
        }

        if (typeof recognizedAdjustment?.capacityDelta === 'number') {
          const nextTotalLevel4Days = roundValue(
            Math.max(0, baseRows.reduce((sum, row) => sum + row.level3Days, 0) + recognizedAdjustment.capacityDelta),
          );
          const redistributedCapacities = createDailyCapacities(nextTotalLevel4Days, baseRows.length);

          return baseRows.map((row, index) => {
            const nextLevel4Days = redistributedCapacities[index] ?? 0;
            return {
              ...row,
              level4Days: nextLevel4Days,
              level4Amount: roundValue(nextLevel4Days * unitPrice),
              modified: true,
            };
          });
        }

        return baseRows;
      }),
    ),
  );
};

const createInitialAmountOverrides = (record: CapacityRecord, rows: DailyCapacityRow[]) => {
  const overrides: Record<string, number> = {};
  const summaryRows = buildMonthlyRows(rows, {});

  summaryRows.forEach((row) => {
    const recognizedAdjustment = findRecognizedLevelFourAdjustment(record.id, row.member, row.month, row.position);

    if (typeof recognizedAdjustment?.amountDelta === 'number') {
      overrides[row.id] = roundValue(row.level4Amount + recognizedAdjustment.amountDelta);
    }
  });

  return overrides;
};

const createInitialAdjustmentHistoryMap = (record: CapacityRecord, rows: DailyCapacityRow[]) => {
  const historyMap: Record<string, AdjustmentRecord[]> = {};
  const summaryRows = buildMonthlyRows(rows, {});

  summaryRows.forEach((row) => {
    const recognizedAdjustment = findRecognizedLevelFourAdjustment(record.id, row.member, row.month, row.position);

    if (!recognizedAdjustment) {
      return;
    }

    const histories: AdjustmentRecord[] = [];

    if (recognizedAdjustment.dailyAdjustments?.length) {
      histories.push({
        id: `${row.id}-daily-recognized`,
        summaryId: row.id,
        type: 'capacity',
        beforeValue: row.level3Days,
        afterValue: row.level4Days,
        reason: recognizedAdjustment.reason,
        operator: '系统识别',
        time: '确认单识别回填',
      });
    } else if (typeof recognizedAdjustment.capacityDelta === 'number') {
      histories.push({
        id: `${row.id}-capacity-recognized`,
        summaryId: row.id,
        type: 'capacity',
        beforeValue: row.level3Days,
        afterValue: row.level4Days,
        reason: recognizedAdjustment.reason,
        operator: '系统识别',
        time: '确认单识别回填',
      });
    }

    if (typeof recognizedAdjustment.amountDelta === 'number') {
      histories.unshift({
        id: `${row.id}-amount-recognized`,
        summaryId: row.id,
        type: 'amount',
        beforeValue: row.level4Amount,
        afterValue: roundValue(row.level4Amount + recognizedAdjustment.amountDelta),
        reason: recognizedAdjustment.reason,
        operator: '系统识别',
        time: '确认单识别回填',
      });
    }

    if (histories.length) {
      historyMap[row.id] = histories;
    }
  });

  return historyMap;
};

const buildMonthlyRows = (rows: DailyCapacityRow[], amountOverrides: Record<string, number>): PersonMonthlyRow[] => {
  const grouped = new Map<string, Omit<PersonMonthlyRow, 'hasDiff'>>();

  rows.forEach((item) => {
    const existing = grouped.get(item.summaryId);

    if (existing) {
      existing.level3Days = roundValue(existing.level3Days + item.level3Days);
      existing.level4Days = roundValue(existing.level4Days + item.level4Days);
      existing.level3Amount = roundValue(existing.level3Amount + item.level3Amount);
      existing.level4Amount = roundValue(existing.level4Amount + item.level4Amount);
      existing.modified = existing.modified || item.modified;
      return;
    }

    grouped.set(item.summaryId, {
      id: item.summaryId,
      month: item.month,
      project: item.project,
      position: item.position,
      member: item.member,
      unitPrice: item.unitPrice,
      level3Days: item.level3Days,
      level4Days: item.level4Days,
      level3Amount: item.level3Amount,
      level4Amount: item.level4Amount,
      modified: item.modified,
    });
  });

  return Array.from(grouped.values()).map((item) => {
    const level4Amount = roundValue(amountOverrides[item.id] ?? item.level4Amount);
    const amountModified = Object.prototype.hasOwnProperty.call(amountOverrides, item.id);

    return {
      ...item,
      level4Amount,
      hasDiff:
        Math.abs(item.level3Days - item.level4Days) > 0.01 ||
        Math.abs(item.level3Amount - level4Amount) > 0.01,
      modified: item.modified || amountModified,
    };
  });
};

const createInitialInvoiceForm = (record: CapacityRecord): InvoiceFormState => ({
  invoiceNumber: '',
  invoiceCode: '',
  invoiceDate: '',
  taxInclusiveAmount: '',
  taxRate: '6',
  attachmentName: '',
});

const createDraftInvoiceForm = (
  record: CapacityRecord,
  attachmentName: string,
  index: number,
  amount: number,
): InvoiceFormState => ({
  invoiceNumber: `3100${record.id.slice(-6)}${String(index).padStart(2, '0')}`,
  invoiceCode: `0440${record.id.slice(-4)}${String(index).padStart(2, '0')}`,
  invoiceDate: nowText().slice(0, 10),
  taxInclusiveAmount: String(roundValue(amount)),
  taxRate: '6',
  attachmentName,
});

const createPendingInvoiceForms = (
  record: CapacityRecord,
  fileNames: string[],
  uploadedCount: number,
  targetAmount: number,
) => {
  if (!fileNames.length) {
    return [];
  }

  const safeTargetAmount = roundValue(Math.max(targetAmount, 0));
  const baseAmount = fileNames.length ? roundValue(safeTargetAmount / fileNames.length) : 0;
  let allocatedAmount = 0;

  return fileNames.map((fileName, index) => {
    const isLast = index === fileNames.length - 1;
    const nextAmount = isLast ? roundValue(safeTargetAmount - allocatedAmount) : baseAmount;
    allocatedAmount = roundValue(allocatedAmount + nextAmount);

    return createDraftInvoiceForm(record, fileName, uploadedCount + index + 1, nextAmount);
  });
};

const createInitialInvoices = (record: CapacityRecord): UploadedInvoiceItem[] => {
  if (record.status !== '已归档' && record.invoiceStatus !== '已上传发票') {
    return [];
  }

  const firstAmount = roundValue(record.amount * 0.55);
  const secondAmount = roundValue(record.amount - firstAmount);

  return [
    {
      id: `${record.id}-invoice-1`,
      invoiceNumber: `3100${record.id.slice(-6)}01`,
      invoiceCode: `0440${record.id.slice(-4)}01`,
      invoiceDate: '2026-04-12',
      taxInclusiveAmount: String(firstAmount),
      taxRate: '6',
      attachmentName: `${record.customer}_${record.period}_发票_01.pdf`,
      uploadedBy: record.handler,
      uploadedAt: '2026-04-12 15:20',
    },
    {
      id: `${record.id}-invoice-2`,
      invoiceNumber: `3100${record.id.slice(-6)}02`,
      invoiceCode: `0440${record.id.slice(-4)}02`,
      invoiceDate: '2026-04-12',
      taxInclusiveAmount: String(secondAmount),
      taxRate: '6',
      attachmentName: `${record.customer}_${record.period}_发票_02.pdf`,
      uploadedBy: record.handler,
      uploadedAt: '2026-04-12 15:28',
    },
  ];
};

const createApprovalLogs = (record: CapacityRecord): ApprovalLogItem[] => [
  {
    id: `${record.id}-log-1`,
    node: record.customer === '中国银行' ? '运营中心负责人发起' : '销售发起',
    handler: record.handler,
    time: '2026-04-08 14:20',
    action: record.customer === '中国银行' ? '申请开票' : '初始化四级申请',
    detail: record.customer === '中国银行'
      ? '运营中心负责人基于三级确认数据发起四级开票申请。'
      : '基于三级确认后的生效数据生成四级开票申请。',
  },
  {
    id: `${record.id}-log-2`,
    node: record.customer === '中国银行' ? '财务开票' : '审批流转',
    handler: record.customer === '中国银行' ? '财务' : (record.approverLevel === '总部审批' ? '总部运营中心' : '分中心负责人'),
    time: '2026-04-09 09:30',
    action: record.customer === '中国银行' ? '开票上传' : '待审核',
    detail: record.customer === '中国银行'
      ? '财务完成开票并上传发票附件。'
      : '等待审批人核对四级产能与三级确认结果差异。',
  },
  {
    id: `${record.id}-log-3`,
    node: '财务开票上传',
    handler: '陈敏',
    time: '2026-04-10 14:20',
    action: '上传发票',
    detail: '财务完成开票并上传发票附件，等待销售归档确认。',
  },
  {
    id: `${record.id}-log-4`,
    node: record.customer === '中国银行' ? '运营中心负责人归档' : '销售归档',
    handler: record.handler,
    time: '2026-04-10 16:05',
    action: '确认归档',
    detail: record.customer === '中国银行'
      ? '运营中心负责人确认发票状态后执行归档。'
      : '销售确认发票已发送客户后执行归档。',
  },
];

const RowTags = ({ hasDiff, modified }: { hasDiff: boolean; modified: boolean }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {hasDiff && <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">差异</span>}
    {modified && <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700">已修改</span>}
  </div>
);

const QuickFilterTabs = ({ value, onChange }: { value: QuickFilter; onChange: (value: QuickFilter) => void }) => {
  const options: Array<{ key: QuickFilter; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'diff', label: '仅看差异' },
    { key: 'modified', label: '仅看已修改' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
            value === option.key
              ? 'bg-primary text-white'
              : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const SectionTitle = ({ title, extra }: { title: string; extra?: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3">
    <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
      <span className="panel-title-accent"></span>
      {title}
    </h3>
    {extra}
  </div>
);

export const LevelFourDetailPage = ({ record, onBack, onOpenLevelThreeSource }: LevelFourDetailPageProps) => {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [memberKeyword, setMemberKeyword] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [selectedMonthlyDetailId, setSelectedMonthlyDetailId] = useState('');
  const [dailyDetailFilter, setDailyDetailFilter] = useState<DailyDetailFilter>('all');
  const initialPersonRows = useMemo(() => createDailyRows(record), [record]);
  const initialAmountOverrides = useMemo(() => createInitialAmountOverrides(record, initialPersonRows), [initialPersonRows, record]);
  const initialAdjustmentHistoryMap = useMemo(
    () => createInitialAdjustmentHistoryMap(record, initialPersonRows),
    [initialPersonRows, record],
  );

  const [personRows, setPersonRows] = useState<DailyCapacityRow[]>(() => initialPersonRows);
  const [amountOverrides, setAmountOverrides] = useState<Record<string, number>>(() => initialAmountOverrides);
  const [adjustmentHistoryMap, setAdjustmentHistoryMap] = useState<Record<string, AdjustmentRecord[]>>(() => initialAdjustmentHistoryMap);
  const [adjustmentModal, setAdjustmentModal] = useState<{ summaryId: string; type: AdjustmentType } | null>(null);
  const [draftAdjustmentValue, setDraftAdjustmentValue] = useState('');
  const [draftAdjustmentReason, setDraftAdjustmentReason] = useState('');
  const [currentStatus, setCurrentStatus] = useState(record.status);
  const [currentInvoiceStatus, setCurrentInvoiceStatus] = useState(record.invoiceStatus || '--');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [pendingInvoiceForms, setPendingInvoiceForms] = useState<InvoiceFormState[]>([]);
  const [uploadedInvoices, setUploadedInvoices] = useState<UploadedInvoiceItem[]>(() => createInitialInvoices(record));
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [totalAdjustmentModalOpen, setTotalAdjustmentModalOpen] = useState(false);
  const [draftTotalAdjustmentAmount, setDraftTotalAdjustmentAmount] = useState('');
  const [draftTotalAdjustmentReason, setDraftTotalAdjustmentReason] = useState('');
  const [totalAdjustmentAmount, setTotalAdjustmentAmount] = useState('');
  const [totalAdjustmentReason, setTotalAdjustmentReason] = useState('');
  const [totalAdjustmentTouched, setTotalAdjustmentTouched] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [archiveConfirmModalOpen, setArchiveConfirmModalOpen] = useState(false);
  const [archiveCustomerSent, setArchiveCustomerSent] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<UploadedInvoiceItem | null>(null);

  const initialPersonRowMap = useMemo(
    () => new Map(initialPersonRows.map((item) => [item.id, item])),
    [initialPersonRows],
  );

  useEffect(() => {
    setQuickFilter('all');
    setMemberKeyword('');
    setMonthFilter('');
    setPositionFilter('');
    setSelectedMonthlyDetailId('');
    setDailyDetailFilter('all');
    setPersonRows(initialPersonRows);
    setAmountOverrides(initialAmountOverrides);
    setAdjustmentHistoryMap(initialAdjustmentHistoryMap);
    setAdjustmentModal(null);
    setDraftAdjustmentValue('');
    setDraftAdjustmentReason('');
    setCurrentStatus(normalizeApprovalStatus(record.status));
    setCurrentInvoiceStatus(record.invoiceStatus || '--');
    setPendingInvoiceForms([]);
    setUploadedInvoices(createInitialInvoices(record));
    setLogsExpanded(false);
    setTotalAdjustmentModalOpen(false);
    setDraftTotalAdjustmentAmount('');
    setDraftTotalAdjustmentReason('');
    setTotalAdjustmentAmount('');
    setTotalAdjustmentReason('');
    setTotalAdjustmentTouched(false);
    setLastSavedAt('');
    setArchiveConfirmModalOpen(false);
    setArchiveCustomerSent(false);
    setPreviewInvoice(null);
  }, [initialAdjustmentHistoryMap, initialAmountOverrides, initialPersonRows, record]);

  const relatedLevelThreeBatches = useMemo(() => getRelatedLevelThreeBatches(record), [record]);
  const canEdit = currentStatus === '待提交';
  const canReview = currentStatus === '待审核';
  const canUploadInvoice = currentStatus === '待上传发票';
  const canArchive = currentStatus === '待归档';
  const showInvoiceSection = ['待上传发票', '待归档', '已归档'].includes(currentStatus);
  const approvalLogs = useMemo(() => createApprovalLogs(record), [record]);

  const monthlyRows = useMemo(() => buildMonthlyRows(personRows, amountOverrides), [amountOverrides, personRows]);

  const filteredPersonRows = useMemo(
    () =>
      monthlyRows.filter((item) => {
        const matchedQuickFilter = matchesQuickFilter(item, quickFilter);
        const matchedMember = !memberKeyword.trim() || item.member.includes(memberKeyword.trim());
        const matchedPosition = !positionFilter || item.position === positionFilter;
        const matchedMonth = !monthFilter || item.month === monthFilter;

        return matchedQuickFilter && matchedMember && matchedPosition && matchedMonth;
      }),
    [memberKeyword, monthFilter, monthlyRows, positionFilter, quickFilter],
  );

  const positionOptions = useMemo(
    () => Array.from(new Set(monthlyRows.map((item) => item.position))),
    [monthlyRows],
  );

  useEffect(() => {
    if (selectedMonthlyDetailId && !filteredPersonRows.some((item) => item.id === selectedMonthlyDetailId)) {
      setSelectedMonthlyDetailId('');
    }
  }, [filteredPersonRows, selectedMonthlyDetailId]);

  useEffect(() => {
    setDailyDetailFilter('all');
  }, [selectedMonthlyDetailId]);

  const selectedMonthlyRow = useMemo(
    () => filteredPersonRows.find((item) => item.id === selectedMonthlyDetailId) || null,
    [filteredPersonRows, selectedMonthlyDetailId],
  );

  const selectedDailyRows = useMemo(
    () => personRows.filter((item) => item.summaryId === selectedMonthlyDetailId),
    [personRows, selectedMonthlyDetailId],
  );

  const selectedDailyDisplayRows = useMemo<DailyDetailDisplayRow[]>(() => {
    if (!selectedMonthlyRow) {
      return [];
    }

    const periodYear = getPeriodYear(record.period);
    const monthNumber = Number(selectedMonthlyRow.month.replace('月', ''));
    const rowMap = new Map(selectedDailyRows.map((item) => [item.date, item]));

    return createMonthDates(periodYear, monthNumber).map(({ date, isWorkday }) => {
      const existing = rowMap.get(date);

      if (existing) {
        return {
          id: existing.id,
          date: existing.date,
          isWorkday,
          level3Days: existing.level3Days,
          level4Days: existing.level4Days,
          level4Amount: existing.level4Amount,
          reason: existing.reason,
          hasDiff: Math.abs(existing.level3Days - existing.level4Days) > 0.01,
          modified: existing.modified,
        };
      }

      return {
        id: `${selectedMonthlyRow.id}-${date}`,
        date,
        isWorkday,
        level3Days: 0,
        level4Days: 0,
        level4Amount: 0,
        reason: '',
        hasDiff: false,
        modified: false,
      };
    });
  }, [record.period, selectedDailyRows, selectedMonthlyRow]);

  const filteredDailyDetailRows = useMemo(() => {
    if (dailyDetailFilter === 'workday') {
      return selectedDailyDisplayRows.filter((item) => item.isWorkday);
    }

    if (dailyDetailFilter === 'diff') {
      return selectedDailyDisplayRows.filter((item) => item.hasDiff);
    }

    if (dailyDetailFilter === 'modified') {
      return selectedDailyDisplayRows.filter((item) => item.modified);
    }

    return selectedDailyDisplayRows;
  }, [dailyDetailFilter, selectedDailyDisplayRows]);

  const totalPositionSummary = useMemo(() => {
    const level3Days = roundValue(monthlyRows.reduce((sum, item) => sum + item.level3Days, 0));
    const level4Days = roundValue(monthlyRows.reduce((sum, item) => sum + item.level4Days, 0));
    const level3Amount = roundValue(monthlyRows.reduce((sum, item) => sum + item.level3Amount, 0));
    const level4Amount = roundValue(monthlyRows.reduce((sum, item) => sum + item.level4Amount, 0));
    const adjustmentAmount = Number(totalAdjustmentAmount) || 0;
    const adjustedLevel4Amount = roundValue(level4Amount + adjustmentAmount);

    return {
      level3Days,
      level4Days,
      level3Amount,
      level4Amount,
      adjustmentAmount,
      adjustedLevel4Amount,
      hasDiff:
        Math.abs(level3Days - level4Days) > 0.01 ||
        Math.abs(level3Amount - adjustedLevel4Amount) > 0.01,
    };
  }, [monthlyRows, totalAdjustmentAmount]);

  useEffect(() => {
    if (totalAdjustmentTouched) {
      return;
    }

    setTotalAdjustmentAmount(String(roundValue(totalPositionSummary.level3Amount - totalPositionSummary.level4Amount)));
  }, [totalAdjustmentTouched, totalPositionSummary.level3Amount, totalPositionSummary.level4Amount]);

  const selectedMonthlyHasModifiedRows = useMemo(
    () => personRows.some((item) => item.summaryId === selectedMonthlyDetailId && item.modified),
    [personRows, selectedMonthlyDetailId],
  );

  const filteredHasModifiedRows = useMemo(
    () => filteredPersonRows.some((item) => item.modified),
    [filteredPersonRows],
  );

  const uploadedInvoiceAmount = useMemo(
    () => roundValue(uploadedInvoices.reduce((sum, item) => sum + Number(item.taxInclusiveAmount || 0), 0)),
    [uploadedInvoices],
  );
  const invoiceAmountGap = roundValue(uploadedInvoiceAmount - totalPositionSummary.adjustedLevel4Amount);
  const invoiceCompareMatched =
    uploadedInvoices.length > 0 &&
    Math.abs(invoiceAmountGap) <= 0.01;
  const invoiceCompareStatusText = currentStatus === '已归档'
    ? '金额匹配，已归档'
    : invoiceCompareMatched
      ? currentStatus === '待归档'
        ? '金额匹配，待销售归档'
        : '金额匹配，可归档'
      : currentStatus === '待上传发票'
        ? '待补齐上传金额'
        : currentStatus === '待归档'
          ? '待补齐上传金额'
          : '待审批通过后上传';

  const updateDailyLevel4Days = (id: string, value: string) => {
    const level4Days = Math.max(0, Number(value) || 0);

    setPersonRows((prev) => {
      let matched = false;

      const nextRows = prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        matched = true;

        return {
          ...item,
          level4Days,
          level4Amount: roundValue(level4Days * item.unitPrice),
          modified: true,
        };
      });

      if (matched || !selectedMonthlyRow) {
        return nextRows;
      }

      const baselineRow = selectedDailyDisplayRows.find((item) => item.id === id);
      const baselineLevel3Days = baselineRow?.level3Days || 0;

      return [
        ...nextRows,
        {
          id,
          summaryId: selectedMonthlyRow.id,
          month: selectedMonthlyRow.month,
          date: id.replace(`${selectedMonthlyRow.id}-`, ''),
          project: selectedMonthlyRow.project,
          position: selectedMonthlyRow.position,
          member: selectedMonthlyRow.member,
          unitPrice: selectedMonthlyRow.unitPrice,
          level3Days: baselineLevel3Days,
          level4Days,
          level3Amount: roundValue(baselineLevel3Days * selectedMonthlyRow.unitPrice),
          level4Amount: roundValue(level4Days * selectedMonthlyRow.unitPrice),
          reason: '',
          modified: true,
        },
      ];
    });
  };

  const updateDailyAdjustmentReason = (id: string, value: string) => {
    setPersonRows((prev) => {
      let matched = false;

      const nextRows = prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        matched = true;

        return {
          ...item,
          reason: value,
          modified: true,
        };
      });

      if (matched || !selectedMonthlyRow || !value.trim()) {
        return nextRows;
      }

      const baselineRow = selectedDailyDisplayRows.find((item) => item.id === id);
      const baselineLevel3Days = baselineRow?.level3Days || 0;

      return [
        ...nextRows,
        {
          id,
          summaryId: selectedMonthlyRow.id,
          month: selectedMonthlyRow.month,
          date: id.replace(`${selectedMonthlyRow.id}-`, ''),
          project: selectedMonthlyRow.project,
          position: selectedMonthlyRow.position,
          member: selectedMonthlyRow.member,
          unitPrice: selectedMonthlyRow.unitPrice,
          level3Days: baselineLevel3Days,
          level4Days: 0,
          level3Amount: roundValue(baselineLevel3Days * selectedMonthlyRow.unitPrice),
          level4Amount: 0,
          reason: value,
          modified: true,
        },
      ];
    });
  };

  const revertPersonRow = (id: string) => {
    const original = initialPersonRowMap.get(id);

    setPersonRows((prev) =>
      original ? prev.map((item) => (item.id === id ? { ...original } : item)) : prev.filter((item) => item.id !== id),
    );
  };

  const revertFilteredRows = () => {
    const filteredIds = new Set(filteredPersonRows.map((item) => item.id));

    setPersonRows((prev) =>
      prev
        .filter((item) => !filteredIds.has(item.summaryId) || initialPersonRowMap.has(item.id))
        .map((item) => {
          if (!filteredIds.has(item.summaryId)) {
            return item;
          }

          const original = initialPersonRowMap.get(item.id);
          return original ? { ...original } : item;
        }),
    );

    setAmountOverrides((prev) => {
      const next = { ...prev };
      filteredIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  };

  const revertMonthlyRow = (summaryId: string) => {
    setPersonRows((prev) =>
      prev
        .filter((item) => item.summaryId !== summaryId || initialPersonRowMap.has(item.id))
        .map((item) => {
          if (item.summaryId !== summaryId) {
            return item;
          }

          const original = initialPersonRowMap.get(item.id);
          return original ? { ...original } : item;
        }),
    );

    setAmountOverrides((prev) => {
      const next = { ...prev };
      delete next[summaryId];
      return next;
    });
  };

  const openAdjustmentModal = (summaryId: string, type: AdjustmentType) => {
    const currentRow = monthlyRows.find((item) => item.id === summaryId);

    if (!currentRow) {
      return;
    }

    setAdjustmentModal({ summaryId, type });
    setDraftAdjustmentReason('');
    setDraftAdjustmentValue('0');
  };

  const closeAdjustmentModal = () => {
    setAdjustmentModal(null);
    setDraftAdjustmentReason('');
    setDraftAdjustmentValue('');
  };

  const currentAdjustmentRow = useMemo(
    () => (adjustmentModal ? monthlyRows.find((item) => item.id === adjustmentModal.summaryId) || null : null),
    [adjustmentModal, monthlyRows],
  );

  const currentAdjustmentRecords = useMemo(
    () => (adjustmentModal ? adjustmentHistoryMap[adjustmentModal.summaryId] || [] : []),
    [adjustmentHistoryMap, adjustmentModal],
  );

  const saveAdjustment = () => {
    if (!adjustmentModal || !currentAdjustmentRow || !draftAdjustmentReason.trim()) {
      return;
    }

    const deltaValue = Number(draftAdjustmentValue) || 0;
    const beforeValue = adjustmentModal.type === 'capacity' ? currentAdjustmentRow.level4Days : currentAdjustmentRow.level4Amount;
    const nextValue = roundValue(Math.max(0, beforeValue + deltaValue));

    if (adjustmentModal.type === 'capacity') {
      const targetRows = personRows.filter((item) => item.summaryId === adjustmentModal.summaryId);
      const nextDailyCapacities = createDailyCapacities(nextValue, targetRows.length);
      let currentIndex = 0;

      setPersonRows((prev) =>
        prev.map((item) => {
          if (item.summaryId !== adjustmentModal.summaryId) {
            return item;
          }

          const level4Days = nextDailyCapacities[currentIndex] ?? 0;
          currentIndex += 1;

          return {
            ...item,
            level4Days,
            level4Amount: roundValue(level4Days * item.unitPrice),
            reason: draftAdjustmentReason.trim(),
            modified: true,
          };
        }),
      );

      setAmountOverrides((prev) => {
        const next = { ...prev };
        delete next[adjustmentModal.summaryId];
        return next;
      });
    } else {
      setAmountOverrides((prev) => ({
        ...prev,
        [adjustmentModal.summaryId]: roundValue(nextValue),
      }));
    }

    setAdjustmentHistoryMap((prev) => ({
      ...prev,
      [adjustmentModal.summaryId]: [
        {
          id: `${adjustmentModal.summaryId}-${adjustmentModal.type}-${Date.now()}`,
          summaryId: adjustmentModal.summaryId,
          type: adjustmentModal.type,
          beforeValue: roundValue(beforeValue),
          afterValue: roundValue(nextValue),
          reason: draftAdjustmentReason.trim(),
          operator: record.handler,
          time: nowText(),
        },
        ...(prev[adjustmentModal.summaryId] || []),
      ],
    }));

    closeAdjustmentModal();
  };

  const openTotalAdjustmentModal = () => {
    setDraftTotalAdjustmentAmount('0');
    setDraftTotalAdjustmentReason(totalAdjustmentReason);
    setTotalAdjustmentModalOpen(true);
  };

  const closeTotalAdjustmentModal = () => {
    setTotalAdjustmentModalOpen(false);
  };

  const saveTotalAdjustment = () => {
    setTotalAdjustmentTouched(true);
    setTotalAdjustmentAmount(String(roundValue((Number(totalAdjustmentAmount) || 0) + (Number(draftTotalAdjustmentAmount) || 0))));
    setTotalAdjustmentReason(draftTotalAdjustmentReason.trim());
    setTotalAdjustmentModalOpen(false);
  };

  const handleInvoiceFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileNames = Array.from(event.target.files || []).map((file) => file.name);

    if (!fileNames.length) {
      return;
    }

    const remainingAmount = roundValue(totalPositionSummary.adjustedLevel4Amount - uploadedInvoiceAmount);
    const targetAmount = remainingAmount > 0.01 ? remainingAmount : totalPositionSummary.adjustedLevel4Amount || record.amount;
    const nextForms = createPendingInvoiceForms(record, fileNames, uploadedInvoices.length, targetAmount);

    setPendingInvoiceForms(nextForms);
    event.target.value = '';
  };

  const handleApplyInvoice = () => {
    setCurrentStatus('待审核');
  };

  const handleSaveDraft = () => {
    setLastSavedAt(nowText());
  };

  const handleWithdrawBatch = () => {
    setCurrentStatus('待提交');
    setCurrentInvoiceStatus('未开票');
    setUploadedInvoices([]);
  };

  const handleApprove = () => {
    if (currentStatus === '待审核') {
      setCurrentStatus('待上传发票');
      setCurrentInvoiceStatus('待上传发票');
    }
  };

  const handleReject = () => {
    setCurrentStatus('待提交');
    setCurrentInvoiceStatus('未开票');
  };

  const closeInvoiceModal = () => {
    setPendingInvoiceForms([]);
    setInvoiceModalOpen(false);
  };

  const openInvoicePreview = (invoice: UploadedInvoiceItem) => {
    setPreviewInvoice(invoice);
  };

  const closeInvoicePreview = () => {
    setPreviewInvoice(null);
  };

  const handleSaveInvoice = () => {
    if (!pendingInvoiceForms.length) {
      return;
    }

    setUploadedInvoices((prev) => [
      ...prev,
      ...pendingInvoiceForms.map((item, index) => ({
        id: `${record.id}-invoice-${prev.length + index + 1}`,
        ...item,
        taxInclusiveAmount: String(roundValue(Number(item.taxInclusiveAmount) || 0)),
        uploadedBy: record.handler,
        uploadedAt: nowText(),
      })),
    ]);

    setCurrentInvoiceStatus('已上传发票');
    setCurrentStatus('待归档');
    setPendingInvoiceForms([]);
  };

  const handleRemoveInvoice = (invoiceId: string) => {
    setUploadedInvoices((prev) => {
      const next = prev.filter((item) => item.id !== invoiceId);
      setCurrentInvoiceStatus(next.length ? '已上传发票' : '待上传发票');
      return next;
    });
  };

  const handleDownloadInvoiceOriginal = (invoice: UploadedInvoiceItem) => {
    const fileContent = [
      '发票原件下载',
      `附件名称：${invoice.attachmentName}`,
      `发票号码：${invoice.invoiceNumber}`,
      `发票代码：${invoice.invoiceCode}`,
      `开票日期：${invoice.invoiceDate}`,
      `含税金额：${invoice.taxInclusiveAmount}`,
      `税率：${invoice.taxRate}`,
      `上传人：${invoice.uploadedBy}`,
      `上传时间：${invoice.uploadedAt}`,
    ].join('\r\n');

    const blob = new Blob([fileContent], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = invoice.attachmentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const openArchiveConfirmModal = () => {
    setArchiveCustomerSent(false);
    setArchiveConfirmModalOpen(true);
  };

  const closeArchiveConfirmModal = () => {
    setArchiveConfirmModalOpen(false);
    setArchiveCustomerSent(false);
  };

  const handleArchiveInvoices = () => {
    if (!archiveCustomerSent) {
      return;
    }

    setCurrentStatus('已归档');
    setCurrentInvoiceStatus('已上传发票');
    closeArchiveConfirmModal();
  };

  return (
    <div className="space-y-4">
      <div className="admin-card overflow-hidden">
        <div className="border-b border-outline-variant px-5 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回四级列表
              </button>
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${statusColorMap[currentStatus] || 'bg-cyan-100 text-primary'}`}>
                  {currentStatus}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {canEdit && (
                <button
                  type="button"
                  onClick={openTotalAdjustmentModal}
                  className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-3 py-1.5 text-xs text-primary hover:bg-surface-container-low transition-colors"
                >
                  调整总额
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 md:grid-cols-2 lg:grid-cols-3">
          <div><div className="text-xs text-on-surface-variant mb-1">客户</div><div className="text-sm font-medium text-on-surface">{record.customer}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">合同</div><div className="text-sm font-medium text-on-surface">{record.contract}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">期间</div><div className="text-sm font-medium text-on-surface">{record.period}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">所属中心</div><div className="text-sm font-medium text-on-surface">{record.operationCenter}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">四级产能</div><div className="text-sm font-medium text-on-surface">{formatNumber(totalPositionSummary.level4Days)}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">四级金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(totalPositionSummary.adjustedLevel4Amount)}</div></div>
        </div>
        <div className="border-t border-outline-variant bg-surface-container-low px-5 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-on-surface">关联三级批次信息</div>
            </div>
            <div className="text-xs text-on-surface-variant">共 {relatedLevelThreeBatches.length} 条</div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-outline-variant bg-white">
            <table className="w-full min-w-[920px] table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                  <th className="w-[15%] px-4 py-3">三级单号</th>
                  <th className="w-[12%] px-4 py-3">客户</th>
                  <th className="w-[31%] px-4 py-3">合同</th>
                  <th className="w-[14%] px-4 py-3">运营中心</th>
                  <th className="w-[10%] px-4 py-3">产能人天</th>
                  <th className="w-[10%] px-4 py-3">金额</th>
                  <th className="w-[8%] px-4 py-3">办理人</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                {relatedLevelThreeBatches.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                    <td className="px-4 py-3.5 font-medium">
                      {onOpenLevelThreeSource && LEVEL3_DATA.some((sourceItem) => sourceItem.id === item.id) ? (
                        <button
                          type="button"
                          onClick={() => onOpenLevelThreeSource(item.id)}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          {item.id}
                        </button>
                      ) : (
                        item.id
                      )}
                    </td>
                    <td className="px-4 py-3.5">{item.customer}</td>
                    <td className="px-4 py-3.5 text-on-surface-variant">{item.contract}</td>
                    <td className="px-4 py-3.5">{item.operationCenter}</td>
                    <td className="px-4 py-3.5">{formatNumber(item.workDays)}</td>
                    <td className="px-4 py-3.5">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3.5">{item.handler}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showInvoiceSection && (
        <div className="admin-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3 gap-3 flex-wrap">
            <div className="text-sm font-semibold text-on-surface">发票展示区</div>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div><div className="mb-1 text-xs text-on-surface-variant">发票上传状态</div><div className="text-sm font-medium text-on-surface">{currentInvoiceStatus}</div></div>
              <div><div className="mb-1 text-xs text-on-surface-variant">四级申请金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(totalPositionSummary.adjustedLevel4Amount)}</div></div>
              <div><div className="mb-1 text-xs text-on-surface-variant">已上传发票金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(uploadedInvoiceAmount)}</div></div>
              <div><div className="mb-1 text-xs text-on-surface-variant">归档校验</div><div className={`text-sm font-medium ${invoiceCompareMatched || currentStatus === '已归档' ? 'text-emerald-600' : 'text-amber-600'}`}>{invoiceCompareStatusText}</div></div>
            </div>
            {!!uploadedInvoices.length && (
              <div className="space-y-3">
                {uploadedInvoices.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-on-surface">发票 {String(index + 1).padStart(2, '0')}</div>
                        <div className="mt-1 text-xs text-on-surface-variant">附件：{item.attachmentName}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openInvoicePreview(item)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          查看
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoiceOriginal(item)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          下载
                        </button>
                        {canUploadInvoice && (
                          <button
                            type="button"
                            onClick={() => handleRemoveInvoice(item.id)}
                            className="text-xs text-rose-600 hover:text-rose-700 transition-colors"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div><div className="mb-1 text-xs text-on-surface-variant">发票号码</div><div className="text-sm font-medium text-on-surface">{item.invoiceNumber}</div></div>
                      <div><div className="mb-1 text-xs text-on-surface-variant">发票代码</div><div className="text-sm font-medium text-on-surface">{item.invoiceCode}</div></div>
                      <div><div className="mb-1 text-xs text-on-surface-variant">开票日期</div><div className="text-sm font-medium text-on-surface">{item.invoiceDate}</div></div>
                      <div><div className="mb-1 text-xs text-on-surface-variant">含税金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(Number(item.taxInclusiveAmount) || 0)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="space-y-4 px-5 py-5">
          <div className="rounded-2xl border border-outline-variant overflow-hidden">
            <SectionTitle title="汇总人员明细" />
            <div className="border-b border-outline-variant px-5 py-3">
              <div className="flex items-center justify-start gap-3 whitespace-nowrap overflow-x-auto custom-scrollbar">
                <input
                  type="text"
                  value={memberKeyword}
                  onChange={(event) => setMemberKeyword(event.target.value)}
                  placeholder="按姓名筛选"
                  className="admin-input h-9 w-[140px] shrink-0 px-3 text-sm"
                />
                <select
                  value={positionFilter}
                  onChange={(event) => setPositionFilter(event.target.value)}
                  className="admin-input h-9 w-[150px] shrink-0 px-3 text-sm"
                >
                  <option value="">全部合同岗位</option>
                  {positionOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={monthFilter}
                  onChange={(event) => setMonthFilter(event.target.value)}
                  className="admin-input h-9 w-[110px] shrink-0 px-3 text-sm"
                >
                  <option value="">全部月份</option>
                  {QUARTER_MONTHS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setQuickFilter((prev) => (prev === 'diff' ? 'all' : 'diff'))}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${
                    quickFilter === 'diff'
                      ? 'bg-primary text-white'
                      : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  仅看差异
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFilter((prev) => (prev === 'modified' ? 'all' : 'modified'))}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${
                    quickFilter === 'modified'
                      ? 'bg-primary text-white'
                      : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  仅看已修改
                </button>
                {canEdit && filteredHasModifiedRows && (
                  <button
                    type="button"
                    onClick={revertFilteredRows}
                    className="shrink-0 text-xs text-amber-700 hover:text-amber-800 transition-colors"
                  >
                    撤销当前筛选结果修改
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full min-w-[1360px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="w-[112px] px-4 py-3">人员</th>
                    <th className="w-[180px] px-4 py-3">所属项目</th>
                    <th className="w-[96px] px-4 py-3">合同岗位</th>
                    <th className="w-[84px] px-4 py-3">月份</th>
                    <th className="px-4 py-3">三级产能</th>
                    <th className="px-4 py-3 bg-amber-50 text-amber-700">四级产能</th>
                    <th className="px-4 py-3">单价</th>
                    <th className="px-4 py-3">四级金额</th>
                    <th className="sticky right-0 z-10 w-[220px] border-l border-outline-variant bg-surface-container-low px-3 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                  {!filteredPersonRows.length && (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-on-surface-variant">
                        当前筛选条件下暂无符合条件的人员明细
                      </td>
                    </tr>
                  )}
                  {filteredPersonRows.map((item) => (
                    <tr key={item.id} className="group hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-4 font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{item.member}</span>
                          <RowTags hasDiff={item.hasDiff} modified={item.modified} />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-on-surface-variant">{item.project}</td>
                      <td className="px-4 py-4 text-on-surface-variant">{item.position}</td>
                      <td className="px-4 py-4 text-on-surface-variant">{item.month}</td>
                      <td className="px-4 py-4">{formatNumber(item.level3Days)}</td>
                      <td className="px-4 py-4">{formatNumber(item.level4Days)}</td>
                      <td className="px-4 py-4">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-4">{formatCurrency(item.level4Amount)}</td>
                      <td className="sticky right-0 border-l border-outline-variant bg-white px-3 py-4 group-hover:bg-surface-container-low">
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedMonthlyDetailId(item.id)}
                            className="text-primary hover:text-primary/80 transition-colors"
                          >
                            详情
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openAdjustmentModal(item.id, 'capacity')}
                              className="text-amber-700 hover:text-amber-800 transition-colors"
                            >
                              调整产能
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openAdjustmentModal(item.id, 'amount')}
                              className="text-primary hover:text-primary/80 transition-colors"
                            >
                              调整金额
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!!monthlyRows.length && (
              <div className="border-t border-outline-variant bg-surface-container-low px-4 py-3">
                <div className="grid gap-3 text-xs text-on-surface md:grid-cols-[0.8fr_0.8fr_0.8fr_0.9fr_1.5fr] md:items-start">
                  <div>
                    <div className="text-on-surface-variant">三级产能总计</div>
                    <div className="mt-1 font-medium">{formatNumber(totalPositionSummary.level3Days)} 人天</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant">四级产能总计</div>
                    <div className="mt-1 font-medium">{formatNumber(totalPositionSummary.level4Days)} 人天</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant">三级金额总计</div>
                    <div className="mt-1 font-medium">{formatCurrency(totalPositionSummary.level3Amount)}</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant">四级金额总计</div>
                    <div className="mt-1 font-medium">{formatCurrency(totalPositionSummary.level4Amount)}</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant">调整后四级金额</div>
                    <div className="mt-1 font-medium">{formatCurrency(totalPositionSummary.adjustedLevel4Amount)}</div>
                    <div className="mt-1 space-y-0.5 text-on-surface-variant">
                      <div>总金额调整：{formatCurrency(totalPositionSummary.adjustmentAmount)}</div>
                      {!!(totalAdjustmentTouched || totalAdjustmentReason) && <div>调整原因：{totalAdjustmentReason || '--'}</div>}
                      <div className={totalPositionSummary.hasDiff ? 'text-amber-600' : 'text-emerald-600'}>
                        {totalPositionSummary.hasDiff ? '当前总计与三级仍存在差异' : '总计已与三级一致'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {adjustmentModal && currentAdjustmentRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={closeAdjustmentModal}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">{adjustmentModal.type === 'capacity' ? '调整产能' : '调整金额'}</div>
                <div className="mt-1 text-xs text-on-surface-variant">上部填写调整数据及调整原因，下部显示当前人员的调整记录。</div>
              </div>
              <button
                type="button"
                onClick={closeAdjustmentModal}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 md:grid-cols-3">
                <div>
                  <div className="mb-1 text-xs text-on-surface-variant">人员</div>
                  <div className="text-sm font-medium text-on-surface">{currentAdjustmentRow.member}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-on-surface-variant">合同岗位</div>
                  <div className="text-sm font-medium text-on-surface">{currentAdjustmentRow.position}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-on-surface-variant">月份</div>
                  <div className="text-sm font-medium text-on-surface">{currentAdjustmentRow.month}</div>
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">{adjustmentModal.type === 'capacity' ? '产能调整增减量' : '金额调整增减量'}</div>
                <input
                  type="number"
                  step={adjustmentModal.type === 'capacity' ? '0.5' : '0.01'}
                  value={draftAdjustmentValue}
                  onChange={(event) => setDraftAdjustmentValue(event.target.value)}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
                <div className="mt-1 text-xs text-on-surface-variant">
                  当前值：{adjustmentModal.type === 'capacity' ? `${formatNumber(currentAdjustmentRow.level4Days)} 人天` : formatCurrency(currentAdjustmentRow.level4Amount)}，调整后：
                  {adjustmentModal.type === 'capacity'
                    ? `${formatNumber(roundValue(Math.max(0, currentAdjustmentRow.level4Days + (Number(draftAdjustmentValue) || 0))))} 人天`
                    : formatCurrency(roundValue(Math.max(0, currentAdjustmentRow.level4Amount + (Number(draftAdjustmentValue) || 0))))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">调整原因</div>
                <input
                  type="text"
                  value={draftAdjustmentReason}
                  onChange={(event) => setDraftAdjustmentReason(event.target.value)}
                  placeholder={adjustmentModal.type === 'capacity' ? '请填写产能调整原因' : '请填写金额调整原因'}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div className="rounded-xl border border-outline-variant bg-white">
                <div className="border-b border-outline-variant px-4 py-3 text-sm font-medium text-on-surface">调整记录</div>
                <div className="max-h-[260px] overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        <th className="px-4 py-3">时间</th>
                        <th className="px-4 py-3">类型</th>
                        <th className="px-4 py-3">调整前</th>
                        <th className="px-4 py-3">调整后</th>
                        <th className="px-4 py-3">原因</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {!currentAdjustmentRecords.length && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">暂无调整记录</td>
                        </tr>
                      )}
                      {currentAdjustmentRecords.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                          <td className="px-4 py-3 text-on-surface">{item.type === 'capacity' ? '调整产能' : '调整金额'}</td>
                          <td className="px-4 py-3 text-on-surface">{item.type === 'amount' ? formatCurrency(item.beforeValue) : `${formatNumber(item.beforeValue)} 人天`}</td>
                          <td className="px-4 py-3 text-on-surface">{item.type === 'amount' ? formatCurrency(item.afterValue) : `${formatNumber(item.afterValue)} 人天`}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 py-4">
              <button
                type="button"
                onClick={closeAdjustmentModal}
                className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveAdjustment}
                disabled={!draftAdjustmentReason.trim()}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
              >
                保存调整
              </button>
            </div>
          </div>
        </div>
      )}

      <MainFooterPortal>
        <div className="flex-shrink-0 flex items-center justify-center gap-1.5 px-5 py-3 text-sm bg-white border-t border-outline-variant">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {canEdit && (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                保存
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={handleApplyInvoice}
                className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                申请开票
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={handleWithdrawBatch}
                className="flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                撤销批次
              </button>
            )}
            {canReview && (
              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                通过
              </button>
            )}
            {canReview && (
              <button
                type="button"
                onClick={handleReject}
                className="flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                驳回
              </button>
            )}
            {canUploadInvoice && (
              <button
                type="button"
                onClick={() => setInvoiceModalOpen(true)}
                className="flex items-center gap-1.5 rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                财务上传发票
              </button>
            )}
            {canArchive && (
              <button
                type="button"
                onClick={openArchiveConfirmModal}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                销售归档
              </button>
            )}
          </div>
          {canEdit && lastSavedAt && (
            <div className="text-xs text-on-surface-variant">已保存：{lastSavedAt}</div>
          )}
        </div>
      </MainFooterPortal>

      {selectedMonthlyRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={() => setSelectedMonthlyDetailId('')}
        >
          <div
            className="flex max-h-full w-full max-w-[88vw] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl xl:max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div className="flex flex-1 items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-base font-semibold text-on-surface">每日产能详情</div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
                    <span>姓名：{selectedMonthlyRow.member}</span>
                    <span>|</span>
                    <span>合同岗位：{selectedMonthlyRow.position}</span>
                    <span>|</span>
                    <span>月份：{selectedMonthlyRow.month}</span>
                    <span>|</span>
                    <span>三级产能：{formatNumber(selectedMonthlyRow.level3Days)}</span>
                    <span>|</span>
                    <span>四级产能：{formatNumber(selectedMonthlyRow.level4Days)}</span>
                    <span>|</span>
                    <span>金额汇总：{formatCurrency(selectedMonthlyRow.level4Amount)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3">
                    {canEdit && selectedMonthlyHasModifiedRows && (
                      <button
                        type="button"
                        onClick={() => revertMonthlyRow(selectedMonthlyRow.id)}
                        className="text-xs text-amber-700 hover:text-amber-800 transition-colors"
                      >
                        撤销本月修改
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedMonthlyDetailId('')}
                      className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      关闭
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {[
                      { key: 'all', label: '全部日期' },
                      { key: 'workday', label: '仅工作日' },
                      { key: 'diff', label: '仅看差异' },
                      { key: 'modified', label: '仅看已修改' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setDailyDetailFilter(option.key as DailyDetailFilter)}
                        className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                          dailyDetailFilter === option.key
                            ? 'bg-primary text-white'
                            : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="max-h-[75vh] overflow-y-auto custom-scrollbar px-5 py-4">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="w-[24%] px-4 py-3">日期</th>
                    <th className="w-[14%] px-4 py-3">三级产能</th>
                    <th className="w-[16%] px-4 py-3 bg-amber-50 text-amber-700">四级产能（日调整）</th>
                    <th className="w-[24%] px-4 py-3">调整原因</th>
                    <th className="w-[14%] px-4 py-3">金额</th>
                    <th className="w-[8%] px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                  {!filteredDailyDetailRows.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-on-surface-variant">
                        当前筛选条件下暂无日期明细
                      </td>
                    </tr>
                  )}
                  {filteredDailyDetailRows.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{item.date}</span>
                          {!item.isWorkday && (
                            <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">非工作日</span>
                          )}
                          <RowTags hasDiff={item.hasDiff} modified={item.modified} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{formatNumber(item.level3Days)}</td>
                      <td className="bg-amber-50/80 px-4 py-3.5">
                        {canEdit ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.level4Days}
                            onChange={(event) => updateDailyLevel4Days(item.id, event.target.value)}
                            className="admin-input w-full border-amber-300 bg-white px-2.5"
                          />
                        ) : (
                          formatNumber(item.level4Days)
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {canEdit ? (
                          <input
                            type="text"
                            value={item.reason}
                            onChange={(event) => updateDailyAdjustmentReason(item.id, event.target.value)}
                            placeholder="请输入原因"
                            className="admin-input h-10 w-full px-2.5 text-xs"
                          />
                        ) : (
                          <div className="truncate text-xs text-on-surface" title={item.reason || '--'}>
                            {item.reason || '--'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{formatCurrency(item.level4Amount)}</td>
                      <td className="px-4 py-3.5">
                        {canEdit && item.modified ? (
                          <button
                            type="button"
                            onClick={() => revertPersonRow(item.id)}
                            className="text-xs text-primary hover:text-primary/80 transition-colors"
                          >
                            撤销
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <SectionTitle
          title="审批轨迹"
          extra={
            <button
              type="button"
              onClick={() => setLogsExpanded((prev) => !prev)}
              className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              {logsExpanded ? '收起' : '展开'}
              {logsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          }
        />
        {logsExpanded ? (
          <div className="space-y-3 px-5 py-4">
            {approvalLogs.map((item) => (
              <div key={item.id} className="rounded border border-outline-variant bg-surface-container-low px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-on-surface">{item.node}</div>
                  <div className="text-xs text-on-surface-variant">{item.time}</div>
                </div>
                <div className="mb-1 text-xs text-on-surface-variant">处理人：{item.handler}</div>
                <div className="mb-1 text-xs text-on-surface-variant">动作：{item.action}</div>
                <div className="text-sm text-on-surface">{item.detail}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-4 text-sm text-on-surface-variant bg-surface-container-low">
            当前默认收起，展开后可查看审批轨迹详情。
          </div>
        )}
      </div>

      {totalAdjustmentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={closeTotalAdjustmentModal}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">合同岗位总计金额调整</div>
                <div className="mt-1 text-xs text-on-surface-variant">
                  支持单独补录四级总金额调整，保留与三级确认金额的对比关系。
                </div>
              </div>
              <button
                type="button"
                onClick={closeTotalAdjustmentModal}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">整体金额调整增减量</div>
                <input
                  type="number"
                  step="0.01"
                  value={draftTotalAdjustmentAmount}
                  onChange={(event) => setDraftTotalAdjustmentAmount(event.target.value)}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
                <div className="mt-1 text-xs text-on-surface-variant">
                  当前整体调整：{formatCurrency(Number(totalAdjustmentAmount) || 0)}，调整后：
                  {formatCurrency(roundValue((Number(totalAdjustmentAmount) || 0) + (Number(draftTotalAdjustmentAmount) || 0)))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">调整原因</div>
                <input
                  type="text"
                  value={draftTotalAdjustmentReason}
                  onChange={(event) => setDraftTotalAdjustmentReason(event.target.value)}
                  placeholder="请填写四级总金额调整原因"
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 py-4">
              <button
                type="button"
                onClick={closeTotalAdjustmentModal}
                className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveTotalAdjustment}
                disabled={!draftTotalAdjustmentReason.trim()}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
              >
                确认调整
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={closeArchiveConfirmModal}>
          <div
            className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-outline-variant px-5 py-4">
              <div className="text-base font-semibold text-on-surface">销售归档确认</div>
              <div className="mt-1 text-xs text-on-surface-variant">归档前需由销售确认发票是否已经发送给客户。</div>
            </div>
            <div className="space-y-4 px-5 py-5">
              <label className="flex items-start gap-3 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={archiveCustomerSent}
                  onChange={(event) => setArchiveCustomerSent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span>已确认发票已经发送给客户，可执行销售归档。</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 py-4">
              <button
                type="button"
                onClick={closeArchiveConfirmModal}
                className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleArchiveInvoices}
                disabled={!archiveCustomerSent}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
              >
                确认归档
              </button>
            </div>
          </div>
        </div>
      )}

      {invoiceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={closeInvoiceModal}
        >
          <div
            className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">上传发票</div>
                <div className="mt-1 text-xs text-on-surface-variant">
                  财务可一次选择多张发票上传，上传后在详情页按发票清单展示。
                </div>
              </div>
              <button
                type="button"
                onClick={closeInvoiceModal}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-2">
              <div className="md:col-span-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
                <div className="text-xs text-on-surface-variant">上传说明</div>
                <div className="mt-1 text-sm font-medium text-on-surface">当前已上传 {uploadedInvoices.length} 张发票，支持财务继续上传发票文件。</div>
                <div className="mt-1 text-xs text-on-surface-variant">支持一次选择多张发票文件，系统按上传顺序生成发票清单并累计上传金额。</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">开票申请单号</div>
                <div className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface">{record.id}</div>
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">客户</div>
                <div className="rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface">{record.customer}</div>
              </div>
              <div className="md:col-span-2">
                <div className="mb-1 text-xs text-on-surface-variant">上传发票文件</div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.ofd,.zip"
                  multiple
                  onChange={handleInvoiceFileSelect}
                  className="block w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary"
                />
                <div className="mt-2 text-xs text-on-surface-variant">支持 PDF、图片、OFD 或压缩包。</div>
              </div>
              <div className="md:col-span-2 rounded-xl border border-outline-variant bg-white px-4 py-4">
                <div className="text-xs text-on-surface-variant">待上传发票清单</div>
                {pendingInvoiceForms.length ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant bg-white text-xs font-semibold text-on-surface-variant">
                          <th className="px-4 py-3">文件名</th>
                          <th className="px-4 py-3">发票号码</th>
                          <th className="px-4 py-3">开票日期</th>
                          <th className="px-4 py-3">金额</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                        {pendingInvoiceForms.map((item) => (
                          <tr key={item.attachmentName}>
                            <td className="px-4 py-3">{item.attachmentName}</td>
                            <td className="px-4 py-3">{item.invoiceNumber}</td>
                            <td className="px-4 py-3">{item.invoiceDate}</td>
                            <td className="px-4 py-3">{formatCurrency(Number(item.taxInclusiveAmount) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-on-surface-variant">选择一张或多张发票文件后，会在这里生成待上传清单。</div>
                )}
              </div>
              <div className="md:col-span-2 rounded-xl border border-outline-variant bg-white px-4 py-4">
                <div className="text-xs text-on-surface-variant">已上传发票</div>
                {uploadedInvoices.length ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-outline-variant bg-white text-xs font-semibold text-on-surface-variant">
                          <th className="px-4 py-3">文件名</th>
                          <th className="px-4 py-3">发票号码</th>
                          <th className="px-4 py-3">开票日期</th>
                          <th className="px-4 py-3">金额</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                        {uploadedInvoices.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">{item.attachmentName}</td>
                            <td className="px-4 py-3">{item.invoiceNumber}</td>
                            <td className="px-4 py-3">{item.invoiceDate}</td>
                            <td className="px-4 py-3">{formatCurrency(Number(item.taxInclusiveAmount) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-on-surface-variant">当前还没有已上传发票。</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-outline-variant px-5 py-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  disabled={!pendingInvoiceForms.length}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                >
                  确认上传
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={closeInvoicePreview}
        >
          <div
            className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">发票原件</div>
                <div className="mt-1 text-xs text-on-surface-variant">支持查看和下载当前发票原件。</div>
              </div>
              <button
                type="button"
                onClick={closeInvoicePreview}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6">
                <div className="flex flex-col items-center text-center">
                  <FileSpreadsheet className="h-12 w-12 text-primary" />
                  <div className="mt-4 text-sm font-medium text-on-surface">{previewInvoice.attachmentName}</div>
                  <div className="mt-2 text-xs leading-5 text-on-surface-variant">
                    当前原型提供发票原件预览占位，可用于业务评审时查看原件名称、号码、日期与金额信息。
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-white p-4">
                <div className="text-sm font-semibold text-on-surface">发票信息</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div><div className="mb-1 text-xs text-on-surface-variant">附件名称</div><div className="font-medium text-on-surface">{previewInvoice.attachmentName}</div></div>
                  <div><div className="mb-1 text-xs text-on-surface-variant">发票号码</div><div className="font-medium text-on-surface">{previewInvoice.invoiceNumber}</div></div>
                  <div><div className="mb-1 text-xs text-on-surface-variant">发票代码</div><div className="font-medium text-on-surface">{previewInvoice.invoiceCode}</div></div>
                  <div><div className="mb-1 text-xs text-on-surface-variant">开票日期</div><div className="font-medium text-on-surface">{previewInvoice.invoiceDate}</div></div>
                  <div><div className="mb-1 text-xs text-on-surface-variant">含税金额</div><div className="font-medium text-on-surface">{formatCurrency(Number(previewInvoice.taxInclusiveAmount) || 0)}</div></div>
                  <div><div className="mb-1 text-xs text-on-surface-variant">税率</div><div className="font-medium text-on-surface">{previewInvoice.taxRate}</div></div>
                  <div><div className="mb-1 text-xs text-on-surface-variant">上传人</div><div className="font-medium text-on-surface">{previewInvoice.uploadedBy}</div></div>
                  <div><div className="mb-1 text-xs text-on-surface-variant">上传时间</div><div className="font-medium text-on-surface">{previewInvoice.uploadedAt}</div></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 py-4">
              <button
                type="button"
                onClick={closeInvoicePreview}
                className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => handleDownloadInvoiceOriginal(previewInvoice)}
                className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                下载原件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};