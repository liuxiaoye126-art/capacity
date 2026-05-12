export type CapacityView = 'level3' | 'level4' | 'level5';

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
}

export const CUSTOMERS = ['上海银行', '浦发银行', '中信银行'];

export const OPERATION_CENTERS = ['第一运营中心', '第二运营中心', '总部运营中心'];

export const HANDLERS = ['李晓燕', '王静', '张楠', '陈敏'];

export const APPROVER_LEVELS = ['分中心审批', '总部审批'];

export const INVOICE_STATUS_OPTIONS = ['待上传发票', '未开票', '已上传发票'];

export const RECEIPT_STATUS_OPTIONS = ['未回清', '已回清'];

export const LEVEL3_DATA: CapacityRecord[] = [
  {
    id: 'L3-2026Q1-001',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2023-2026年度信贷及信用卡领域战略技术服务合同',
    position: '高级',
    project: '专项分期电子签名功能优化',
    operationCenter: '第一运营中心',
    subCenter: '信用卡分中心',
    status: '待调整',
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
    operationCenter: '第二运营中心',
    subCenter: '信贷分中心',
    status: '待审核',
    approverLevel: '分中心审批',
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
    operationCenter: '总部运营中心',
    subCenter: '综合分中心',
    status: '已通过',
    approverLevel: '总部审批',
    amount: 878000,
    workDays: 439,
    handler: '张楠',
    updatedAt: '2026-04-07 18:06',
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
    operationCenter: '第一运营中心',
    subCenter: '信用卡分中心',
    approverLevel: '分中心审批',
    status: '待提交',
    invoiceStatus: '未开票',
    amount: 665085,
    workDays: 439,
    handler: '李晓燕',
    updatedAt: '2026-04-09 09:08',
  },
  {
    id: 'L4-2026Q1-002',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度供应链金融业务技术服务合同',
    position: '中级',
    project: '供应链开票异常处理优化',
    operationCenter: '第二运营中心',
    subCenter: '信贷分中心',
    approverLevel: '分中心审批',
    status: '待分中心审核',
    invoiceStatus: '未开票',
    amount: 572000,
    workDays: 440,
    handler: '王静',
    updatedAt: '2026-04-09 10:18',
  },
  {
    id: 'L4-2026Q1-003',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度网银渠道优化项目服务合同',
    position: '资深',
    project: '网银银企交易审核优化',
    operationCenter: '总部运营中心',
    subCenter: '综合分中心',
    approverLevel: '总部审批',
    status: '待总部审核',
    invoiceStatus: '未开票',
    amount: 878000,
    workDays: 439,
    handler: '张楠',
    updatedAt: '2026-04-09 11:02',
  },
  {
    id: 'L4-2026Q1-004',
    period: '2026Q1（1-3月）',
    customer: '上海银行',
    contract: '上海银行2023-2026年度信贷及信用卡领域战略技术服务合同',
    position: '高级',
    project: '专项分期电子签名功能优化',
    operationCenter: '第一运营中心',
    subCenter: '信用卡分中心',
    approverLevel: '分中心审批',
    status: '待上传发票',
    invoiceStatus: '待上传发票',
    amount: 665085,
    workDays: 439,
    handler: '李晓燕',
    updatedAt: '2026-04-09 15:26',
  },
  {
    id: 'L4-2026Q1-005',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度供应链金融业务技术服务合同',
    position: '中级',
    project: '供应链开票异常处理优化',
    operationCenter: '第二运营中心',
    subCenter: '信贷分中心',
    approverLevel: '分中心审批',
    status: '已归档',
    invoiceStatus: '已上传发票',
    amount: 572000,
    workDays: 440,
    handler: '王静',
    updatedAt: '2026-04-08 17:45',
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
    operationCenter: '第一运营中心',
    subCenter: '信用卡分中心',
    approverLevel: '分中心审批',
    status: '回款中',
    receiptStatus: '未回清',
    amount: 665085,
    workDays: 439,
    handler: '陈敏',
    updatedAt: '2026-04-09 12:30',
  },
  {
    id: 'L5-2026Q1-002',
    period: '2026Q1（1-3月）',
    customer: '浦发银行',
    contract: '浦发银行2026年度供应链金融业务技术服务合同',
    position: '中级',
    project: '供应链开票异常处理优化',
    operationCenter: '第二运营中心',
    subCenter: '信贷分中心',
    approverLevel: '分中心审批',
    status: '已回清待确认',
    receiptStatus: '已回清',
    amount: 572000,
    workDays: 440,
    handler: '陈敏',
    updatedAt: '2026-04-09 13:18',
  },
  {
    id: 'L5-2026Q1-003',
    period: '2026Q1（1-3月）',
    customer: '中信银行',
    contract: '中信银行2026年度网银渠道优化项目服务合同',
    position: '资深',
    project: '网银银企交易审核优化',
    operationCenter: '总部运营中心',
    subCenter: '综合分中心',
    approverLevel: '总部审批',
    status: '待总部审核',
    receiptStatus: '已回清',
    amount: 878000,
    workDays: 439,
    handler: '陈敏',
    updatedAt: '2026-04-09 14:05',
  },
];