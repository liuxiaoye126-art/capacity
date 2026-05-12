import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  RotateCcw,
  Save,
  Send,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CapacityRecord } from '../types';

interface LevelThreeDetailPageProps {
  record: CapacityRecord;
  onBack: () => void;
}

interface TagState {
  hasDiff: boolean;
  modified: boolean;
}

interface DailyCapacityRow {
  id: string;
  summaryId: string;
  month: string;
  date: string;
  position: string;
  member: string;
  level1Days: number;
  level2Days: number;
  level3Days: number;
  unitPrice: number;
  amount: number;
  modified: boolean;
}

interface DailyDetailDisplayRow {
  id: string;
  date: string;
  isWorkday: boolean;
  level1Days: number;
  level2Days: number;
  recognitionLevel3Days: number;
  hasRecognitionDiff: boolean;
  level3Days: number;
  amount: number;
  modified: boolean;
}

interface PersonMonthlyRow {
  id: string;
  month: string;
  position: string;
  member: string;
  level1Days: number;
  level2Days: number;
  level3Days: number;
  unitPrice: number;
  amount: number;
  modified: boolean;
}

interface PositionTargetRow {
  id: string;
  position: string;
  unitPrice: number;
  taxRate: number;
  targetCapacityDays: number;
  targetAmount: number;
}

interface PositionSummaryRow extends PositionTargetRow, TagState {
  detailCapacityDays: number;
  detailAmount: number;
  capacityGap: number;
  amountGap: number;
}

interface PositionTemplate {
  position: string;
  targetDays: number;
  members: Array<{
    name: string;
    monthlyDays: number[];
  }>;
}

interface RecognitionLog {
  id: string;
  time: string;
  operator: string;
  action: string;
  detail: string;
}

interface RecognitionResult {
  id: string;
  label: string;
  fileName: string;
  version: string;
  identifiedAt: string;
  identifiedBy: string;
  sourceFile: string;
  logs: RecognitionLog[];
}

type QuickFilter = 'all' | 'diff' | 'modified';
type DailyDetailFilter = 'all' | 'workday' | 'diff' | 'modified';

const QUARTER_MONTHS = ['1月', '2月', '3月'];

const badgeColorMap: Record<string, string> = {
  '待调整': 'bg-amber-100 text-amber-700',
  '待审核': 'bg-sky-100 text-sky-700',
  '已通过': 'bg-emerald-100 text-emerald-700',
  '已撤销': 'bg-rose-100 text-rose-700',
};

const approvalLogs = [
  {
    node: '销售调整',
    handler: '李晓燕',
    time: '2026-05-08 14:20',
    comment: '根据客户确认结果核对三级产能，修正部分确认口径。',
    action: '保存草稿',
    delta: '存在差异数据已标识，待负责人审批。',
  },
  {
    node: '分中心审核',
    handler: '王双银',
    time: '2026-05-09 09:30',
    comment: '待销售补充确认原因后再进入终审。',
    action: '待审核',
    delta: '当前仍有修改数据需复核。',
  },
];

const originalAttachment = { name: '2026年1季度验收单.xlsx', type: '原始识别文件' };

const roundValue = (value: number) => Number(value.toFixed(2));

const createExpandedMonthState = () =>
  Object.fromEntries(QUARTER_MONTHS.map((month) => [month, true])) as Record<string, boolean>;

const createRecognitionResults = (record: CapacityRecord): RecognitionResult[] => [
  {
    id: `${record.id}-recognition-v1`,
    label: '识别结果 V1',
    fileName: `${record.customer}_${record.period}_识别结果_v1.xlsx`,
    version: 'V1 初版识别',
    identifiedAt: '2026-04-02 09:18',
    identifiedBy: '李晓燕',
    sourceFile: originalAttachment.name,
    logs: [
      {
        id: `${record.id}-log-v1-1`,
        time: '2026-04-02 09:18',
        operator: '李晓燕',
        action: '上传原始文件',
        detail: '导入季度验收单并启动首轮识别。',
      },
      {
        id: `${record.id}-log-v1-2`,
        time: '2026-04-02 09:24',
        operator: '系统识别引擎',
        action: '生成结果',
        detail: '完成合同岗位、人员归集与季度口径汇总。',
      },
      {
        id: `${record.id}-log-v1-3`,
        time: '2026-04-02 09:31',
        operator: '李晓燕',
        action: '提交复核',
        detail: '将初版识别结果提交业务复核。',
      },
    ],
  },
  {
    id: `${record.id}-recognition-v2`,
    label: '识别结果 V2',
    fileName: `${record.customer}_${record.period}_识别结果_v2.xlsx`,
    version: 'V2 复核修订',
    identifiedAt: '2026-04-03 14:42',
    identifiedBy: '王静',
    sourceFile: originalAttachment.name,
    logs: [
      {
        id: `${record.id}-log-v2-1`,
        time: '2026-04-03 13:56',
        operator: '王静',
        action: '调整识别规则',
        detail: '补充分月工作日映射规则并重新识别。',
      },
      {
        id: `${record.id}-log-v2-2`,
        time: '2026-04-03 14:42',
        operator: '系统识别引擎',
        action: '生成结果',
        detail: '输出按 1月/2月/3月 分组的季度识别结果。',
      },
      {
        id: `${record.id}-log-v2-3`,
        time: '2026-04-03 15:05',
        operator: '王静',
        action: '记录差异',
        detail: '标记合同岗位与人员汇总存在差异的明细。',
      },
    ],
  },
  {
    id: `${record.id}-recognition-v3`,
    label: '识别结果 V3',
    fileName: `${record.customer}_${record.period}_识别结果_v3.xlsx`,
    version: 'V3 当前生效',
    identifiedAt: '2026-04-05 10:16',
    identifiedBy: '张楠',
    sourceFile: originalAttachment.name,
    logs: [
      {
        id: `${record.id}-log-v3-1`,
        time: '2026-04-05 09:40',
        operator: '张楠',
        action: '挑选结果',
        detail: '选取复核后结果作为当前识别版本。',
      },
      {
        id: `${record.id}-log-v3-2`,
        time: '2026-04-05 10:16',
        operator: '系统识别引擎',
        action: '归档识别',
        detail: '归档当前识别结果并写入识别日志。',
      },
      {
        id: `${record.id}-log-v3-3`,
        time: '2026-04-05 10:28',
        operator: '张楠',
        action: '通知调整',
        detail: '通知销售进入人员日维度调整阶段。',
      },
    ],
  },
];

