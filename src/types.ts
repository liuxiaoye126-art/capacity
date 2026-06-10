export type CapacityView = 'level1' | 'level2' | 'level3' | 'level4' | 'level5';

export interface LevelOneAttendanceDetail {
  id: string;
  date: string;
  status: '正常打卡' | '加班' | '居家办公';
  checkIn: string;
  checkOut: string;
  days: number;
  remark: string;
}

export interface LevelOneAttendanceAdjustmentDetail {
  id: string;
  employeeName: string;
  abnormalDate: string;
  abnormalType: string;
  days: number;
  approvalStatus: '待审核' | '已通过' | '已驳回';
  punchTime: string;
  bankCheckInTime: string;
  bankCheckOutTime: string;
  attachments: string[];
}

export interface LevelOneReportDetail {
  id: string;
  employeeName: string;
  project: string;
  department: string;
  eventType: string;
  days: number;
  approvalStatus: '待审核' | '已通过' | '已驳回';
  reportRange: string;
  reason: string;
  attachments: string[];
}

export interface LevelOneLeaveDetail {
  id: string;
  employeeName: string;
  project: string;
  department: string;
  leaveType: string;
  days: number;
  approvalStatus: '待审核' | '已通过' | '已驳回';
  duration: string;
  leaveRange: string;
  reason: string;
}

export interface LevelOneRecord {
  id: string;
  employeeName: string;
  project: string;
  operationCenter: string;
  month: string;
  standardWorkDays: number;
  levelOneDays: number;
  attendanceAdjustmentDays: number;
  reportDays: number;
  leaveDays: number;
  attendanceDetails: LevelOneAttendanceDetail[];
  attendanceAdjustments: LevelOneAttendanceAdjustmentDetail[];
  reports: LevelOneReportDetail[];
  leaves: LevelOneLeaveDetail[];
}

export interface CapacityRecord {
  id: string;
  period: string;
  customer: string;
  contract: string;
  position: string;
  project: string;
  operationCenter: string;
  subCenter: string;
  approverLevel?: string;
  status: string;
  invoiceStatus?: string;
  receiptStatus?: string;
  amount: number;
  workDays: number;
  handler: string;
  updatedAt: string;
  relatedLevelThreeIds?: string[];
  relatedLevelFourId?: string;
}

export const normalizeApprovalStatus = (status: string) =>
  ['待分中心审核', '待总部审核'].includes(status) ? '待审核' : status;

export const CUSTOMERS = ['上海银行', '浦发银行', '中信银行', '中国银行'];

export const OPERATION_CENTERS = ['总部运营中心', '上海运营中心', '第三运营中心', '第四运营中心', '第五运营中心', '第六运营中心', '第八运营中心'];

export const HANDLERS = ['李晓燕', '王静', '张楠', '陈敏', '王双银', '赵晨', '杨琳', '汤大区'];

export const APPROVER_LEVELS = ['分中心审批', '总部审批'];

// ─── Level 2 ────────────────────────────────────────────────────────────────

export interface LevelTwoPersonRow {
  id: string;
  member: string;
  project: string;
  position: string;
  month: string;
  levelOneDays: number;
  levelTwoDays: number;
  unitPrice: number;
  amount: number;
}

export interface LevelTwoSubProjectMemberDetail {
  date: string;
  hours: number;
  task: string;
}

export interface LevelTwoSubProjectMember {
  id: string;
  member: string;
  project: string;
  month: string;
  reportHours: number;
  reportDays: number;
  dailyDetails: LevelTwoSubProjectMemberDetail[];
}

export interface LevelTwoSubProject {
  subProjectId: string;
  subProjectName: string;
  subProjectBatch: string;
  members: LevelTwoSubProjectMember[];
}

export interface LevelTwoAttachment {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  size: string;
}

export interface LevelTwoRecord {
  id: string;
  month: string;
  customer: string;
  contract: string;
  project: string;
  operationCenter: string;
  workDays: number;
  personRows: LevelTwoPersonRow[];
  subProjects: LevelTwoSubProject[];
  attachments: LevelTwoAttachment[];
}

const makeDailyDetails = (startDate: string, days: number, tasks: string[]): LevelTwoSubProjectMemberDetail[] =>
  Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { date: dateStr, hours: 8, task: tasks[i % tasks.length] };
  });

