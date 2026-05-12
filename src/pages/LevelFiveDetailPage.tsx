import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Save,
  Send,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CapacityRecord } from '../types';

interface LevelFiveDetailPageProps {
  record: CapacityRecord;
  onBack: () => void;
  onOpenLevelFourSource?: (id: string) => void;
}

interface PositionTemplate {
  position: string;
  members: Array<{
    name: string;
    monthlyDays: number[];
  }>;
}

interface DailyCapacityRow {
  id: string;
  summaryId: string;
  month: string;
  date: string;
  position: string;
  member: string;
  unitPrice: number;
  level4Days: number;
  level5Days: number;
  level4Amount: number;
  level5Amount: number;
  reason: string;
  modified: boolean;
}

interface PersonMonthlyRow {
  id: string;
  month: string;
  position: string;
  member: string;
  unitPrice: number;
  level4Days: number;
  level5Days: number;
  level4Amount: number;
  level5Amount: number;
  hasDiff: boolean;
  modified: boolean;
}

interface DailyDetailDisplayRow {
  id: string;
  date: string;
  isWorkday: boolean;
  level4Days: number;
  level5Days: number;
  level5Amount: number;
  reason: string;
  hasDiff: boolean;
  modified: boolean;
}

interface PositionSummaryRow {
  id: string;
  position: string;
  unitPrice: number;
  level4Days: number;
  level5Days: number;
  level4Amount: number;
  level5Amount: number;
  hasDiff: boolean;
  modified: boolean;
}

interface ReceiptRecord {
  id: string;
  receiptNo: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  payer: string;
  account: string;
  operator: string;
  remark: string;
}

interface ReceiptFormState {
  date: string;
  amount: string;
  payer: string;
  account: string;
  remark: string;
}

interface LinkedInvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  taxRate: string;
  attachmentName: string;
}

interface ApprovalLogItem {
  id: string;
  node: string;
  handler: string;
  time: string;
  action: string;
  detail: string;
}

type QuickFilter = 'all' | 'diff' | 'modified';
type DailyDetailFilter = 'all' | 'workday' | 'diff' | 'modified';
type RoleView = 'finance' | 'sales' | 'approval';

const QUARTER_MONTHS = ['1月', '2月', '3月'];

const statusColorMap: Record<string, string> = {
  '回款中': 'bg-orange-100 text-orange-700',
  '已回清待确认': 'bg-cyan-100 text-cyan-700',
  '待分中心审核': 'bg-sky-100 text-sky-700',
  '待总部审核': 'bg-violet-100 text-violet-700',
  '已生效': 'bg-emerald-100 text-emerald-700',
  '已驳回': 'bg-rose-100 text-rose-700',
  '已撤回': 'bg-slate-100 text-slate-700',
};

const getDefaultRoleView = (status: string): RoleView => {
  if (status === '回款中') {
    return 'finance';
  }

  if (['待分中心审核', '待总部审核', '已生效'].includes(status)) {
    return 'approval';
  }

  return 'sales';
};

const roundValue = (value: number) => Number(value.toFixed(2));

const createExpandedMonthState = () =>
  Object.fromEntries(QUARTER_MONTHS.map((month) => [month, true])) as Record<string, boolean>;

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

const getSourceLevelFourId = (record: CapacityRecord) => {
  if (record.customer === '上海银行') {
    return 'L4-2026Q1-004';
  }

  if (record.customer === '浦发银行') {
    return 'L4-2026Q1-005';
  }

  return 'L4-2026Q1-003';
};

const formatBatchName = (workDays: number, amount: number, identifiedAt: string) =>
  `${formatNumber(workDays)}人天 ${formatCurrency(amount)} ${identifiedAt}`;

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

        return workdayDates.map((date, dayIndex) => {
          const level4Days = dailyCapacities[dayIndex] || 0;
          let level5Days = level4Days;
          let reason = '';

          if (monthIndex === 1 && memberIndex === 0 && dayIndex === 0 && level4Days > 0) {
            level5Days = roundValue(Math.max(0, level4Days - 0.5));
            reason = '客户暂缓确认该日 0.5 人天，待后续回款完成后再确认。';
          }

          if (monthIndex === 2 && memberIndex === 1 && dayIndex === 1 && level4Days > 0) {
            level5Days = roundValue(level4Days + 0.5);
            reason = '根据回款核销结果补记 0.5 人天。';
          }

          return {
            id: `${summaryId}-${dayIndex + 1}`,
            summaryId,
            month,
            date,
            position: item.position,
            member: member.name,
            unitPrice,
            level4Days,
            level5Days,
            level4Amount: roundValue(level4Days * unitPrice),
            level5Amount: roundValue(level5Days * unitPrice),
            reason,
            modified: false,
          };
        });
      }),
    ),
  );
};

