import { CalendarDays, Clock3, FileUp, UserRoundCheck, XCircle } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  LevelOneAttendanceAdjustmentDetail,
  LevelOneAttendanceDetail,
  LevelOneLeaveDetail,
  LevelOneRecord,
  LevelOneReportDetail,
} from '../types';

interface LevelOneListPageProps {
  data: LevelOneRecord[];
}

type LevelOneDetailType = 'levelOne' | 'attendanceAdjustment' | 'report' | 'leave';

interface ActiveDetailState {
  recordId: string;
  type: LevelOneDetailType;
}

interface LevelOneEffectiveRow {
  id: string;
  date: string;
  source: string;
  status: string;
  days: number;
  remark: string;
}

const formatNumber = (value: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  });

const MetricButton = ({
  value,
  disabled,
  onClick,
}: {
  value: number;
  disabled?: boolean;
  onClick: () => void;
}) => {
  if (disabled) {
    return <span className="text-on-surface-variant">0</span>;
  }

  return (
    <button type="button" onClick={onClick} className="text-primary hover:underline transition-colors">
      {formatNumber(value)}
    </button>
  );
};

const SectionTitle = ({ title, icon: Icon }: { title: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
    <Icon className="h-4 w-4 text-primary" />
    <div className="text-sm font-semibold text-on-surface">{title}</div>
  </div>
);

const getApprovedAttendanceAdjustmentDays = (record: LevelOneRecord) =>
  record.attendanceAdjustments
    .filter((item) => item.approvalStatus === '已通过')
    .reduce((sum, item) => sum + item.days, 0);

const getApprovedReportDays = (record: LevelOneRecord) =>
  record.reports.filter((item) => item.approvalStatus === '已通过').reduce((sum, item) => sum + item.days, 0);

const getApprovedLeaveDays = (record: LevelOneRecord) =>
  record.leaves.filter((item) => item.approvalStatus === '已通过').reduce((sum, item) => sum + item.days, 0);

const getDisplayedLevelOneDays = (record: LevelOneRecord) =>
  record.standardWorkDays - getApprovedLeaveDays(record);

const getDisplayedAttendanceAdjustmentDays = (record: LevelOneRecord) => getApprovedAttendanceAdjustmentDays(record);

const getDisplayedReportDays = (record: LevelOneRecord) => getApprovedReportDays(record);

const getDisplayedLeaveDays = (record: LevelOneRecord) => getApprovedLeaveDays(record);

const getApprovedAttendanceAdjustments = (record: LevelOneRecord) =>
  record.attendanceAdjustments.filter((item) => item.approvalStatus === '已通过');

const getApprovedReports = (record: LevelOneRecord) => record.reports.filter((item) => item.approvalStatus === '已通过');

const getApprovedLeaves = (record: LevelOneRecord) => record.leaves.filter((item) => item.approvalStatus === '已通过');

const buildEffectiveLevelOneRows = (record: LevelOneRecord): LevelOneEffectiveRow[] => [
  ...record.attendanceDetails.map((item) => ({
    id: item.id,
    date: item.date,
    source: '系统考勤',
    status: item.status,
    days: item.days,
    remark: item.remark,
  })),
  ...getApprovedAttendanceAdjustments(record)
    .map((item) => ({
      id: item.id,
      date: item.abnormalDate,
      source: '考勤调整',
      status: item.approvalStatus,
      days: item.days,
      remark: `${item.abnormalType}调整审核通过，计入一级产能。`,
    })),
  ...getApprovedReports(record)
    .map((item) => ({
      id: item.id,
      date: item.reportRange,
      source: '报备',
      status: item.approvalStatus,
      days: item.days,
      remark: `${item.eventType}报备审核通过，计入一级产能。`,
    })),
  ...getApprovedLeaves(record).map((item) => ({
    id: item.id,
    date: item.leaveRange,
    source: '请假',
    status: item.approvalStatus,
    days: -item.days,
    remark: `${item.leaveType}审批通过，扣减一级产能。`,
  })),
];

const renderAttendanceContent = (record: LevelOneRecord, details: LevelOneEffectiveRow[]) => (
  <>
    <SectionTitle title="一级产能明细" icon={UserRoundCheck} />
    <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-3">
      <div><div className="mb-1 text-xs text-on-surface-variant">员工姓名</div><div className="text-sm font-medium text-on-surface">{record.employeeName}</div></div>
      <div><div className="mb-1 text-xs text-on-surface-variant">所属项目</div><div className="text-sm font-medium text-on-surface">{record.project}</div></div>
      <div><div className="mb-1 text-xs text-on-surface-variant">月份</div><div className="text-sm font-medium text-on-surface">{record.month}</div></div>
      <div><div className="mb-1 text-xs text-on-surface-variant">标准工作日天数</div><div className="text-sm font-medium text-on-surface">{formatNumber(record.standardWorkDays)}</div></div>
      <div><div className="mb-1 text-xs text-on-surface-variant">一级产能</div><div className="text-sm font-medium text-on-surface">{formatNumber(getDisplayedLevelOneDays(record))}</div></div>
      <div><div className="mb-1 text-xs text-on-surface-variant">说明</div><div className="text-sm font-medium text-on-surface">已通过的考勤调整和报备纳入正常一级产能，已通过请假扣减一级产能。</div></div>
    </div>
    <div className="border-t border-outline-variant px-5 py-5">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
              <th className="px-3 py-3">日期</th>
              <th className="px-3 py-3">数据来源</th>
              <th className="px-3 py-3">状态</th>
              <th className="px-3 py-3">一级产能/人天</th>
              <th className="px-3 py-3">说明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {details.map((item) => (
              <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-3 py-3 font-medium text-on-surface">{item.date}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.source}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.status}</td>
                <td className="px-3 py-3 text-on-surface font-medium">{formatNumber(item.days)}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

const renderAttendanceAdjustmentContent = (details: LevelOneAttendanceAdjustmentDetail[]) => (
  <>
    <SectionTitle title="考勤调整详情" icon={Clock3} />
    <div className="px-5 py-5">
      <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-outline-variant bg-white">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
              <th className="px-3 py-3">员工姓名</th>
              <th className="px-3 py-3">异常日期</th>
              <th className="px-3 py-3">异常类型</th>
              <th className="px-3 py-3">调整人天</th>
              <th className="px-3 py-3">审批状态</th>
              <th className="px-3 py-3">签到打卡时间</th>
              <th className="px-3 py-3">行方打卡上班时间</th>
              <th className="px-3 py-3">行方打卡下班时间</th>
              <th className="px-3 py-3">上传材料</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {details.map((item) => (
              <tr key={item.id} className="align-top hover:bg-surface-container-low transition-colors">
                <td className="px-3 py-3 font-medium text-on-surface">{item.employeeName}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.abnormalDate}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.abnormalType}</td>
                <td className="px-3 py-3 text-on-surface-variant">{formatNumber(item.days)}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.approvalStatus}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.punchTime}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.bankCheckInTime}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.bankCheckOutTime}</td>
                <td className="px-3 py-3">
                  <div className="space-y-2">
                    {item.attachments.map((attachment) => (
                      <div key={attachment} className="text-sm text-primary hover:underline transition-colors">
                        {attachment}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

const renderReportContent = (details: LevelOneReportDetail[]) => (
  <>
    <SectionTitle title="报备详情" icon={FileUp} />
    <div className="px-5 py-5">
      <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-outline-variant bg-white">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
              <th className="px-3 py-3">员工姓名</th>
              <th className="px-3 py-3">所属项目</th>
              <th className="px-3 py-3">所属部门</th>
              <th className="px-3 py-3">报备事件</th>
              <th className="px-3 py-3">报备人天</th>
              <th className="px-3 py-3">审批状态</th>
              <th className="px-3 py-3">报备时间范围</th>
              <th className="px-3 py-3">报备事由</th>
              <th className="px-3 py-3">报备材料</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {details.map((item) => (
              <tr key={item.id} className="align-top hover:bg-surface-container-low transition-colors">
                <td className="px-3 py-3 font-medium text-on-surface">{item.employeeName}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.project}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.department}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.eventType}</td>
                <td className="px-3 py-3 text-on-surface-variant">{formatNumber(item.days)}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.approvalStatus}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.reportRange}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.reason}</td>
                <td className="px-3 py-3">
                  <div className="space-y-2">
                    {item.attachments.map((attachment) => (
                      <div key={attachment} className="text-sm text-primary hover:underline transition-colors">
                        {attachment}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

const renderLeaveContent = (details: LevelOneLeaveDetail[]) => (
  <>
    <SectionTitle title="请假详情" icon={CalendarDays} />
    <div className="px-5 py-5">
      <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-outline-variant bg-white">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
              <th className="px-3 py-3">姓名</th>
              <th className="px-3 py-3">项目</th>
              <th className="px-3 py-3">部门</th>
              <th className="px-3 py-3">请假类型</th>
              <th className="px-3 py-3">请假人天</th>
              <th className="px-3 py-3">审批状态</th>
              <th className="px-3 py-3">请假时长</th>
              <th className="px-3 py-3">请假范围</th>
              <th className="px-3 py-3">请假事由</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {details.map((item) => (
              <tr key={item.id} className="align-top hover:bg-surface-container-low transition-colors">
                <td className="px-3 py-3 font-medium text-on-surface">{item.employeeName}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.project}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.department}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.leaveType}</td>
                <td className="px-3 py-3 text-on-surface-variant">{formatNumber(item.days)}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.approvalStatus}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.duration}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.leaveRange}</td>
                <td className="px-3 py-3 text-on-surface-variant">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

export const LevelOneListPage = ({ data }: LevelOneListPageProps) => {
  const [employeeNameFilter, setEmployeeNameFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  const [activeDetail, setActiveDetail] = useState<ActiveDetailState | null>(null);

  const projects = useMemo(() => Array.from(new Set(data.map((item) => item.project))), [data]);

  const operationCenters = useMemo(() => Array.from(new Set(data.map((item) => item.operationCenter))), [data]);
  const months = useMemo(() => Array.from(new Set(data.map((item) => item.month))), [data]);

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const matchedEmployeeName = !employeeNameFilter.trim() || item.employeeName.includes(employeeNameFilter.trim());
        const matchedProject = !projectFilter || item.project === projectFilter;
        const matchedMonth = !monthFilter || item.month === monthFilter;
        const matchedCenter = !centerFilter || item.operationCenter === centerFilter;

        return matchedEmployeeName && matchedProject && matchedMonth && matchedCenter;
      }),
    [centerFilter, data, employeeNameFilter, monthFilter, projectFilter],
  );

  const activeRecord = activeDetail ? data.find((item) => item.id === activeDetail.recordId) || null : null;
  const activeLevelOneRows = activeRecord ? buildEffectiveLevelOneRows(activeRecord) : [];
  const activeApprovedAttendanceAdjustments = activeRecord ? getApprovedAttendanceAdjustments(activeRecord) : [];
  const activeApprovedReports = activeRecord ? getApprovedReports(activeRecord) : [];
  const activeApprovedLeaves = activeRecord ? getApprovedLeaves(activeRecord) : [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <div className="admin-card px-5 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-on-surface-variant">姓名</span>
            <input
              type="text"
              value={employeeNameFilter}
              onChange={(event) => setEmployeeNameFilter(event.target.value)}
              placeholder="输入姓名"
              className="admin-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-on-surface-variant">项目</span>
            <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="admin-input">
              <option value="">全部项目</option>
              {projects.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-on-surface-variant">月份</span>
            <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} className="admin-input">
              <option value="">全部月份</option>
              {months.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-on-surface-variant">运营中心</span>
            <select value={centerFilter} onChange={(event) => setCenterFilter(event.target.value)} className="admin-input">
              <option value="">全部运营中心</option>
              {operationCenters.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1280px] border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low text-sm font-semibold text-on-surface">
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">项目</th>
                <th className="px-4 py-3">运营中心</th>
                <th className="px-4 py-3">月份</th>
                <th className="px-4 py-3">标准工作日天数</th>
                <th className="px-4 py-3">一级产能</th>
                <th className="px-4 py-3">考勤调整</th>
                <th className="px-4 py-3">报备</th>
                <th className="px-4 py-3">请假</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-4 font-medium text-on-surface">{item.employeeName}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{item.project}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{item.operationCenter}</td>
                  <td className="px-4 py-4 text-on-surface-variant">{item.month}</td>
                  <td className="px-4 py-4 text-on-surface">{formatNumber(item.standardWorkDays)}</td>
                  <td className="px-4 py-4 text-on-surface font-medium">
                    <MetricButton value={getDisplayedLevelOneDays(item)} onClick={() => setActiveDetail({ recordId: item.id, type: 'levelOne' })} />
                  </td>
                  <td className="px-4 py-4 text-on-surface font-medium">
                    <MetricButton
                      value={getDisplayedAttendanceAdjustmentDays(item)}
                      disabled={getDisplayedAttendanceAdjustmentDays(item) <= 0}
                      onClick={() => setActiveDetail({ recordId: item.id, type: 'attendanceAdjustment' })}
                    />
                  </td>
                  <td className="px-4 py-4 text-on-surface font-medium">
                    <MetricButton
                      value={getDisplayedReportDays(item)}
                      disabled={getDisplayedReportDays(item) <= 0}
                      onClick={() => setActiveDetail({ recordId: item.id, type: 'report' })}
                    />
                  </td>
                  <td className="px-4 py-4 text-on-surface font-medium">
                    <MetricButton
                      value={getDisplayedLeaveDays(item)}
                      disabled={getDisplayedLeaveDays(item) <= 0}
                      onClick={() => setActiveDetail({ recordId: item.id, type: 'leave' })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeRecord && activeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6" onClick={() => setActiveDetail(null)}>
          <div
            className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">
                  {{
                    levelOne: '一级产能详情',
                    attendanceAdjustment: '考勤调整详情',
                    report: '报备详情',
                    leave: '请假详情',
                  }[activeDetail.type]}
                </div>
                <div className="mt-1 text-xs text-on-surface-variant">{activeRecord.employeeName} | {activeRecord.project} | {activeRecord.month}</div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetail(null)}
                className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                关闭
              </button>
            </div>
            <div className="max-h-[calc(90vh-80px)] overflow-auto custom-scrollbar bg-surface-container-low/30">
              {activeDetail.type === 'levelOne' && renderAttendanceContent(activeRecord, activeLevelOneRows)}
              {activeDetail.type === 'attendanceAdjustment' && renderAttendanceAdjustmentContent(activeApprovedAttendanceAdjustments)}
              {activeDetail.type === 'report' && renderReportContent(activeApprovedReports)}
              {activeDetail.type === 'leave' && renderLeaveContent(activeApprovedLeaves)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};