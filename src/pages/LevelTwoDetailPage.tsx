import { ArrowLeft, Download, FileText, Users, XCircle } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { LevelTwoRecord, LevelTwoSubProject } from '../types';

interface LevelTwoDetailPageProps {
  record: LevelTwoRecord;
  onBack: () => void;
}

type ViewTab = 'person' | 'subproject';

const formatAmount = (amount: number) =>
  amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const SectionTitle = ({
  icon: Icon,
  title,
  extra,
}: {
  icon: React.ElementType;
  title: string;
  extra?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" />
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
    </div>
    {extra}
  </div>
);

export const LevelTwoDetailPage = ({ record, onBack }: LevelTwoDetailPageProps) => {
  const [tab, setTab] = useState<ViewTab>('person');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const totalL2Days = useMemo(
    () => record.personRows.reduce((sum, r) => sum + r.levelTwoDays, 0),
    [record.personRows],
  );
  const totalL1Days = useMemo(
    () => record.personRows.reduce((sum, r) => sum + r.levelOneDays, 0),
    [record.personRows],
  );
  const totalAmount = useMemo(
    () => record.personRows.reduce((sum, r) => sum + r.amount, 0),
    [record.personRows],
  );

  const selectedPerson = useMemo(
    () => record.personRows.find((r) => r.id === selectedPersonId) ?? null,
    [record.personRows, selectedPersonId],
  );

  const selectedSubProjectMember = useMemo<{
    member: LevelTwoSubProject['members'][number];
    subProject: LevelTwoSubProject;
  } | null>(() => {
    if (!selectedMemberId) return null;
    for (const sp of record.subProjects) {
      const m = sp.members.find((item) => item.id === selectedMemberId);
      if (m) return { member: m, subProject: sp };
    }
    return null;
  }, [record.subProjects, selectedMemberId]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      {/* ── 头部信息 ── */}
      <div className="admin-card px-5 py-5">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-lg font-semibold text-on-surface">{record.project}</div>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs text-on-surface-variant">
              <span>单据编号：{record.id}</span>
              <span>|</span>
              <span>所属月份：{record.month}</span>
              <span>|</span>
              <span>客户：{record.customer}</span>
              <span>|</span>
              <span>运营中心：{record.operationCenter}</span>
            </div>
            <div className="mt-1 text-xs text-on-surface-variant">合同：{record.contract}</div>
          </div>
          <div className="flex items-center gap-8 flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-on-surface">{totalL2Days}</div>
              <div className="mt-0.5 text-xs text-on-surface-variant">二级产能（天）</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">¥{formatAmount(totalAmount)}</div>
              <div className="mt-0.5 text-xs text-on-surface-variant">计算金额</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 原始材料 ── */}
      <div className="admin-card overflow-hidden">
        <SectionTitle icon={FileText} title="原始材料" />
        <div className="px-5 py-4">
          {record.attachments.length === 0 ? (
            <div className="text-sm text-on-surface-variant">暂无原始材料</div>
          ) : (
            <div className="space-y-2">
              {record.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-on-surface">{att.name}</div>
                      <div className="mt-0.5 text-xs text-on-surface-variant">
                        {att.type} · {att.size} · 上传于 {att.uploadedAt} · {att.uploadedBy}
                      </div>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    下载
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 人员产能明细 ── */}
      <div className="admin-card overflow-hidden">
        <SectionTitle
          icon={Users}
          title="人员产能明细"
          extra={
            <div className="flex items-center gap-0.5 rounded-lg border border-outline-variant bg-surface-container-low p-0.5">
              {(['person', 'subproject'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded px-3 py-1.5 text-xs transition-colors ${
                    tab === key
                      ? 'bg-white text-primary shadow-sm font-medium'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {key === 'person' ? '按人员查看' : '按子项目查看'}
                </button>
              ))}
            </div>
          }
        />

        {/* 按人员查看 */}
        {tab === 'person' && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="border-b border-outline-variant text-sm font-semibold text-on-surface bg-surface-container-low">
                  <th className="px-4 py-3">人员</th>
                  <th className="px-4 py-3">所属项目</th>
                  <th className="px-4 py-3">合同岗位</th>
                  <th className="px-4 py-3">月份</th>
                  <th className="px-4 py-3">一级产能（天）</th>
                  <th className="px-4 py-3">二级产能（天）</th>
                  <th className="px-4 py-3">计算金额（元）</th>
                  <th className="px-4 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm">
                {record.personRows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-medium text-on-surface">{row.member}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{row.project}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{row.position}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{row.month}</td>
                    <td className="px-4 py-3 text-on-surface">{row.levelOneDays}</td>
                    <td className="px-4 py-3 font-medium text-on-surface">{row.levelTwoDays}</td>
                    <td className="px-4 py-3 text-on-surface">¥{formatAmount(row.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedPersonId(row.id)}
                        className="text-primary hover:underline text-sm transition-colors"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-outline-variant bg-surface-container-low text-sm font-semibold">
                  <td className="px-4 py-3 text-on-surface" colSpan={4}>
                    合计
                  </td>
                  <td className="px-4 py-3 text-on-surface">{totalL1Days}</td>
                  <td className="px-4 py-3 text-on-surface">{totalL2Days}</td>
                  <td className="px-4 py-3 text-primary">¥{formatAmount(totalAmount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* 按子项目查看 */}
        {tab === 'subproject' && (
          <div className="divide-y divide-outline-variant">
            {record.subProjects.map((sp) => (
              <div key={sp.subProjectId}>
                <div className="flex items-center gap-3 bg-surface-container-low px-5 py-2.5 flex-wrap">
                  <span className="text-xs font-semibold text-on-surface">{sp.subProjectName}</span>
                  <span className="inline-flex rounded px-2 py-0.5 text-xs bg-sky-100 text-sky-700">
                    {sp.subProjectId}
                  </span>
                  <span className="text-xs text-on-surface-variant">批次：{sp.subProjectBatch}</span>
                  <span className="text-xs text-on-surface-variant">
                    · 共 {sp.members.length} 人 ·{' '}
                    {sp.members.reduce((s, m) => s + m.reportDays, 0)} 天 /{' '}
                    {sp.members.reduce((s, m) => s + m.reportHours, 0)} 小时
                  </span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-outline-variant text-xs font-semibold text-on-surface-variant bg-white">
                        <th className="px-4 py-2.5">人员</th>
                        <th className="px-4 py-2.5">所属项目</th>
                        <th className="px-4 py-2.5">月份</th>
                        <th className="px-4 py-2.5">报工时长（h）</th>
                        <th className="px-4 py-2.5">报工人天（天）</th>
                        <th className="px-4 py-2.5 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-sm">
                      {sp.members.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-4 py-3 font-medium text-on-surface">{m.member}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{m.project}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{m.month}</td>
                          <td className="px-4 py-3 text-on-surface">{m.reportHours}</td>
                          <td className="px-4 py-3 font-medium text-on-surface">{m.reportDays}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedMemberId(m.id)}
                              className="text-primary hover:underline text-sm transition-colors"
                            >
                              详情
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 人员详情弹窗（按人员查看） ── */}
      {selectedPerson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={() => setSelectedPersonId(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">人员产能详情</div>
                <div className="mt-0.5 text-xs text-on-surface-variant">
                  {selectedPerson.member} · {selectedPerson.position} · {selectedPerson.month}
                </div>
              </div>
              <button
                onClick={() => setSelectedPersonId(null)}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '所属项目', value: selectedPerson.project },
                  { label: '合同岗位', value: selectedPerson.position },
                  { label: '月份', value: selectedPerson.month },
                  {
                    label: '单价（元/天）',
                    value: `¥${selectedPerson.unitPrice.toLocaleString()}`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
                  >
                    <div className="text-xs text-on-surface-variant">{item.label}</div>
                    <div className="mt-0.5 text-sm font-medium text-on-surface">{item.value}</div>
                  </div>
                ))}
              </div>
              <table className="w-full text-left text-sm overflow-hidden rounded-lg border border-outline-variant">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-on-surface-variant">
                    <th className="px-4 py-2.5">维度</th>
                    <th className="px-4 py-2.5 text-right">数值（天）</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {[
                    { label: '月标准工作日', value: 22 },
                    { label: '一级产能', value: selectedPerson.levelOneDays },
                    { label: '二级产能', value: selectedPerson.levelTwoDays },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-2.5 text-on-surface-variant">{row.label}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-on-surface">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface-container-low font-semibold">
                    <td className="px-4 py-2.5 text-on-surface">计算金额</td>
                    <td className="px-4 py-2.5 text-right text-primary">
                      ¥{formatAmount(selectedPerson.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 子项目成员报工弹窗（按子项目查看） ── */}
      {selectedSubProjectMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/45 px-4 py-6"
          onClick={() => setSelectedMemberId(null)}
        >
          <div
            className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
              <div>
                <div className="text-base font-semibold text-on-surface">报工明细</div>
                <div className="mt-0.5 text-xs text-on-surface-variant">
                  {selectedSubProjectMember.member.member} ·{' '}
                  {selectedSubProjectMember.subProject.subProjectName} ·{' '}
                  {selectedSubProjectMember.member.month}
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberId(null)}
                className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                关闭
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: '子项目编号',
                    value: selectedSubProjectMember.subProject.subProjectId,
                  },
                  {
                    label: '子项目批次',
                    value: selectedSubProjectMember.subProject.subProjectBatch,
                  },
                  {
                    label: '报工合计',
                    value: `${selectedSubProjectMember.member.reportHours}h / ${selectedSubProjectMember.member.reportDays}天`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
                  >
                    <div className="text-xs text-on-surface-variant">{item.label}</div>
                    <div className="mt-0.5 text-sm font-medium text-on-surface">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-on-surface-variant mb-1">
                以下展示该人员本月前 10 个工作日报工记录（示例）
              </div>
              <div className="max-h-[50vh] overflow-auto custom-scrollbar rounded-lg border border-outline-variant">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-on-surface-variant sticky top-0">
                      <th className="px-4 py-2.5">日期</th>
                      <th className="px-4 py-2.5">工时（h）</th>
                      <th className="px-4 py-2.5">任务描述</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {selectedSubProjectMember.member.dailyDetails.map((d, i) => (
                      <tr key={i} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-4 py-2.5 text-on-surface-variant whitespace-nowrap">
                          {d.date}
                        </td>
                        <td className="px-4 py-2.5 text-on-surface">{d.hours}</td>
                        <td className="px-4 py-2.5 text-on-surface-variant">{d.task}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
