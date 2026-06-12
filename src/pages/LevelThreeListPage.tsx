import React from 'react';
import { CapacityFilter } from '../components/CapacityFilter';
import { CapacityTable } from '../components/CapacityTable';
import { LEVEL3_DATA } from '../types';

interface LevelThreeListPageProps {
  onDetailClick: (id: string) => void;
  chinaBankRole: 'hq' | 'delivery' | 'other';
  onChinaBankRoleChange: (role: 'hq' | 'delivery' | 'other') => void;
}

export const LevelThreeListPage = ({ onDetailClick, chinaBankRole, onChinaBankRoleChange }: LevelThreeListPageProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="admin-card mb-4 px-5 py-4">
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-on-surface-variant">中行待确认视角</span>
          <select
            value={chinaBankRole}
            onChange={(event) => onChinaBankRoleChange(event.target.value as 'hq' | 'delivery' | 'other')}
            className="admin-input h-9 w-[180px] px-3"
          >
            <option value="hq">总部运营中心</option>
            <option value="delivery">交付</option>
            <option value="other">其他人员</option>
          </select>
        </div>
      </div>
      <CapacityFilter type="level3" />
      <CapacityTable data={LEVEL3_DATA} view="level3" onDetailClick={onDetailClick} chinaBankRole={chinaBankRole} />
    </div>
  );
};