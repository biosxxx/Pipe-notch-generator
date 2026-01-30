import React, { useEffect, useState } from 'react';
// import { useParamStore } from './store/useParamStore';
import { Sidebar } from './features/controls/Sidebar';
import { Scene } from './features/viewer/Scene';

function App() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  if (isMobile) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background text-white overflow-y-auto">
        {/* Sidebar */}
        <Sidebar />

        {/* 3D Viewport */}
        <main className="relative h-[60vh] w-full bg-gradient-to-br from-gray-900 to-black">
          <Scene />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-background text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* 3D Viewport */}
      <main className="flex-1 relative bg-gradient-to-br from-gray-900 to-black overflow-hidden">
        <Scene />
      </main>
    </div>
  );
}

export default App;
