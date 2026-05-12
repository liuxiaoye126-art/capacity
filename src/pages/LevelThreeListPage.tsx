import React from 'react';
import { CapacityFilter } from '../components/CapacityFilter';
import { CapacityTable } from '../components/CapacityTable';
import { LEVEL3_DATA } from '../types';

interface LevelThreeListPageProps {
  onDetailClick: (id: string) => void;
}

export const LevelThreeListPage = ({ onDetailClick }: LevelThreeListPageProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CapacityFilter type="level3" />
      <CapacityTable data={LEVEL3_DATA} view="level3" onDetailClick={onDetailClick} />
    </div>
  );
};