const buildMonthlyRows = (rows: DailyCapacityRow[]): PersonMonthlyRow[] => {
  const grouped = new Map<string, Omit<PersonMonthlyRow, 'hasDiff'>>();

  rows.forEach((item) => {
    const existing = grouped.get(item.summaryId);

    if (existing) {
      existing.level4Days = roundValue(existing.level4Days + item.level4Days);
      existing.level5Days = roundValue(existing.level5Days + item.level5Days);
      existing.level4Amount = roundValue(existing.level4Amount + item.level4Amount);
      existing.level5Amount = roundValue(existing.level5Amount + item.level5Amount);
      existing.modified = existing.modified || item.modified;
      return;
    }

    grouped.set(item.summaryId, {
      id: item.summaryId,
      month: item.month,
      position: item.position,
      member: item.member,
      unitPrice: item.unitPrice,
      level4Days: item.level4Days,
      level5Days: item.level5Days,
      level4Amount: item.level4Amount,
      level5Amount: item.level5Amount,
      modified: item.modified,
    });
  });

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    hasDiff:
      Math.abs(item.level4Days - item.level5Days) > 0.01 ||
      Math.abs(item.level4Amount - item.level5Amount) > 0.01,
  }));
};

const createInitialReceiptForm = (record: CapacityRecord): ReceiptFormState => ({
  date: nowText().slice(0, 10),
  amount: '',
  payer: record.customer,
  account: '6222 **** **** 8103',
  remark: '',
});

const createInitialReceipts = (record: CapacityRecord): ReceiptRecord[] => {
  const firstAmount = roundValue(record.amount * 0.4);
  const secondAmount = record.receiptStatus === '已回清'
    ? roundValue(record.amount - firstAmount)
    : roundValue(record.amount * 0.2);

  return [
    {
      id: `${record.id}-receipt-1`,
      receiptNo: `SK${record.id.slice(-6)}01`,
      invoiceNumber: `3100${record.id.slice(-6)}01`,
      date: '2026-04-12',
      amount: firstAmount,
      payer: `${record.customer}股份有限公司`,
      account: '6222 **** **** 8103',
      operator: '陈敏',
      remark: '首笔回款已到账，财务完成登记。',
    },
    {
      id: `${record.id}-receipt-2`,
      receiptNo: `SK${record.id.slice(-6)}02`,
      invoiceNumber: `3100${record.id.slice(-6)}02`,
      date: record.receiptStatus === '已回清' ? '2026-04-18' : '2026-04-15',
      amount: secondAmount,
      payer: `${record.customer}股份有限公司`,
      account: '6222 **** **** 8103',
      operator: '陈敏',
      remark: record.receiptStatus === '已回清' ? '尾款到账，已满足最终确认条件。' : '第二笔部分回款到账。',
    },
  ];
};

const createLinkedInvoices = (record: CapacityRecord): LinkedInvoiceItem[] => {
  const firstAmount = roundValue(record.amount * 0.55);
  const secondAmount = roundValue(record.amount - firstAmount);

  return [
    {
      id: `${record.id}-invoice-1`,
      invoiceNumber: `3100${record.id.slice(-6)}01`,
      invoiceDate: '2026-04-10',
      amount: firstAmount,
      taxRate: '6',
      attachmentName: `${record.customer}_${record.period}_发票_01.pdf`,
    },
    {
      id: `${record.id}-invoice-2`,
      invoiceNumber: `3100${record.id.slice(-6)}02`,
      invoiceDate: '2026-04-10',
      amount: secondAmount,
      taxRate: '6',
      attachmentName: `${record.customer}_${record.period}_发票_02.pdf`,
    },
  ];
};