export const LEVEL2_DATA: LevelTwoRecord[] = [
  {
    id: 'L2-2026M05-001',
    month: '2026-05',
    customer: '上海银行',
    contract: '上海银行2023-2026年度信贷及信用卡领域战略技术服务合同',
    project: '专项分期电子签名功能优化',
    operationCenter: '上海运营中心',
    workDays: 105,
    personRows: [
      { id: 'L2P-001-01', member: '陈志远', project: '专项分期电子签名功能优化', position: '高级', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1440, amount: 31680 },
      { id: 'L2P-001-02', member: '林梓萱', project: '专项分期电子签名功能优化', position: '中级', month: '2026-05', levelOneDays: 22, levelTwoDays: 21, unitPrice: 1200, amount: 25200 },
      { id: 'L2P-001-03', member: '黄思远', project: '专项分期电子签名功能优化', position: '资深', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1800, amount: 39600 },
      { id: 'L2P-001-04', member: '周雅婷', project: '专项分期电子签名功能优化', position: '中级', month: '2026-05', levelOneDays: 21, levelTwoDays: 20, unitPrice: 1200, amount: 24000 },
      { id: 'L2P-001-05', member: '魏晨曦', project: '专项分期电子签名功能优化', position: '高级', month: '2026-05', levelOneDays: 22, levelTwoDays: 20, unitPrice: 1440, amount: 28800 },
    ],
    subProjects: [
      {
        subProjectId: 'SP-2026-0501',
        subProjectName: '电子签名前端改造',
        subProjectBatch: '2026Q2-批次01',
        members: [
          {
            id: 'L2SM-0501-01', member: '陈志远', project: '专项分期电子签名功能优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['签名组件需求评审', '签名 SDK 集成开发', '前端联调测试', '代码审查与修复', '功能验收自测']),
          },
          {
            id: 'L2SM-0501-02', member: '林梓萱', project: '专项分期电子签名功能优化', month: '2026-05', reportHours: 168, reportDays: 21,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['签名交互原型评审', '前端页面开发', 'UI 还原与走查', '缺陷修复', '交互优化']),
          },
          {
            id: 'L2SM-0501-03', member: '魏晨曦', project: '专项分期电子签名功能优化', month: '2026-05', reportHours: 160, reportDays: 20,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['前端框架升级', '签名回调逻辑开发', '端到端测试', '性能优化', '文档整理']),
          },
        ],
      },
      {
        subProjectId: 'SP-2026-0502',
        subProjectName: '电子签名后端接口适配',
        subProjectBatch: '2026Q2-批次01',
        members: [
          {
            id: 'L2SM-0502-01', member: '黄思远', project: '专项分期电子签名功能优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['接口方案设计', '签名服务接入开发', '接口联调', '异常处理优化', '压测与调优']),
          },
          {
            id: 'L2SM-0502-02', member: '周雅婷', project: '专项分期电子签名功能优化', month: '2026-05', reportHours: 160, reportDays: 20,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['数据模型设计', '接口开发', '单元测试', '联调问题修复', '代码提交审核']),
          },
        ],
      },
    ],
    attachments: [
      { id: 'L2A-001-01', name: '2026年5月工时报表.xlsx', type: '月度工时报表', uploadedAt: '2026-06-02 10:30', uploadedBy: '李晓燕', size: '128 KB' },
      { id: 'L2A-001-02', name: '上海银行5月考勤确认函.pdf', type: '考勤确认', uploadedAt: '2026-06-03 09:15', uploadedBy: '李晓燕', size: '256 KB' },
    ],
  },
  {
    id: 'L2-2026M05-002',
    month: '2026-05',
    customer: '上海银行',
    contract: '上海银行2026年度渠道整合技术服务合同',
    project: '渠道统一认证优化',
    operationCenter: '第四运营中心',
    workDays: 88,
    personRows: [
      { id: 'L2P-002-01', member: '苏梦琪', project: '渠道统一认证优化', position: '高级', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1440, amount: 31680 },
      { id: 'L2P-002-02', member: '赵子涵', project: '渠道统一认证优化', position: '中级', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1200, amount: 26400 },
      { id: 'L2P-002-03', member: '唐思远', project: '渠道统一认证优化', position: '资深', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1800, amount: 39600 },
      { id: 'L2P-002-04', member: '顾可欣', project: '渠道统一认证优化', position: '中级', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1200, amount: 26400 },
    ],
    subProjects: [
      {
        subProjectId: 'SP-2026-0504',
        subProjectName: '渠道认证前端统一改造',
        subProjectBatch: '2026H1-批次01',
        members: [
          {
            id: 'L2SM-0504-01', member: '苏梦琪', project: '渠道统一认证优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['认证流程梳理', 'SSO 组件开发', '前端路由改造', '联调测试', '走查修复']),
          },
          {
            id: 'L2SM-0504-02', member: '赵子涵', project: '渠道统一认证优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['UI 组件开发', '认证弹窗改造', '交互走查', '兼容性测试', '文档输出']),
          },
        ],
      },
      {
        subProjectId: 'SP-2026-0505',
        subProjectName: '认证中台接口联调',
        subProjectBatch: '2026H1-批次01',
        members: [
          {
            id: 'L2SM-0505-01', member: '唐思远', project: '渠道统一认证优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['中台接口设计', 'Token 校验开发', '接口联调', '安全加固', '压测']),
          },
          {
            id: 'L2SM-0505-02', member: '顾可欣', project: '渠道统一认证优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['接口文档整理', '数据验证开发', '异常场景测试', '缺陷修复', '回归测试']),
          },
        ],
      },
    ],
    attachments: [
      { id: 'L2A-002-01', name: '2026年5月渠道项目工时报表.xlsx', type: '月度工时报表', uploadedAt: '2026-06-02 14:20', uploadedBy: '李晓燕', size: '96 KB' },
    ],
  },
  {
    id: 'L2-2026M05-003',
    month: '2026-05',
    customer: '上海银行',
    contract: '上海银行2026年度客户经营平台技术服务合同',
    project: '客户经营标签链路优化',
    operationCenter: '上海运营中心',
    workDays: 66,
    personRows: [
      { id: 'L2P-003-01', member: '梁知夏', project: '客户经营标签链路优化', position: '高级', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1440, amount: 31680 },
      { id: 'L2P-003-02', member: '邵亦凡', project: '客户经营标签链路优化', position: '中级', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1200, amount: 26400 },
      { id: 'L2P-003-03', member: '高云帆', project: '客户经营标签链路优化', position: '资深', month: '2026-05', levelOneDays: 22, levelTwoDays: 22, unitPrice: 1800, amount: 39600 },
    ],
    subProjects: [
      {
        subProjectId: 'SP-2026-0506',
        subProjectName: '标签数据链路优化',
        subProjectBatch: '2026H1-批次02',
        members: [
          {
            id: 'L2SM-0506-01', member: '梁知夏', project: '客户经营标签链路优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['标签链路方案评审', '数据管道开发', '链路监控接入', '性能调优', '联调测试']),
          },
          {
            id: 'L2SM-0506-02', member: '邵亦凡', project: '客户经营标签链路优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['数据清洗逻辑开发', '标签规则配置', '数据验证', '报表统计', '缺陷修复']),
          },
        ],
      },
      {
        subProjectId: 'SP-2026-0507',
        subProjectName: '标签服务性能优化',
        subProjectBatch: '2026H1-批次02',
        members: [
          {
            id: 'L2SM-0507-01', member: '高云帆', project: '客户经营标签链路优化', month: '2026-05', reportHours: 176, reportDays: 22,
            dailyDetails: makeDailyDetails('2026-05-06', 10, ['性能基线测试', '缓存策略优化', 'DB 查询优化', '并发压测', '优化效果验收']),
          },
        ],
      },
    ],
    attachments: [
      { id: 'L2A-003-01', name: '2026年5月客户标签项目工时报表.xlsx', type: '月度工时报表', uploadedAt: '2026-06-01 16:45', uploadedBy: '李晓燕', size: '112 KB' },
      { id: 'L2A-003-02', name: '上海银行5月工时确认邮件截图.png', type: '客户确认截图', uploadedAt: '2026-06-02 09:00', uploadedBy: '李晓燕', size: '320 KB' },
    ],
  },
];

