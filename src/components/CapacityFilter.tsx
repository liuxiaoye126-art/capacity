import { RefreshCw, Search } from 'lucide-react';
import React from 'react';
import {
  CUSTOMERS,
  HANDLERS,
  INVOICE_STATUS_OPTIONS,
  OPERATION_CENTERS,
  RECEIPT_STATUS_OPTIONS,
} from '../types';

const LabelInput = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm text-on-surface-variant">{label}</span>
    {children}
  </div>
);

interface CapacityFilterProps {
  type: 'level3' | 'level4' | 'level5';
  actions?: React.ReactNode;
}

export const CapacityFilter = ({ type, actions }: CapacityFilterProps) => {
  const statusOptions = {
    level3: ['全部状态', '待确认', '待审核', '已通过'],
    level4: ['全部状态', '待提交', '待审核', '待上传发票', '已归档'],
    level5: ['全部状态', '回款中', '已回清待确认', '待审核', '已生效'],
  }[type];

  const keywordPlaceholder = {
    level3: '输入单号/合同名称',
    level4: '输入单号/合同名称',
    level5: '输入单号/合同名称',
  }[type];

  return (
    <div className="admin-card mb-4 px-5 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-4 mb-4">
        <LabelInput label="所属周期">
          <input type="month" className="admin-input" defaultValue="2026-05" />
        </LabelInput>
        <LabelInput label="客户">
          <select className="admin-input">
            <option value="">全部客户</option>
            {CUSTOMERS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </LabelInput>
        <LabelInput label="运营中心">
          <select className="admin-input">
            <option value="">全部运营中心</option>
            {OPERATION_CENTERS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </LabelInput>
        <LabelInput label="办理人">
          <select className="admin-input">
            <option value="">全部办理人</option>
            {HANDLERS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </LabelInput>
        <LabelInput label="状态">
          <select className="admin-input">
            {statusOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </LabelInput>
        <LabelInput label="关键字">
          <input type="text" className="admin-input" placeholder={keywordPlaceholder} />
        </LabelInput>
        {type === 'level5' && (
          <LabelInput label="审批层级">
            <select className="admin-input">
              <option value="">全部层级</option>
              {['分中心审批', '总部审批'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </LabelInput>
        )}
        {type === 'level4' && (
          <LabelInput label="发票状态">
            <select className="admin-input">
              <option value="">全部发票状态</option>
              {INVOICE_STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </LabelInput>
        )}
        {type === 'level5' && (
          <LabelInput label="回款状态">
            <select className="admin-input">
              <option value="">全部回款状态</option>
              {RECEIPT_STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </LabelInput>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className="flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
          <Search className="w-3.5 h-3.5" />
          查询
        </button>
        <button className="flex items-center gap-1.5 rounded border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          重置
        </button>
        {actions}
      </div>
    </div>
  );
};