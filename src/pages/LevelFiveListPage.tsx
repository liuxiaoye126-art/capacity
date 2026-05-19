import React from 'react';
import { CapacityFilter } from '../components/CapacityFilter';
import { CapacityTable } from '../components/CapacityTable';
import { LEVEL5_DATA } from '../types';

interface LevelFiveListPageProps {
  onDetailClick: (id: string) => void;
  onRelatedLevelFourClick: (id: string) => void;
}

export const LevelFiveListPage = ({ onDetailClick, onRelatedLevelFourClick }: LevelFiveListPageProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CapacityFilter type="level5" />
      <CapacityTable
        data={LEVEL5_DATA}
        view="level5"
        onDetailClick={onDetailClick}
        onRelatedLevelFourClick={onRelatedLevelFourClick}
      />
    </div>
  );
};