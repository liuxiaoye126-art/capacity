import { Save, Send, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CapacityFilter } from '../components/CapacityFilter';
import { CapacityTable } from '../components/CapacityTable';
import { CapacityRecord, LEVEL3_DATA } from '../types';
import { findRecognizedLevelFourAdjustment } from '../utils/levelFourRecognition';

interface LevelFourListPageProps {
  data: CapacityRecord[];
  onDetailClick: (id: string) => void;
  onCreateRecord: (record: CapacityRecord) => void;
}

type AcceptanceGranularity = 'monthly' | 'daily';
type DraftAdjustmentType = 'capacity' | 'amount' | 'daily';
type DraftQuickFilter = 'all' | 'diff' | 'modified';

interface DraftDailyRow {
  id: string;
  date: string;
  isWorkday: boolean;
  level3Days: number;
  level4Days: number;
  amount: number;
}

interface DraftAdjustmentRecord {
  id: string;
  type: DraftAdjustmentType;
  beforeValue: number;
  afterValue: number;
  reason: string;
  time: string;
  operator: string;
}

interface DraftLevelFourRow {
  id: string;
  sourceRecordId: string;
  sourceRecordNo: string;
  sourceGranularity: AcceptanceGranularity;
  project: string;
  member: string;
  position: string;
  month: string;
  level3Days: number;
  level4Days: number;
  unitPrice: number;
  amount: number;
  modified: boolean;
  adjustmentHistory: DraftAdjustmentRecord[];
  dailyRows: DraftDailyRow[];
}

interface LevelThreeTemplate {
  position: string;
  members: Array<{
    name: string;
    monthlyDays: number[];
  }>;
}

interface SavedDraftSnapshot {
  selectedLevelThreeIds: string[];
  draftRows: DraftLevelFourRow[];
  customerFilter: string;
  memberKeyword: string;
  positionFilter: string;
  monthFilter: string;
  quickFilter: DraftQuickFilter;
  overallAmountAdjustment: string;
  overallAmountAdjustmentReason: string;
  overallAmountAdjustmentHistory: DraftAdjustmentRecord[];
  savedAt: string;
}

const CURRENT_SALES_HANDLER = '李晓燕';

const QUARTER_MONTHS = ['1月', '2月', '3月'];

