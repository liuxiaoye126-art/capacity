import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { MainFooterPortal } from '../components/layout/Shell';
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
  sourceGranularity: AcceptanceGranularity;
  position: string;
  member: string;
  operationCenter: string;
  bankBranch: string;
  handler: string;
  level1Days: number;
  level2Days: number;
  level3Days: number;
  normalHours: number;
  overtimeHours: number;
  systemUnitPrice: number;
  recognitionUnitPrice: number;
  amount: number;
  recognitionAmount: number;
  modified: boolean;
}

interface DailyDetailDisplayRow {
  id: string;
  date: string;
  isWorkday: boolean;
  operationCenter: string;
  bankBranch: string;
  handler: string;
  level1Days: number;
  level2Days: number;
  recognitionLevel3Days: number;
  hasRecognitionDiff: boolean;
  level3Days: number;
  normalHours: number;
  overtimeHours: number;
  sourceGranularity: AcceptanceGranularity;
  systemUnitPrice: number;
  recognitionUnitPrice: number;
  amount: number;
  recognitionAmount: number;
  modified: boolean;
}

interface PersonMonthlyRow {
  id: string;
  month: string;
  position: string;
  member: string;
  operationCenter: string;
  bankBranch: string;
  handler: string;
  sourceGranularity: AcceptanceGranularity;
  level1Days: number;
  level2Days: number;
  level3Days: number;
  systemUnitPrice: number;
  recognitionUnitPrice: number;
  baseAmount: number;
  computedAmount: number;
  recognitionAmount: number;
  hasDiff: boolean;
  modified: boolean;
}

interface PositionTemplate {
  position: string;
  targetDays: number;
  members: Array<{
    name: string;
    monthlyDays: number[];
    operationCenter?: string;
    bankBranch?: string;
    handler?: string;
  }>;
}