const createApprovalLogs = (record: CapacityRecord): ApprovalLogItem[] => [
  {
    id: `${record.id}-log-1`,
    node: '财务登记',
    handler: '陈敏',
    time: '2026-04-12 14:10',
    action: '新增回款',
    detail: '根据已归档发票登记首笔回款，系统自动累计回款金额。',
  },
  {
    id: `${record.id}-log-2`,
    node: '销售确认',
    handler: record.handler,
    time: '2026-04-18 10:22',
    action: '调整五级明细',
    detail: '基于回款结果调整人员人天与金额，形成五级确认口径。',
  },
  {
    id: `${record.id}-log-3`,
    node: '审批流转',
    handler: record.approverLevel === '总部审批' ? '总部运营中心' : '分中心负责人',
    time: '2026-04-18 11:00',
    action: '待审核',
    detail: '等待审批人核对五级调整结果与累计回款金额。',
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

export const LevelFiveDetailPage = ({ record, onBack, onOpenLevelFourSource }: LevelFiveDetailPageProps) => {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedMonthlyDetailId, setSelectedMonthlyDetailId] = useState('');
  const [dailyDetailFilter, setDailyDetailFilter] = useState<DailyDetailFilter>('all');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => createExpandedMonthState());
  const [personRows, setPersonRows] = useState<DailyCapacityRow[]>(() => createDailyRows(record));
  const [currentStatus, setCurrentStatus] = useState(record.status);
  const [currentReceiptStatus, setCurrentReceiptStatus] = useState(record.receiptStatus || '--');
  const [receiptRecords, setReceiptRecords] = useState<ReceiptRecord[]>(() => createInitialReceipts(record));
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState<ReceiptFormState>(() => createInitialReceiptForm(record));
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [totalAdjustmentModalOpen, setTotalAdjustmentModalOpen] = useState(false);
  const [draftTotalAdjustmentAmount, setDraftTotalAdjustmentAmount] = useState('');
  const [draftTotalAdjustmentReason, setDraftTotalAdjustmentReason] = useState('');
  const [totalAdjustmentAmount, setTotalAdjustmentAmount] = useState('');
  const [totalAdjustmentReason, setTotalAdjustmentReason] = useState('');
  const [totalAdjustmentTouched, setTotalAdjustmentTouched] = useState(false);

  const initialPersonRows = useMemo(() => createDailyRows(record), [record]);
  const initialPersonRowMap = useMemo(
    () => new Map(initialPersonRows.map((item) => [item.id, item])),
    [initialPersonRows],
  );

  useEffect(() => {
    setQuickFilter('all');
    setSelectedPosition('');
    setSelectedMonthlyDetailId('');
    setDailyDetailFilter('all');
    setExpandedMonths(createExpandedMonthState());
    setPersonRows(initialPersonRows);
    setCurrentStatus(record.status);
    setCurrentReceiptStatus(record.receiptStatus || '--');
    setReceiptRecords(createInitialReceipts(record));
    setReceiptModalOpen(false);
    setReceiptForm(createInitialReceiptForm(record));
    setLogsExpanded(false);
    setTotalAdjustmentModalOpen(false);
    setDraftTotalAdjustmentAmount('');
    setDraftTotalAdjustmentReason('');
    setTotalAdjustmentAmount('');
    setTotalAdjustmentReason('');
    setTotalAdjustmentTouched(false);
  }, [initialPersonRows, record]);

  const sourceLevelFourId = getSourceLevelFourId(record);
  const isCrossCenter = record.approverLevel === '总部审批';
  const currentRole = getDefaultRoleView(currentStatus);
  const isFinanceView = currentRole === 'finance';
  const isSalesView = currentRole === 'sales';
  const isApprovalView = currentRole === 'approval';
  const canRegisterReceipt = currentStatus === '回款中';
  const canEdit = ['回款中', '已回清待确认', '已驳回'].includes(currentStatus);
  const canSubmit = ['已回清待确认', '已驳回'].includes(currentStatus) && currentReceiptStatus === '已回清';
  const canReview = currentStatus === '待分中心审核' || currentStatus === '待总部审核';
  const canWithdraw = ['已回清待确认', '待分中心审核', '待总部审核'].includes(currentStatus);
  const showFinanceAction = isFinanceView && canRegisterReceipt;
  const showSalesEdit = isSalesView && canEdit;
  const showSalesSubmit = isSalesView && canSubmit;
  const showSalesWithdraw = isSalesView && canWithdraw;
  const showApprovalAction = isApprovalView && canReview;
  const approvalLogs = useMemo(() => createApprovalLogs(record), [record]);
  const sourceBatchName = formatBatchName(record.workDays, record.amount, '2026-04-18 10:22');
  const linkedInvoices = useMemo(() => createLinkedInvoices(record), [record]);

  const monthlyRows = useMemo(() => buildMonthlyRows(personRows), [personRows]);

  const positionRows = useMemo<PositionSummaryRow[]>(() => {
    const grouped = new Map<string, PositionSummaryRow>();

    personRows.forEach((item) => {
      const current = grouped.get(item.position);
      const nextLevel4Days = roundValue((current?.level4Days || 0) + item.level4Days);
      const nextLevel5Days = roundValue((current?.level5Days || 0) + item.level5Days);
      const nextLevel4Amount = roundValue((current?.level4Amount || 0) + item.level4Amount);
      const nextLevel5Amount = roundValue((current?.level5Amount || 0) + item.level5Amount);

      grouped.set(item.position, {
        id: `${record.id}-${item.position}`,
        position: item.position,
        unitPrice: item.unitPrice,
        level4Days: nextLevel4Days,
        level5Days: nextLevel5Days,
        level4Amount: nextLevel4Amount,
        level5Amount: nextLevel5Amount,
        hasDiff:
          Math.abs(nextLevel4Days - nextLevel5Days) > 0.01 ||
          Math.abs(nextLevel4Amount - nextLevel5Amount) > 0.01,
        modified: (current?.modified || false) || item.modified,
      });
    });

    return Array.from(grouped.values());
  }, [personRows, record.id]);

  const filteredPositionRows = useMemo(
    () => positionRows.filter((item) => matchesQuickFilter(item, quickFilter)),
    [positionRows, quickFilter],
  );

  useEffect(() => {
    if (!filteredPositionRows.length) {
      setSelectedPosition('');
      return;
    }

    if (!selectedPosition || !filteredPositionRows.some((item) => item.position === selectedPosition)) {
      setSelectedPosition(filteredPositionRows[0].position);
    }
  }, [filteredPositionRows, selectedPosition]);

  const filteredPersonRows = useMemo(
    () =>
      monthlyRows.filter((item) => {
        if (item.position !== selectedPosition) {
          return false;
        }

        return matchesQuickFilter(item, quickFilter);
      }),
    [monthlyRows, quickFilter, selectedPosition],
  );

  useEffect(() => {
    if (selectedMonthlyDetailId && !filteredPersonRows.some((item) => item.id === selectedMonthlyDetailId)) {
      setSelectedMonthlyDetailId('');
    }
  }, [filteredPersonRows, selectedMonthlyDetailId]);

  useEffect(() => {
    setDailyDetailFilter('all');
  }, [selectedMonthlyDetailId]);

  const monthGroups = useMemo(
    () =>
      QUARTER_MONTHS.map((month) => {
        const rows = filteredPersonRows.filter((item) => item.month === month);

        return {
          month,
          rows,
          totalLevel4Days: roundValue(rows.reduce((sum, item) => sum + item.level4Days, 0)),
          totalLevel5Days: roundValue(rows.reduce((sum, item) => sum + item.level5Days, 0)),
          totalLevel5Amount: roundValue(rows.reduce((sum, item) => sum + item.level5Amount, 0)),
        };
      }).filter((group) => group.rows.length > 0),
    [filteredPersonRows],
  );

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
          level4Days: existing.level4Days,
          level5Days: existing.level5Days,
          level5Amount: existing.level5Amount,
          reason: existing.reason,
          hasDiff: Math.abs(existing.level4Days - existing.level5Days) > 0.01,
          modified: existing.modified,
        };
      }

      return {
        id: `${selectedMonthlyRow.id}-${date}`,
        date,
        isWorkday,
        level4Days: 0,
        level5Days: 0,
        level5Amount: 0,
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
    const level4Days = roundValue(positionRows.reduce((sum, item) => sum + item.level4Days, 0));
    const level5Days = roundValue(positionRows.reduce((sum, item) => sum + item.level5Days, 0));
    const level4Amount = roundValue(positionRows.reduce((sum, item) => sum + item.level4Amount, 0));
    const level5Amount = roundValue(positionRows.reduce((sum, item) => sum + item.level5Amount, 0));
    const adjustmentAmount = Number(totalAdjustmentAmount) || 0;
    const adjustedLevel5Amount = roundValue(level5Amount + adjustmentAmount);

    return {
      level4Days,
      level5Days,
      level4Amount,
      level5Amount,
      adjustmentAmount,
      adjustedLevel5Amount,
      hasDiff:
        Math.abs(level4Days - level5Days) > 0.01 ||
        Math.abs(level4Amount - adjustedLevel5Amount) > 0.01,
    };
  }, [positionRows, totalAdjustmentAmount]);

  useEffect(() => {
    if (totalAdjustmentTouched) {
      return;
    }

    setTotalAdjustmentAmount(String(roundValue(totalPositionSummary.level4Amount - totalPositionSummary.level5Amount)));
  }, [totalAdjustmentTouched, totalPositionSummary.level4Amount, totalPositionSummary.level5Amount]);

  const totalReceivedAmount = useMemo(
    () => roundValue(receiptRecords.reduce((sum, item) => sum + item.amount, 0)),
    [receiptRecords],
  );
  const remainingReceivableAmount = roundValue(Math.max(0, totalPositionSummary.adjustedLevel5Amount - totalReceivedAmount));
  const receiptCompletionRate = totalPositionSummary.adjustedLevel5Amount > 0
    ? Math.min(100, roundValue((totalReceivedAmount / totalPositionSummary.adjustedLevel5Amount) * 100))
    : 0;
  const receiptMatchesAmount = Math.abs(totalReceivedAmount - totalPositionSummary.adjustedLevel5Amount) <= 0.01;

  const selectedPositionHasModifiedRows = useMemo(
    () => monthlyRows.some((item) => item.position === selectedPosition && item.modified),
    [monthlyRows, selectedPosition],
  );

  const selectedMonthlyHasModifiedRows = useMemo(
    () => personRows.some((item) => item.summaryId === selectedMonthlyDetailId && item.modified),
    [personRows, selectedMonthlyDetailId],
  );

  const updateDailyLevel5Days = (id: string, value: string) => {
    const level5Days = Math.max(0, Number(value) || 0);

    setPersonRows((prev) => {
      let matched = false;

      const nextRows = prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        matched = true;

        return {
          ...item,
          level5Days,
          level5Amount: roundValue(level5Days * item.unitPrice),
          modified: true,
        };
      });

      if (matched || !selectedMonthlyRow) {
        return nextRows;
      }

      return [
        ...nextRows,
        {
          id,
          summaryId: selectedMonthlyRow.id,
          month: selectedMonthlyRow.month,
          date: id.replace(`${selectedMonthlyRow.id}-`, ''),
          position: selectedMonthlyRow.position,
          member: selectedMonthlyRow.member,
          unitPrice: selectedMonthlyRow.unitPrice,
          level4Days: 0,
          level5Days,
          level4Amount: 0,
          level5Amount: roundValue(level5Days * selectedMonthlyRow.unitPrice),
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

      return [
        ...nextRows,
        {
          id,
          summaryId: selectedMonthlyRow.id,
          month: selectedMonthlyRow.month,
          date: id.replace(`${selectedMonthlyRow.id}-`, ''),
          position: selectedMonthlyRow.position,
          member: selectedMonthlyRow.member,
          unitPrice: selectedMonthlyRow.unitPrice,
          level4Days: 0,
          level5Days: 0,
          level4Amount: 0,
          level5Amount: 0,
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

  const revertSelectedPositionRows = () => {
    setPersonRows((prev) =>
      prev
        .filter((item) => item.position !== selectedPosition || initialPersonRowMap.has(item.id))
        .map((item) => {
          if (item.position !== selectedPosition) {
            return item;
          }

          const original = initialPersonRowMap.get(item.id);
          return original ? { ...original } : item;
        }),
    );
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
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  const openTotalAdjustmentModal = () => {
    setDraftTotalAdjustmentAmount(totalAdjustmentAmount || '0');
    setDraftTotalAdjustmentReason(totalAdjustmentReason);
    setTotalAdjustmentModalOpen(true);
  };

  const closeTotalAdjustmentModal = () => {
    setTotalAdjustmentModalOpen(false);
  };

  const saveTotalAdjustment = () => {
    setTotalAdjustmentTouched(true);
    setTotalAdjustmentAmount(draftTotalAdjustmentAmount);
    setTotalAdjustmentReason(draftTotalAdjustmentReason.trim());
    setTotalAdjustmentModalOpen(false);
  };

  const closeReceiptModal = () => {
    setReceiptForm(createInitialReceiptForm(record));
    setReceiptModalOpen(false);
  };

  const handleSaveReceipt = () => {
    const nextAmount = roundValue(Number(receiptForm.amount) || 0);

    if (!nextAmount || nextAmount > remainingReceivableAmount + 0.01) {
      return;
    }

    const nextTotal = roundValue(totalReceivedAmount + nextAmount);

    setReceiptRecords((prev) => [
      ...prev,
      {
        id: `${record.id}-receipt-${prev.length + 1}`,
        receiptNo: `SK${record.id.slice(-6)}${String(prev.length + 1).padStart(2, '0')}`,
        invoiceNumber: linkedInvoices[Math.min(prev.length, linkedInvoices.length - 1)]?.invoiceNumber || '--',
        date: receiptForm.date,
        amount: nextAmount,
        payer: receiptForm.payer,
        account: receiptForm.account,
        operator: '陈敏',
        remark: receiptForm.remark.trim() || '新增回款登记。',
      },
    ]);

    if (Math.abs(nextTotal - totalPositionSummary.adjustedLevel5Amount) <= 0.01) {
      setCurrentReceiptStatus('已回清');
      setCurrentStatus('已回清待确认');
    } else {
      setCurrentReceiptStatus('未回清');
      setCurrentStatus('回款中');
    }

    closeReceiptModal();
  };

  const handleSubmitConfirm = () => {
    if (currentReceiptStatus !== '已回清') {
      return;
    }

    setCurrentStatus('待分中心审核');
  };

  const handleApprove = () => {
    if (currentStatus === '待分中心审核') {
      if (isCrossCenter) {
        setCurrentStatus('待总部审核');
        return;
      }

      setCurrentStatus('已生效');
      return;
    }

    if (currentStatus === '待总部审核') {
      setCurrentStatus('已生效');
    }
  };

  const handleReject = () => {
    setCurrentStatus('已驳回');
  };

  const handleWithdraw = () => {
    setCurrentStatus('已撤回');
  };

  const receiptDraftExceeded = (() => {
    const draftAmount = roundValue(Number(receiptForm.amount) || 0);
    return draftAmount > remainingReceivableAmount + 0.01;
  })();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="admin-card px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回五级列表
            </button>
            <div>
              <div className="text-lg font-semibold text-on-surface">五级产能详情</div>
              <div className="mt-1 text-sm text-on-surface-variant">围绕发票回款台账、人员明细调整和最终确认流转进行处理。</div>
            </div>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${statusColorMap[currentStatus] || 'bg-cyan-100 text-primary'}`}>
                {currentStatus}
              </span>
              <span className="text-on-surface-variant">是否跨中心：{isCrossCenter ? '是' : '否'}</span>
              <span className="text-on-surface-variant">当前审批层级：{currentStatus === '待总部审核' ? '总部审批' : currentStatus === '待分中心审核' ? '分中心审批' : record.approverLevel || '分中心审批'}</span>
              <span className="text-on-surface-variant">回款状态：{currentReceiptStatus}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showFinanceAction && (
              <button
                type="button"
                onClick={() => setReceiptModalOpen(true)}
                className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                新增回款登记
              </button>
            )}
            {showSalesSubmit && (
              <button
                type="button"
                onClick={handleSubmitConfirm}
                className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                提交五级确认
              </button>
            )}
            {showSalesWithdraw && (
              <button
                type="button"
                onClick={handleWithdraw}
                className="flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                撤回
              </button>
            )}
            {showApprovalAction && (
              <button
                type="button"
                onClick={handleApprove}
                className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                审批通过
              </button>
            )}
            {showApprovalAction && (
              <button
                type="button"
                onClick={handleReject}
                className="flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                驳回
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="admin-card overflow-hidden">
          <SectionTitle
            title="来源开票单与回款概览"
            extra={
              onOpenLevelFourSource ? (
                <button
                  type="button"
                  onClick={() => onOpenLevelFourSource(sourceLevelFourId)}
                  className="text-xs text-primary hover:underline transition-colors"
                >
                  查看关联四级单
                </button>
              ) : undefined
            }
          />
          <div className="space-y-4 px-5 py-5">
            <div className="rounded border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface">
              {sourceBatchName}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div><div className="mb-1 text-xs text-on-surface-variant">关联开票单号</div><div className="text-sm font-medium text-on-surface">{sourceLevelFourId}</div></div>
              <div><div className="mb-1 text-xs text-on-surface-variant">开票金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(record.amount)}</div></div>
              <div><div className="mb-1 text-xs text-on-surface-variant">累计回款</div><div className="text-sm font-medium text-on-surface">{formatCurrency(totalReceivedAmount)}</div></div>
              <div><div className="mb-1 text-xs text-on-surface-variant">未回款金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(remainingReceivableAmount)}</div></div>
            </div>
            <div className="rounded-2xl border border-outline-variant bg-white p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-on-surface">回款进度</div>
                  <div className="mt-1 text-xs text-on-surface-variant">累计回款需与五级最终确认金额对齐，才能进入最终确认。</div>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${receiptMatchesAmount ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                  {receiptMatchesAmount ? '金额已对齐' : '待补足回款'}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container-low">
                <div className={`h-full rounded-full ${receiptMatchesAmount ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${receiptCompletionRate}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-surface-container-low px-3 py-3">
                  <div className="text-xs text-on-surface-variant">五级确认金额</div>
                  <div className="mt-1 text-sm font-semibold text-on-surface">{formatCurrency(totalPositionSummary.adjustedLevel5Amount)}</div>
                </div>
                <div className="rounded-xl bg-surface-container-low px-3 py-3">
                  <div className="text-xs text-on-surface-variant">累计回款</div>
                  <div className="mt-1 text-sm font-semibold text-on-surface">{formatCurrency(totalReceivedAmount)}</div>
                </div>
                <div className={`rounded-xl px-3 py-3 ${receiptMatchesAmount ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <div className="text-xs text-on-surface-variant">校验结果</div>
                  <div className={`mt-1 text-sm font-semibold ${receiptMatchesAmount ? 'text-emerald-700' : 'text-amber-800'}`}>
                    {receiptMatchesAmount ? '满足最终确认条件' : `仍差 ${formatCurrency(remainingReceivableAmount)}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          <SectionTitle
            title="关联发票"
            extra={
              <button type="button" className="inline-flex items-center gap-1 text-xs text-primary hover:underline transition-colors">
                <Download className="w-3.5 h-3.5" />
                下载回款台账
              </button>
            }
          />
          <div className="space-y-3 px-5 py-5">
            {linkedInvoices.map((item) => (
              <div key={item.id} className="rounded-2xl border border-outline-variant bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-on-surface">发票号 {item.invoiceNumber}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">附件：{item.attachmentName}</div>
                  </div>
                  <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700">
                    税率 {item.taxRate}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div><div className="mb-1 text-xs text-on-surface-variant">开票日期</div><div className="text-sm font-medium text-on-surface">{item.invoiceDate}</div></div>
                  <div><div className="mb-1 text-xs text-on-surface-variant">含税金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(item.amount)}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <SectionTitle
          title="回款记录"
          extra={
            showFinanceAction ? (
              <button
                type="button"
                onClick={() => setReceiptModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                新增回款
              </button>
            ) : undefined
          }
        />
        <div className="space-y-4 px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div><div className="mb-1 text-xs text-on-surface-variant">回款状态</div><div className="text-sm font-medium text-on-surface">{currentReceiptStatus}</div></div>
            <div><div className="mb-1 text-xs text-on-surface-variant">回款笔数</div><div className="text-sm font-medium text-on-surface">{receiptRecords.length} 笔</div></div>
            <div><div className="mb-1 text-xs text-on-surface-variant">累计回款</div><div className="text-sm font-medium text-on-surface">{formatCurrency(totalReceivedAmount)}</div></div>
            <div><div className="mb-1 text-xs text-on-surface-variant">剩余未回款</div><div className="text-sm font-medium text-on-surface">{formatCurrency(remainingReceivableAmount)}</div></div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[920px] text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                  <th className="px-3 py-3">回款单号</th>
                  <th className="px-3 py-3">关联发票</th>
                  <th className="px-3 py-3">回款日期</th>
                  <th className="px-3 py-3">回款金额</th>
                  <th className="px-3 py-3">付款方</th>
                  <th className="px-3 py-3">回款账号</th>
                  <th className="px-3 py-3">录入人</th>
                  <th className="px-3 py-3">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm">
                {receiptRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-3 py-3 font-medium text-on-surface">{item.receiptNo}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{item.invoiceNumber}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{item.date}</td>
                    <td className="px-3 py-3 text-on-surface font-medium">{formatCurrency(item.amount)}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{item.payer}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{item.account}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{item.operator}</td>
                    <td className="px-3 py-3 text-on-surface-variant">{item.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="min-w-[300px] rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface">
              {sourceBatchName}
            </div>
            <QuickFilterTabs value={quickFilter} onChange={setQuickFilter} />
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            五级基于已归档四级发票和累计回款进行最终确认。
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 xl:grid-cols-[0.95fr_1.45fr]">
          <div className="rounded-2xl border border-outline-variant bg-white">
            <SectionTitle
              title="合同岗位汇总"
              extra={
                showSalesEdit && selectedPositionHasModifiedRows ? (
                  <button
                    type="button"
                    onClick={revertSelectedPositionRows}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    还原当前岗位
                  </button>
                ) : undefined
              }
            />
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[520px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="px-3 py-3">合同岗位</th>
                    <th className="px-3 py-3">单价</th>
                    <th className="px-3 py-3">四级产能</th>
                    <th className="px-3 py-3">五级产能</th>
                    <th className="px-3 py-3">五级金额</th>
                    <th className="px-3 py-3">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {filteredPositionRows.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer transition-colors ${selectedPosition === item.position ? 'bg-cyan-50' : 'hover:bg-surface-container-low'}`}
                      onClick={() => setSelectedPosition(item.position)}
                    >
                      <td className="px-3 py-3 font-medium text-on-surface">{item.position}</td>
                      <td className="px-3 py-3 text-on-surface-variant">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-on-surface">{formatNumber(item.level4Days)}</td>
                      <td className="px-3 py-3 text-on-surface">{formatNumber(item.level5Days)}</td>
                      <td className="px-3 py-3 text-on-surface font-medium">{formatCurrency(item.level5Amount)}</td>
                      <td className="px-3 py-3"><RowTags hasDiff={item.hasDiff} modified={item.modified} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-outline-variant bg-surface-container-low text-sm font-medium text-on-surface">
                    <td className="px-3 py-3">总计</td>
                    <td className="px-3 py-3">--</td>
                    <td className="px-3 py-3">{formatNumber(totalPositionSummary.level4Days)}</td>
                    <td className="px-3 py-3">{formatNumber(totalPositionSummary.level5Days)}</td>
                    <td className="px-3 py-3">{formatCurrency(totalPositionSummary.adjustedLevel5Amount)}</td>
                    <td className="px-3 py-3">
                      {showSalesEdit && (
                        <button
                          type="button"
                          onClick={openTotalAdjustmentModal}
                          className="text-xs text-primary hover:underline transition-colors"
                        >
                          调整总金额
                        </button>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {!!totalAdjustmentReason && (
              <div className="border-t border-outline-variant px-5 py-3 text-xs text-on-surface-variant">
                总金额调整：{formatCurrency(Number(totalAdjustmentAmount) || 0)}，原因：{totalAdjustmentReason}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-outline-variant bg-white">
            <SectionTitle title="人员产能明细" />
            <div className="space-y-4 px-5 py-5">
              {monthGroups.map((group) => (
                <div key={group.month} className="rounded-2xl border border-outline-variant bg-surface-container-low/50">
                  <button
                    type="button"
                    onClick={() => toggleMonth(group.month)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <div className="text-sm font-semibold text-on-surface">{group.month}</div>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        四级 {formatNumber(group.totalLevel4Days)} 人天 / 五级 {formatNumber(group.totalLevel5Days)} 人天 / {formatCurrency(group.totalLevel5Amount)}
                      </div>
                    </div>
                    {expandedMonths[group.month] ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
                  </button>
                  {expandedMonths[group.month] && (
                    <div className="overflow-x-auto border-t border-outline-variant bg-white custom-scrollbar">
                      <table className="w-full min-w-[720px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant text-xs font-semibold text-on-surface-variant">
                            <th className="px-3 py-3">人员</th>
                            <th className="px-3 py-3">四级产能</th>
                            <th className="px-3 py-3">五级产能</th>
                            <th className="px-3 py-3">五级金额</th>
                            <th className="px-3 py-3">标签</th>
                            <th className="px-3 py-3 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant text-sm">
                          {group.rows.map((item) => (
                            <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-3 py-3 font-medium text-on-surface">{item.member}</td>
                              <td className="px-3 py-3 text-on-surface">{formatNumber(item.level4Days)}</td>
                              <td className="px-3 py-3 text-on-surface">{formatNumber(item.level5Days)}</td>
                              <td className="px-3 py-3 text-on-surface font-medium">{formatCurrency(item.level5Amount)}</td>
                              <td className="px-3 py-3"><RowTags hasDiff={item.hasDiff} modified={item.modified} /></td>
                              <td className="px-3 py-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedMonthlyDetailId(item.id)}
                                  className="text-primary hover:underline transition-colors"
                                >
                                  详情
                                </button>
                                {item.modified && showSalesEdit && (
                                  <button
                                    type="button"
                                    onClick={() => revertMonthlyRow(item.id)}
                                    className="ml-3 text-xs text-primary hover:underline transition-colors"
                                  >
                                    还原
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <SectionTitle
          title="审批轨迹"
          extra={
            <button
              type="button"
              onClick={() => setLogsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
            >
              {logsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {logsExpanded ? '收起' : '展开'}
            </button>
          }
        />
        {logsExpanded && (
          <div className="space-y-3 px-5 py-5">
            {approvalLogs.map((item) => (
              <div key={item.id} className="rounded-2xl border border-outline-variant bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm font-semibold text-on-surface">{item.node}</div>
                  <div className="text-xs text-on-surface-variant">{item.time}</div>
                </div>
                <div className="mt-2 text-sm text-on-surface">{item.action}</div>
                <div className="mt-1 text-xs text-on-surface-variant">处理人：{item.handler}</div>
                <div className="mt-2 text-sm text-on-surface-variant">{item.detail}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMonthlyRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={() => setSelectedMonthlyDetailId('')}>
          <div
            className="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">{selectedMonthlyRow.member} {selectedMonthlyRow.month} 日维度明细</div>
                <div className="mt-1 text-xs text-on-surface-variant">
                  {showSalesEdit
                    ? '按天查看四级和五级人天差异，可继续调整并记录原因。'
                    : '按天查看四级和五级人天差异，当前视角仅支持查看。'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMonthlyDetailId('')}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-3">
              <div className="flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
                <span>岗位：{selectedMonthlyRow.position}</span>
                <span>单价：{formatCurrency(selectedMonthlyRow.unitPrice)}</span>
                <span>四级：{formatNumber(selectedMonthlyRow.level4Days)} 人天</span>
                <span>五级：{formatNumber(selectedMonthlyRow.level5Days)} 人天</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'workday', 'diff', 'modified'] as DailyDetailFilter[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDailyDetailFilter(item)}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                      dailyDetailFilter === item
                        ? 'bg-primary text-white'
                        : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {{ all: '全部', workday: '工作日', diff: '仅差异', modified: '仅修改' }[item]}
                  </button>
                ))}
                {selectedMonthlyHasModifiedRows && showSalesEdit && (
                  <button
                    type="button"
                    onClick={() => revertMonthlyRow(selectedMonthlyRow.id)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    还原当月
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto custom-scrollbar">
              <table className="w-full min-w-[1080px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="px-3 py-3">日期</th>
                    <th className="px-3 py-3">是否工作日</th>
                    <th className="px-3 py-3">四级产能</th>
                    <th className="px-3 py-3">五级产能</th>
                    <th className="px-3 py-3">五级金额</th>
                    <th className="px-3 py-3">调整原因</th>
                    <th className="px-3 py-3">状态</th>
                    <th className="px-3 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {filteredDailyDetailRows.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-3 py-3 font-medium text-on-surface">{item.date}</td>
                      <td className="px-3 py-3 text-on-surface-variant">{item.isWorkday ? '是' : '否'}</td>
                      <td className="px-3 py-3 text-on-surface">{formatNumber(item.level4Days)}</td>
                      <td className="px-3 py-3">
                        {showSalesEdit ? (
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={String(item.level5Days)}
                            onChange={(event) => updateDailyLevel5Days(item.id, event.target.value)}
                            className="admin-input h-9 w-24 px-3 text-sm"
                          />
                        ) : (
                          <span className="text-on-surface">{formatNumber(item.level5Days)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-on-surface font-medium">{formatCurrency(item.level5Amount)}</td>
                      <td className="px-3 py-3">
                        {showSalesEdit ? (
                          <input
                            type="text"
                            value={item.reason}
                            onChange={(event) => updateDailyAdjustmentReason(item.id, event.target.value)}
                            placeholder="填写调整原因"
                            className="admin-input h-9 w-full min-w-[240px] px-3 text-sm"
                          />
                        ) : (
                          <span className="text-on-surface-variant">{item.reason || '--'}</span>
                        )}
                      </td>
                      <td className="px-3 py-3"><RowTags hasDiff={item.hasDiff} modified={item.modified} /></td>
                      <td className="px-3 py-3 text-right">
                        {item.modified && showSalesEdit && (
                          <button
                            type="button"
                            onClick={() => revertPersonRow(item.id)}
                            className="text-xs text-primary hover:underline transition-colors"
                          >
                            还原
                          </button>
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

      {totalAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={closeTotalAdjustmentModal}>
          <div
            className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-outline-variant px-5 py-4">
              <div className="text-base font-semibold text-on-surface">五级总金额调整</div>
              <div className="mt-1 text-xs text-on-surface-variant">支持在合同岗位汇总之上追加总金额修正，用于回款核销后的最终确认口径。</div>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">调整金额</div>
                <input
                  type="number"
                  step="100"
                  value={draftTotalAdjustmentAmount}
                  onChange={(event) => setDraftTotalAdjustmentAmount(event.target.value)}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">调整原因</div>
                <input
                  type="text"
                  value={draftTotalAdjustmentReason}
                  onChange={(event) => setDraftTotalAdjustmentReason(event.target.value)}
                  placeholder="请填写五级总金额调整原因"
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

      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={closeReceiptModal}>
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-outline-variant px-5 py-4">
              <div className="text-base font-semibold text-on-surface">新增回款记录</div>
              <div className="mt-1 text-xs text-on-surface-variant">财务根据已归档发票录入回款，系统自动累计回款金额并刷新五级状态。</div>
            </div>
            <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">回款日期</div>
                <input
                  type="date"
                  value={receiptForm.date}
                  onChange={(event) => setReceiptForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">回款金额</div>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={receiptForm.amount}
                  onChange={(event) => setReceiptForm((prev) => ({ ...prev, amount: event.target.value }))}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">付款方</div>
                <input
                  type="text"
                  value={receiptForm.payer}
                  onChange={(event) => setReceiptForm((prev) => ({ ...prev, payer: event.target.value }))}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">回款账号</div>
                <input
                  type="text"
                  value={receiptForm.account}
                  onChange={(event) => setReceiptForm((prev) => ({ ...prev, account: event.target.value }))}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <div className="mb-1 text-xs text-on-surface-variant">备注</div>
                <input
                  type="text"
                  value={receiptForm.remark}
                  onChange={(event) => setReceiptForm((prev) => ({ ...prev, remark: event.target.value }))}
                  placeholder="选填，说明本次回款说明"
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div className={`md:col-span-2 rounded-xl px-4 py-3 text-sm ${receiptDraftExceeded ? 'bg-amber-50 text-amber-800' : 'bg-surface-container-low text-on-surface'}`}>
                本次可登记剩余金额：{formatCurrency(remainingReceivableAmount)}
                {receiptDraftExceeded && '，当前录入金额超过剩余可登记金额。'}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 py-4">
              <button
                type="button"
                onClick={closeReceiptModal}
                className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveReceipt}
                disabled={!receiptForm.amount || receiptDraftExceeded}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
              >
                保存回款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};