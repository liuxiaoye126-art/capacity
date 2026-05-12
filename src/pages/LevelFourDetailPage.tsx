import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Send,
  Upload,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CapacityRecord } from '../types';

interface LevelFourDetailPageProps {
  record: CapacityRecord;
  onBack: () => void;
  onOpenLevelThreeSource?: (id: string) => void;
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

interface InvoiceRecognitionDraft {
  status: '识别一致' | '识别异常';
  confidence: string;
  summary: string;
  issue?: string;
  recognitionAmount: number;
  recognitionTaxRate: string;
}

interface UploadedInvoiceItem extends InvoiceFormState {
  id: string;
  uploadedBy: string;
  uploadedAt: string;
  recognitionFileName: string;
  recognitionBatchName: string;
  recognitionAmount: number;
  recognitionTaxRate: string;
  recognitionStatus: '识别一致' | '识别异常';
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

const QUARTER_MONTHS = ['1月', '2月', '3月'];

const statusColorMap: Record<string, string> = {
  '待提交': 'bg-amber-100 text-amber-700',
  '待分中心审核': 'bg-sky-100 text-sky-700',
  '待总部审核': 'bg-violet-100 text-violet-700',
  '待上传发票': 'bg-cyan-100 text-cyan-700',
  '已归档': 'bg-emerald-100 text-emerald-700',
  '已驳回': 'bg-rose-100 text-rose-700',
  '已撤回': 'bg-slate-100 text-slate-700',
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

const getSourceLevelThreeId = (record: CapacityRecord) => {
  if (record.customer === '上海银行') {
    return 'L3-2026Q1-001';
  }

  if (record.customer === '浦发银行') {
    return 'L3-2026Q1-002';
  }

  return 'L3-2026Q1-003';
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
          const level3Days = dailyCapacities[dayIndex] || 0;

          return {
            id: `${summaryId}-${dayIndex + 1}`,
            summaryId,
            month,
            date,
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
      }),
    ),
  );
};

const buildMonthlyRows = (rows: DailyCapacityRow[]): PersonMonthlyRow[] => {
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

  return Array.from(grouped.values()).map((item) => ({
    ...item,
    hasDiff:
      Math.abs(item.level3Days - item.level4Days) > 0.01 ||
      Math.abs(item.level3Amount - item.level4Amount) > 0.01,
  }));
};

const createInitialInvoiceForm = (record: CapacityRecord): InvoiceFormState => ({
  invoiceNumber: '',
  invoiceCode: '',
  invoiceDate: '',
  taxInclusiveAmount: '',
  taxRate: '6',
  attachmentName: '',
});

const createRecognizedInvoiceForm = (
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

const createInvoiceRecognitionDraft = (attachmentName: string, amount: number): InvoiceRecognitionDraft => {
  const isAbnormal = /异常|error|fail/i.test(attachmentName);

  if (isAbnormal) {
    return {
      status: '识别异常',
      confidence: '82%',
      summary: '识别到金额与税率存在疑点，待人工复核。',
      issue: '识别金额与申请金额不一致，且识别税率异常。',
      recognitionAmount: roundValue(Math.max(0, amount - 1200)),
      recognitionTaxRate: '13',
    };
  }

  return {
    status: '识别一致',
    confidence: '98%',
    summary: '版式完整，票面关键信息识别一致。',
    recognitionAmount: roundValue(amount),
    recognitionTaxRate: '6',
  };
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
      recognitionFileName: `${record.customer}_${record.period}_发票识别_01.xlsx`,
      recognitionBatchName: '识别结果 01 - 2026-04-12',
      recognitionAmount: firstAmount,
      recognitionTaxRate: '6',
      recognitionStatus: '识别一致',
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
      recognitionFileName: `${record.customer}_${record.period}_发票识别_02.xlsx`,
      recognitionBatchName: '识别结果 02 - 2026-04-12',
      recognitionAmount: secondAmount,
      recognitionTaxRate: '6',
      recognitionStatus: '识别一致',
    },
  ];
};

