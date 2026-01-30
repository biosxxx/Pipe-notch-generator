import React from 'react';
// import { useParamStore } from './store/useParamStore';
import { Sidebar } from './features/controls/Sidebar';
import { Scene } from './features/viewer/Scene';

function App() {
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
