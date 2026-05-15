import { Save, Send, XCircle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { CapacityFilter } from '../components/CapacityFilter';
import { CapacityTable } from '../components/CapacityTable';
import { CapacityRecord, LEVEL3_DATA } from '../types';

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
  memberKeyword: string;
  positionFilter: string;
  monthFilter: string;
  quickFilter: DraftQuickFilter;
  savedAt: string;
}

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

          return {
            id: `${record.id}-${template.position}-${member.name}-${month}`,
            sourceRecordId: record.id,
            sourceRecordNo: record.id,
            sourceGranularity,
            member: member.name,
            position: template.position,
            month,
            level3Days,
            level4Days: level3Days,
            unitPrice,
            amount: roundValue(level3Days * unitPrice),
            modified: false,
            adjustmentHistory: [],
            dailyRows,
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
  const [selectedLevelThreeIds, setSelectedLevelThreeIds] = useState<string[]>([]);
  const [draftRows, setDraftRows] = useState<DraftLevelFourRow[]>([]);
  const [savedDraft, setSavedDraft] = useState<SavedDraftSnapshot | null>(null);
  const [pendingRestoreDraft, setPendingRestoreDraft] = useState<SavedDraftSnapshot | null>(null);
  const [memberKeyword, setMemberKeyword] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<DraftQuickFilter>('all');
  const [detailRowId, setDetailRowId] = useState<string>('');
  const [adjustmentModal, setAdjustmentModal] = useState<{ rowId: string; type: 'capacity' | 'amount' } | null>(null);
  const [draftAdjustmentValue, setDraftAdjustmentValue] = useState('');
  const [draftAdjustmentReason, setDraftAdjustmentReason] = useState('');
  const [detailAdjustmentReason, setDetailAdjustmentReason] = useState('');

  const approvedLevelThreeRecords = useMemo(() => LEVEL3_DATA.filter((item) => item.status === '已通过'), []);

  const selectedLevelThreeRecords = useMemo(
    () => approvedLevelThreeRecords.filter((item) => selectedLevelThreeIds.includes(item.id)),
    [approvedLevelThreeRecords, selectedLevelThreeIds],
  );

  const draftSummary = useMemo(
    () => ({
      totalLevel3Days: roundValue(draftRows.reduce((sum, item) => sum + item.level3Days, 0)),
      totalLevel4Days: roundValue(draftRows.reduce((sum, item) => sum + item.level4Days, 0)),
      totalAmount: roundValue(draftRows.reduce((sum, item) => sum + item.amount, 0)),
    }),
    [draftRows],
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
    setSelectedLevelThreeIds([]);
    setDraftRows([]);
    setMemberKeyword('');
    setPositionFilter('');
    setMonthFilter('');
    setQuickFilter('all');
    setDetailRowId('');
    setAdjustmentModal(null);
    setDraftAdjustmentValue('');
    setDraftAdjustmentReason('');
    setDetailAdjustmentReason('');
  };

  const openWizard = () => {
    setWizardOpen(true);
    if (savedDraft) {
      setPendingRestoreDraft(savedDraft);
      setSelectedLevelThreeIds(savedDraft.selectedLevelThreeIds);
      setMemberKeyword(savedDraft.memberKeyword);
      setPositionFilter(savedDraft.positionFilter);
      setMonthFilter(savedDraft.monthFilter);
      setQuickFilter(savedDraft.quickFilter);
    } else {
      setPendingRestoreDraft(null);
      setSelectedLevelThreeIds([]);
      setDraftRows([]);
      setMemberKeyword('');
      setPositionFilter('');
      setMonthFilter('');
      setQuickFilter('all');
    }
    setDetailRowId('');
    setAdjustmentModal(null);
    setDraftAdjustmentValue('');
    setDraftAdjustmentReason('');
    setDetailAdjustmentReason('');
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
    setDraftAdjustmentValue(String(type === 'capacity' ? currentRow.level4Days : currentRow.amount));
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

    const nextValue = Math.max(0, Number(draftAdjustmentValue) || 0);

    setDraftRows((prev) =>
      prev.map((item) => {
        if (item.id !== adjustmentModal.rowId) {
          return item;
        }

        if (adjustmentModal.type === 'capacity') {
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

        return {
          ...item,
          amount: roundValue(nextValue),
          modified: true,
          adjustmentHistory: [
            {
              id: `${item.id}-amount-${Date.now()}`,
              type: 'amount',
              beforeValue: item.amount,
              afterValue: roundValue(nextValue),
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
      memberKeyword,
      positionFilter,
      monthFilter,
      quickFilter,
      savedAt: nowText(),
    });
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
                <div className="mt-1 text-xs text-on-surface-variant">选择三级产能批次后，系统自动汇总人员明细，生成一张待提交的四级开票申请单。</div>
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

            <div className="grid min-h-0 flex-1 overflow-hidden gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-h-0 flex-col border-r border-outline-variant">
                <div className="border-b border-outline-variant bg-surface-container-low px-5 py-3 text-sm text-on-surface-variant">
                  仅展示已审核通过的三级产能批次，支持整行点击选择后汇总生成一张四级开票申请单。
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full min-w-[920px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        <th className="px-4 py-3">选择</th>
                        <th className="px-4 py-3">三级单号</th>
                        <th className="px-4 py-3">客户</th>
                        <th className="px-4 py-3">合同</th>
                        <th className="px-4 py-3">运营中心</th>
                        <th className="px-4 py-3">产能人天</th>
                        <th className="px-4 py-3">金额</th>
                        <th className="px-4 py-3">办理人</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {approvedLevelThreeRecords.map((item) => {
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
                            <td className="px-4 py-3 text-on-surface-variant">{item.customer}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.contract}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.operationCenter}</td>
                            <td className="px-4 py-3 text-on-surface">{formatNumber(item.workDays)}</td>
                            <td className="px-4 py-3 text-on-surface">{formatCurrency(item.amount)}</td>
                            <td className="px-4 py-3 text-on-surface-variant">{item.handler}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex min-h-0 flex-col">
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
                  <table className="w-full min-w-[980px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                        <th className="px-4 py-3">人员</th>
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
                          <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">
                            请先在左侧选择三级产能批次，再查看汇总人员明细。
                          </td>
                        </tr>
                      )}
                      {!!draftRows.length && !filteredDraftRows.length && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">
                            当前筛选条件下暂无符合条件的人员明细。
                          </td>
                        </tr>
                      )}
                      {filteredDraftRows.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 font-medium text-on-surface">{item.member}</td>
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
            </div>

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
                <button
                  type="button"
                  onClick={submitCreateRecord}
                  disabled={!draftRows.length}
                  className="inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-on-surface-variant"
                >
                  <Send className="w-3.5 h-3.5" />
                  申请开票
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {adjustmentModal && currentAdjustmentRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={closeAdjustmentModal}>
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
                <div className="mb-1 text-xs text-on-surface-variant">{adjustmentModal.type === 'capacity' ? '调整后四级产能' : '调整后金额'}</div>
                <input
                  type="number"
                  min="0"
                  step={adjustmentModal.type === 'capacity' ? '0.5' : '0.01'}
                  value={draftAdjustmentValue}
                  onChange={(event) => setDraftAdjustmentValue(event.target.value)}
                  className="admin-input h-10 w-full px-3 text-sm"
                />
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
                      {!currentAdjustmentRow.adjustmentHistory.length && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">暂无调整记录</td>
                        </tr>
                      )}
                      {currentAdjustmentRow.adjustmentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                          <td className="px-4 py-3 text-on-surface">{item.type === 'capacity' ? '调整产能' : item.type === 'amount' ? '调整金额' : '日明细调整'}</td>
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
                        <th className="px-4 py-3">调整前</th>
                        <th className="px-4 py-3">调整后</th>
                        <th className="px-4 py-3">原因</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {!detailRow.adjustmentHistory.length && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">暂无调整记录</td>
                        </tr>
                      )}
                      {detailRow.adjustmentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{item.time}</td>
                          <td className="px-4 py-3 text-on-surface">{item.type === 'capacity' ? '调整产能' : item.type === 'amount' ? '调整金额' : '日明细调整'}</td>
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