export const INVOICE_STATUS_OPTIONS = ['待上传发票', '未开票', '已上传发票'];

export const RECEIPT_STATUS_OPTIONS = ['未回清', '已回清'];

export const LEVEL1_DATA: LevelOneRecord[] = [
  {
    id: 'L1-2026-05-001',
    employeeName: '马福昌',
    project: '浦发银行研发外协项目-2026年度-上海',
    operationCenter: '浦发分运营中心',
    month: '2026-05',
    standardWorkDays: 22,
    levelOneDays: 20,
    attendanceAdjustmentDays: 2,
    reportDays: 0,
    leaveDays: 2,
    attendanceDetails: [
      {
        id: 'L1A-001-01',
        date: '2026-05-06',
        status: '正常打卡',
        checkIn: '08:56',
        checkOut: '18:11',
        days: 1,
        remark: '系统考勤正常计入一级产能。',
      },
      {
        id: 'L1A-001-02',
        date: '2026-05-07',
        status: '正常打卡',
        checkIn: '08:58',
        checkOut: '18:09',
        days: 1,
        remark: '系统考勤正常计入一级产能。',
      },
      {
        id: 'L1A-001-03',
        date: '2026-05-08',
        status: '加班',
        checkIn: '08:51',
        checkOut: '20:03',
        days: 1,
        remark: '加班按 1 人天计入。',
      },
    ],
    attendanceAdjustments: [
      {
        id: 'L1AD-001-01',
        employeeName: '马福昌',
        abnormalDate: '2026-05-15',
        abnormalType: '旷工',
        days: 1,
        approvalStatus: '已通过',
        punchTime: '18:12:50',
        bankCheckInTime: '08:57',
        bankCheckOutTime: '18:09',
        attachments: [
          'JPEG_20260518_142541_5014612127215638593-考勤调整材料934-142601991.jpg',
          'JPEG_20260518_142429_8224832348616433237-考勤调整材料470-142501464.jpg',
        ],
      },
      {
        id: 'L1AD-001-02',
        employeeName: '马福昌',
        abnormalDate: '2026-05-21',
        abnormalType: '迟到',
        days: 1,
        approvalStatus: '待审核',
        punchTime: '09:27:16',
        bankCheckInTime: '08:58',
        bankCheckOutTime: '18:06',
        attachments: ['attendance-adjustment-proof-20260521.png'],
      },
    ],
    reports: [],
    leaves: [
      {
        id: 'L1LV-001-01',
        employeeName: '马福昌',
        project: '浦发银行研发外协项目-2026年度-上海',
        department: '第1小组',
        leaveType: '事假',
        days: 1,
        approvalStatus: '已通过',
        duration: '1天',
        leaveRange: '2026-05-16 09:00:00~2026-05-16 17:00:00',
        reason: '个人事务请假。',
      },
      {
        id: 'L1LV-001-02',
        employeeName: '马福昌',
        project: '浦发银行研发外协项目-2026年度-上海',
        department: '第1小组',
        leaveType: '病假',
        days: 1,
        approvalStatus: '已通过',
        duration: '1天',
        leaveRange: '2026-05-23 09:00:00~2026-05-23 17:00:00',
        reason: '身体不适居家休息。',
      },
    ],
  },
  {
    id: 'L1-2026-05-002',
    employeeName: '王化雷',
    project: '浦发银行研发外协项目-2026年度-上海',
    operationCenter: '第一运营中心',
    month: '2026-05',
    standardWorkDays: 22,
    levelOneDays: 21,
    attendanceAdjustmentDays: 0,
    reportDays: 0,
    leaveDays: 2,
    attendanceDetails: [
      {
        id: 'L1A-002-01',
        date: '2026-05-08',
        status: '正常打卡',
        checkIn: '09:01',
        checkOut: '18:02',
        days: 1,
        remark: '系统自动汇总正常出勤。',
      },
      {
        id: 'L1A-002-02',
        date: '2026-05-09',
        status: '正常打卡',
        checkIn: '08:53',
        checkOut: '18:14',
        days: 1,
        remark: '系统自动汇总正常出勤。',
      },
    ],
    attendanceAdjustments: [],
    reports: [],
    leaves: [
      {
        id: 'L1LV-002-01',
        employeeName: '王化雷',
        project: '浦发银行研发外协项目-2026年度-上海',
        department: '第1小组',
        leaveType: '事假',
        days: 1,
        approvalStatus: '已通过',
        duration: '1天',
        leaveRange: '2026-05-12 09:00:00~2026-05-12 17:00:00',
        reason: '家中有事',
      },
      {
        id: 'L1LV-002-02',
        employeeName: '王化雷',
        project: '浦发银行研发外协项目-2026年度-上海',
        department: '第1小组',
        leaveType: '调休',
        days: 1,
        approvalStatus: '已通过',
        duration: '1天',
        leaveRange: '2026-05-27 09:00:00~2026-05-27 17:00:00',
        reason: '节前调休安排。',
      },
    ],
  },
  {
    id: 'L1-2026-05-003',
    employeeName: '王葵',
    project: '浦发银行研发外协项目-2026年度-上海',
    operationCenter: '浦发分运营中心',
    month: '2026-05',
    standardWorkDays: 22,
    levelOneDays: 21,
    attendanceAdjustmentDays: 0,
    reportDays: 2,
    leaveDays: 0,
    attendanceDetails: [
      {
        id: 'L1A-003-01',
        date: '2026-05-13',
        status: '正常打卡',
        checkIn: '08:59',
        checkOut: '18:06',
        days: 1,
        remark: '正常出勤。',
      },
      {
        id: 'L1A-003-02',
        date: '2026-05-15',
        status: '居家办公',
        checkIn: '09:00',
        checkOut: '17:00',
        days: 1,
        remark: '通过报备计入一级产能。',
      },
    ],
    attendanceAdjustments: [],
    reports: [
      {
        id: 'L1RP-003-01',
        employeeName: '王葵',
        project: '浦发银行研发外协项目-2026年度-上海',
        department: '浦发分运营中心',
        eventType: '旷工',
        days: 1,
        approvalStatus: '已通过',
        reportRange: '2026-05-14 09:00~2026-05-14 17:00',
        reason: '忘记打卡',
        attachments: ['report-material-preview-20260514.jpg'],
      },
      {
        id: 'L1RP-003-02',
        employeeName: '王葵',
        project: '浦发银行研发外协项目-2026年度-上海',
        department: '浦发分运营中心',
        eventType: '外出办公',
        days: 1,
        approvalStatus: '已驳回',
        reportRange: '2026-05-20 13:00~2026-05-20 18:00',
        reason: '客户现场联调支持。',
        attachments: ['client-visit-apply-20260520.pdf', 'onsite-checkin-20260520.jpg'],
      },
    ],
    leaves: [],
  },
  {
    id: 'L1-2026-05-004',
    employeeName: '陈卓',
    project: '中信银行2026年度网银渠道优化项目',
    operationCenter: '第八运营中心',
    month: '2026-05',
    standardWorkDays: 22,
    levelOneDays: 22,
    attendanceAdjustmentDays: 0,
    reportDays: 0,
    leaveDays: 0,
    attendanceDetails: [
      {
        id: 'L1A-004-01',
        date: '2026-05-06',
        status: '正常打卡',
        checkIn: '08:48',
        checkOut: '18:20',
        days: 1,
        remark: '满勤示例。',
      },
      {
        id: 'L1A-004-02',
        date: '2026-05-07',
        status: '正常打卡',
        checkIn: '08:50',
        checkOut: '18:18',
        days: 1,
        remark: '满勤示例。',
      },
    ],
    attendanceAdjustments: [],
    reports: [],
    leaves: [],
  },
];