const createApprovalLogs = (record: CapacityRecord): ApprovalLogItem[] => [
  {
    id: `${record.id}-log-1`,
    node: '销售发起',
    handler: record.handler,
    time: '2026-04-08 14:20',
    action: '初始化四级申请',
    detail: '基于三级确认后的生效数据生成四级开票申请。',
  },
  {
    id: `${record.id}-log-2`,
    node: '审批流转',
    handler: record.approverLevel === '总部审批' ? '总部运营中心' : '分中心负责人',
    time: '2026-04-09 09:30',
    action: '待审核',
    detail: '等待审批人核对四级产能与三级确认结果差异。',
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
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedMonthlyDetailId, setSelectedMonthlyDetailId] = useState('');
  const [dailyDetailFilter, setDailyDetailFilter] = useState<DailyDetailFilter>('all');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => createExpandedMonthState());
  const [personRows, setPersonRows] = useState<DailyCapacityRow[]>(() => createDailyRows(record));
  const [currentStatus, setCurrentStatus] = useState(record.status);
  const [currentInvoiceStatus, setCurrentInvoiceStatus] = useState(record.invoiceStatus || '--');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>(() => createInitialInvoiceForm(record));
  const [invoiceRecognitionDraft, setInvoiceRecognitionDraft] = useState<InvoiceRecognitionDraft | null>(null);
  const [uploadedInvoices, setUploadedInvoices] = useState<UploadedInvoiceItem[]>(() => createInitialInvoices(record));
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
    setSelectedMonthlyDetailId('');
    setDailyDetailFilter('all');
    setExpandedMonths(createExpandedMonthState());
    setPersonRows(initialPersonRows);
    setCurrentStatus(record.status);
    setCurrentInvoiceStatus(record.invoiceStatus || '--');
    setInvoiceForm(createInitialInvoiceForm(record));
    setInvoiceRecognitionDraft(null);
    setUploadedInvoices(createInitialInvoices(record));
    setLogsExpanded(false);
    setTotalAdjustmentModalOpen(false);
    setDraftTotalAdjustmentAmount('');
    setDraftTotalAdjustmentReason('');
    setTotalAdjustmentAmount('');
    setTotalAdjustmentReason('');
    setTotalAdjustmentTouched(false);
  }, [initialPersonRows, record]);

  const sourceLevelThreeId = getSourceLevelThreeId(record);
  const isCrossCenter = record.approverLevel === '总部审批';
  const canEdit = currentStatus === '待提交' || currentStatus === '已驳回';
  const canReview = currentStatus === '待分中心审核' || currentStatus === '待总部审核';
  const canUploadInvoice = currentStatus === '待上传发票';
  const showInvoiceSection = ['待分中心审核', '待总部审核', '待上传发票', '已归档'].includes(currentStatus);
  const approvalLogs = useMemo(() => createApprovalLogs(record), [record]);
  const sourceBatchName = formatBatchName(record.workDays, record.amount, '2026-04-05 10:16');

  const monthlyRows = useMemo(() => buildMonthlyRows(personRows), [personRows]);

  const positionRows = useMemo<PositionSummaryRow[]>(() => {
    const grouped = new Map<string, PositionSummaryRow>();

    personRows.forEach((item) => {
      const current = grouped.get(item.position);
      const nextLevel3Days = roundValue((current?.level3Days || 0) + item.level3Days);
      const nextLevel4Days = roundValue((current?.level4Days || 0) + item.level4Days);
      const nextLevel3Amount = roundValue((current?.level3Amount || 0) + item.level3Amount);
      const nextLevel4Amount = roundValue((current?.level4Amount || 0) + item.level4Amount);

      grouped.set(item.position, {
        id: `${record.id}-${item.position}`,
        position: item.position,
        unitPrice: item.unitPrice,
        level3Days: nextLevel3Days,
        level4Days: nextLevel4Days,
        level3Amount: nextLevel3Amount,
        level4Amount: nextLevel4Amount,
        hasDiff:
          Math.abs(nextLevel3Days - nextLevel4Days) > 0.01 ||
          Math.abs(nextLevel3Amount - nextLevel4Amount) > 0.01,
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
          totalLevel3Days: roundValue(rows.reduce((sum, item) => sum + item.level3Days, 0)),
          totalLevel4Days: roundValue(rows.reduce((sum, item) => sum + item.level4Days, 0)),
          totalLevel4Amount: roundValue(rows.reduce((sum, item) => sum + item.level4Amount, 0)),
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
    const level3Days = roundValue(positionRows.reduce((sum, item) => sum + item.level3Days, 0));
    const level4Days = roundValue(positionRows.reduce((sum, item) => sum + item.level4Days, 0));
    const level3Amount = roundValue(positionRows.reduce((sum, item) => sum + item.level3Amount, 0));
    const level4Amount = roundValue(positionRows.reduce((sum, item) => sum + item.level4Amount, 0));
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
  }, [positionRows, totalAdjustmentAmount]);

  useEffect(() => {
    if (totalAdjustmentTouched) {
      return;
    }

    setTotalAdjustmentAmount(String(roundValue(totalPositionSummary.level3Amount - totalPositionSummary.level4Amount)));
  }, [totalAdjustmentTouched, totalPositionSummary.level3Amount, totalPositionSummary.level4Amount]);

  const selectedPositionHasModifiedRows = useMemo(
    () => monthlyRows.some((item) => item.position === selectedPosition && item.modified),
    [monthlyRows, selectedPosition],
  );

  const selectedMonthlyHasModifiedRows = useMemo(
    () => personRows.some((item) => item.summaryId === selectedMonthlyDetailId && item.modified),
    [personRows, selectedMonthlyDetailId],
  );

  const uploadedInvoiceAmount = useMemo(
    () => roundValue(uploadedInvoices.reduce((sum, item) => sum + Number(item.taxInclusiveAmount || 0), 0)),
    [uploadedInvoices],
  );
  const invoiceAmountGap = roundValue(uploadedInvoiceAmount - totalPositionSummary.adjustedLevel4Amount);
  const invoiceCompareMatched =
    uploadedInvoices.length > 0 &&
    Math.abs(invoiceAmountGap) <= 0.01 &&
    uploadedInvoices.every((item) => item.recognitionStatus === '识别一致');
  const invoiceCompareStatusText = currentStatus === '已归档'
    ? '识别一致，已归档'
    : invoiceCompareMatched
      ? '识别一致，可归档'
      : currentStatus === '待上传发票'
        ? '待识别比对'
        : '待审批通过后识别';

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
          level3Days: 0,
          level4Days,
          level3Amount: 0,
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
          level3Days: 0,
          level4Days: 0,
          level3Amount: 0,
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

  const handleInvoiceFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileName = event.target.files?.[0]?.name;

    if (!fileName) {
      return;
    }

    const nextIndex = uploadedInvoices.length + 1;
    const remainingAmount = roundValue(totalPositionSummary.adjustedLevel4Amount - uploadedInvoiceAmount);
    const recognizedAmount = remainingAmount > 0.01 ? remainingAmount : totalPositionSummary.adjustedLevel4Amount || record.amount;
    const nextRecognitionDraft = createInvoiceRecognitionDraft(fileName, recognizedAmount);

    setInvoiceForm(createRecognizedInvoiceForm(record, fileName, nextIndex, recognizedAmount));
    setInvoiceRecognitionDraft(nextRecognitionDraft);
  };

  const handleApplyInvoice = () => {
    setCurrentStatus('待分中心审核');
  };

  const handleWithdrawBatch = () => {
    setCurrentStatus('已撤回');
    setCurrentInvoiceStatus('未开票');
    setUploadedInvoices([]);
  };

  const handleApprove = () => {
    if (currentStatus === '待分中心审核') {
      if (isCrossCenter) {
        setCurrentStatus('待总部审核');
        return;
      }

      setCurrentStatus('待上传发票');
      setCurrentInvoiceStatus('待上传发票');
      return;
    }

    if (currentStatus === '待总部审核') {
      setCurrentStatus('待上传发票');
      setCurrentInvoiceStatus('待上传发票');
    }
  };

  const handleReject = () => {
    setCurrentStatus('已驳回');
    setCurrentInvoiceStatus('未开票');
  };

  const closeInvoiceModal = () => {
    setInvoiceForm(createInitialInvoiceForm(record));
    setInvoiceRecognitionDraft(null);
    setInvoiceModalOpen(false);
  };

  const handleSaveInvoice = () => {
    if (!invoiceForm.attachmentName || !invoiceRecognitionDraft) {
      return;
    }

    const invoiceAmount = roundValue(Number(invoiceForm.taxInclusiveAmount) || 0);

    setUploadedInvoices((prev) => [
      ...prev,
      {
        id: `${record.id}-invoice-${prev.length + 1}`,
        ...invoiceForm,
        taxInclusiveAmount: String(invoiceAmount),
        uploadedBy: record.handler,
        uploadedAt: nowText(),
        recognitionFileName: `${record.customer}_${record.period}_发票识别_${String(prev.length + 1).padStart(2, '0')}.xlsx`,
        recognitionBatchName: `识别结果 ${String(prev.length + 1).padStart(2, '0')} - ${nowText().slice(0, 10)}`,
        recognitionAmount: invoiceRecognitionDraft.recognitionAmount,
        recognitionTaxRate: invoiceRecognitionDraft.recognitionTaxRate,
        recognitionStatus: invoiceRecognitionDraft.status,
      },
    ]);

    setCurrentInvoiceStatus('已上传发票');
    closeInvoiceModal();
  };

  const handleRemoveInvoice = (invoiceId: string) => {
    setUploadedInvoices((prev) => {
      const next = prev.filter((item) => item.id !== invoiceId);
      setCurrentInvoiceStatus(next.length ? '已上传发票' : '待上传发票');
      return next;
    });
  };

  const handleArchiveInvoices = () => {
    if (!invoiceCompareMatched) {
      return;
    }

    setCurrentStatus('已归档');
    setCurrentInvoiceStatus('已上传发票');
  };

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
              返回四级列表
            </button>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${statusColorMap[currentStatus] || 'bg-cyan-100 text-primary'}`}>
                {currentStatus}
              </span>
              <span className="text-on-surface-variant">是否跨中心：{isCrossCenter ? '是' : '否'}</span>
              <span className="text-on-surface-variant">当前审批层级：{currentStatus === '待总部审核' ? '总部审批' : record.approverLevel || '分中心审批'}</span>
              <span className="text-on-surface-variant">发票上传状态：{currentInvoiceStatus}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                上传发票
              </button>
            )}
          </div>
        </div>
      </div>

      {showInvoiceSection && (
        <div className="admin-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3 gap-3 flex-wrap">
            <div className="text-sm font-semibold text-on-surface">发票展示区</div>
            {canUploadInvoice && (
              <button
                type="button"
                onClick={handleArchiveInvoices}
                disabled={!invoiceCompareMatched}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
              >
                发票归档
              </button>
            )}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${item.recognitionStatus === '识别一致' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.recognitionStatus}
                        </span>
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
                    <div className="mt-4 rounded-xl bg-surface-container-low px-4 py-3">
                      <div className="text-xs text-on-surface-variant">对应识别结果</div>
                      {item.recognitionStatus === '识别异常' && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                          检测到 OCR 异常：识别金额或税率与申请信息不一致，需人工复核后再归档。
                        </div>
                      )}
                      <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div><div className="mb-1 text-xs text-on-surface-variant">识别批次</div><div className="text-sm font-medium text-on-surface">{item.recognitionBatchName}</div></div>
                        <div><div className="mb-1 text-xs text-on-surface-variant">识别文件</div><div className="text-sm font-medium text-on-surface">{item.recognitionFileName}</div></div>
                        <div><div className="mb-1 text-xs text-on-surface-variant">识别金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(item.recognitionAmount)}</div></div>
                        <div><div className="mb-1 text-xs text-on-surface-variant">识别税率</div><div className="text-sm font-medium text-on-surface">{item.recognitionTaxRate}%</div></div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-outline-variant bg-white px-3 py-2">
                          <div className="text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">票面金额</div>
                          <div className="mt-1 text-sm font-semibold text-on-surface">{formatCurrency(Number(item.taxInclusiveAmount) || 0)}</div>
                        </div>
                        <div className={`rounded-lg border px-3 py-2 ${item.recognitionStatus === '识别一致' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                          <div className="text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">识别校验</div>
                          <div className={`mt-1 text-sm font-semibold ${item.recognitionStatus === '识别一致' ? 'text-emerald-700' : 'text-amber-800'}`}>
                            {item.recognitionStatus === '识别一致'
                              ? '票面与识别结果一致'
                              : `差异 ${formatCurrency(Math.abs((Number(item.taxInclusiveAmount) || 0) - item.recognitionAmount))}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="min-w-[300px] rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface">
              {sourceBatchName}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => onOpenLevelThreeSource?.(sourceLevelThreeId)}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              查看三级确认单
            </button>
            <button className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              查看原始文件
            </button>
            <button className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <Download className="w-3.5 h-3.5" />
              下载原始文件
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 md:grid-cols-2 lg:grid-cols-3">
          <div><div className="text-xs text-on-surface-variant mb-1">客户</div><div className="text-sm font-medium text-on-surface">{record.customer}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">合同</div><div className="text-sm font-medium text-on-surface">{record.contract}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">期间</div><div className="text-sm font-medium text-on-surface">{record.period}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">所属中心</div><div className="text-sm font-medium text-on-surface">{record.operationCenter}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">三级确认产能</div><div className="text-sm font-medium text-on-surface">{formatNumber(record.workDays)}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">三级确认金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(record.amount)}</div></div>
        </div>
        <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            原始文件：{record.customer}_{record.period}_三级确认结果.xlsx
          </div>
          <div className="text-xs text-on-surface-variant">
            关联三级单号：
            <button
              type="button"
              onClick={() => onOpenLevelThreeSource?.(sourceLevelThreeId)}
              className="ml-1 text-primary hover:text-primary/80 transition-colors"
            >
              {sourceLevelThreeId}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="border-b border-outline-variant bg-primary/5 px-5 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-on-surface">联动筛选区</div>
              <div className="mt-1 text-xs text-on-surface-variant">
                左侧显示多个合同岗位，右侧人员产能明细按月展示；进入详情后按天调整四级产能。
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <QuickFilterTabs value={quickFilter} onChange={setQuickFilter} />
            </div>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[0.95fr_1.2fr]">
          <div className="flex min-h-[680px] flex-col overflow-hidden border-b border-outline-variant xl:border-b-0 xl:border-r xl:border-outline-variant">
            <SectionTitle
              title="合同岗位汇总信息"
              extra={
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    差异=四级产能与三级确认结果不一致
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    点击岗位后，右侧人员产能明细同步切换
                  </div>
                </div>
              }
            />
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="w-[18%] px-3 py-2.5">合同岗位</th>
                    <th className="w-[14%] px-3 py-2.5">单价</th>
                    <th className="w-[14%] px-3 py-2.5">三级产能</th>
                    <th className="w-[14%] px-3 py-2.5">四级产能</th>
                    <th className="w-[20%] px-3 py-2.5">三级金额</th>
                    <th className="w-[20%] px-3 py-2.5">四级金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                  {!filteredPositionRows.length && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-sm text-on-surface-variant">
                        当前筛选条件下暂无合同岗位数据
                      </td>
                    </tr>
                  )}
                  {filteredPositionRows.map((item) => {
                    const isSelected = item.position === selectedPosition;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedPosition(item.position)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/5' : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-on-surface">{item.position}</span>
                            <RowTags hasDiff={item.hasDiff} modified={item.modified} />
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-xs">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-3 align-top text-xs">{formatNumber(item.level3Days)}</td>
                        <td className="px-3 py-3 align-top text-xs">{formatNumber(item.level4Days)}</td>
                        <td className="px-3 py-3 align-top text-xs">{formatCurrency(item.level3Amount)}</td>
                        <td className="px-3 py-3 align-top text-xs">
                          <div className="space-y-0.5 leading-5 break-words">
                            <div>{formatCurrency(item.level4Amount)}</div>
                            <div className={item.hasDiff ? 'text-amber-600' : 'text-emerald-600'}>
                              {item.hasDiff ? '与三级存在差异' : '与三级一致'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!!positionRows.length && (
              <div className="border-t border-outline-variant bg-surface-container-low px-4 py-3">
                <div className="grid gap-3 text-xs text-on-surface md:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_1fr_1.4fr] md:items-start">
                  <div className="font-semibold text-sm text-on-surface">合同岗位总计</div>
                  <div>
                    <div className="text-on-surface-variant">单价</div>
                    <div>--</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant">三级产能</div>
                    <div className="font-medium">{formatNumber(totalPositionSummary.level3Days)}</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant">四级产能</div>
                    <div className="font-medium">{formatNumber(totalPositionSummary.level4Days)}</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant">三级金额</div>
                    <div className="font-medium">{formatCurrency(totalPositionSummary.level3Amount)}</div>
                  </div>
                  <div className="space-y-1">
                    <div>四级金额：{formatCurrency(totalPositionSummary.level4Amount)}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>总金额调整：{formatCurrency(totalPositionSummary.adjustmentAmount)}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={openTotalAdjustmentModal}
                          className="rounded border border-outline-variant bg-white px-2.5 py-1 text-xs text-primary transition-colors hover:bg-surface-container-low"
                        >
                          调整
                        </button>
                      )}
                    </div>
                    {!!(totalAdjustmentTouched || totalAdjustmentReason) && <div>调整原因：{totalAdjustmentReason || '--'}</div>}
                    <div>调整后四级金额：{formatCurrency(totalPositionSummary.adjustedLevel4Amount)}</div>
                    <div className={totalPositionSummary.hasDiff ? 'text-amber-600' : 'text-emerald-600'}>
                      {totalPositionSummary.hasDiff ? '当前总计与三级仍存在差异' : '总计已与三级一致'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-[680px] flex-col overflow-hidden">
            <SectionTitle
              title="人员产能明细"
              extra={
                <div className="flex items-center gap-3">
                  <div className="text-xs text-on-surface-variant">
                    跟随左侧合同岗位联动，当前选中：{selectedPosition || '--'}
                  </div>
                  {canEdit && selectedPositionHasModifiedRows && (
                    <button
                      type="button"
                      onClick={revertSelectedPositionRows}
                      className="text-xs text-amber-700 hover:text-amber-800 transition-colors"
                    >
                      撤销当前岗位修改
                    </button>
                  )}
                </div>
              }
            />
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full min-w-[840px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="w-[112px] px-4 py-3">人员</th>
                    <th className="w-[84px] px-4 py-3">月份</th>
                    <th className="px-4 py-3">三级产能</th>
                    <th className="px-4 py-3 bg-amber-50 text-amber-700">四级产能</th>
                    <th className="px-4 py-3">单价</th>
                    <th className="px-4 py-3">四级金额</th>
                    <th className="sticky right-0 z-10 w-[88px] border-l border-outline-variant bg-surface-container-low px-3 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                  {!filteredPersonRows.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-on-surface-variant">
                        当前合同岗位下暂无符合筛选条件的人员明细
                      </td>
                    </tr>
                  )}
                  {monthGroups.map((group) => (
                    <React.Fragment key={group.month}>
                      <tr className="bg-surface-container-low/80 text-xs text-on-surface-variant">
                        <td colSpan={7} className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggleMonth(group.month)}
                            className="flex w-full items-center justify-between gap-3 text-left"
                          >
                            <div className="flex items-center gap-2">
                              {expandedMonths[group.month] ? (
                                <ChevronUp className="w-3.5 h-3.5 text-on-surface-variant" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
                              )}
                              <span className="font-semibold text-on-surface">{group.month}</span>
                            </div>
                            <span>
                              本月小计：三级 {formatNumber(group.totalLevel3Days)} 人天 / 四级 {formatNumber(group.totalLevel4Days)} 人天 / {formatCurrency(group.totalLevel4Amount)}
                            </span>
                          </button>
                        </td>
                      </tr>
                      {expandedMonths[group.month] && group.rows.map((item) => (
                        <tr key={item.id} className="group hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-4 font-medium">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{item.member}</span>
                              <RowTags hasDiff={item.hasDiff} modified={item.modified} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-on-surface-variant">{item.month}</td>
                          <td className="px-4 py-4">{formatNumber(item.level3Days)}</td>
                          <td className="px-4 py-4">{formatNumber(item.level4Days)}</td>
                          <td className="px-4 py-4">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-4">{formatCurrency(item.level4Amount)}</td>
                          <td className="sticky right-0 border-l border-outline-variant bg-white px-3 py-4 group-hover:bg-surface-container-low">
                            <button
                              type="button"
                              onClick={() => setSelectedMonthlyDetailId(item.id)}
                              className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              详情
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
                <div className="mb-1 text-xs text-on-surface-variant">调整金额</div>
                <input
                  type="number"
                  step="0.01"
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
                  销售可分多次上传发票，上传后将在详情页展示发票及对应识别结果。
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
                <div className="mt-1 text-sm font-medium text-on-surface">当前已上传 {uploadedInvoices.length} 张发票，支持继续上传发票文件。</div>
                <div className="mt-1 text-xs text-on-surface-variant">上传后系统自动识别发票号码、代码、日期、金额和税率，再回填到发票展示区。文件名包含“异常”可预览人工复核分支。</div>
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
                  onChange={handleInvoiceFileSelect}
                  className="block w-full rounded border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface file:mr-3 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary"
                />
                <div className="mt-2 text-xs text-on-surface-variant">支持 PDF、图片、OFD 或压缩包。</div>
              </div>
              <div className="md:col-span-2 rounded-xl border border-outline-variant bg-white px-4 py-4">
                <div className="text-xs text-on-surface-variant">识别结果预览</div>
                {invoiceForm.attachmentName && invoiceRecognitionDraft ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-outline-variant bg-[#fbfaf6] shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-dashed border-outline-variant px-4 py-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-on-surface">OCR 识别回执</div>
                        <div className="mt-1 text-xs text-on-surface-variant">扫描件：{invoiceForm.attachmentName}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${invoiceRecognitionDraft.status === '识别一致' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                          {invoiceRecognitionDraft.status}
                        </span>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          置信度 {invoiceRecognitionDraft.confidence}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1.1fr_1.4fr]">
                      <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">票面定位</div>
                        <div className="mt-3 space-y-3">
                          <div className="rounded-xl bg-surface-container-low px-3 py-3">
                            <div className="text-xs text-on-surface-variant">发票号码区域</div>
                            <div className="mt-1 font-mono text-sm text-on-surface">{invoiceForm.invoiceNumber}</div>
                          </div>
                          <div className="rounded-xl bg-surface-container-low px-3 py-3">
                            <div className="text-xs text-on-surface-variant">发票代码区域</div>
                            <div className="mt-1 font-mono text-sm text-on-surface">{invoiceForm.invoiceCode}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-surface-container-low px-3 py-3">
                              <div className="text-xs text-on-surface-variant">开票日期</div>
                              <div className="mt-1 text-sm font-medium text-on-surface">{invoiceForm.invoiceDate}</div>
                            </div>
                            <div className="rounded-xl bg-surface-container-low px-3 py-3">
                              <div className="text-xs text-on-surface-variant">识别税率</div>
                              <div className="mt-1 text-sm font-medium text-on-surface">{invoiceRecognitionDraft.recognitionTaxRate}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-outline-variant bg-white p-4">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">识别摘要</div>
                          <div className="mt-2 text-sm font-medium text-on-surface">{invoiceRecognitionDraft.summary}</div>
                          {invoiceRecognitionDraft.issue && (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                              {invoiceRecognitionDraft.issue}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-outline-variant bg-white p-4">
                            <div className="text-xs text-on-surface-variant">票面金额</div>
                            <div className="mt-1 text-lg font-semibold text-on-surface">{formatCurrency(Number(invoiceForm.taxInclusiveAmount) || 0)}</div>
                          </div>
                          <div className={`rounded-2xl border p-4 ${invoiceRecognitionDraft.status === '识别一致' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                            <div className="text-xs text-on-surface-variant">OCR 识别金额</div>
                            <div className={`mt-1 text-lg font-semibold ${invoiceRecognitionDraft.status === '识别一致' ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {formatCurrency(invoiceRecognitionDraft.recognitionAmount)}
                            </div>
                            <div className="mt-2 text-xs text-on-surface-variant">
                              {invoiceRecognitionDraft.status === '识别一致'
                                ? '金额与申请单一致，可直接入卡。'
                                : `差异 ${formatCurrency(Math.abs((Number(invoiceForm.taxInclusiveAmount) || 0) - invoiceRecognitionDraft.recognitionAmount))}，建议复核后上传。`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-on-surface-variant">选择发票文件后展示识别结果预览。</div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-outline-variant px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                以发票文件上传为主，识别结果确认后直接进入详情页卡片展示。
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  disabled={!invoiceForm.attachmentName || !invoiceRecognitionDraft}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                >
                  确认上传
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};