const getPeriodYear = (period: string) => Number(period.match(/(\d{4})/)?.[1] || '2026');

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

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toLocaleString('zh-CN');
  }

  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (value: number) => {
  const hasFraction = Math.abs(value % 1) > 0.001;

  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatRecognitionBatchName = (workDays: number, amount: number, identifiedAt: string) =>
  `${formatNumber(workDays)}人天 ${formatCurrency(amount).replace('¥', '￥')} ${identifiedAt}`;

const createRecognitionLevel3Value = (date: string, baseDays: number, member: string) => {
  const day = Number(date.match(/月(\d{2})日/)?.[1] || '0');
  const memberSeed = Array.from(member).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const offsetCycle = (memberSeed + day) % 6;
  const offset = offsetCycle === 0 ? 0.5 : offsetCycle === 3 ? -0.5 : 0;

  return roundValue(Math.max(0, baseDays + offset));
};

const createTemplates = (record: CapacityRecord): PositionTemplate[] => {
  if (record.customer === '上海银行') {
    return [
      {
        position: '高级',
        targetDays: 189,
        members: [
          { name: '刘晨', monthlyDays: [21, 22, 21] },
          { name: '吴楠', monthlyDays: [20, 21, 22] },
          { name: '程浩', monthlyDays: [19, 20, 21] },
        ],
      },
      {
        position: '中级',
        targetDays: 126,
        members: [
          { name: '周颖', monthlyDays: [21, 21, 20] },
          { name: '孙怡', monthlyDays: [20, 21, 21] },
        ],
      },
      {
        position: '初级',
        targetDays: 124,
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
        targetDays: 190,
        members: [
          { name: '黄璐', monthlyDays: [22, 21, 22] },
          { name: '陈卓', monthlyDays: [21, 21, 20] },
          { name: '梁骁', monthlyDays: [20, 21, 21] },
        ],
      },
      {
        position: '高级',
        targetDays: 125,
        members: [
          { name: '李彤', monthlyDays: [21, 20, 21] },
          { name: '许铭', monthlyDays: [20, 21, 21] },
        ],
      },
      {
        position: '初级',
        targetDays: 124,
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
      targetDays: 191,
      members: [
        { name: '黄璐', monthlyDays: [22, 21, 21] },
        { name: '陈卓', monthlyDays: [21, 21, 20] },
        { name: '徐青', monthlyDays: [20, 22, 21] },
      ],
    },
    {
      position: '高级',
      targetDays: 125,
      members: [
        { name: '李彤', monthlyDays: [21, 20, 21] },
        { name: '许铭', monthlyDays: [20, 21, 21] },
      ],
    },
    {
      position: '初级',
      targetDays: 124,
      members: [
        { name: '宋倩', monthlyDays: [22, 21, 20] },
        { name: '杨澄', monthlyDays: [19, 20, 21] },
      ],
    },
  ];
};

const createPositionTargets = (record: CapacityRecord): PositionTargetRow[] => {
  const unitPrice = record.amount / record.workDays;

  return createTemplates(record).map((item) => ({
    id: `${record.id}-${item.position}-target`,
    position: item.position,
    unitPrice,
    taxRate: 6,
    targetCapacityDays: item.targetDays,
    targetAmount: roundValue(item.targetDays * unitPrice),
  }));
};

const createDailyRows = (record: CapacityRecord): DailyCapacityRow[] => {
  const unitPrice = record.amount / record.workDays;
  const periodYear = getPeriodYear(record.period);

  return createTemplates(record).flatMap((item) =>
    item.members.flatMap((member, memberIndex) =>
      QUARTER_MONTHS.flatMap((month, monthIndex) => {
        const summaryId = `${record.id}-${item.position}-member-${memberIndex + 1}-${month}`;
        const monthNumber = monthIndex + 1;
        const workdayDates = createWorkdayDates(periodYear, monthNumber);
        const dailyCapacities = createDailyCapacities(member.monthlyDays[monthIndex] ?? 0, workdayDates.length);

        return workdayDates.map((date, dayIndex) => {
          const level3Days = dailyCapacities[dayIndex] ?? 0;

          return {
          id: `${summaryId}-${dayIndex + 1}`,
          summaryId,
          month,
          date,
          position: item.position,
          member: member.name,
          level1Days: level3Days,
          level2Days: level3Days,
          level3Days,
          unitPrice,
          amount: roundValue(level3Days * unitPrice),
          modified: false,
          };
        });
      }),
    ),
  );
};

const buildMonthlyRows = (rows: DailyCapacityRow[]): PersonMonthlyRow[] => {
  const grouped = new Map<string, PersonMonthlyRow>();

  rows.forEach((item) => {
    const existing = grouped.get(item.summaryId);

    if (existing) {
      existing.level1Days = roundValue(existing.level1Days + item.level1Days);
      existing.level2Days = roundValue(existing.level2Days + item.level2Days);
      existing.level3Days = roundValue(existing.level3Days + item.level3Days);
      existing.amount = roundValue(existing.amount + item.amount);
      existing.modified = existing.modified || item.modified;
      return;
    }

    grouped.set(item.summaryId, {
      id: item.summaryId,
      month: item.month,
      position: item.position,
      member: item.member,
      level1Days: item.level1Days,
      level2Days: item.level2Days,
      level3Days: item.level3Days,
      unitPrice: item.unitPrice,
      amount: item.amount,
      modified: item.modified,
    });
  });

  return Array.from(grouped.values());
};

const buildPositionRows = (
  targets: PositionTargetRow[],
  rows: DailyCapacityRow[],
): PositionSummaryRow[] => {
  const detailGrouped = new Map<string, { detailCapacityDays: number; detailAmount: number; modified: boolean }>();

  rows.forEach((item) => {
    const existing = detailGrouped.get(item.position);
    if (existing) {
      existing.detailCapacityDays = roundValue(existing.detailCapacityDays + item.level3Days);
      existing.detailAmount = roundValue(existing.detailAmount + item.amount);
      existing.modified = existing.modified || item.modified;
      return;
    }

    detailGrouped.set(item.position, {
      detailCapacityDays: item.level3Days,
      detailAmount: item.amount,
      modified: item.modified,
    });
  });

  return targets.map((target) => {
    const detail = detailGrouped.get(target.position) ?? {
      detailCapacityDays: 0,
      detailAmount: 0,
      modified: false,
    };
    const capacityGap = roundValue(target.targetCapacityDays - detail.detailCapacityDays);
    const amountGap = roundValue(target.targetAmount - detail.detailAmount);
    const hasDiff = Math.abs(capacityGap) > 0.01 || Math.abs(amountGap) > 0.01;

    return {
      ...target,
      detailCapacityDays: detail.detailCapacityDays,
      detailAmount: detail.detailAmount,
      capacityGap,
      amountGap,
      hasDiff,
      modified: detail.modified,
    };
  });
};

const matchesFilter = (item: TagState, filter: QuickFilter) => {
  if (filter === 'diff') {
    return item.hasDiff;
  }

  if (filter === 'modified') {
    return item.modified;
  }

  return true;
};

const RowTags = ({ hasDiff, modified }: TagState) => {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {hasDiff && <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">差异</span>}
      {modified && <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700">已修改</span>}
    </div>
  );
};

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

export const LevelThreeDetailPage = ({ record, onBack }: LevelThreeDetailPageProps) => {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [dailyDetailFilter, setDailyDetailFilter] = useState<DailyDetailFilter>('all');
  const [dailyAdjustmentReasons, setDailyAdjustmentReasons] = useState<Record<string, string>>({});
  const [totalAdjustmentModalOpen, setTotalAdjustmentModalOpen] = useState(false);
  const [draftTotalAdjustmentAmount, setDraftTotalAdjustmentAmount] = useState('');
  const [draftTotalAdjustmentReason, setDraftTotalAdjustmentReason] = useState('');
  const [totalAdjustmentReason, setTotalAdjustmentReason] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedMonthlyDetailId, setSelectedMonthlyDetailId] = useState('');
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [recognitionLogsOpen, setRecognitionLogsOpen] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(() => createExpandedMonthState());
  const [totalAdjustmentAmount, setTotalAdjustmentAmount] = useState('');
  const [totalAdjustmentTouched, setTotalAdjustmentTouched] = useState(false);
  const recognitionResults = useMemo(() => createRecognitionResults(record), [record]);
  const [selectedRecognitionResultId, setSelectedRecognitionResultId] = useState('');
  const positionTargets = useMemo(() => createPositionTargets(record), [record]);
  const initialPersonRows = useMemo(() => createDailyRows(record), [record]);
  const initialPersonRowMap = useMemo(
    () => new Map(initialPersonRows.map((item) => [item.id, item])),
    [initialPersonRows],
  );
  const [personRows, setPersonRows] = useState<DailyCapacityRow[]>(() => createDailyRows(record));

  useEffect(() => {
    setPersonRows(initialPersonRows);
    setQuickFilter('all');
    setSelectedMonthlyDetailId('');
    setExpandedMonths(createExpandedMonthState());
    setSelectedRecognitionResultId(recognitionResults[0]?.id || '');
    setRecognitionLogsOpen(false);
    setLogsExpanded(false);
    setDailyDetailFilter('all');
    setDailyAdjustmentReasons({});
    setTotalAdjustmentModalOpen(false);
    setDraftTotalAdjustmentAmount('');
    setDraftTotalAdjustmentReason('');
    setTotalAdjustmentReason('');
    setTotalAdjustmentTouched(false);
    setTotalAdjustmentAmount('');
  }, [initialPersonRows, recognitionResults]);

  const selectedRecognitionResult = useMemo(
    () => recognitionResults.find((item) => item.id === selectedRecognitionResultId) || recognitionResults[0],
    [recognitionResults, selectedRecognitionResultId],
  );

  const positionRows = useMemo(() => buildPositionRows(positionTargets, personRows), [positionTargets, personRows]);

  const totalPositionSummary = useMemo(() => {
    const summary = positionRows.reduce(
      (accumulator, item) => ({
        targetCapacityDays: roundValue(accumulator.targetCapacityDays + item.targetCapacityDays),
        targetAmount: roundValue(accumulator.targetAmount + item.targetAmount),
        detailCapacityDays: roundValue(accumulator.detailCapacityDays + item.detailCapacityDays),
        detailAmount: roundValue(accumulator.detailAmount + item.detailAmount),
      }),
      {
        targetCapacityDays: 0,
        targetAmount: 0,
        detailCapacityDays: 0,
        detailAmount: 0,
      },
    );

    const capacityGap = roundValue(summary.targetCapacityDays - summary.detailCapacityDays);
    const amountGap = roundValue(summary.targetAmount - summary.detailAmount);
    const adjustmentAmount = Number(totalAdjustmentAmount) || 0;
    const adjustedDetailAmount = roundValue(summary.detailAmount + adjustmentAmount);
    const adjustedAmountGap = roundValue(summary.targetAmount - adjustedDetailAmount);
    const hasDiff = Math.abs(capacityGap) > 0.01 || Math.abs(adjustedAmountGap) > 0.01;

    return {
      ...summary,
      capacityGap,
      amountGap,
      adjustmentAmount,
      adjustedDetailAmount,
      adjustedAmountGap,
      hasDiff,
    };
  }, [positionRows, totalAdjustmentAmount]);

  useEffect(() => {
    if (totalAdjustmentTouched) {
      return;
    }

    setTotalAdjustmentAmount(String(roundValue(totalPositionSummary.amountGap)));
  }, [totalAdjustmentTouched, totalPositionSummary.amountGap]);

  const positionDiffMap = useMemo(
    () => new Map(positionRows.map((item) => [item.position, item.hasDiff])),
    [positionRows],
  );

  const filteredPositionRows = useMemo(
    () => positionRows.filter((item) => matchesFilter(item, quickFilter)),
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

  const monthlyRows = useMemo(() => buildMonthlyRows(personRows), [personRows]);

  const filteredPersonRows = useMemo(
    () =>
      monthlyRows.filter(
        (item) =>
          item.position === selectedPosition &&
          (quickFilter === 'all' ||
            (quickFilter === 'diff' && positionDiffMap.get(item.position)) ||
            (quickFilter === 'modified' && item.modified)),
      ),
    [monthlyRows, positionDiffMap, quickFilter, selectedPosition],
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
          totalDays: roundValue(rows.reduce((sum, item) => sum + item.level3Days, 0)),
          totalAmount: roundValue(rows.reduce((sum, item) => sum + item.amount, 0)),
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
      const baseDays = existing?.level1Days ?? 0;
      const recognitionLevel3Days = createRecognitionLevel3Value(date, baseDays, selectedMonthlyRow.member);

      if (existing) {
        return {
          id: existing.id,
          date: existing.date,
          isWorkday,
          level1Days: existing.level1Days,
          level2Days: existing.level2Days,
          recognitionLevel3Days,
          hasRecognitionDiff:
            Math.abs(recognitionLevel3Days - existing.level1Days) > 0.01 ||
            Math.abs(recognitionLevel3Days - existing.level2Days) > 0.01,
          level3Days: existing.level3Days,
          amount: existing.amount,
          modified: existing.modified,
        };
      }

      return {
        id: `${selectedMonthlyRow.id}-${date}`,
        date,
        isWorkday,
        level1Days: 0,
        level2Days: 0,
        recognitionLevel3Days,
        hasRecognitionDiff: Math.abs(recognitionLevel3Days) > 0.01,
        level3Days: 0,
        amount: 0,
        modified: false,
      };
    });
  }, [record.period, selectedDailyRows, selectedMonthlyRow]);

  const filteredDailyDetailRows = useMemo(() => {
    if (dailyDetailFilter === 'workday') {
      return selectedDailyDisplayRows.filter((item) => item.isWorkday);
    }

    if (dailyDetailFilter === 'diff') {
      return selectedDailyDisplayRows.filter(
        (item) =>
          item.hasRecognitionDiff ||
          Math.abs(item.level1Days - item.level3Days) > 0.01 ||
          Math.abs(item.level2Days - item.level3Days) > 0.01,
      );
    }

    if (dailyDetailFilter === 'modified') {
      return selectedDailyDisplayRows.filter((item) => item.modified);
    }

    return selectedDailyDisplayRows;
  }, [dailyDetailFilter, selectedDailyDisplayRows]);

  const selectedMonthlyHasModifiedRows = selectedDailyRows.some((item) => item.modified);

  const targetWorkDays = useMemo(
    () => roundValue(positionTargets.reduce((sum, item) => sum + item.targetCapacityDays, 0)),
    [positionTargets],
  );

  const targetAmount = useMemo(
    () => roundValue(positionTargets.reduce((sum, item) => sum + item.targetAmount, 0)),
    [positionTargets],
  );

  const summary = {
    customer: record.customer,
    contract: record.contract,
    period: `${record.period}，按1月/2月/3月分组`,
    center: record.operationCenter,
    workDays: targetWorkDays,
    amount: targetAmount,
  };

  const canEdit = record.status === '待调整' || record.status === '已驳回';
  const canSubmit = record.status === '待调整' || record.status === '待提交';
  const canReview = record.status === '待审核';
  const canAdjustTotalAmount = canEdit && (Math.abs(totalPositionSummary.capacityGap) <= 0.01 || totalAdjustmentTouched);

  const updatePersonRow = (id: string, value: string) => {
    if (id) {
      setDailyAdjustmentReasons((prev) => {
        const currentValue = prev[id]?.trim();

        if (currentValue) {
          return prev;
        }

        return {
          ...prev,
          [id]: '三级确认',
        };
      });
    }

    setPersonRows((prev) => {
      let matched = false;
      const level3Days = Math.max(0, Number(value) || 0);

      const nextRows = prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        matched = true;

        return {
          ...item,
          level3Days,
          amount: Number((level3Days * item.unitPrice).toFixed(2)),
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
          level1Days: 0,
          level2Days: 0,
          level3Days,
          unitPrice: selectedMonthlyRow.unitPrice,
          amount: Number((level3Days * selectedMonthlyRow.unitPrice).toFixed(2)),
          modified: true,
        },
      ];
    });
  };

  const revertPersonRow = (id: string) => {
    const original = initialPersonRowMap.get(id);

    setPersonRows((prev) => {
      return original
        ? prev.map((item) => (item.id === id ? { ...original } : item))
        : prev.filter((item) => item.id !== id);
    });

    setDailyAdjustmentReasons((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const revertSelectedPositionRows = () => {
    const dailyIdsToClear = new Set(personRows.filter((item) => item.position === selectedPosition).map((item) => item.id));

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

    setDailyAdjustmentReasons((prev) => {
      const next = { ...prev };
      dailyIdsToClear.forEach((dailyId) => {
        delete next[dailyId];
      });
      return next;
    });
  };

  const revertMonthlyRow = (summaryId: string) => {
    const dailyIdsToClear = new Set(personRows.filter((item) => item.summaryId === summaryId).map((item) => item.id));

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

    setDailyAdjustmentReasons((prev) => {
      const next = { ...prev };
      dailyIdsToClear.forEach((dailyId) => {
        delete next[dailyId];
      });
      return next;
    });
  };

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  const updateTotalAdjustmentAmount = (value: string) => {
    setTotalAdjustmentTouched(true);
    setTotalAdjustmentAmount(value);
  };

  const updateDailyAdjustmentReason = (dailyId: string, value: string) => {
    setDailyAdjustmentReasons((prev) => ({
      ...prev,
      [dailyId]: value,
    }));
  };

  const applyQuickAdjustment = () => {
    if (!selectedMonthlyRow || !filteredDailyDetailRows.length) {
      return;
    }

    setPersonRows((prev) => {
      const nextRows = [...prev];

      filteredDailyDetailRows.forEach((item) => {
        const existingIndex = nextRows.findIndex((row) => row.id === item.id);
        const nextAmount = Number((item.recognitionLevel3Days * selectedMonthlyRow.unitPrice).toFixed(2));

        if (existingIndex >= 0) {
          nextRows[existingIndex] = {
            ...nextRows[existingIndex],
            level3Days: item.recognitionLevel3Days,
            amount: nextAmount,
            modified: true,
          };
          return;
        }

        if (item.recognitionLevel3Days > 0.01) {
          nextRows.push({
            id: item.id,
            summaryId: selectedMonthlyRow.id,
            month: selectedMonthlyRow.month,
            date: item.date,
            position: selectedMonthlyRow.position,
            member: selectedMonthlyRow.member,
            level1Days: item.level1Days,
            level2Days: item.level2Days,
            level3Days: item.recognitionLevel3Days,
            unitPrice: selectedMonthlyRow.unitPrice,
            amount: nextAmount,
            modified: true,
          });
        }
      });

      return nextRows;
    });

    setDailyAdjustmentReasons((prev) => {
      const next = { ...prev };

      filteredDailyDetailRows.forEach((item) => {
        next[item.id] = prev[item.id]?.trim() || '一键调整';
      });

      return next;
    });
  };

  const openTotalAdjustmentModal = () => {
    setDraftTotalAdjustmentAmount(totalAdjustmentAmount || String(roundValue(totalPositionSummary.amountGap)));
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

  const selectedPositionHasModifiedRows = filteredPersonRows.some((item) => item.modified);

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
              返回三级列表
            </button>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${badgeColorMap[record.status] || 'bg-cyan-100 text-primary'}`}>
                {record.status}
              </span>
              <span className="text-on-surface-variant">是否跨中心：{record.approverLevel === '总部审批' ? '是' : '否'}</span>
              <span className="text-on-surface-variant">当前审批层级：{record.approverLevel || '分中心审批'}</span>
              <span className="text-amber-600">便捷筛选可快速定位差异数据和已修改数据</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <button className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">
                <Save className="w-3.5 h-3.5" />
                保存草稿
              </button>
            )}
            {canSubmit && (
              <button className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
                <Send className="w-3.5 h-3.5" />
                提交确认
              </button>
            )}
            {canReview && (
              <button className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                <Send className="w-3.5 h-3.5" />
                通过
              </button>
            )}
            {canReview && (
              <button className="flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
                驳回
              </button>
            )}
            {!canReview && (
              <button className="flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100 transition-colors">
                <XCircle className="w-3.5 h-3.5" />
                撤销批次
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {canReview ? (
              <div className="min-w-[260px] rounded border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface">
                {selectedRecognitionResult
                  ? formatRecognitionBatchName(summary.workDays, summary.amount, selectedRecognitionResult.identifiedAt)
                  : '--'}
              </div>
            ) : (
              <select
                value={selectedRecognitionResult?.id || ''}
                onChange={(event) => setSelectedRecognitionResultId(event.target.value)}
                className="admin-input min-w-[260px] py-1.5 text-xs"
              >
                {recognitionResults.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatRecognitionBatchName(summary.workDays, summary.amount, item.identifiedAt)}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setRecognitionLogsOpen(true)}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              查看识别日志
            </button>
            <button className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <Eye className="w-3.5 h-3.5" />
              查看原始文件
            </button>
            <button className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <Download className="w-3.5 h-3.5" />
              下载原始文件
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 md:grid-cols-2 lg:grid-cols-3">
          <div><div className="text-xs text-on-surface-variant mb-1">客户</div><div className="text-sm font-medium text-on-surface">{summary.customer}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">合同</div><div className="text-sm font-medium text-on-surface">{summary.contract}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">期间</div><div className="text-sm font-medium text-on-surface">{summary.period}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">所属中心</div><div className="text-sm font-medium text-on-surface">{summary.center}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">识别产能人天</div><div className="text-sm font-medium text-on-surface">{formatNumber(summary.workDays)}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">识别金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(summary.amount)}</div></div>
        </div>
        <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            原始文件：{originalAttachment.name}
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="border-b border-outline-variant bg-primary/5 px-5 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-on-surface">联动筛选区</div>
              <div className="mt-1 text-xs text-on-surface-variant">
                左侧选择合同岗位，右侧人员产能明细同步联动；筛选同时作用于合同岗位汇总信息和人员产能明细。
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
                  差异=左侧识别结果与右侧人员明细汇总不一致
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
                  <th className="w-[10%] px-3 py-2.5">税率</th>
                  <th className="w-[13%] px-3 py-2.5">汇总产能</th>
                  <th className="w-[15%] px-3 py-2.5">汇总金额</th>
                  <th className="w-[30%] px-3 py-2.5">人员明细汇总</th>
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
                      <td className="px-3 py-3 align-top text-xs">{item.taxRate}%</td>
                      <td className="px-3 py-3 align-top text-xs">{formatNumber(item.targetCapacityDays)}</td>
                      <td className="px-3 py-3 align-top text-xs">{formatCurrency(item.targetAmount)}</td>
                      <td className="px-3 py-3 align-top text-xs">
                        <div className="space-y-0.5 leading-5 break-words">
                          <div>产能：{formatNumber(item.detailCapacityDays)}</div>
                          <div>金额：{formatCurrency(item.detailAmount)}</div>
                          <div className={item.hasDiff ? 'text-amber-600' : 'text-emerald-600'}>
                            {item.hasDiff
                              ? `待补齐：${formatNumber(item.capacityGap)} 人天 / ${formatCurrency(item.amountGap)}`
                              : '已与识别结果一致'}
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
              <div className="grid gap-3 text-xs text-on-surface md:grid-cols-[1.1fr_0.75fr_0.6fr_0.8fr_1fr_1.8fr] md:items-start">
                <div className="font-semibold text-sm text-on-surface">合同岗位总计</div>
                <div>
                  <div className="text-on-surface-variant">单价</div>
                  <div>--</div>
                </div>
                <div>
                  <div className="text-on-surface-variant">税率</div>
                  <div>--</div>
                </div>
                <div>
                  <div className="text-on-surface-variant">汇总产能</div>
                  <div className="font-medium">{formatNumber(totalPositionSummary.targetCapacityDays)}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant">汇总金额</div>
                  <div className="font-medium">{formatCurrency(totalPositionSummary.targetAmount)}</div>
                </div>
                <div className="space-y-1">
                  <div>产能：{formatNumber(totalPositionSummary.detailCapacityDays)}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>金额：{formatCurrency(totalPositionSummary.detailAmount)}</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={openTotalAdjustmentModal}
                        disabled={!canAdjustTotalAmount}
                        className="rounded border border-outline-variant bg-white px-2.5 py-1 text-xs text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:text-on-surface-variant disabled:bg-surface-container-low"
                      >
                        调整
                      </button>
                    )}
                  </div>
                  {!canAdjustTotalAmount && canEdit && (
                    <div className="text-amber-600">请先调整产能至对齐后，再进行金额调整。</div>
                  )}
                  {!!(totalAdjustmentTouched || totalAdjustmentReason) && (
                    <>
                      <div>调整金额：{formatCurrency(totalPositionSummary.adjustmentAmount)}</div>
                      <div>调整原因：{totalAdjustmentReason || '--'}</div>
                    </>
                  )}
                  <div>调整后金额：{formatCurrency(totalPositionSummary.adjustedDetailAmount)}</div>
                  <div className={totalPositionSummary.hasDiff ? 'text-amber-600' : 'text-emerald-600'}>
                    {totalPositionSummary.hasDiff
                      ? `待补齐：${formatNumber(totalPositionSummary.capacityGap)} 人天 / ${formatCurrency(totalPositionSummary.adjustedAmountGap)}`
                      : '汇总已与识别结果一致'}
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
                  <th className="w-[88px] px-4 py-3">一级产能</th>
                  <th className="w-[88px] px-4 py-3">二级产能</th>
                  <th className="w-[128px] px-3 py-3">三级产能</th>
                  <th className="w-[96px] px-4 py-3">单价</th>
                  <th className="w-[128px] px-3 py-3">金额</th>
                  <th className="sticky right-0 z-10 w-[88px] border-l border-outline-variant bg-surface-container-low px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                {!filteredPersonRows.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-on-surface-variant">
                      当前合同岗位下暂无符合筛选条件的人员明细
                    </td>
                  </tr>
                )}
                {monthGroups.map((group) => (
                  <React.Fragment key={group.month}>
                    <tr className="bg-surface-container-low/80 text-xs text-on-surface-variant">
                      <td colSpan={8} className="px-4 py-2.5">
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
                          <span>本月小计：{formatNumber(group.totalDays)} 人天 / {formatCurrency(group.totalAmount)}</span>
                        </button>
                      </td>
                    </tr>
                    {expandedMonths[group.month] && group.rows.map((item) => (
                      <tr key={item.id} className="group hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-4 font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{item.member}</span>
                            <RowTags hasDiff={false} modified={item.modified} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-on-surface-variant">{item.month}</td>
                        <td className="px-4 py-4">{formatNumber(item.level1Days)}</td>
                        <td className="px-4 py-4">{formatNumber(item.level2Days)}</td>
                        <td className="px-3 py-4">{formatNumber(item.level3Days)}</td>
                        <td className="px-4 py-4">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-3 py-4">{formatCurrency(item.amount)}</td>
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
            className="flex max-h-full w-full max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl xl:max-w-7xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div className="flex flex-1 items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-base font-semibold text-on-surface">每日产能详情</div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
                    <span>姓名：{selectedMonthlyRow.member}</span>
                    <span>|</span>
                    <span>级别：{selectedMonthlyRow.position}</span>
                    <span>|</span>
                    <span>月份：{selectedMonthlyRow.month}</span>
                    <span>|</span>
                    <span>产能数：{formatNumber(selectedMonthlyRow.level3Days)}</span>
                    <span>|</span>
                    <span>金额汇总：{formatCurrency(selectedMonthlyRow.amount)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={applyQuickAdjustment}
                        disabled={!filteredDailyDetailRows.length}
                        className="rounded border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-outline-variant disabled:bg-surface-container-low disabled:text-on-surface-variant"
                      >
                        一键调整当前筛选
                      </button>
                    )}
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
                    <th className="w-[18%] px-4 py-3">日期</th>
                    <th className="w-[10%] px-4 py-3">一级产能</th>
                    <th className="w-[10%] px-4 py-3">二级产能</th>
                    <th className="w-[12%] px-4 py-3">识别三级产能</th>
                    <th className="w-[14%] px-4 py-3 bg-amber-50 text-amber-700">三级产能（日调整）</th>
                    <th className="w-[20%] px-4 py-3">调整原因</th>
                    <th className="w-[10%] px-4 py-3">金额</th>
                    <th className="w-[6%] px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                  {!filteredDailyDetailRows.length && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-on-surface-variant">
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
                          <RowTags hasDiff={item.hasRecognitionDiff} modified={item.modified} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{formatNumber(item.level1Days)}</td>
                      <td className="px-4 py-3.5">{formatNumber(item.level2Days)}</td>
                      <td className="px-4 py-3.5">{formatNumber(item.recognitionLevel3Days)}</td>
                      <td className="bg-amber-50/80 px-4 py-3.5">
                        {canEdit ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.level3Days}
                            onChange={(event) => updatePersonRow(item.id, event.target.value)}
                            className="admin-input w-full border-amber-300 bg-white px-2.5 shadow-[0_0_0_2px_rgba(245,158,11,0.08)]"
                          />
                        ) : (
                          formatNumber(item.level3Days)
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {canEdit ? (
                          <input
                            type="text"
                            value={dailyAdjustmentReasons[item.id] ?? ''}
                            onChange={(event) => updateDailyAdjustmentReason(item.id, event.target.value)}
                            placeholder="修改后自动带出“三级确认”"
                            className="admin-input h-10 w-full px-2.5 text-xs"
                          />
                        ) : (
                          <div className="truncate text-xs text-on-surface" title={dailyAdjustmentReasons[item.id] || '--'}>
                            {dailyAdjustmentReasons[item.id] || '--'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{formatCurrency(item.amount)}</td>
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
                <div className="text-base font-semibold text-on-surface">金额调整</div>
                <div className="mt-1 text-xs text-on-surface-variant">
                  先完成产能对齐，再对金额差额进行补充调整，并明确填写调整原因。
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
                  placeholder="请手动填写金额调整原因"
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

      {recognitionLogsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={() => setRecognitionLogsOpen(false)}
        >
          <div
            className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">识别日志</div>
                <div className="mt-1 text-xs text-on-surface-variant">
                  当前识别结果：{selectedRecognitionResult
                    ? formatRecognitionBatchName(summary.workDays, summary.amount, selectedRecognitionResult.identifiedAt)
                    : '--'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecognitionLogsOpen(false)}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto custom-scrollbar px-5 py-4">
              <div className="space-y-3">
                {selectedRecognitionResult?.logs.map((log) => (
                  <div key={log.id} className="rounded border border-outline-variant bg-surface-container-low px-4 py-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="text-sm font-medium text-on-surface">{log.action}</div>
                      <div className="text-xs text-on-surface-variant">{log.time}</div>
                    </div>
                    <div className="text-xs text-on-surface-variant mb-1">操作人：{log.operator}</div>
                    <div className="text-sm text-on-surface">{log.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        <SectionTitle
          title="审批轨迹及操作日志"
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
          <div className="p-5">
            <div className="space-y-4">
              {approvalLogs.map((log) => (
                <div key={`${log.node}-${log.time}`} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-light text-primary">
                    <History className="w-3 h-3" />
                  </div>
                  <div className="rounded border border-outline-variant bg-surface-container-low px-4 py-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="text-sm font-semibold text-on-surface">{log.node}</div>
                      <div className="text-xs text-on-surface-variant">{log.time}</div>
                    </div>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <div><span className="text-on-surface-variant">处理人：</span><span className="text-on-surface">{log.handler}</span></div>
                      <div><span className="text-on-surface-variant">操作：</span><span className="text-on-surface">{log.action}</span></div>
                      <div className="md:col-span-2"><span className="text-on-surface-variant">审批意见：</span><span className="text-on-surface">{log.comment}</span></div>
                      <div className="md:col-span-2"><span className="text-on-surface-variant">变化摘要：</span><span className="text-on-surface">{log.delta}</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 text-sm text-on-surface-variant bg-surface-container-low">
            当前默认收起，展开后可查看审批轨迹与操作日志详情。
          </div>
        )}
      </div>
    </div>
  );
};