interface CenterConfirmStatus {
  operationCenter: string;
  status: '待确认' | '已确认';
  confirmer: string;
  confirmedAt: string;
  workDays: number;
  amount: number;
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

type AcceptanceGranularity = 'monthly' | 'daily';
type QuickFilter = 'all' | 'diff' | 'modified';
type DailyDetailFilter = 'all' | 'workday' | 'diff' | 'modified';
type AdjustmentType = 'capacity' | 'amount';

interface AdjustmentRecord {
  id: string;
  summaryId: string;
  type: AdjustmentType;
  adjustmentValue?: number;
  beforeValue: number;
  afterValue: number;
  reason: string;
  operator: string;
  time: string;
}

interface LevelThreeInitialState {
  personRows: DailyCapacityRow[];
  dailyAdjustmentReasons: Record<string, string>;
  adjustmentHistoryMap: Record<string, AdjustmentRecord[]>;
}

const granularityLabelMap: Record<AcceptanceGranularity, string> = {
  monthly: '月产能',
  daily: '日产能',
};

const QUARTER_MONTHS = ['1月', '2月', '3月'];

const badgeColorMap: Record<string, string> = {
  '初始化': 'bg-slate-100 text-slate-700',
  '待确认': 'bg-amber-100 text-amber-700',
  '待审核': 'bg-sky-100 text-sky-700',
  '已通过': 'bg-emerald-100 text-emerald-700',
};

const CHINA_BANK_SPLIT_GROUPS = [
  {
    operationCenter: '上海运营中心',
    branches: ['中行上海', '中行武汉'],
    handlers: ['赵晨', '杨琳'],
  },
  {
    operationCenter: '第三运营中心',
    branches: ['中行珠海'],
    handlers: ['王静'],
  },
  {
    operationCenter: '第四运营中心',
    branches: ['中行北京'],
    handlers: ['李晓燕'],
  },
  {
    operationCenter: '第五运营中心',
    branches: ['中行深圳'],
    handlers: ['陈敏'],
  },
  {
    operationCenter: '第六运营中心',
    branches: ['中行成都', '中行西安', '中行合肥'],
    handlers: ['张楠', '王双银'],
  },
] as const;

const CHINA_BANK_CENTER_CONFIRM_STATUS: Record<string, CenterConfirmStatus[]> = {
  'L3-2026Q1-011': [
    { operationCenter: '上海运营中心', status: '待确认', confirmer: '--', confirmedAt: '--', workDays: 182, amount: 246800 },
    { operationCenter: '第三运营中心', status: '待确认', confirmer: '--', confirmedAt: '--', workDays: 91, amount: 123400 },
    { operationCenter: '第四运营中心', status: '待确认', confirmer: '--', confirmedAt: '--', workDays: 91, amount: 123400 },
    { operationCenter: '第五运营中心', status: '待确认', confirmer: '--', confirmedAt: '--', workDays: 91, amount: 123400 },
    { operationCenter: '第六运营中心', status: '待确认', confirmer: '--', confirmedAt: '--', workDays: 447, amount: 601600 },
  ],
  'L3-2026Q1-012': [
    { operationCenter: '上海运营中心', status: '已确认', confirmer: '赵晨', confirmedAt: '2026-04-12 13:20', workDays: 182, amount: 246800 },
    { operationCenter: '第三运营中心', status: '已确认', confirmer: '王静', confirmedAt: '2026-04-12 13:28', workDays: 91, amount: 123400 },
    { operationCenter: '第四运营中心', status: '已确认', confirmer: '李晓燕', confirmedAt: '2026-04-12 13:35', workDays: 91, amount: 123400 },
    { operationCenter: '第五运营中心', status: '已确认', confirmer: '陈敏', confirmedAt: '2026-04-12 13:42', workDays: 91, amount: 123400 },
    { operationCenter: '第六运营中心', status: '待确认', confirmer: '--', confirmedAt: '--', workDays: 447, amount: 601600 },
  ],
};

const CHINA_BANK_MOCK_MEMBERS = [
  ['周子航', '孙雨桐'],
  ['韩一鸣', '徐嘉宁'],
  ['魏晨曦', '许安然'],
  ['蒋明轩', '沈若溪'],
  ['陆景川', '顾可欣'],
  ['唐思远', '郑书瑶'],
  ['高云帆', '罗静宜'],
  ['梁知夏', '邵亦凡'],
] as const;

const normalizeLevelThreeStatus = (status: string) => {
  if (status === '初始化') {
    return '初始化';
  }

  if (status === '待审核') {
    return '待审核';
  }

  if (status === '已通过') {
    return '已通过';
  }

  return '待确认';
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

const nowText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getAcceptanceGranularity = (record: CapacityRecord): AcceptanceGranularity =>
  record.customer === '上海银行' ? 'monthly' : 'daily';

const createRecognitionUnitPrice = (systemUnitPrice: number, member: string, position: string) => {
  const seed = Array.from(`${member}-${position}`).reduce((sum, item) => sum + item.charCodeAt(0), 0);

  if (seed % 5 === 0) {
    return roundValue(systemUnitPrice + 120);
  }

  if (seed % 3 === 0) {
    return roundValue(systemUnitPrice - 80);
  }

  return roundValue(systemUnitPrice);
};

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

const formatSignedNumber = (value: number) => `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatNumber(Math.abs(value))}`;

const formatSignedCurrency = (value: number) => `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatCurrency(Math.abs(value))}`;

const formatRecognitionBatchName = (workDays: number, amount: number, identifiedAt: string) =>
  `${formatNumber(workDays)}人天 ${formatCurrency(amount).replace('¥', '￥')} ${identifiedAt}`;

const createRecognitionLevel3Value = (date: string, baseDays: number, member: string) => {
  const day = Number(date.match(/月(\d{2})日/)?.[1] || '0');
  const memberSeed = Array.from(member).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const offsetCycle = (memberSeed + day) % 6;
  const offset = offsetCycle === 0 ? 0.5 : offsetCycle === 3 ? -0.5 : 0;

  return roundValue(Math.max(0, baseDays + offset));
};

const createRecognitionReason = (deltaValue: number) =>
  deltaValue > 0 ? '确认单识别：客户补录产能，系统已自动回填。' : '确认单识别：客户扣减产能，系统已自动回填。';

const createChinaBankHours = (date: string, isWorkday: boolean, member: string, branch: string) => {
  const day = Number(date.match(/月(\d{2})日/)?.[1] || '1');
  const seed = Array.from(`${member}-${branch}`).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  if (isWorkday) {
    const overtimeHours = [0.5, 1, 1.5, 2][(seed + day) % 4];
    return {
      normalHours: 8,
      overtimeHours,
    };
  }

  const overtimeHours = [2, 3, 4, 5][(seed + day) % 4];
  return {
    normalHours: 0,
    overtimeHours,
  };
};

const createTemplates = (record: CapacityRecord): PositionTemplate[] => {
  if (record.customer === '中国银行') {
    let memberSeed = 0;

    return CHINA_BANK_SPLIT_GROUPS.flatMap((group, centerIndex) =>
      group.branches.map((branch, branchIndex) => {
        const handler = group.handlers[(centerIndex + branchIndex) % group.handlers.length];
        const memberPair = CHINA_BANK_MOCK_MEMBERS[memberSeed % CHINA_BANK_MOCK_MEMBERS.length];
        memberSeed += 1;

        return {
          position: centerIndex % 2 === 0 ? '高级' : '中级',
          targetDays: 180,
          members: [
            {
              name: memberPair[0],
              monthlyDays: [20, 21, 20],
              operationCenter: group.operationCenter,
              bankBranch: branch,
              handler,
            },
            {
              name: memberPair[1],
              monthlyDays: [19, 20, 21],
              operationCenter: group.operationCenter,
              bankBranch: branch,
              handler,
            },
          ],
        };
      }),
    );
  }

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

const createDailyRows = (record: CapacityRecord): DailyCapacityRow[] => {
  const systemUnitPrice = roundValue(record.amount / record.workDays);
  const periodYear = getPeriodYear(record.period);
  const sourceGranularity = getAcceptanceGranularity(record);
  const isChinaBank = record.customer === '中国银行';

  return createTemplates(record).flatMap((item) =>
    item.members.flatMap((member, memberIndex) =>
      QUARTER_MONTHS.flatMap((month, monthIndex) => {
        const summaryId = `${record.id}-${item.position}-member-${memberIndex + 1}-${month}`;
        const monthNumber = monthIndex + 1;
        const monthDates = isChinaBank
          ? createMonthDates(periodYear, monthNumber)
          : createWorkdayDates(periodYear, monthNumber).map((date) => ({ date, isWorkday: true }));
        const dailyCapacities = createDailyCapacities(member.monthlyDays[monthIndex] ?? 0, monthDates.length);
        const recognitionUnitPrice = createRecognitionUnitPrice(systemUnitPrice, member.name, item.position);
        const operationCenter = member.operationCenter || record.operationCenter;
        const bankBranch = member.bankBranch || record.subCenter;
        const handler = member.handler || record.handler;

        return monthDates.map(({ date, isWorkday }, dayIndex) => {
          const dayCapacity = dailyCapacities[dayIndex] ?? 0;
          const hourProfile = isChinaBank
            ? createChinaBankHours(date, isWorkday, member.name, bankBranch)
            : { normalHours: roundValue(dayCapacity * 8), overtimeHours: 0 };
          const level3Days = isChinaBank
            ? roundValue((hourProfile.normalHours + hourProfile.overtimeHours) / 8)
            : dayCapacity;
          const recognitionLevel3Days = createRecognitionLevel3Value(date, level3Days, member.name);

          return {
            id: `${summaryId}-${dayIndex + 1}`,
            summaryId,
            month,
            date,
            sourceGranularity,
            position: item.position,
            member: member.name,
            operationCenter,
            bankBranch,
            handler,
            level1Days: level3Days,
            level2Days: level3Days,
            level3Days,
            normalHours: hourProfile.normalHours,
            overtimeHours: hourProfile.overtimeHours,
            systemUnitPrice,
            recognitionUnitPrice,
            amount: roundValue(level3Days * systemUnitPrice),
            recognitionAmount: roundValue(recognitionLevel3Days * recognitionUnitPrice),
            modified: false,
          };
        });
      }),
    ),
  );
};

const createInitialLevelThreeState = (record: CapacityRecord): LevelThreeInitialState => {
  if (record.status === '初始化') {
    return {
      personRows: [],
      dailyAdjustmentReasons: {},
      adjustmentHistoryMap: {},
    };
  }

  const baseRows = createDailyRows(record);
  const dailyAdjustmentReasons: Record<string, string> = {};
  const summaryTotals = new Map<string, { beforeValue: number; afterValue: number }>();

  const personRows = baseRows.map((row) => {
    const recognizedLevel3Days = createRecognitionLevel3Value(row.date, row.level2Days, row.member);
    const deltaValue = roundValue(recognizedLevel3Days - row.level3Days);

    if (Math.abs(deltaValue) <= 0.01) {
      summaryTotals.set(row.summaryId, {
        beforeValue: roundValue((summaryTotals.get(row.summaryId)?.beforeValue || 0) + row.level3Days),
        afterValue: roundValue((summaryTotals.get(row.summaryId)?.afterValue || 0) + row.level3Days),
      });

      return row;
    }

    dailyAdjustmentReasons[row.id] = createRecognitionReason(deltaValue);
    summaryTotals.set(row.summaryId, {
      beforeValue: roundValue((summaryTotals.get(row.summaryId)?.beforeValue || 0) + row.level3Days),
      afterValue: roundValue((summaryTotals.get(row.summaryId)?.afterValue || 0) + recognizedLevel3Days),
    });

    return {
      ...row,
      level3Days: recognizedLevel3Days,
      amount: roundValue(recognizedLevel3Days * row.systemUnitPrice),
      modified: true,
    };
  });

  const monthlyRows = buildMonthlyRows(personRows, {});
  const adjustmentHistoryMap: Record<string, AdjustmentRecord[]> = {};

  monthlyRows.forEach((row) => {
    const total = summaryTotals.get(row.id);

    if (!total || Math.abs(total.afterValue - total.beforeValue) <= 0.01) {
      return;
    }

    adjustmentHistoryMap[row.id] = [
      {
        id: `${row.id}-recognized-capacity`,
        summaryId: row.id,
        type: 'capacity',
        adjustmentValue: roundValue(total.afterValue - total.beforeValue),
        beforeValue: total.beforeValue,
        afterValue: total.afterValue,
        reason: '确认单识别回填：系统已根据确认单自动带出人员增减量，可继续手工维护。',
        operator: '系统识别引擎',
        time: '确认单识别回填',
      },
    ];
  });

  return {
    personRows,
    dailyAdjustmentReasons,
    adjustmentHistoryMap,
  };
};

const getInitializationDescription = (record: CapacityRecord) => {
  if (record.id === 'L3-2026Q1-010') {
    return '刘晨的三级产能无对应的本合同下的一二级产能，请确认其项目履历。';
  }

  return '当前三级产能未完成初始化，请先核对人员项目履历和级别归属。';
};

const buildMonthlyRows = (rows: DailyCapacityRow[], amountOverrides: Record<string, number>): PersonMonthlyRow[] => {
  const grouped = new Map<string, PersonMonthlyRow>();

  rows.forEach((item) => {
    const existing = grouped.get(item.summaryId);

    if (existing) {
      existing.level1Days = roundValue(existing.level1Days + item.level1Days);
      existing.level2Days = roundValue(existing.level2Days + item.level2Days);
      existing.level3Days = roundValue(existing.level3Days + item.level3Days);
      existing.baseAmount = roundValue(existing.baseAmount + item.amount);
      existing.recognitionAmount = roundValue(existing.recognitionAmount + item.recognitionAmount);
      existing.modified = existing.modified || item.modified;
      return;
    }

    grouped.set(item.summaryId, {
      id: item.summaryId,
      month: item.month,
      position: item.position,
      member: item.member,
      operationCenter: item.operationCenter,
      bankBranch: item.bankBranch,
      handler: item.handler,
      sourceGranularity: item.sourceGranularity,
      level1Days: item.level1Days,
      level2Days: item.level2Days,
      level3Days: item.level3Days,
      systemUnitPrice: item.systemUnitPrice,
      recognitionUnitPrice: item.recognitionUnitPrice,
      baseAmount: item.amount,
      computedAmount: item.amount,
      recognitionAmount: item.recognitionAmount,
      hasDiff: false,
      modified: item.modified,
    });
  });

  return Array.from(grouped.values()).map((item) => {
    const computedAmount = roundValue(amountOverrides[item.id] ?? item.baseAmount);
    const amountModified = Object.prototype.hasOwnProperty.call(amountOverrides, item.id);
    const hasDiff =
      Math.abs(item.level3Days - item.level1Days) > 0.01 ||
      Math.abs(item.level3Days - item.level2Days) > 0.01 ||
      Math.abs(item.systemUnitPrice - item.recognitionUnitPrice) > 0.01 ||
      Math.abs(computedAmount - item.recognitionAmount) > 0.01;

    return {
      ...item,
      computedAmount,
      hasDiff,
      modified: item.modified || amountModified,
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
  const isChinaBank = record.customer === '中国银行';
  const displayStatus = normalizeLevelThreeStatus(record.status);
  const isInitialization = displayStatus === '初始化';
  const canEdit = displayStatus === '待确认';
  const canSubmit = displayStatus === '待确认';
  const canReview = displayStatus === '待审核';
  const currentDeliveryHandler = isChinaBank ? '赵晨' : record.handler;

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [dailyDetailFilter, setDailyDetailFilter] = useState<DailyDetailFilter>('all');
  const [dailyLevel3DraftValues, setDailyLevel3DraftValues] = useState<Record<string, string>>({});
  const [lastDataRefreshTime, setLastDataRefreshTime] = useState(record.updatedAt);
  const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false);
  const [memberKeyword, setMemberKeyword] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [operationCenterFilter, setOperationCenterFilter] = useState('');
  const [bankBranchFilter, setBankBranchFilter] = useState('');
  const [selectedMonthlyDetailId, setSelectedMonthlyDetailId] = useState('');
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [recognitionLogsOpen, setRecognitionLogsOpen] = useState(false);
  const [amountOverrides, setAmountOverrides] = useState<Record<string, number>>({});
  const [adjustmentModal, setAdjustmentModal] = useState<{ summaryId: string; type: AdjustmentType } | null>(null);
  const [draftAdjustmentValue, setDraftAdjustmentValue] = useState('');
  const [draftAdjustmentReason, setDraftAdjustmentReason] = useState('');
  const [totalAmountAdjustment, setTotalAmountAdjustment] = useState(0);
  const [totalAmountAdjustmentModalOpen, setTotalAmountAdjustmentModalOpen] = useState(false);
  const [draftTotalAdjustmentValue, setDraftTotalAdjustmentValue] = useState('');
  const [draftTotalAdjustmentReason, setDraftTotalAdjustmentReason] = useState('');
  const [totalAmountAdjustmentHistory, setTotalAmountAdjustmentHistory] = useState<AdjustmentRecord[]>([]);
  const [dailyRowAdjustmentHistory, setDailyRowAdjustmentHistory] = useState<
    Record<string, Array<{ id: string; deltaValue: number; beforeValue: number; afterValue: number; reason: string; operator: string; time: string }>>
  >({});
  const [dailyAdjHistoryViewId, setDailyAdjHistoryViewId] = useState<string | null>(null);
  const recognitionResults = useMemo(() => createRecognitionResults(record), [record]);
  const initialState = useMemo(() => createInitialLevelThreeState(record), [record]);
  const initialPersonRows = useMemo(() => initialState.personRows, [initialState]);
  const initialDailyAdjustmentReasons = useMemo(() => initialState.dailyAdjustmentReasons, [initialState]);
  const initialAdjustmentHistoryMap = useMemo(() => initialState.adjustmentHistoryMap, [initialState]);
  const initialPersonRowMap = useMemo(
    () => new Map(initialPersonRows.map((item) => [item.id, item])),
    [initialPersonRows],
  );
  const [personRows, setPersonRows] = useState<DailyCapacityRow[]>(() => initialState.personRows);
  const [dailyAdjustmentReasons, setDailyAdjustmentReasons] = useState<Record<string, string>>(() => initialState.dailyAdjustmentReasons);
  const [adjustmentHistoryMap, setAdjustmentHistoryMap] = useState<Record<string, AdjustmentRecord[]>>(() => initialState.adjustmentHistoryMap);

  const resetLevelThreeDetailState = () => {
    setPersonRows(initialPersonRows);
    setQuickFilter('all');
    setMemberKeyword('');
    setPositionFilter('');
    setMonthFilter('');
    setOperationCenterFilter('');
    setBankBranchFilter('');
    setSelectedMonthlyDetailId('');
    setRecognitionLogsOpen(false);
    setLogsExpanded(false);
    setDailyDetailFilter('all');
    setDailyLevel3DraftValues({});
    setDailyAdjustmentReasons(initialDailyAdjustmentReasons);
    setAmountOverrides({});
    setAdjustmentHistoryMap(initialAdjustmentHistoryMap);
    setAdjustmentModal(null);
    setDraftAdjustmentValue('');
    setDraftAdjustmentReason('');
    setTotalAmountAdjustment(0);
    setTotalAmountAdjustmentModalOpen(false);
    setDraftTotalAdjustmentValue('');
    setDraftTotalAdjustmentReason('');
    setTotalAmountAdjustmentHistory([]);
    setDailyRowAdjustmentHistory({});
    setDailyAdjHistoryViewId(null);
  };

  useEffect(() => {
    resetLevelThreeDetailState();
    setLastDataRefreshTime(record.updatedAt);
    setRefreshConfirmOpen(false);
  }, [initialAdjustmentHistoryMap, initialDailyAdjustmentReasons, initialPersonRows, recognitionResults]);

  const selectedRecognitionResult = recognitionResults[0];

  const monthlyRows = useMemo(() => buildMonthlyRows(personRows, amountOverrides), [amountOverrides, personRows]);

  const centerConfirmStatus = useMemo(() => CHINA_BANK_CENTER_CONFIRM_STATUS[record.id] || [], [record.id]);
  const allCentersConfirmed = centerConfirmStatus.length > 0 && centerConfirmStatus.every((item) => item.status === '已确认');

  const filteredPersonRows = useMemo(
    () =>
      monthlyRows.filter((item) => {
        const matchedQuickFilter = matchesFilter(item, quickFilter);
        const matchedMember = !memberKeyword.trim() || item.member.includes(memberKeyword.trim());
        const matchedPosition = !positionFilter || item.position === positionFilter;
        const matchedMonth = !monthFilter || item.month === monthFilter;
        const matchedCenter = !operationCenterFilter || item.operationCenter === operationCenterFilter;
        const matchedBranch = !bankBranchFilter || item.bankBranch === bankBranchFilter;
        const matchedCurrentHandler = !(isChinaBank && canEdit) || item.handler === currentDeliveryHandler;

        return matchedQuickFilter && matchedMember && matchedPosition && matchedMonth && matchedCenter && matchedBranch && matchedCurrentHandler;
      }),
    [
      bankBranchFilter,
      canEdit,
      currentDeliveryHandler,
      isChinaBank,
      memberKeyword,
      monthFilter,
      monthlyRows,
      operationCenterFilter,
      positionFilter,
      quickFilter,
    ],
  );

  const positionOptions = useMemo(
    () => Array.from(new Set(monthlyRows.map((item) => item.position))),
    [monthlyRows],
  );

  const operationCenterOptions = useMemo(
    () => Array.from(new Set(monthlyRows.map((item) => item.operationCenter))),
    [monthlyRows],
  );

  const bankBranchOptions = useMemo(
    () => Array.from(new Set(monthlyRows.map((item) => item.bankBranch))),
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
      const baseDays = existing?.level1Days ?? 0;
      const recognitionLevel3Days = createRecognitionLevel3Value(date, baseDays, selectedMonthlyRow.member);

      if (existing) {
        return {
          id: existing.id,
          date: existing.date,
          isWorkday,
          operationCenter: existing.operationCenter,
          bankBranch: existing.bankBranch,
          handler: existing.handler,
          level1Days: existing.level1Days,
          level2Days: existing.level2Days,
          recognitionLevel3Days,
          hasRecognitionDiff:
            Math.abs(recognitionLevel3Days - existing.level1Days) > 0.01 ||
            Math.abs(recognitionLevel3Days - existing.level2Days) > 0.01,
          level3Days: existing.level3Days,
          normalHours: existing.normalHours,
          overtimeHours: existing.overtimeHours,
          sourceGranularity: existing.sourceGranularity,
          systemUnitPrice: existing.systemUnitPrice,
          recognitionUnitPrice: existing.recognitionUnitPrice,
          amount: existing.amount,
          recognitionAmount: roundValue(recognitionLevel3Days * existing.recognitionUnitPrice),
          modified: existing.modified,
        };
      }

      return {
        id: `${selectedMonthlyRow.id}-${date}`,
        date,
        isWorkday,
        operationCenter: selectedMonthlyRow.operationCenter,
        bankBranch: selectedMonthlyRow.bankBranch,
        handler: selectedMonthlyRow.handler,
        level1Days: 0,
        level2Days: 0,
        recognitionLevel3Days,
        hasRecognitionDiff: Math.abs(recognitionLevel3Days) > 0.01,
        level3Days: 0,
        normalHours: 0,
        overtimeHours: 0,
        sourceGranularity: selectedMonthlyRow.sourceGranularity,
        systemUnitPrice: selectedMonthlyRow.systemUnitPrice,
        recognitionUnitPrice: selectedMonthlyRow.recognitionUnitPrice,
        amount: 0,
        recognitionAmount: roundValue(recognitionLevel3Days * selectedMonthlyRow.recognitionUnitPrice),
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

  // 日产能粒度下，有调整量但未填写原因的行
  const dailyMissingReasonRows = useMemo(() => {
    if (!selectedMonthlyRow || selectedMonthlyRow.sourceGranularity !== 'daily') return [];
    return filteredDailyDetailRows.filter((item) => {
      const initialLevel3Days = initialPersonRowMap.get(item.id)?.level3Days ?? 0;
      const draftVal = dailyLevel3DraftValues[item.id];
      const hasDelta =
        draftVal !== undefined
          ? draftVal.trim() !== ''
          : Math.abs(item.level3Days - initialLevel3Days) > 0.001;
      return hasDelta && !dailyAdjustmentReasons[item.id]?.trim();
    });
  }, [selectedMonthlyRow, filteredDailyDetailRows, dailyLevel3DraftValues, dailyAdjustmentReasons, initialPersonRowMap]);

  const targetWorkDays = useMemo(() => roundValue(monthlyRows.reduce((sum, item) => sum + item.level3Days, 0)), [monthlyRows]);

  const targetAmount = useMemo(() => roundValue(monthlyRows.reduce((sum, item) => sum + item.recognitionAmount, 0)), [monthlyRows]);

  const summary = {
    customer: record.customer,
    contract: record.contract,
    period: `${record.period}，按1月/2月/3月分组`,
    center: record.operationCenter,
    workDays: targetWorkDays,
    amount: roundValue(targetAmount + totalAmountAdjustment),
  };

  const acceptanceGranularity = getAcceptanceGranularity(record);
  const initializationDescription = getInitializationDescription(record);

  const displaySummary = isInitialization
    ? {
        ...summary,
        workDays: record.workDays,
        amount: record.amount,
      }
    : summary;

  const updatePersonRow = (id: string, deltaStr: string) => {
    if (deltaStr.trim() === '') {
      // 清空输入 = 撤销该行调整，恢复初始值
      revertPersonRow(id);
      return;
    }

    const delta = Number(deltaStr) || 0;

    setPersonRows((prev) => {
      let matched = false;

      const nextRows = prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        matched = true;
        const initialRow = initialPersonRowMap.get(id);
        const initialLevel3Days = initialRow?.level3Days ?? item.level1Days;
        const level3Days = Math.max(0, roundValue(initialLevel3Days + delta));

        return {
          ...item,
          level3Days,
          amount: roundValue(level3Days * item.systemUnitPrice),
          modified: Math.abs(level3Days - initialLevel3Days) > 0.001,
        };
      });

      if (matched || !selectedMonthlyRow) {
        return nextRows;
      }

      const baselineRow = selectedDailyDisplayRows.find((item) => item.id === id);
      const baselineLevel1Days = baselineRow?.level1Days || 0;
      const baselineLevel2Days = baselineRow?.level2Days || 0;
      const recognitionLevel3Days = baselineRow?.recognitionLevel3Days || 0;
      const level3Days = Math.max(0, roundValue(recognitionLevel3Days + delta));

      return [
        ...nextRows,
        {
          id,
          summaryId: selectedMonthlyRow.id,
          month: selectedMonthlyRow.month,
          date: id.replace(`${selectedMonthlyRow.id}-`, ''),
          position: selectedMonthlyRow.position,
          member: selectedMonthlyRow.member,
          operationCenter: selectedMonthlyRow.operationCenter,
          bankBranch: selectedMonthlyRow.bankBranch,
          handler: selectedMonthlyRow.handler,
          level1Days: baselineLevel1Days,
          level2Days: baselineLevel2Days,
          level3Days,
          normalHours: baselineRow?.normalHours || 0,
          overtimeHours: baselineRow?.overtimeHours || 0,
          sourceGranularity: selectedMonthlyRow.sourceGranularity,
          systemUnitPrice: selectedMonthlyRow.systemUnitPrice,
          recognitionUnitPrice: selectedMonthlyRow.recognitionUnitPrice,
          amount: roundValue(level3Days * selectedMonthlyRow.systemUnitPrice),
          recognitionAmount: roundValue(recognitionLevel3Days * selectedMonthlyRow.recognitionUnitPrice),
          modified: Math.abs(level3Days - recognitionLevel3Days) > 0.001,
        },
      ];
    });
  };

  const updateDailyLevel3DraftValue = (id: string, value: string) => {
    setDailyLevel3DraftValues((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (value.trim() === '') {
      return;
    }

    updatePersonRow(id, value);
  };

  const commitDailyLevel3DraftValue = (id: string) => {
    const draftValue = dailyLevel3DraftValues[id];

    if (typeof draftValue === 'undefined') {
      return;
    }

    if (draftValue.trim() !== '') {
      updatePersonRow(id, draftValue);

      // Save history entry if reason is already filled
      const reason = dailyAdjustmentReasons[id]?.trim();
      if (reason) {
        const delta = Number(draftValue) || 0;
        const existingRow = personRows.find((r) => r.id === id);
        const initialLevel3Days = initialPersonRowMap.get(id)?.level3Days ?? (existingRow?.level1Days ?? 0);
        const beforeValue = existingRow?.level3Days ?? initialLevel3Days;
        const afterValue = Math.max(0, roundValue(initialLevel3Days + delta));
        setDailyRowAdjustmentHistory((prev) => {
          const history = prev[id] || [];
          const last = history[0];
          if (last && Math.abs(last.deltaValue - delta) < 0.001 && last.reason === reason) return prev;
          return {
            ...prev,
            [id]: [
              { id: `${id}-adj-${Date.now()}`, deltaValue: delta, beforeValue, afterValue, reason, operator: record.handler, time: nowText() },
              ...history,
            ],
          };
        });
      }
    }

    setDailyLevel3DraftValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const commitDailyAdjReason = (id: string) => {
    const reason = dailyAdjustmentReasons[id]?.trim();
    if (!reason) return;
    const existingRow = personRows.find((r) => r.id === id);
    const initialLevel3Days = initialPersonRowMap.get(id)?.level3Days ?? (existingRow?.level1Days ?? 0);
    const currentLevel3Days = existingRow?.level3Days ?? initialLevel3Days;
    const delta = roundValue(currentLevel3Days - initialLevel3Days);
    if (Math.abs(delta) < 0.001) return;
    setDailyRowAdjustmentHistory((prev) => {
      const history = prev[id] || [];
      const last = history[0];
      if (last && Math.abs(last.deltaValue - delta) < 0.001 && last.reason === reason) return prev;
      return {
        ...prev,
        [id]: [
          { id: `${id}-adj-${Date.now()}`, deltaValue: delta, beforeValue: roundValue(initialLevel3Days), afterValue: roundValue(currentLevel3Days), reason, operator: record.handler, time: nowText() },
          ...history,
        ],
      };
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
      if (initialDailyAdjustmentReasons[id]) {
        next[id] = initialDailyAdjustmentReasons[id];
      } else {
        delete next[id];
      }
      return next;
    });

    setDailyLevel3DraftValues((prev) => {
      const next = { ...prev };
      delete next[id];
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
        if (initialDailyAdjustmentReasons[dailyId]) {
          next[dailyId] = initialDailyAdjustmentReasons[dailyId];
        } else {
          delete next[dailyId];
        }
      });
      return next;
    });

    setDailyLevel3DraftValues((prev) => {
      const next = { ...prev };
      dailyIdsToClear.forEach((dailyId) => {
        delete next[dailyId];
      });
      return next;
    });
  };

  const updateDailyAdjustmentReason = (dailyId: string, value: string) => {
    setDailyAdjustmentReasons((prev) => ({
      ...prev,
      [dailyId]: value,
    }));
  };

  // no-op stub kept for JSX reference — actual save happens in commitDailyAdjReason (onBlur)
  const _commitDailyAdjReason = commitDailyAdjReason;

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

    const deltaValue = roundValue(Number(draftAdjustmentValue) || 0);
    const beforeValue = adjustmentModal.type === 'capacity' ? roundValue(currentAdjustmentRow.level2Days) : roundValue(currentAdjustmentRow.computedAmount);
    const afterValue =
      adjustmentModal.type === 'capacity'
        ? roundValue(currentAdjustmentRow.level3Days)
        : roundValue(Math.max(0, currentAdjustmentRow.computedAmount + deltaValue));

    if (adjustmentModal.type === 'amount') {
      setAmountOverrides((prev) => ({
        ...prev,
        [adjustmentModal.summaryId]: afterValue,
      }));
    }

    setAdjustmentHistoryMap((prev) => ({
      ...prev,
      [adjustmentModal.summaryId]: [
        {
          id: `${adjustmentModal.summaryId}-${adjustmentModal.type}-${Date.now()}`,
          summaryId: adjustmentModal.summaryId,
          type: adjustmentModal.type,
          adjustmentValue: deltaValue,
          beforeValue: roundValue(beforeValue),
          afterValue: roundValue(afterValue),
          reason: draftAdjustmentReason.trim(),
          operator: record.handler,
          time: nowText(),
        },
        ...(prev[adjustmentModal.summaryId] || []),
      ],
    }));

    closeAdjustmentModal();
  };

  const openTotalAmountAdjustmentModal = () => {
    setDraftTotalAdjustmentValue('0');
    setDraftTotalAdjustmentReason('');
    setTotalAmountAdjustmentModalOpen(true);
  };

  const closeTotalAmountAdjustmentModal = () => {
    setTotalAmountAdjustmentModalOpen(false);
    setDraftTotalAdjustmentValue('');
    setDraftTotalAdjustmentReason('');
  };

  const saveTotalAmountAdjustment = () => {
    if (!draftTotalAdjustmentReason.trim()) {
      return;
    }

    const beforeValue = totalAmountAdjustment;
    const deltaValue = Number(draftTotalAdjustmentValue) || 0;
    const nextValue = roundValue(beforeValue + deltaValue);

    setTotalAmountAdjustment(nextValue);
    setTotalAmountAdjustmentHistory((prev) => [
      {
        id: `level3-total-amount-${Date.now()}`,
        summaryId: 'level3-total-amount',
        type: 'amount',
        adjustmentValue: deltaValue,
        beforeValue,
        afterValue: nextValue,
        reason: draftTotalAdjustmentReason.trim(),
        operator: record.handler,
        time: nowText(),
      },
      ...prev,
    ]);

    closeTotalAmountAdjustmentModal();
  };

  const handleConfirmRefreshData = () => {
    if (!canEdit) {
      setRefreshConfirmOpen(false);
      return;
    }

    resetLevelThreeDetailState();
    setLastDataRefreshTime(nowText());
    setRefreshConfirmOpen(false);
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
                返回三级列表
              </button>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-on-surface-variant">当前确认识别结果：</span>
                <span className="font-medium text-on-surface">
                  {selectedRecognitionResult
                    ? formatRecognitionBatchName(displaySummary.workDays, displaySummary.amount, selectedRecognitionResult.identifiedAt)
                    : '--'}
                </span>
                <span className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-medium ${badgeColorMap[displayStatus] || 'bg-cyan-100 text-primary'}`}>
                  {displayStatus}
                </span>
              </div>
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
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 md:grid-cols-2 lg:grid-cols-4">
          <div><div className="text-xs text-on-surface-variant mb-1">客户</div><div className="text-sm font-medium text-on-surface">{summary.customer}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">合同</div><div className="text-sm font-medium text-on-surface">{summary.contract}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">期间</div><div className="text-sm font-medium text-on-surface">{summary.period}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">所属中心</div><div className="text-sm font-medium text-on-surface">{summary.center}</div></div>
          <div>
            <div className="text-xs text-on-surface-variant mb-1">客户确认粒度</div>
            <div>
              <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${acceptanceGranularity === 'daily' ? 'bg-cyan-100 text-cyan-700' : 'bg-violet-100 text-violet-700'}`}>
                {granularityLabelMap[acceptanceGranularity]}
              </span>
            </div>
          </div>
          <div><div className="text-xs text-on-surface-variant mb-1">客户确认产能/人天</div><div className="text-sm font-medium text-on-surface">{formatNumber(displaySummary.workDays)}</div></div>
          <div><div className="text-xs text-on-surface-variant mb-1">客户确认金额</div><div className="text-sm font-medium text-on-surface">{formatCurrency(displaySummary.amount)}</div></div>
          <div>
            <div className="text-xs text-on-surface-variant mb-1">数据刷新时间</div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm font-medium text-on-surface">{lastDataRefreshTime}</div>
              <button
                type="button"
                onClick={() => setRefreshConfirmOpen(true)}
                disabled={!canEdit}
                className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:cursor-not-allowed disabled:border-outline-variant disabled:bg-surface-container-low disabled:text-on-surface-variant"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                刷新数据
              </button>
            </div>
          </div>
          {isInitialization && (
            <div className="md:col-span-2 lg:col-span-4">
              <div className="text-xs text-on-surface-variant mb-1">初始化描述</div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {initializationDescription}
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-outline-variant bg-surface-container-low px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-on-surface-variant flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            原始文件：{originalAttachment.name}
          </div>
          {isChinaBank && (
            <div className="text-xs text-on-surface-variant">
              数据流程：交付确认数据到总部运营中心审核（中行全量数据已按运营中心/分部拆分）
            </div>
          )}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="flex min-h-[680px] flex-col overflow-hidden">
          <SectionTitle
            title="人员产能明细"
            extra={canEdit ? (
              <button
                type="button"
                onClick={openTotalAmountAdjustmentModal}
                className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                调整金额
              </button>
            ) : undefined}
          />
          <div className="border-b border-outline-variant px-5 py-3">
            <div className="flex items-center justify-start gap-3 whitespace-nowrap">
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
              {isChinaBank && (
                <select
                  value={operationCenterFilter}
                  onChange={(event) => setOperationCenterFilter(event.target.value)}
                  className="admin-input h-9 w-[150px] shrink-0 px-3 text-sm"
                >
                  <option value="">全部运营中心</option>
                  {operationCenterOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              )}
              {isChinaBank && (
                <select
                  value={bankBranchFilter}
                  onChange={(event) => setBankBranchFilter(event.target.value)}
                  className="admin-input h-9 w-[140px] shrink-0 px-3 text-sm"
                >
                  <option value="">全部项目</option>
                  {bankBranchOptions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              )}
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
            </div>
          </div>
          {isChinaBank && (
            <div className="border-b border-outline-variant bg-surface-container-low px-5 py-2.5 text-xs text-on-surface-variant">
              {canEdit
                ? `当前办理人：${currentDeliveryHandler}（待确认阶段仅展示本人负责的项目数据，可调整并确认）`
                : canReview
                  ? '当前为总部运营中心审核阶段：仅可查看各中心确认结果，不可调整数据。'
                  : '中行全量数据已按运营中心与分部分拆归集。'}
            </div>
          )}
          {isChinaBank && canReview && centerConfirmStatus.length > 0 && (
            <div className="border-b border-outline-variant px-5 py-3">
              <div className="mb-2 text-xs font-medium text-on-surface">各中心确认状态</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {centerConfirmStatus.map((item) => (
                  <div key={item.operationCenter} className="rounded-xl border border-outline-variant bg-white px-3 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-on-surface">{item.operationCenter}</span>
                      <span className={`inline-flex rounded px-2 py-0.5 ${item.status === '已确认' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-1 text-on-surface-variant">确认人：{item.confirmer}</div>
                    <div className="text-on-surface-variant">确认时间：{item.confirmedAt}</div>
                    <div className="text-on-surface-variant">产能数：{formatNumber(item.workDays)} 人天</div>
                    <div className="text-on-surface-variant">金额数：{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className={`w-full text-left border-collapse ${isChinaBank ? 'min-w-[1820px]' : 'min-w-[1490px]'}`}>
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                  <th className="w-[112px] px-4 py-3">人员</th>
                  {isChinaBank && <th className="w-[120px] px-4 py-3">运营中心</th>}
                  {isChinaBank && <th className="w-[120px] px-4 py-3">项目</th>}
                  <th className="w-[180px] px-4 py-3">所属项目</th>
                  <th className="w-[120px] px-4 py-3">合同岗位</th>
                  <th className="w-[84px] px-4 py-3">月份</th>
                  <th className="w-[88px] px-4 py-3">一级产能</th>
                  <th className="w-[88px] px-4 py-3">二级产能</th>
                  <th className="w-[96px] bg-amber-50 px-3 py-3 text-amber-700">三级产能</th>
                  <th className="w-[108px] px-4 py-3">系统单价</th>
                  <th className="w-[108px] bg-cyan-50 px-4 py-3 text-cyan-700">识别单价</th>
                  <th className="w-[128px] px-3 py-3">计算金额</th>
                  <th className="w-[128px] bg-cyan-50 px-3 py-3 text-cyan-700">识别金额</th>
                  {isChinaBank && <th className="w-[96px] px-4 py-3">办理人</th>}
                  <th className="sticky right-0 z-10 w-[240px] border-l border-outline-variant bg-surface-container-low px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                {!filteredPersonRows.length && (
                  <tr>
                    <td colSpan={isChinaBank ? 15 : 12} className="px-4 py-10 text-center text-sm text-on-surface-variant">
                      {isInitialization ? '初始化状态下暂无人员产能明细，请先核对项目履历后再继续处理。' : '当前筛选条件下暂无符合条件的人员产能明细'}
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
                    {isChinaBank && <td className="px-4 py-4 text-on-surface-variant">{item.operationCenter}</td>}
                    {isChinaBank && <td className="px-4 py-4 text-on-surface-variant">{item.bankBranch}</td>}
                    <td className="px-4 py-4 text-on-surface-variant">{record.project}</td>
                    <td className="px-4 py-4 text-on-surface-variant">{item.position}</td>
                    <td className="px-4 py-4 text-on-surface-variant">{item.month}</td>
                    <td className="px-4 py-4">{formatNumber(item.level1Days)}</td>
                    <td className="px-4 py-4">{formatNumber(item.level2Days)}</td>
                    <td className="bg-amber-50/70 px-3 py-4">{formatNumber(item.level3Days)}</td>
                    <td className="px-4 py-4">{formatCurrency(item.systemUnitPrice)}</td>
                    <td className="bg-cyan-50/70 px-4 py-4">{formatCurrency(item.recognitionUnitPrice)}</td>
                    <td className="px-3 py-4 font-medium">{formatCurrency(item.computedAmount)}</td>
                    <td className="bg-cyan-50/70 px-3 py-4">{formatCurrency(item.recognitionAmount)}</td>
                    {isChinaBank && <td className="px-4 py-4 text-on-surface-variant">{item.handler}</td>}
                    <td className="sticky right-0 border-l border-outline-variant bg-white px-3 py-4 group-hover:bg-surface-container-low">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedMonthlyDetailId(item.id)}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          详情
                        </button>
                        {canEdit && item.sourceGranularity === 'monthly' && (
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
        </div>
      </div>

      <MainFooterPortal>
        <div className="flex-shrink-0 flex items-center justify-center gap-1.5 px-5 py-3 text-sm bg-white border-t border-outline-variant">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isInitialization && (
              <>
                <button
                  disabled
                  className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存草稿
                </button>
                <button
                  disabled
                  className="flex items-center gap-1.5 rounded bg-surface-container-high px-4 py-2 text-sm font-medium text-on-surface-variant cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  提交确认
                </button>
                <button
                  disabled
                  className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant cursor-not-allowed"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  撤销批次
                </button>
              </>
            )}
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
              <button
                disabled={isChinaBank && !allCentersConfirmed}
                className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
              >
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
            {!canReview && !isInitialization && displayStatus !== '已通过' && (
              <button className="flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100 transition-colors">
                <XCircle className="w-3.5 h-3.5" />
                撤销批次
              </button>
            )}
            {isChinaBank && canReview && !allCentersConfirmed && (
              <span className="ml-2 text-xs text-amber-700">仍有运营中心未确认，暂不可审核通过。</span>
            )}
          </div>
        </div>
      </MainFooterPortal>

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
                    <span>合同岗位：{selectedMonthlyRow.position}</span>
                    {isChinaBank && (
                      <>
                        <span>|</span>
                        <span>运营中心：{selectedMonthlyRow.operationCenter}</span>
                        <span>|</span>
                        <span>项目：{selectedMonthlyRow.bankBranch}</span>
                      </>
                    )}
                    <span>|</span>
                    <span>月份：{selectedMonthlyRow.month}</span>
                    <span>|</span>
                    <span>粒度：{granularityLabelMap[selectedMonthlyRow.sourceGranularity]}</span>
                    <span>|</span>
                    <span>产能数：{formatNumber(selectedMonthlyRow.level3Days)}</span>
                    <span>|</span>
                    <span>计算金额：{formatCurrency(selectedMonthlyRow.computedAmount)}</span>
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
                    {(selectedMonthlyRow.sourceGranularity === 'daily'
                      ? [
                          { key: 'all', label: '全部日期' },
                          { key: 'workday', label: '仅工作日' },
                          { key: 'diff', label: '仅看差异' },
                          { key: 'modified', label: '仅看已修改' },
                        ]
                      : [
                          { key: 'all', label: '全部日期' },
                          { key: 'workday', label: '仅工作日' },
                        ]
                    ).map((option) => (
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
            <div
              className="overflow-auto custom-scrollbar px-5 py-4"
              style={{ maxHeight: selectedMonthlyRow.sourceGranularity === 'daily' ? 'calc(75vh - 56px)' : '75vh' }}
            >
              <table
                className={`w-full text-left border-collapse ${
                  selectedMonthlyRow.sourceGranularity === 'daily'
                    ? isChinaBank ? 'min-w-[1040px]' : 'min-w-[860px]'
                    : 'min-w-[540px] table-fixed'
                }`}
              >
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="px-4 py-3 w-[160px]">日期</th>
                    {isChinaBank && selectedMonthlyRow.sourceGranularity === 'daily' && (
                      <th className="px-4 py-3 w-[100px]">正常工时</th>
                    )}
                    {isChinaBank && selectedMonthlyRow.sourceGranularity === 'daily' && (
                      <th className="px-4 py-3 w-[100px]">加班工时</th>
                    )}
                    <th className="px-4 py-3 w-[80px]">一级产能</th>
                    <th className="px-4 py-3 w-[80px]">二级产能</th>
                    {selectedMonthlyRow.sourceGranularity === 'daily' && (
                      <th className="px-4 py-3 w-[90px]">识别三级产能</th>
                    )}
                    <th
                      className={`px-4 py-3 bg-amber-50 text-amber-700 ${
                        selectedMonthlyRow.sourceGranularity === 'daily' ? 'w-[110px]' : 'w-[140px]'
                      }`}
                    >
                      {selectedMonthlyRow.sourceGranularity === 'daily' ? '产能调整增减量' : '三级产能（日拆分）'}
                    </th>
                    {selectedMonthlyRow.sourceGranularity === 'daily' && (
                      <th className="px-4 py-3 w-[200px]">调整原因</th>
                    )}
                    <th className="px-4 py-3 w-[100px]">金额</th>
                    {selectedMonthlyRow.sourceGranularity === 'daily' && (
                      <th className="px-4 py-3 w-[90px]">操作</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                  {!filteredDailyDetailRows.length && (
                    <tr>
                      <td
                        colSpan={selectedMonthlyRow.sourceGranularity === 'daily' ? (isChinaBank ? 10 : 8) : 5}
                        className="px-4 py-8 text-center text-sm text-on-surface-variant"
                      >
                        当前筛选条件下暂无日期明细
                      </td>
                    </tr>
                  )}
                  {filteredDailyDetailRows.map((item) => {
                    const initialLevel3Days = initialPersonRowMap.get(item.id)?.level3Days ?? 0;
                    const currentDelta = roundValue(item.level3Days - initialLevel3Days);
                    const deltaDisplayValue =
                      dailyLevel3DraftValues[item.id] !== undefined
                        ? dailyLevel3DraftValues[item.id]
                        : currentDelta !== 0
                          ? String(currentDelta)
                          : '';
                    const hasDeltaButNoReason =
                      deltaDisplayValue.trim() !== '' && !dailyAdjustmentReasons[item.id]?.trim();
                    return (
                      <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                        <td className="px-4 py-3.5 font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{item.date}</span>
                            {!item.isWorkday && (
                              <span className="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600">非工作日</span>
                            )}
                            {selectedMonthlyRow.sourceGranularity === 'daily' && (
                              <RowTags hasDiff={item.hasRecognitionDiff} modified={item.modified} />
                            )}
                          </div>
                        </td>
                        {isChinaBank && selectedMonthlyRow.sourceGranularity === 'daily' && (
                          <td className="px-4 py-3.5">{formatNumber(item.normalHours)}</td>
                        )}
                        {isChinaBank && selectedMonthlyRow.sourceGranularity === 'daily' && (
                          <td className="px-4 py-3.5">{formatNumber(item.overtimeHours)}</td>
                        )}
                        <td className="px-4 py-3.5">{formatNumber(item.level1Days)}</td>
                        <td className="px-4 py-3.5">{formatNumber(item.level2Days)}</td>
                        {selectedMonthlyRow.sourceGranularity === 'daily' && (
                          <td className="px-4 py-3.5">{formatNumber(item.recognitionLevel3Days)}</td>
                        )}
                        <td className="bg-amber-50/80 px-4 py-3.5">
                          {canEdit && selectedMonthlyRow.sourceGranularity === 'daily' ? (
                            <input
                              type="number"
                              step="0.5"
                              value={deltaDisplayValue}
                              onChange={(event) => updateDailyLevel3DraftValue(item.id, event.target.value)}
                              onBlur={() => commitDailyLevel3DraftValue(item.id)}
                              placeholder="输入增减量"
                              className={`admin-input w-full px-2.5 bg-white ${
                                hasDeltaButNoReason
                                  ? 'border-rose-400 shadow-[0_0_0_2px_rgba(239,68,68,0.12)]'
                                  : 'border-amber-300 shadow-[0_0_0_2px_rgba(245,158,11,0.08)]'
                              }`}
                            />
                          ) : (
                            formatNumber(item.level3Days)
                          )}
                        </td>
                        {selectedMonthlyRow.sourceGranularity === 'daily' && (
                          <td className="px-4 py-3.5">
                            {canEdit ? (
                              <input
                                type="text"
                                value={dailyAdjustmentReasons[item.id] ?? ''}
                                onChange={(event) => updateDailyAdjustmentReason(item.id, event.target.value)}
                                placeholder={hasDeltaButNoReason ? '请填写原因（必填）' : '填写调整原因'}
                                className={`admin-input h-10 w-full px-2.5 text-xs ${
                                  hasDeltaButNoReason ? 'border-rose-400' : ''
                                }`}
                                onBlur={() => _commitDailyAdjReason(item.id)}
                              />
                            ) : (
                              <div
                                className="truncate text-xs text-on-surface"
                                title={dailyAdjustmentReasons[item.id] || '--'}
                              >
                                {dailyAdjustmentReasons[item.id] || '--'}
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3.5">{formatCurrency(item.amount)}</td>
                        {selectedMonthlyRow.sourceGranularity === 'daily' && (
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3 whitespace-nowrap">
                              {canEdit && item.modified && (
                                <button
                                  type="button"
                                  onClick={() => revertPersonRow(item.id)}
                                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                  撤销
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDailyAdjHistoryViewId(item.id)}
                                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
                              >
                                调整记录
                                {(dailyRowAdjustmentHistory[item.id]?.length ?? 0) > 0 && (
                                  <span className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-white">
                                    {dailyRowAdjustmentHistory[item.id].length}
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selectedMonthlyRow.sourceGranularity === 'daily' && canEdit && (
              <div className="flex items-center justify-between border-t border-outline-variant px-5 py-3">
                <div className="text-xs">
                  {dailyMissingReasonRows.length > 0 ? (
                    <span className="text-rose-600">{dailyMissingReasonRows.length} 条调整缺少原因，请补充后再确认</span>
                  ) : selectedDailyRows.some((r) => r.modified) ? (
                    <span className="text-emerald-700">所有调整已填写原因，可以确认</span>
                  ) : (
                    <span className="text-on-surface-variant">暂无调整记录</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={dailyMissingReasonRows.length > 0}
                  onClick={() => setSelectedMonthlyDetailId('')}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                >
                  整体确认
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {dailyAdjHistoryViewId && selectedMonthlyRow && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={() => setDailyAdjHistoryViewId(null)}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">
                  调整记录 — {filteredDailyDetailRows.find((r) => r.id === dailyAdjHistoryViewId)?.date ?? dailyAdjHistoryViewId}
                </div>
                <div className="mt-1 text-xs text-on-surface-variant">
                  {selectedMonthlyRow.member} · {selectedMonthlyRow.month} · 该日期下所有产能调整记录
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDailyAdjHistoryViewId(null)}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">调整量（人天）</th>
                    <th className="px-4 py-3">调整前</th>
                    <th className="px-4 py-3">调整后</th>
                    <th className="px-4 py-3">原因</th>
                    <th className="px-4 py-3">操作人</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {!(dailyRowAdjustmentHistory[dailyAdjHistoryViewId]?.length) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">暂无调整记录</td>
                    </tr>
                  )}
                  {(dailyRowAdjustmentHistory[dailyAdjHistoryViewId] || []).map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-on-surface-variant">{entry.time}</td>
                      <td className="px-4 py-3 font-medium">{formatSignedNumber(entry.deltaValue)}</td>
                      <td className="px-4 py-3">{formatNumber(entry.beforeValue)}</td>
                      <td className="px-4 py-3">{formatNumber(entry.afterValue)}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{entry.reason}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{entry.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                <div className="text-base font-semibold text-on-surface">
                  {adjustmentModal.type === 'capacity' ? '调整产能' : '调整金额'}
                </div>
                <div className="mt-1 text-xs text-on-surface-variant">
                  {adjustmentModal.type === 'capacity'
                    ? '本次填写的是三级与二级不一致的产能增减量和原因，仅做差异记录，不改写正式三级产能。'
                    : '本次填写金额增减量和调整原因，下部展示该人员在当前月份下的多次调整记录。'}
                </div>
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
                <div className="mb-1 text-xs text-on-surface-variant">
                  {adjustmentModal.type === 'capacity' ? '产能调整增减量' : '金额调整增减量'}
                </div>
                <input
                  type="number"
                  step={adjustmentModal.type === 'capacity' ? '0.5' : '0.01'}
                  value={draftAdjustmentValue}
                  onChange={(event) => setDraftAdjustmentValue(event.target.value)}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
                <div className="mt-1 text-xs text-on-surface-variant">
                  {adjustmentModal.type === 'capacity' ? (
                    <>
                      当前二级产能：{formatNumber(currentAdjustmentRow.level2Days)} 人天，当前三级产能：{formatNumber(currentAdjustmentRow.level3Days)} 人天，
                      本次记录差异量：{formatSignedNumber(roundValue(Number(draftAdjustmentValue) || 0))} 人天。保存后三级产能保持 {formatNumber(currentAdjustmentRow.level3Days)} 人天不变。
                    </>
                  ) : (
                    <>
                      当前值：{formatCurrency(currentAdjustmentRow.computedAmount)}，调整后：
                      {formatCurrency(roundValue(Math.max(0, currentAdjustmentRow.computedAmount + (Number(draftAdjustmentValue) || 0))))}
                    </>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">调整原因</div>
                <input
                  type="text"
                  value={draftAdjustmentReason}
                  onChange={(event) => setDraftAdjustmentReason(event.target.value)}
                  placeholder={adjustmentModal.type === 'capacity' ? '请填写三级与二级差异原因' : '请填写金额调整原因'}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div className="rounded-xl border border-outline-variant bg-white">
                <div className="border-b border-outline-variant px-4 py-3 text-sm font-medium text-on-surface">调整记录</div>
                <div className="max-h-[280px] overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        <th className="px-4 py-3">时间</th>
                        <th className="px-4 py-3">类型</th>
                        <th className="px-4 py-3">调整量</th>
                        <th className="px-4 py-3">调整前</th>
                        <th className="px-4 py-3">调整后</th>
                        <th className="px-4 py-3">调整原因</th>
                        <th className="px-4 py-3">操作人</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {!currentAdjustmentRecords.length && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                            暂无调整记录
                          </td>
                        </tr>
                      )}
                      {currentAdjustmentRecords.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                          <td className="px-4 py-3 text-on-surface">{item.type === 'capacity' ? '调整产能' : '调整金额'}</td>
                          <td className="px-4 py-3 text-on-surface">
                            {item.type === 'capacity'
                              ? `${formatSignedNumber(roundValue(item.adjustmentValue ?? item.afterValue - item.beforeValue))} 人天`
                              : formatSignedCurrency(roundValue(item.adjustmentValue ?? item.afterValue - item.beforeValue))}
                          </td>
                          <td className="px-4 py-3 text-on-surface">
                            {item.type === 'capacity' ? `${formatNumber(item.beforeValue)} 人天` : formatCurrency(item.beforeValue)}
                          </td>
                          <td className="px-4 py-3 text-on-surface">
                            {item.type === 'capacity' ? `${formatNumber(item.afterValue)} 人天` : formatCurrency(item.afterValue)}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.reason}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.operator}</td>
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

      {totalAmountAdjustmentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={closeTotalAmountAdjustmentModal}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">调整金额</div>
                <div className="mt-1 text-xs text-on-surface-variant">用于处理不能归属到具体产能人员的金额，本次填写金额增减量并记录原因。</div>
              </div>
              <button
                type="button"
                onClick={closeTotalAmountAdjustmentModal}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface">
                当前客户确认金额：{formatCurrency(summary.amount)}
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">金额调整增减量</div>
                <input
                  type="number"
                  step="0.01"
                  value={draftTotalAdjustmentValue}
                  onChange={(event) => setDraftTotalAdjustmentValue(event.target.value)}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
                <div className="mt-1 text-xs text-on-surface-variant">
                  当前未归属金额调整：{formatCurrency(totalAmountAdjustment)}，调整后：
                  {formatCurrency(roundValue(totalAmountAdjustment + (Number(draftTotalAdjustmentValue) || 0)))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">调整原因</div>
                <input
                  type="text"
                  value={draftTotalAdjustmentReason}
                  onChange={(event) => setDraftTotalAdjustmentReason(event.target.value)}
                  placeholder="请填写金额调整原因"
                  className="admin-input h-10 w-full px-3 text-sm"
                />
              </div>
              <div className="rounded-xl border border-outline-variant bg-white">
                <div className="border-b border-outline-variant px-4 py-3 text-sm font-medium text-on-surface">调整记录</div>
                <div className="max-h-[280px] overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        <th className="px-4 py-3">时间</th>
                        <th className="px-4 py-3">调整前</th>
                        <th className="px-4 py-3">调整后</th>
                        <th className="px-4 py-3">调整原因</th>
                        <th className="px-4 py-3">操作人</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {!totalAmountAdjustmentHistory.length && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">暂无调整记录</td>
                        </tr>
                      )}
                      {totalAmountAdjustmentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                          <td className="px-4 py-3 text-on-surface">{formatCurrency(item.beforeValue)}</td>
                          <td className="px-4 py-3 text-on-surface">{formatCurrency(item.afterValue)}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.reason}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.operator}</td>
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
                onClick={closeTotalAmountAdjustmentModal}
                className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveTotalAmountAdjustment}
                disabled={!draftTotalAdjustmentReason.trim()}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
              >
                保存调整
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

      {refreshConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={() => setRefreshConfirmOpen(false)}
        >
          <div
            className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">确认刷新数据</div>
                <div className="mt-1 text-xs text-on-surface-variant">刷新后将按当前识别结果重新装载三级详情数据。</div>
              </div>
              <button
                type="button"
                onClick={() => setRefreshConfirmOpen(false)}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="px-5 py-5 text-sm leading-6 text-on-surface">
              如人员项目或级别有调整可刷新更新数据，数据刷新时间较长，是否确认刷新。
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-outline-variant px-5 py-4">
              <button
                type="button"
                onClick={() => setRefreshConfirmOpen(false)}
                className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmRefreshData}
                className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                确认刷新
              </button>
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