'use client';

import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Album } from '../../types';

export const AlbumCard: React.FC<{ album: Album }> = ({ album }) => {
  return (
    <Link
      href={`/album/${album.id}`}
      className="group relative p-3 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border/40 hover:border-surface-border transition-all duration-200 flex flex-col justify-between"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-surface-elevated">
        <img
          src={album.coverUrl || ''}
          alt={album.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center shadow-lg shadow-black/60 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>
      </div>

      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">
          {album.title}
        </h4>
        <p className="text-xs text-muted truncate mt-0.5">
          {album.artist?.name} • {album.releaseYear || 'Album'}
        </p>
      </div>
    </Link>
  );
};