const roundValue = (value: number) => Number(value.toFixed(2));

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toLocaleString('zh-CN');
  }

  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (value: number) =>
  `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: Math.abs(value % 1) > 0.001 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;

const formatSignedAdjustmentValue = (value: number, type: DraftAdjustmentType) => {
  const sign = value >= 0 ? '+' : '-';
  const absoluteValue = Math.abs(value);

  if (type === 'amount') {
    return `${sign}${formatCurrency(absoluteValue)}`;
  }

  return `${sign}${formatNumber(absoluteValue)} 人天`;
};

const nowText = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getAcceptanceGranularity = (record: CapacityRecord): AcceptanceGranularity =>
  record.customer === '上海银行' ? 'monthly' : 'daily';

const hasDraftDiff = (row: DraftLevelFourRow) => {
  const expectedAmount = roundValue(row.level3Days * row.unitPrice);

  return Math.abs(row.level3Days - row.level4Days) > 0.01 || Math.abs(expectedAmount - row.amount) > 0.01;
};

const matchesDraftQuickFilter = (row: DraftLevelFourRow, filter: DraftQuickFilter) => {
  if (filter === 'diff') {
    return hasDraftDiff(row);
  }

  if (filter === 'modified') {
    return row.modified;
  }

  return true;
};

const getPeriodYear = (period: string) => Number(period.match(/(\d{4})/)?.[1] || '2026');

const createWorkdayDates = (year: number, monthNumber: number) => {
  const dates: Array<{ date: string; isWorkday: boolean }> = [];
  const currentDate = new Date(year, monthNumber - 1, 1);

  while (currentDate.getMonth() === monthNumber - 1) {
    const weekDay = currentDate.getDay();
    const isWorkday = weekDay !== 0 && weekDay !== 6;

    if (isWorkday) {
      dates.push({
        date: `${monthNumber}月${String(currentDate.getDate()).padStart(2, '0')}日`,
        isWorkday,
      });
    }

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

const createTemplates = (record: CapacityRecord): LevelThreeTemplate[] => {
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
      position: '初级',
      members: [
        { name: '宋倩', monthlyDays: [22, 21, 20] },
        { name: '杨澄', monthlyDays: [19, 20, 21] },
      ],
    },
  ];
};

const createDraftRowsFromLevelThree = (records: CapacityRecord[]): DraftLevelFourRow[] => {
  return records.flatMap((record) => {
    const unitPrice = roundValue(record.amount / record.workDays);
    const periodYear = getPeriodYear(record.period);
    const sourceGranularity = getAcceptanceGranularity(record);

    return createTemplates(record).flatMap((template, templateIndex) =>
      template.members.flatMap((member, memberIndex) =>
        QUARTER_MONTHS.map((month, monthIndex) => {
          const monthNumber = monthIndex + 1;
          const workdays = createWorkdayDates(periodYear, monthNumber);
          const dailyCapacities = createDailyCapacities(member.monthlyDays[monthIndex] ?? 0, workdays.length);
          const dailyRows = workdays.map((item, dailyIndex) => {
            const level3Days = dailyCapacities[dailyIndex] ?? 0;
            return {
              id: `${record.id}-${templateIndex + 1}-${memberIndex + 1}-${monthNumber}-${dailyIndex + 1}`,
              date: item.date,
              isWorkday: item.isWorkday,
              level3Days,
              level4Days: level3Days,
              amount: roundValue(level3Days * unitPrice),
            };
          });
          const level3Days = roundValue(dailyRows.reduce((sum, item) => sum + item.level3Days, 0));
          const recognizedAdjustment = findRecognizedLevelFourAdjustment(record.id, member.name, month, template.position);
          let recognizedDailyRows = dailyRows;
          let level4Days = level3Days;
          let amount = roundValue(level3Days * unitPrice);
          let modified = false;
          const adjustmentHistory: DraftAdjustmentRecord[] = [];

          if (recognizedAdjustment?.dailyAdjustments?.length) {
            const adjustmentMap = new Map(recognizedAdjustment.dailyAdjustments.map((item) => [item.date, item]));
            recognizedDailyRows = dailyRows.map((dailyRow) => {
              const matchedAdjustment = adjustmentMap.get(dailyRow.date);

              if (!matchedAdjustment) {
                return dailyRow;
              }

              const nextLevel4Days = roundValue(Math.max(0, dailyRow.level3Days + matchedAdjustment.delta));
              modified = true;

              return {
                ...dailyRow,
                level4Days: nextLevel4Days,
                amount: roundValue(nextLevel4Days * unitPrice),
              };
            });
            level4Days = roundValue(recognizedDailyRows.reduce((sum, item) => sum + item.level4Days, 0));
            amount = roundValue(level4Days * unitPrice);
            adjustmentHistory.push({
              id: `${record.id}-${member.name}-${month}-daily-recognized`,
              type: 'daily',
              beforeValue: level3Days,
              afterValue: level4Days,
              reason: recognizedAdjustment.reason,
              time: '确认单识别回填',
              operator: '系统识别',
            });
          } else if (typeof recognizedAdjustment?.capacityDelta === 'number') {
            level4Days = roundValue(Math.max(0, level3Days + recognizedAdjustment.capacityDelta));
            const redistributedCapacities = createDailyCapacities(level4Days, dailyRows.length);
            recognizedDailyRows = dailyRows.map((dailyRow, index) => {
              const nextLevel4Days = redistributedCapacities[index] ?? 0;
              return {
                ...dailyRow,
                level4Days: nextLevel4Days,
                amount: roundValue(nextLevel4Days * unitPrice),
              };
            });
            amount = roundValue(level4Days * unitPrice);
            modified = true;
            adjustmentHistory.push({
              id: `${record.id}-${member.name}-${month}-capacity-recognized`,
              type: 'capacity',
              beforeValue: level3Days,
              afterValue: level4Days,
              reason: recognizedAdjustment.reason,
              time: '确认单识别回填',
              operator: '系统识别',
            });
          }

          if (typeof recognizedAdjustment?.amountDelta === 'number') {
            const beforeAmount = amount;
            amount = roundValue(amount + recognizedAdjustment.amountDelta);
            modified = true;
            adjustmentHistory.unshift({
              id: `${record.id}-${member.name}-${month}-amount-recognized`,
              type: 'amount',
              beforeValue: beforeAmount,
              afterValue: amount,
              reason: recognizedAdjustment.reason,
              time: '确认单识别回填',
              operator: '系统识别',
            });
          }

          return {
            id: `${record.id}-${template.position}-${member.name}-${month}`,
            sourceRecordId: record.id,
            sourceRecordNo: record.id,
            sourceGranularity,
            project: record.project,
            member: member.name,
            position: template.position,
            month,
            level3Days,
            level4Days,
            unitPrice,
            amount,
            modified,
            adjustmentHistory,
            dailyRows: recognizedDailyRows,
          };
        }),
      ),
    );
  });
};

const buildNextLevel4Id = (records: CapacityRecord[]) => {
  const maxNo = records.reduce((maxValue, item) => {
    const matched = item.id.match(/L4-\d{4}Q\d-(\d{3})/);
    return Math.max(maxValue, Number(matched?.[1] || '0'));
  }, 0);

  return `L4-2026Q1-${String(maxNo + 1).padStart(3, '0')}`;
};

export const LevelFourListPage = ({ data, onDetailClick, onCreateRecord }: LevelFourListPageProps) => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [selectedLevelThreeIds, setSelectedLevelThreeIds] = useState<string[]>([]);
  const [draftRows, setDraftRows] = useState<DraftLevelFourRow[]>([]);
  const [savedDraft, setSavedDraft] = useState<SavedDraftSnapshot | null>(null);
  const [pendingRestoreDraft, setPendingRestoreDraft] = useState<SavedDraftSnapshot | null>(null);
  const [customerFilter, setCustomerFilter] = useState('');
  const [memberKeyword, setMemberKeyword] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<DraftQuickFilter>('all');
  const [detailRowId, setDetailRowId] = useState<string>('');
  const [adjustmentModal, setAdjustmentModal] = useState<{ rowId: string; type: 'capacity' | 'amount' } | null>(null);
  const [draftAdjustmentValue, setDraftAdjustmentValue] = useState('');
  const [draftAdjustmentReason, setDraftAdjustmentReason] = useState('');
  const [detailAdjustmentReason, setDetailAdjustmentReason] = useState('');
  const [overallAmountAdjustment, setOverallAmountAdjustment] = useState('0');
  const [overallAmountAdjustmentReason, setOverallAmountAdjustmentReason] = useState('');
  const [overallAmountAdjustmentHistory, setOverallAmountAdjustmentHistory] = useState<DraftAdjustmentRecord[]>([]);
  const [overallAmountAdjustmentModalOpen, setOverallAmountAdjustmentModalOpen] = useState(false);
  const [draftOverallAmountAdjustmentValue, setDraftOverallAmountAdjustmentValue] = useState('');
  const [draftOverallAmountAdjustmentReason, setDraftOverallAmountAdjustmentReason] = useState('');

  const approvedLevelThreeRecords = useMemo(() => LEVEL3_DATA.filter((item) => item.status === '已通过'), []);
  const salesOwnedLevelThreeRecords = useMemo(
    () => approvedLevelThreeRecords.filter((item) => item.handler === CURRENT_SALES_HANDLER),
    [approvedLevelThreeRecords],
  );
  const customerOptions = useMemo(
    () => Array.from(new Set(salesOwnedLevelThreeRecords.map((item) => item.customer))),
    [salesOwnedLevelThreeRecords],
  );
  const filteredSelectableLevelThreeRecords = useMemo(
    () => salesOwnedLevelThreeRecords.filter((item) => !customerFilter || item.customer === customerFilter),
    [customerFilter, salesOwnedLevelThreeRecords],
  );

  const selectedLevelThreeRecords = useMemo(
    () => salesOwnedLevelThreeRecords.filter((item) => selectedLevelThreeIds.includes(item.id)),
    [salesOwnedLevelThreeRecords, selectedLevelThreeIds],
  );

  const draftSummary = useMemo(
    () => ({
      totalLevel3Days: roundValue(draftRows.reduce((sum, item) => sum + item.level3Days, 0)),
      totalLevel4Days: roundValue(draftRows.reduce((sum, item) => sum + item.level4Days, 0)),
      totalAmount: roundValue(draftRows.reduce((sum, item) => sum + item.amount, 0) + (Number(overallAmountAdjustment) || 0)),
    }),
    [draftRows, overallAmountAdjustment],
  );

  const positionOptions = useMemo(
    () => Array.from(new Set(draftRows.map((item) => item.position))),
    [draftRows],
  );

  const filteredDraftRows = useMemo(
    () =>
      draftRows.filter((item) => {
        const matchedMember = !memberKeyword.trim() || item.member.includes(memberKeyword.trim());
        const matchedPosition = !positionFilter || item.position === positionFilter;
        const matchedMonth = !monthFilter || item.month === monthFilter;

        return matchedMember && matchedPosition && matchedMonth && matchesDraftQuickFilter(item, quickFilter);
      }),
    [draftRows, memberKeyword, monthFilter, positionFilter, quickFilter],
  );

  const detailRow = useMemo(() => draftRows.find((item) => item.id === detailRowId) || null, [detailRowId, draftRows]);
  const currentAdjustmentRow = useMemo(
    () => (adjustmentModal ? draftRows.find((item) => item.id === adjustmentModal.rowId) || null : null),
    [adjustmentModal, draftRows],
  );

  const resetWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setSelectedLevelThreeIds([]);
    setDraftRows([]);
    setCustomerFilter('');
    setMemberKeyword('');
    setPositionFilter('');
    setMonthFilter('');
    setQuickFilter('all');
    setDetailRowId('');
    setAdjustmentModal(null);
    setDraftAdjustmentValue('');
    setDraftAdjustmentReason('');
    setDetailAdjustmentReason('');
    setOverallAmountAdjustment('0');
    setOverallAmountAdjustmentReason('');
    setOverallAmountAdjustmentHistory([]);
    setOverallAmountAdjustmentModalOpen(false);
    setDraftOverallAmountAdjustmentValue('');
    setDraftOverallAmountAdjustmentReason('');
  };

  const openWizard = () => {
    setWizardOpen(true);
    if (savedDraft) {
      setPendingRestoreDraft(savedDraft);
      setWizardStep(savedDraft.draftRows.length ? 2 : 1);
      setSelectedLevelThreeIds(savedDraft.selectedLevelThreeIds);
      setCustomerFilter(savedDraft.customerFilter);
      setMemberKeyword(savedDraft.memberKeyword);
      setPositionFilter(savedDraft.positionFilter);
      setMonthFilter(savedDraft.monthFilter);
      setQuickFilter(savedDraft.quickFilter);
      setOverallAmountAdjustment(savedDraft.overallAmountAdjustment);
      setOverallAmountAdjustmentReason(savedDraft.overallAmountAdjustmentReason);
      setOverallAmountAdjustmentHistory(savedDraft.overallAmountAdjustmentHistory);
    } else {
      setPendingRestoreDraft(null);
      setWizardStep(1);
      setSelectedLevelThreeIds([]);
      setDraftRows([]);
      setCustomerFilter('');
      setMemberKeyword('');
      setPositionFilter('');
      setMonthFilter('');
      setQuickFilter('all');
      setOverallAmountAdjustment('0');
      setOverallAmountAdjustmentReason('');
      setOverallAmountAdjustmentHistory([]);
    }
    setDetailRowId('');
    setAdjustmentModal(null);
    setDraftAdjustmentValue('');
    setDraftAdjustmentReason('');
    setDetailAdjustmentReason('');
    setOverallAmountAdjustmentModalOpen(false);
    setDraftOverallAmountAdjustmentValue('');
    setDraftOverallAmountAdjustmentReason('');
  };

  useEffect(() => {
    if (pendingRestoreDraft) {
      setDraftRows(pendingRestoreDraft.draftRows);
      setPendingRestoreDraft(null);
      return;
    }

    setDraftRows(createDraftRowsFromLevelThree(selectedLevelThreeRecords));
  }, [pendingRestoreDraft, selectedLevelThreeRecords]);

  const toggleLevelThreeSelect = (id: string) => {
    setSelectedLevelThreeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const openAdjustmentModal = (rowId: string, type: 'capacity' | 'amount') => {
    const currentRow = draftRows.find((item) => item.id === rowId);

    if (!currentRow) {
      return;
    }

    setAdjustmentModal({ rowId, type });
    setDraftAdjustmentReason('');
    setDraftAdjustmentValue('0');
  };

  const closeAdjustmentModal = () => {
    setAdjustmentModal(null);
    setDraftAdjustmentValue('');
    setDraftAdjustmentReason('');
  };

  const saveAdjustment = () => {
    if (!adjustmentModal || !currentAdjustmentRow || !draftAdjustmentReason.trim()) {
      return;
    }

    const deltaValue = Number(draftAdjustmentValue) || 0;

    setDraftRows((prev) =>
      prev.map((item) => {
        if (item.id !== adjustmentModal.rowId) {
          return item;
        }

        if (adjustmentModal.type === 'capacity') {
          const nextValue = roundValue(Math.max(0, item.level4Days + deltaValue));
          const nextCapacities = createDailyCapacities(nextValue, item.dailyRows.length);
          const nextDailyRows = item.dailyRows.map((dailyRow, index) => {
            const level4Days = nextCapacities[index] ?? 0;
            return {
              ...dailyRow,
              level4Days,
              amount: roundValue(level4Days * item.unitPrice),
            };
          });

          return {
            ...item,
            level4Days: roundValue(nextValue),
            amount: roundValue(nextValue * item.unitPrice),
            modified: true,
            dailyRows: nextDailyRows,
            adjustmentHistory: [
              {
                id: `${item.id}-capacity-${Date.now()}`,
                type: 'capacity',
                beforeValue: item.level4Days,
                afterValue: roundValue(nextValue),
                reason: draftAdjustmentReason.trim(),
                time: nowText(),
                operator: '销售',
              },
              ...item.adjustmentHistory,
            ],
          };
        }

        const nextValue = roundValue(Math.max(0, item.amount + deltaValue));

        return {
          ...item,
          amount: nextValue,
          modified: true,
          adjustmentHistory: [
            {
              id: `${item.id}-amount-${Date.now()}`,
              type: 'amount',
              beforeValue: item.amount,
              afterValue: nextValue,
              reason: draftAdjustmentReason.trim(),
              time: nowText(),
              operator: '销售',
            },
            ...item.adjustmentHistory,
          ],
        };
      }),
    );

    closeAdjustmentModal();
  };

  const saveDailyAdjustment = () => {
    if (!detailRow || detailRow.sourceGranularity !== 'daily' || !detailAdjustmentReason.trim()) {
      return;
    }

    setDraftRows((prev) =>
      prev.map((item) => {
        if (item.id !== detailRow.id) {
          return item;
        }

        const nextLevel4Days = roundValue(item.dailyRows.reduce((sum, dailyRow) => sum + dailyRow.level4Days, 0));

        return {
          ...item,
          level4Days: nextLevel4Days,
          amount: roundValue(nextLevel4Days * item.unitPrice),
          modified: true,
          adjustmentHistory: [
            {
              id: `${item.id}-daily-${Date.now()}`,
              type: 'daily',
              beforeValue: item.level4Days,
              afterValue: nextLevel4Days,
              reason: detailAdjustmentReason.trim(),
              time: nowText(),
              operator: '销售',
            },
            ...item.adjustmentHistory,
          ],
        };
      }),
    );

    setDetailAdjustmentReason('');
  };

  const updateDailyLevel4Days = (dailyId: string, value: string) => {
    setDraftRows((prev) =>
      prev.map((item) => {
        if (item.id !== detailRowId) {
          return item;
        }

        return {
          ...item,
          dailyRows: item.dailyRows.map((dailyRow) =>
            dailyRow.id === dailyId
              ? {
                  ...dailyRow,
                  level4Days: Math.max(0, Number(value) || 0),
                  amount: roundValue(Math.max(0, Number(value) || 0) * item.unitPrice),
                }
              : dailyRow,
          ),
        };
      }),
    );
  };

  const openOverallAmountAdjustmentModal = () => {
    setDraftOverallAmountAdjustmentValue('0');
    setDraftOverallAmountAdjustmentReason('');
    setOverallAmountAdjustmentModalOpen(true);
  };

  const closeOverallAmountAdjustmentModal = () => {
    setOverallAmountAdjustmentModalOpen(false);
    setDraftOverallAmountAdjustmentValue('');
    setDraftOverallAmountAdjustmentReason('');
  };

  const saveOverallAmountAdjustment = () => {
    if (!draftOverallAmountAdjustmentReason.trim()) {
      return;
    }

    const beforeValue = Number(overallAmountAdjustment) || 0;
    const deltaValue = Number(draftOverallAmountAdjustmentValue) || 0;
    const nextValue = roundValue(beforeValue + deltaValue);
    setOverallAmountAdjustment(String(nextValue));
    setOverallAmountAdjustmentReason(draftOverallAmountAdjustmentReason.trim());
    setOverallAmountAdjustmentHistory((prev) => [
      {
        id: `overall-amount-${Date.now()}`,
        type: 'amount',
        beforeValue,
        afterValue: nextValue,
        reason: draftOverallAmountAdjustmentReason.trim(),
        time: nowText(),
        operator: '销售',
      },
      ...prev,
    ]);
    closeOverallAmountAdjustmentModal();
  };

  const submitCreateRecord = () => {
    if (!selectedLevelThreeRecords.length || !draftRows.length) {
      return;
    }

    const sourceRecord = selectedLevelThreeRecords[0];
    const nextRecord: CapacityRecord = {
      id: buildNextLevel4Id(data),
      period: sourceRecord.period,
      customer: sourceRecord.customer,
      contract:
        selectedLevelThreeRecords.length === 1 ? sourceRecord.contract : `${sourceRecord.customer}批量开票汇总单`,
      position: sourceRecord.position,
      project: '批量汇总开票申请',
      operationCenter: sourceRecord.operationCenter,
      subCenter: sourceRecord.subCenter,
      approverLevel: sourceRecord.approverLevel || '分中心审批',
      status: '待提交',
      invoiceStatus: '未开票',
      amount: draftSummary.totalAmount,
      workDays: draftSummary.totalLevel4Days,
      handler: '李晓燕',
      updatedAt: nowText(),
      relatedLevelThreeIds: selectedLevelThreeRecords.map((item) => item.id),
    };

    onCreateRecord(nextRecord);
    setSavedDraft(null);
    resetWizard();
  };

  const saveWizardDraft = () => {
    if (!selectedLevelThreeIds.length && !draftRows.length) {
      return;
    }

    setSavedDraft({
      selectedLevelThreeIds,
      draftRows,
      customerFilter,
      memberKeyword,
      positionFilter,
      monthFilter,
      quickFilter,
      overallAmountAdjustment,
      overallAmountAdjustmentReason,
      overallAmountAdjustmentHistory,
      savedAt: nowText(),
    });
  };

  const goToNextStep = () => {
    if (!selectedLevelThreeIds.length) {
      return;
    }

    setWizardStep(2);
  };

  const goToPreviousStep = () => {
    setWizardStep(1);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CapacityFilter
        type="level4"
        actions={
          <button
            type="button"
            onClick={openWizard}
            className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            申请开票
          </button>
        }
      />
      <CapacityTable data={data} view="level4" onDetailClick={onDetailClick} />

      {wizardOpen && (
        <div className="fixed inset-0 z-50 bg-scrim/45" onClick={resetWizard}>
          <div
            className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">申请开票</div>
                <div className="mt-1 text-xs text-on-surface-variant">按两步完成申请开票：先选择当前销售负责客户的三级批次，再核对汇总结果并按增减量调整。</div>
              </div>
              <button
                type="button"
                onClick={resetWizard}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>

            <div className="shrink-0 border-b border-outline-variant bg-surface-container-low px-5 py-3">
              <div className="flex items-center gap-3 text-xs">
                <div className={`rounded-full px-3 py-1.5 ${wizardStep === 1 ? 'bg-primary text-white' : 'bg-white text-on-surface-variant border border-outline-variant'}`}>步骤1 选择批次</div>
                <div className="h-px w-8 bg-outline-variant" />
                <div className={`rounded-full px-3 py-1.5 ${wizardStep === 2 ? 'bg-primary text-white' : 'bg-white text-on-surface-variant border border-outline-variant'}`}>步骤2 汇总调整</div>
              </div>
            </div>

            {wizardStep === 1 && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="border-b border-outline-variant bg-surface-container-low px-5 py-3 text-sm text-on-surface-variant">
                  仅展示当前销售负责客户下已审核通过的三级产能批次。可先按客户筛选，再勾选批次进入下一步。
                </div>
                <div className="border-b border-outline-variant px-5 py-3">
                  <div className="flex items-center gap-3 whitespace-nowrap overflow-x-auto custom-scrollbar">
                    <div className="text-xs text-on-surface-variant">当前销售：{CURRENT_SALES_HANDLER}</div>
                    <select
                      value={customerFilter}
                      onChange={(event) => setCustomerFilter(event.target.value)}
                      className="admin-input h-9 w-[180px] shrink-0 px-3 text-sm"
                    >
                      <option value="">全部客户</option>
                      {customerOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    <div className="text-xs text-on-surface-variant">已选 {selectedLevelThreeIds.length} 个批次</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 border-b border-outline-variant px-5 py-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
                    <div className="text-xs text-on-surface-variant">当前可选批次</div>
                    <div className="mt-1 text-sm font-semibold text-on-surface">{filteredSelectableLevelThreeRecords.length} 个</div>
                  </div>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
                    <div className="text-xs text-on-surface-variant">累计三级产能</div>
                    <div className="mt-1 text-sm font-semibold text-on-surface">{formatNumber(roundValue(filteredSelectableLevelThreeRecords.reduce((sum, item) => sum + item.workDays, 0)))} 人天</div>
                  </div>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
                    <div className="text-xs text-on-surface-variant">累计三级金额</div>
                    <div className="mt-1 text-sm font-semibold text-on-surface">{formatCurrency(roundValue(filteredSelectableLevelThreeRecords.reduce((sum, item) => sum + item.amount, 0)))}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full min-w-[1380px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        <th className="px-4 py-3">选择</th>
                        <th className="px-4 py-3">三级单号</th>
                        <th className="px-4 py-3">所属周期</th>
                        <th className="px-4 py-3">客户</th>
                        <th className="px-4 py-3">合同</th>
                        <th className="px-4 py-3">项目</th>
                        <th className="px-4 py-3">分中心</th>
                        <th className="px-4 py-3">运营中心</th>
                        <th className="px-4 py-3">产能人天</th>
                        <th className="px-4 py-3">金额</th>
                        <th className="px-4 py-3">办理人</th>
                        <th className="px-4 py-3">更新时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {filteredSelectableLevelThreeRecords.map((item) => {
                        const selected = selectedLevelThreeIds.includes(item.id);

                        return (
                          <tr
                            key={item.id}
                            onClick={() => toggleLevelThreeSelect(item.id)}
                            className={`cursor-pointer transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleLevelThreeSelect(item.id)}
                                onClick={(event) => event.stopPropagation()}
                                className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-on-surface">{item.id}</td>
                            <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{item.period}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.customer}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.contract}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.project}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.subCenter}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.operationCenter}</td>
                            <td className="px-4 py-3 text-on-surface">{formatNumber(item.workDays)}</td>
                            <td className="px-4 py-3 text-on-surface">{formatCurrency(item.amount)}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.handler}</td>
                            <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{item.updatedAt}</td>
                          </tr>
                        );
                      })}
                      {!filteredSelectableLevelThreeRecords.length && (
                        <tr>
                          <td colSpan={12} className="px-4 py-12 text-center text-on-surface-variant">当前销售负责客户范围内暂无可选三级批次。</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="grid grid-cols-2 gap-3 border-b border-outline-variant px-5 py-4 lg:grid-cols-4">
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5">
                    <div className="text-xs text-on-surface-variant">已选三级单</div>
                    <div className="mt-1 text-sm font-semibold text-on-surface">{selectedLevelThreeRecords.length} 张</div>
                  </div>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5">
                    <div className="text-xs text-on-surface-variant">三级产能</div>
                    <div className="mt-1 text-sm font-semibold text-on-surface">{formatNumber(draftSummary.totalLevel3Days)} 人天</div>
                  </div>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5">
                    <div className="text-xs text-on-surface-variant">四级产能</div>
                    <div className="mt-1 text-sm font-semibold text-on-surface">{formatNumber(draftSummary.totalLevel4Days)} 人天</div>
                  </div>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5">
                    <div className="text-xs text-on-surface-variant">四级金额</div>
                    <div className="mt-1 text-sm font-semibold text-on-surface">{formatCurrency(draftSummary.totalAmount)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-on-surface">汇总人员明细</div>
                    <div className="mt-1 text-xs text-on-surface-variant">
                      当前整体金额调整：{formatCurrency(Number(overallAmountAdjustment) || 0)}
                      {overallAmountAdjustmentReason ? `，最近原因：${overallAmountAdjustmentReason}` : '，未记录整体调整'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openOverallAmountAdjustmentModal}
                    className="inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    调整总额
                  </button>
                </div>
                <div className="border-b border-outline-variant px-5 py-3">
                  <div className="flex items-center justify-start gap-3 overflow-x-auto whitespace-nowrap custom-scrollbar">
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
                    <div className="shrink-0 text-xs text-on-surface-variant">
                      当前展示 {filteredDraftRows.length} / {draftRows.length} 条
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar px-5 py-4">
                  <table className="w-full min-w-[1140px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        <th className="px-4 py-3">人员</th>
                        <th className="px-4 py-3">所属项目</th>
                        <th className="px-4 py-3">合同岗位</th>
                        <th className="px-4 py-3">月份</th>
                        <th className="px-4 py-3">三级产能</th>
                        <th className="px-4 py-3">四级产能</th>
                        <th className="px-4 py-3">金额</th>
                        <th className="sticky right-0 z-10 w-[220px] border-l border-outline-variant bg-surface-container-low px-4 py-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {!draftRows.length && (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
                            请先在左侧选择三级产能批次，再查看汇总人员明细。
                          </td>
                        </tr>
                      )}
                      {!!draftRows.length && !filteredDraftRows.length && (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-on-surface-variant">
                            当前筛选条件下暂无符合条件的人员明细。
                          </td>
                        </tr>
                      )}
                      {filteredDraftRows.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 font-medium text-on-surface">{item.member}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.project}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.position}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{item.month}</td>
                          <td className="px-4 py-3 text-on-surface">{formatNumber(item.level3Days)}</td>
                          <td className="px-4 py-3 text-on-surface">{formatNumber(item.level4Days)}</td>
                          <td className="px-4 py-3 text-on-surface font-medium">{formatCurrency(item.amount)}</td>
                          <td className="sticky right-0 border-l border-outline-variant bg-white px-4 py-3 text-right whitespace-nowrap hover:bg-surface-container-low">
                            <div className="flex items-center justify-end gap-3 whitespace-nowrap text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailRowId(item.id);
                                  setDetailAdjustmentReason('');
                                }}
                                className="text-primary hover:underline transition-colors"
                              >
                                详情
                              </button>
                              <button
                                type="button"
                                onClick={() => openAdjustmentModal(item.id, 'capacity')}
                                className="text-amber-700 hover:underline transition-colors"
                              >
                                调整产能
                              </button>
                              <button
                                type="button"
                                onClick={() => openAdjustmentModal(item.id, 'amount')}
                                className="text-primary hover:underline transition-colors"
                              >
                                调整金额
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="shrink-0 border-t border-outline-variant bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex flex-col items-center gap-3">
              {savedDraft?.savedAt && (
                <div className="text-xs text-on-surface-variant">最近保存：{savedDraft.savedAt}</div>
              )}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={resetWizard}
                  className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveWizardDraft}
                  disabled={!selectedLevelThreeIds.length && !draftRows.length}
                  className="inline-flex items-center gap-1.5 rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存
                </button>
                {wizardStep === 2 && (
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    上一步
                  </button>
                )}
                {wizardStep === 1 ? (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!selectedLevelThreeIds.length}
                    className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitCreateRecord}
                    disabled={!draftRows.length}
                    className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                  >
                    <Send className="w-3.5 h-3.5" />
                    申请开票
                  </button>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {overallAmountAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={closeOverallAmountAdjustmentModal}>
          <div
            className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">调整总额</div>
                <div className="mt-1 text-xs text-on-surface-variant">用于处理不能归属到具体产能人员的金额，本次填写金额增减量并记录原因。</div>
              </div>
              <button
                type="button"
                onClick={closeOverallAmountAdjustmentModal}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface">
                当前四级金额：{formatCurrency(draftSummary.totalAmount)}
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">金额调整增减量</div>
                <input
                  type="number"
                  step="0.01"
                  value={draftOverallAmountAdjustmentValue}
                  onChange={(event) => setDraftOverallAmountAdjustmentValue(event.target.value)}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
                <div className="mt-1 text-xs text-on-surface-variant">
                  当前整体调整：{formatCurrency(Number(overallAmountAdjustment) || 0)}，调整后：
                  {formatCurrency(roundValue((Number(overallAmountAdjustment) || 0) + (Number(draftOverallAmountAdjustmentValue) || 0)))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-on-surface-variant">调整原因</div>
                <input
                  type="text"
                  value={draftOverallAmountAdjustmentReason}
                  onChange={(event) => setDraftOverallAmountAdjustmentReason(event.target.value)}
                  placeholder="请填写整体金额调整原因"
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
                        <th className="px-4 py-3">调整量</th>
                        <th className="px-4 py-3">调整前</th>
                        <th className="px-4 py-3">调整后</th>
                        <th className="px-4 py-3">调整原因</th>
                        <th className="px-4 py-3">操作人</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {!overallAmountAdjustmentHistory.length && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">暂无调整记录</td>
                        </tr>
                      )}
                      {overallAmountAdjustmentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                          <td className="px-4 py-3 text-on-surface">{formatSignedAdjustmentValue(roundValue(item.afterValue - item.beforeValue), 'amount')}</td>
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
                onClick={closeOverallAmountAdjustmentModal}
                className="rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveOverallAmountAdjustment}
                disabled={!draftOverallAmountAdjustmentReason.trim()}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
              >
                保存调整
              </button>
            </div>
          </div>
        </div>
      )}

      {adjustmentModal && currentAdjustmentRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={closeAdjustmentModal}>
          <div
            className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
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
                  当前值：{adjustmentModal.type === 'capacity' ? `${formatNumber(currentAdjustmentRow.level4Days)} 人天` : formatCurrency(currentAdjustmentRow.amount)}，调整后：
                  {adjustmentModal.type === 'capacity'
                    ? `${formatNumber(roundValue(Math.max(0, currentAdjustmentRow.level4Days + (Number(draftAdjustmentValue) || 0))))} 人天`
                    : formatCurrency(roundValue(Math.max(0, currentAdjustmentRow.amount + (Number(draftAdjustmentValue) || 0))))}
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
                        <th className="px-4 py-3">调整量</th>
                        <th className="px-4 py-3">调整前</th>
                        <th className="px-4 py-3">调整后</th>
                        <th className="px-4 py-3">原因</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {!currentAdjustmentRow.adjustmentHistory.length && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">暂无调整记录</td>
                        </tr>
                      )}
                      {currentAdjustmentRow.adjustmentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                          <td className="px-4 py-3 text-on-surface">{item.type === 'capacity' ? '调整产能' : item.type === 'amount' ? '调整金额' : '日明细调整'}</td>
                          <td className="px-4 py-3 text-on-surface">{formatSignedAdjustmentValue(roundValue(item.afterValue - item.beforeValue), item.type)}</td>
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

      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={() => setDetailRowId('')}>
          <div
            className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">人员日产能详情</div>
                <div className="mt-1 text-xs text-on-surface-variant">
                  {detailRow.sourceGranularity === 'monthly'
                    ? '当前来源为人员月汇总数据，系统按规则拆分到工作日，仅支持查看。'
                    : '当前来源为人员每日明细数据，可直接在详情中调整员工日维度四级产能。'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailRowId('')}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="border-b border-outline-variant px-5 py-3 text-xs text-on-surface-variant">
              人员：{detailRow.member} | 合同岗位：{detailRow.position} | 月份：{detailRow.month} | 来源三级单：{detailRow.sourceRecordNo}
            </div>
            <div className="max-h-[60vh] overflow-auto custom-scrollbar px-5 py-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                    <th className="px-4 py-3">日期</th>
                    <th className="px-4 py-3">三级产能</th>
                    <th className="px-4 py-3">四级产能</th>
                    <th className="px-4 py-3">金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant text-sm">
                  {detailRow.dailyRows.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 font-medium text-on-surface">{item.date}</td>
                      <td className="px-4 py-3 text-on-surface">{formatNumber(item.level3Days)}</td>
                      <td className="px-4 py-3 text-on-surface">
                        {detailRow.sourceGranularity === 'daily' ? (
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={String(item.level4Days)}
                            onChange={(event) => updateDailyLevel4Days(item.id, event.target.value)}
                            className="admin-input h-9 w-24 px-3 text-sm"
                          />
                        ) : (
                          formatNumber(item.level4Days)
                        )}
                      </td>
                      <td className="px-4 py-3 text-on-surface font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-4 border-t border-outline-variant px-5 py-4">
              {detailRow.sourceGranularity === 'daily' && (
                <>
                  <div>
                    <div className="mb-1 text-xs text-on-surface-variant">调整原因</div>
                    <input
                      type="text"
                      value={detailAdjustmentReason}
                      onChange={(event) => setDetailAdjustmentReason(event.target.value)}
                      placeholder="请填写日明细调整原因"
                      className="admin-input h-10 w-full px-3 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={saveDailyAdjustment}
                      disabled={!detailAdjustmentReason.trim()}
                      className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                    >
                      <Save className="w-3.5 h-3.5" />
                      保存日明细调整
                    </button>
                  </div>
                </>
              )}
              <div className="rounded-xl border border-outline-variant bg-white">
                <div className="border-b border-outline-variant px-4 py-3 text-sm font-medium text-on-surface">调整记录</div>
                <div className="max-h-[220px] overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        <th className="px-4 py-3">时间</th>
                        <th className="px-4 py-3">类型</th>
                        <th className="px-4 py-3">调整量</th>
                        <th className="px-4 py-3">调整前</th>
                        <th className="px-4 py-3">调整后</th>
                        <th className="px-4 py-3">原因</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {!detailRow.adjustmentHistory.length && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">暂无调整记录</td>
                        </tr>
                      )}
                      {detailRow.adjustmentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                          <td className="px-4 py-3 text-on-surface">{item.type === 'capacity' ? '调整产能' : item.type === 'amount' ? '调整金额' : '日明细调整'}</td>
                          <td className="px-4 py-3 text-on-surface">{formatSignedAdjustmentValue(roundValue(item.afterValue - item.beforeValue), item.type)}</td>
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
          </div>
        </div>
      )}
    </div>
  );
};