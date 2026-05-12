import React from 'react';
import { CapacityFilter } from '../components/CapacityFilter';
import { CapacityTable } from '../components/CapacityTable';
import { LEVEL4_DATA } from '../types';

interface LevelFourListPageProps {
  onDetailClick: (id: string) => void;
}

export const LevelFourListPage = ({ onDetailClick }: LevelFourListPageProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CapacityFilter type="level4" />
      <CapacityTable data={LEVEL4_DATA} view="level4" onDetailClick={onDetailClick} />
    </div>
  );
};