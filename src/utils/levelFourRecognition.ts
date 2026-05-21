export interface RecognizedLevelFourDailyAdjustment {
  date: string;
  delta: number;
  reason?: string;
}

export interface RecognizedLevelFourAdjustment {
  sourceRecordId: string;
  member: string;
  month: string;
  position?: string;
  capacityDelta?: number;
  amountDelta?: number;
  reason: string;
  dailyAdjustments?: RecognizedLevelFourDailyAdjustment[];
}

const RECOGNIZED_LEVEL_FOUR_ADJUSTMENTS: RecognizedLevelFourAdjustment[] = [
  {
    sourceRecordId: 'L3-2026Q1-001',
    member: '刘晨',
    month: '1月',
    position: '高级',
    capacityDelta: -1,
    reason: '确认单识别：客户验收剔除 1 人天待命产能。',
  },
  {
    sourceRecordId: 'L3-2026Q1-001',
    member: '孙怡',
    month: '2月',
    position: '中级',
    amountDelta: 1200,
    reason: '确认单识别：客户补录夜间支持金额差额。',
  },
  {
    sourceRecordId: 'L3-2026Q1-002',
    member: '黄璐',
    month: '1月',
    position: '资深',
    reason: '确认单识别：按日回填请假扣减与半天补录。',
    dailyAdjustments: [
      {
        date: '1月08日',
        delta: -1,
        reason: '确认单识别：客户请假不计费。',
      },
      {
        date: '1月21日',
        delta: 0.5,
        reason: '确认单识别：补录半天现场支持。',
      },
    ],
  },
  {
    sourceRecordId: 'L3-2026Q1-005',
    member: '许铭',
    month: '3月',
    position: '高级',
    capacityDelta: 0.5,
    reason: '确认单识别：客户追加半天联调支持。',
  },
];

export const findRecognizedLevelFourAdjustment = (
  sourceRecordId: string,
  member: string,
  month: string,
  position?: string,
) =>
  RECOGNIZED_LEVEL_FOUR_ADJUSTMENTS.find(
    (item) =>
      item.sourceRecordId === sourceRecordId &&
      item.member === member &&
      item.month === month &&
      (!item.position || item.position === position),
  );

export const getRecognizedLevelFourAdjustments = (sourceRecordId: string) =>
  RECOGNIZED_LEVEL_FOUR_ADJUSTMENTS.filter((item) => item.sourceRecordId === sourceRecordId);