export const LEVEL3_DATA: CapacityRecord[] = [
  {
    id: 'L3-2026Q1-010',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2026年度客户经营平台技术服务合同',
    position: '高级',
    project: '客户经营标签链路优化',
    operationCenter: '上海运营中心',
    subCenter: '信用卡分中心',
    status: '初始化',
    amount: 214500,
    workDays: 132,
    handler: '李晓燕',
    updatedAt: '2026-04-08 16:40',
  },
  {
    id: 'L3-2026Q1-001',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2023-2026年度信贷及信用卡领域战略技术服务合同',
    position: '高级',
    project: '专项分期电子签名功能优化',
    operationCenter: '上海运营中心',
    subCenter: '信用卡分中心',
    status: '待确认',
    amount: 665085,
    workDays: 439,
    handler: '李晓燕',
    updatedAt: '2026-04-08 14:20',
  },
  {
    id: 'L3-2026Q1-002',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度供应链金融业务技术服务合同',
    position: '中级',
    project: '供应链开票异常处理优化',
    operationCenter: '第三运营中心',
    subCenter: '信贷分中心',
    status: '待确认',
    amount: 572000,
    workDays: 440,
    handler: '王静',
    updatedAt: '2026-04-09 09:15',
  },
  {
    id: 'L3-2026Q1-003',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度网银渠道优化项目服务合同',
    position: '资深',
    project: '网银银企交易审核优化',
    operationCenter: '第八运营中心',
    subCenter: '综合分中心',
    status: '待审核',
    approverLevel: '总部审批',
    amount: 878000,
    workDays: 439,
    handler: '张楠',
    updatedAt: '2026-04-09 11:36',
  },
  {
    id: 'L3-2026Q1-004',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2026年度渠道整合技术服务合同',
    position: '高级',
    project: '渠道统一认证优化',
    operationCenter: '第四运营中心',
    subCenter: '渠道分中心',
    status: '已通过',
    approverLevel: '分中心审批',
    amount: 618400,
    workDays: 412,
    handler: '李晓燕',
    updatedAt: '2026-04-10 10:26',
  },
  {
    id: 'L3-2026Q1-005',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度零售授信平台技术服务合同',
    position: '中级',
    project: '零售授信流程优化',
    operationCenter: '第五运营中心',
    subCenter: '零售分中心',
    status: '已通过',
    approverLevel: '分中心审批',
    amount: 536000,
    workDays: 402,
    handler: '王静',
    updatedAt: '2026-04-10 15:12',
  },
  {
    id: 'L3-2026Q1-006',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度企业网银渠道服务合同',
    position: '资深',
    project: '企业网银交易链路治理',
    operationCenter: '第六运营中心',
    subCenter: '企业分中心',
    status: '已通过',
    approverLevel: '总部审批',
    amount: 904000,
    workDays: 452,
    handler: '张楠',
    updatedAt: '2026-04-11 09:08',
  },
  {
    id: 'L3-2026Q1-007',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2026年度零售渠道技术服务合同',
    position: '高级',
    project: '零售渠道统一编排优化',
    operationCenter: '第四运营中心',
    subCenter: '零售分中心',
    status: '已通过',
    approverLevel: '分中心审批',
    amount: 588600,
    workDays: 408,
    handler: '李晓燕',
    updatedAt: '2026-04-11 14:18',
  },
  {
    id: 'L3-2026Q1-008',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度运营支撑平台技术服务合同',
    position: '中级',
    project: '运营支撑工单流转优化',
    operationCenter: '第三运营中心',
    subCenter: '运营支撑分中心',
    status: '已通过',
    approverLevel: '分中心审批',
    amount: 549800,
    workDays: 398,
    handler: '李晓燕',
    updatedAt: '2026-04-12 09:42',
  },
  {
    id: 'L3-2026Q1-009',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度交易治理技术服务合同',
    position: '资深',
    project: '交易链路治理与指标校准',
    operationCenter: '第六运营中心',
    subCenter: '交易分中心',
    status: '已通过',
    approverLevel: '总部审批',
    amount: 936500,
    workDays: 447,
    handler: '李晓燕',
    updatedAt: '2026-04-12 16:05',
  },
  {
    id: 'L3-2026Q1-011',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行全量数据拆分交付确认',
    operationCenter: '总部运营中心',
    subCenter: '中行总部分部',
    status: '待确认',
    amount: 1218600,
    workDays: 902,
    handler: '王双银',
    updatedAt: '2026-04-13 10:20',
  },
  {
    id: 'L3-2026Q1-012',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行全量数据拆分交付确认',
    operationCenter: '总部运营中心',
    subCenter: '中行总部分部',
    status: '待审核',
    approverLevel: '总部审批',
    amount: 1218600,
    workDays: 902,
    handler: '汤大区',
    updatedAt: '2026-04-13 15:10',
  },
  {
    id: 'L3-2026Q1-013',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行上海',
    operationCenter: '上海运营中心',
    subCenter: '中行上海',
    status: '已通过',
    approverLevel: '总部审批',
    amount: 246800,
    workDays: 182,
    handler: '李晓燕',
    updatedAt: '2026-04-14 10:20',
  },
  {
    id: 'L3-2026Q1-014',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行珠海',
    operationCenter: '第三运营中心',
    subCenter: '中行珠海',
    status: '已通过',
    approverLevel: '总部审批',
    amount: 123400,
    workDays: 91,
    handler: '李晓燕',
    updatedAt: '2026-04-14 10:26',
  },
  {
    id: 'L3-2026Q1-015',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行北京',
    operationCenter: '第四运营中心',
    subCenter: '中行北京',
    status: '已通过',
    approverLevel: '总部审批',
    amount: 123400,
    workDays: 91,
    handler: '李晓燕',
    updatedAt: '2026-04-14 10:32',
  },
  {
    id: 'L3-2026Q1-016',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行深圳',
    operationCenter: '第五运营中心',
    subCenter: '中行深圳',
    status: '已通过',
    approverLevel: '总部审批',
    amount: 123400,
    workDays: 91,
    handler: '李晓燕',
    updatedAt: '2026-04-14 10:38',
  },
  {
    id: 'L3-2026Q1-017',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行成都',
    operationCenter: '第六运营中心',
    subCenter: '中行成都',
    status: '已通过',
    approverLevel: '总部审批',
    amount: 601600,
    workDays: 447,
    handler: '李晓燕',
    updatedAt: '2026-04-14 10:45',
  },
];

