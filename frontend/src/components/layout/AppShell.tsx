'use client';

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PlayerBar } from '../player/PlayerBar';
import { QueueDrawer } from '../player/QueueDrawer';
import { ExpandedPlayer } from '../player/ExpandedPlayer';
import { useAuthStore } from '../../stores/useAuthStore';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-white font-sans antialiased">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto pb-32 px-8 pt-4 scrollbar-thin scrollbar-thumb-surface-border">
          {children}
        </main>
      </div>

      {/* Persistent Bottom Player Bar */}
      <PlayerBar />

      {/* Slide-out Queue Panel */}
      <QueueDrawer />

      {/* Fullscreen Expanded Player */}
      <ExpandedPlayer />
    </div>
  );
};
