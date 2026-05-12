import React, { useState } from 'react';
import { BreadcrumbItem, Layout } from './components/layout/Shell';
import { LevelFourDetailPage } from './pages/LevelFourDetailPage';
import { LevelThreeDetailPage } from './pages/LevelThreeDetailPage';
import { LevelThreeListPage } from './pages/LevelThreeListPage';
import { LevelFourListPage } from './pages/LevelFourListPage';
import { LevelFiveDetailPage } from './pages/LevelFiveDetailPage';
import { LevelFiveListPage } from './pages/LevelFiveListPage';
import { CapacityView, LEVEL3_DATA, LEVEL4_DATA, LEVEL5_DATA } from './types';

export default function App() {
  const [view, setView] = useState<CapacityView>('level3');
  const [selectedLevelThreeId, setSelectedLevelThreeId] = useState<string | null>(null);
  const [selectedLevelFourId, setSelectedLevelFourId] = useState<string | null>(null);
  const [selectedLevelFiveId, setSelectedLevelFiveId] = useState<string | null>(null);

  const handleChangeView = (nextView: CapacityView) => {
    setView(nextView);
    if (nextView !== 'level3') {
      setSelectedLevelThreeId(null);
    }
    if (nextView !== 'level4') {
      setSelectedLevelFourId(null);
    }
    if (nextView !== 'level5') {
      setSelectedLevelFiveId(null);
    }
  };

  const goToLevelThreeList = () => {
    setView('level3');
    setSelectedLevelThreeId(null);
  };

  const goToLevelFourList = () => {
    setView('level4');
    setSelectedLevelFourId(null);
  };

  const goToLevelFiveList = () => {
    setView('level5');
    setSelectedLevelFiveId(null);
  };

  const openSourceLevelThree = (id: string) => {
    setSelectedLevelFourId(null);
    setView('level3');
    setSelectedLevelThreeId(id);
  };

  const openSourceLevelFour = (id: string) => {
    setSelectedLevelFiveId(null);
    setView('level4');
    setSelectedLevelFourId(id);
  };

  const selectedLevelThreeRecord = LEVEL3_DATA.find((item) => item.id === selectedLevelThreeId) || null;
  const selectedLevelFourRecord = LEVEL4_DATA.find((item) => item.id === selectedLevelFourId) || null;
  const selectedLevelFiveRecord = LEVEL5_DATA.find((item) => item.id === selectedLevelFiveId) || null;

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: '产能管理',
      onClick: goToLevelThreeList,
    },
  ];

  if (view === 'level3') {
    breadcrumbs.push({
      label: '三级产能',
      onClick: selectedLevelThreeId ? goToLevelThreeList : undefined,
    });

    if (selectedLevelThreeId) {
      breadcrumbs.push({ label: '详情' });
    }
  }

  if (view === 'level4') {
    breadcrumbs.push({
      label: '四级产能',
      onClick: selectedLevelFourId ? goToLevelFourList : undefined,
    });

    if (selectedLevelFourId) {
      breadcrumbs.push({ label: '详情' });
    }
  }

  if (view === 'level5') {
    breadcrumbs.push({
      label: '五级产能',
      onClick: selectedLevelFiveId ? goToLevelFiveList : undefined,
    });

    if (selectedLevelFiveId) {
      breadcrumbs.push({ label: '详情' });
    }
  }

  return (
    <Layout breadcrumbs={breadcrumbs} currentView={view} onChangeView={handleChangeView}>
      {view === 'level3' && !selectedLevelThreeId && <LevelThreeListPage onDetailClick={setSelectedLevelThreeId} />}
      {view === 'level3' && selectedLevelThreeRecord && (
        <LevelThreeDetailPage record={selectedLevelThreeRecord} onBack={() => setSelectedLevelThreeId(null)} />
      )}
      {view === 'level4' && !selectedLevelFourId && <LevelFourListPage onDetailClick={setSelectedLevelFourId} />}
      {view === 'level4' && selectedLevelFourRecord && (
        <LevelFourDetailPage
          record={selectedLevelFourRecord}
          onBack={() => setSelectedLevelFourId(null)}
          onOpenLevelThreeSource={openSourceLevelThree}
        />
      )}
      {view === 'level5' && !selectedLevelFiveId && <LevelFiveListPage onDetailClick={setSelectedLevelFiveId} />}
      {view === 'level5' && selectedLevelFiveRecord && (
        <LevelFiveDetailPage
          record={selectedLevelFiveRecord}
          onBack={() => setSelectedLevelFiveId(null)}
          onOpenLevelFourSource={openSourceLevelFour}
        />
      )}
    </Layout>
  );
}