export const LEVEL4_DATA: CapacityRecord[] = [
  {
    id: 'L4-2026Q1-001',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2023-2026年度信贷及信用卡领域战略技术服务合同',
    position: '高级',
    project: '专项分期电子签名功能优化',
    operationCenter: '上海运营中心',
    subCenter: '信用卡分中心',
    approverLevel: '分中心审批',
    status: '待提交',
    invoiceStatus: '未开票',
    amount: 665085,
    workDays: 439,
    handler: '李晓燕',
    updatedAt: '2026-04-09 09:08',
    relatedLevelThreeIds: ['L3-2026Q1-001', 'L3-2026Q1-004'],
  },
  {
    id: 'L4-2026Q1-002',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度供应链金融业务技术服务合同',
    position: '中级',
    project: '供应链开票异常处理优化',
    operationCenter: '第三运营中心',
    subCenter: '信贷分中心',
    approverLevel: '分中心审批',
    status: '待审核',
    invoiceStatus: '未开票',
    amount: 572000,
    workDays: 440,
    handler: '王静',
    updatedAt: '2026-04-09 10:18',
    relatedLevelThreeIds: ['L3-2026Q1-002', 'L3-2026Q1-005'],
  },
  {
    id: 'L4-2026Q1-003',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度网银渠道优化项目服务合同',
    position: '资深',
    project: '网银银企交易审核优化',
    operationCenter: '第八运营中心',
    subCenter: '综合分中心',
    approverLevel: '总部审批',
    status: '待审核',
    invoiceStatus: '未开票',
    amount: 878000,
    workDays: 439,
    handler: '张楠',
    updatedAt: '2026-04-09 11:02',
    relatedLevelThreeIds: ['L3-2026Q1-003', 'L3-2026Q1-006'],
  },
  {
    id: 'L4-2026Q1-004',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2026年度渠道整合技术服务合同',
    position: '高级',
    project: '渠道统一认证优化',
    operationCenter: '第四运营中心',
    subCenter: '渠道分中心',
    approverLevel: '分中心审批',
    status: '待上传发票',
    invoiceStatus: '待上传发票',
    amount: 618400,
    workDays: 412,
    handler: '李晓燕',
    updatedAt: '2026-04-09 15:26',
    relatedLevelThreeIds: ['L3-2026Q1-001', 'L3-2026Q1-004'],
  },
  {
    id: 'L4-2026Q1-005',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度零售授信平台技术服务合同',
    position: '中级',
    project: '零售授信流程优化',
    operationCenter: '第五运营中心',
    subCenter: '零售分中心',
    approverLevel: '分中心审批',
    status: '待归档',
    invoiceStatus: '已上传发票',
    amount: 536000,
    workDays: 402,
    handler: '王静',
    updatedAt: '2026-04-08 17:45',
    relatedLevelThreeIds: ['L3-2026Q1-002', 'L3-2026Q1-005'],
  },
  {
    id: 'L4-2026Q1-006',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度企业网银渠道服务合同',
    position: '资深',
    project: '企业网银交易链路治理',
    operationCenter: '第六运营中心',
    subCenter: '企业分中心',
    approverLevel: '总部审批',
    status: '待审核',
    invoiceStatus: '未开票',
    amount: 904000,
    workDays: 452,
    handler: '张楠',
    updatedAt: '2026-04-11 09:08',
    relatedLevelThreeIds: ['L3-2026Q1-003', 'L3-2026Q1-006'],
  },
  {
    id: 'L4-2026Q1-007',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行多中心批量开票申请',
    operationCenter: '总部运营中心',
    subCenter: '中行总部分部',
    approverLevel: '运营中心负责人审批',
    status: '待提交',
    invoiceStatus: '未开票',
    amount: 1218600,
    workDays: 902,
    handler: '李晓燕',
    updatedAt: '2026-04-14 11:12',
    relatedLevelThreeIds: ['L3-2026Q1-013', 'L3-2026Q1-014', 'L3-2026Q1-015', 'L3-2026Q1-016', 'L3-2026Q1-017'],
  },
  {
    id: 'L4-2026Q1-008',
    period: '2026Q1（1-3月）',
    customer: '中国银行',
    contract: '中国银行2026年度全量交付确认及产能结算服务合同',
    position: '高级',
    project: '中行多中心批量开票申请',
    operationCenter: '总部运营中心',
    subCenter: '中行总部分部',
    approverLevel: '运营中心负责人审批',
    status: '待归档',
    invoiceStatus: '已上传发票',
    amount: 1218600,
    workDays: 902,
    handler: '李晓燕',
    updatedAt: '2026-04-14 16:28',
    relatedLevelThreeIds: ['L3-2026Q1-013', 'L3-2026Q1-014', 'L3-2026Q1-015', 'L3-2026Q1-016', 'L3-2026Q1-017'],
  },
];

