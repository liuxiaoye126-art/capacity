import React, { useState } from 'react';
import { BreadcrumbItem, Layout } from './components/layout/Shell';
import { LevelOneListPage } from './pages/LevelOneListPage';
import { LevelFourDetailPage } from './pages/LevelFourDetailPage';
import { LevelThreeDetailPage } from './pages/LevelThreeDetailPage';
import { LevelThreeListPage } from './pages/LevelThreeListPage';
import { LevelFourListPage } from './pages/LevelFourListPage';
import { LevelFiveDetailPage } from './pages/LevelFiveDetailPage';
import { LevelFiveListPage } from './pages/LevelFiveListPage';
import { CapacityView, LEVEL1_DATA, LEVEL3_DATA, LEVEL4_DATA, LEVEL5_DATA } from './types';

export default function App() {
  const [view, setView] = useState<CapacityView>('level3');
  const [selectedLevelThreeId, setSelectedLevelThreeId] = useState<string | null>(null);
  const [selectedLevelFourId, setSelectedLevelFourId] = useState<string | null>(null);
  const [selectedLevelFiveId, setSelectedLevelFiveId] = useState<string | null>(null);
  const [level4Records, setLevel4Records] = useState(LEVEL4_DATA);

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

  const goToLevelOneList = () => {
    setView('level1');
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
  const selectedLevelFourRecord = level4Records.find((item) => item.id === selectedLevelFourId) || null;
  const selectedLevelFiveRecord = LEVEL5_DATA.find((item) => item.id === selectedLevelFiveId) || null;

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: '产能管理',
      onClick: goToLevelOneList,
    },
  ];

  if (view === 'level1') {
    breadcrumbs.push({
      label: '一级产能管理',
    });
  }

  if (view === 'level3') {
    breadcrumbs.push({
      label: '三级产能管理',
      onClick: selectedLevelThreeId ? goToLevelThreeList : undefined,
    });

    if (selectedLevelThreeId) {
      breadcrumbs.push({ label: '详情' });
    }
  }

  if (view === 'level4') {
    breadcrumbs.push({
      label: '四级产能管理',
      onClick: selectedLevelFourId ? goToLevelFourList : undefined,
    });

    if (selectedLevelFourId) {
      breadcrumbs.push({ label: '详情' });
    }
  }

  if (view === 'level5') {
    breadcrumbs.push({
      label: '五级产能管理',
      onClick: selectedLevelFiveId ? goToLevelFiveList : undefined,
    });

    if (selectedLevelFiveId) {
      breadcrumbs.push({ label: '详情' });
    }
  }

  return (
    <Layout breadcrumbs={breadcrumbs} currentView={view} onChangeView={handleChangeView}>
      {view === 'level1' && <LevelOneListPage data={LEVEL1_DATA} />}
      {view === 'level3' && !selectedLevelThreeId && <LevelThreeListPage onDetailClick={setSelectedLevelThreeId} />}
      {view === 'level3' && selectedLevelThreeRecord && (
        <LevelThreeDetailPage record={selectedLevelThreeRecord} onBack={() => setSelectedLevelThreeId(null)} />
      )}
      {view === 'level4' && !selectedLevelFourId && (
        <LevelFourListPage
          data={level4Records}
          onDetailClick={setSelectedLevelFourId}
          onCreateRecord={(nextRecord) => {
            setLevel4Records((prev) => [nextRecord, ...prev]);
            setSelectedLevelFourId(nextRecord.id);
          }}
        />
      )}
      {view === 'level4' && selectedLevelFourRecord && (
        <LevelFourDetailPage
          record={selectedLevelFourRecord}
          onBack={() => setSelectedLevelFourId(null)}
          onOpenLevelThreeSource={openSourceLevelThree}
        />
      )}
      {view === 'level5' && !selectedLevelFiveId && (
        <LevelFiveListPage
          onDetailClick={setSelectedLevelFiveId}
          onRelatedLevelFourClick={openSourceLevelFour}
        />
      )}
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