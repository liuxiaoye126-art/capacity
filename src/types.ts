export type CapacityView = 'level1' | 'level3' | 'level4' | 'level5';

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

export const CUSTOMERS = ['上海银行', '浦发银行', '中信银行'];

export const OPERATION_CENTERS = ['上海运营中心', '第三运营中心', '第四运营中心', '第五运营中心', '第六运营中心', '第八运营中心'];

export const HANDLERS = ['李晓燕', '王静', '张楠', '陈敏'];

export const APPROVER_LEVELS = ['分中心审批', '总部审批'];

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
    status: '已归档',
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
    status: '已回清待确认',
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
    status: '待审核',
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
    status: '已回清待确认',
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
    status: '待审核',
    receiptStatus: '已回清',
    amount: 904000,
    workDays: 452,
    handler: '陈敏',
    updatedAt: '2026-04-11 10:05',
    relatedLevelFourId: 'L4-2026Q1-006',
  },
];