export const LEVEL5_DATA: CapacityRecord[] = [
  {
    id: 'L5-2026Q1-001',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2023-2026年度信贷及信用卡领域战略技术服务合同',
    position: '高级',
    project: '专项分期电子签名功能优化',
    operationCenter: '上海运营中心',
    subCenter: '信用卡分中心',
    approverLevel: '分中心审批',
    status: '回款中',
    receiptStatus: '未回清',
    amount: 665085,
    workDays: 439,
    handler: '陈敏',
    updatedAt: '2026-04-09 12:30',
    relatedLevelFourId: 'L4-2026Q1-001',
  },
  {
    id: 'L5-2026Q1-002',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度供应链金融业务技术服务合同',
    position: '中级',
    project: '供应链开票异常处理优化',
    operationCenter: '第三运营中心',
    subCenter: '信贷分中心',
    approverLevel: '分中心审批',
    status: '已回清',
    receiptStatus: '已回清',
    amount: 572000,
    workDays: 440,
    handler: '陈敏',
    updatedAt: '2026-04-09 13:18',
    relatedLevelFourId: 'L4-2026Q1-002',
  },
  {
    id: 'L5-2026Q1-003',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度网银渠道优化项目服务合同',
    position: '资深',
    project: '网银银企交易审核优化',
    operationCenter: '第八运营中心',
    subCenter: '综合分中心',
    approverLevel: '总部审批',
    status: '已回清',
    receiptStatus: '已回清',
    amount: 878000,
    workDays: 439,
    handler: '陈敏',
    updatedAt: '2026-04-09 14:05',
    relatedLevelFourId: 'L4-2026Q1-003',
  },
  {
    id: 'L5-2026Q1-004',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2026年度渠道整合技术服务合同',
    position: '高级',
    project: '渠道统一认证优化',
    operationCenter: '第四运营中心',
    subCenter: '渠道分中心',
    approverLevel: '分中心审批',
    status: '回款中',
    receiptStatus: '未回清',
    amount: 618400,
    workDays: 412,
    handler: '陈敏',
    updatedAt: '2026-04-10 11:16',
    relatedLevelFourId: 'L4-2026Q1-004',
  },
  {
    id: 'L5-2026Q1-005',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度零售授信平台技术服务合同',
    position: '中级',
    project: '零售授信流程优化',
    operationCenter: '第五运营中心',
    subCenter: '零售分中心',
    approverLevel: '分中心审批',
    status: '已回清',
    receiptStatus: '已回清',
    amount: 536000,
    workDays: 402,
    handler: '陈敏',
    updatedAt: '2026-04-10 14:22',
    relatedLevelFourId: 'L4-2026Q1-005',
  },
  {
    id: 'L5-2026Q1-006',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度企业网银渠道服务合同',
    position: '资深',
    project: '企业网银交易链路治理',
    operationCenter: '第六运营中心',
    subCenter: '企业分中心',
    approverLevel: '总部审批',
    status: '已回清',
    receiptStatus: '已回清',
    amount: 904000,
    workDays: 452,
    handler: '陈敏',
    updatedAt: '2026-04-11 10:05',
    relatedLevelFourId: 'L4-2026Q1-006',
  },
];