'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Artist } from '../../types';

export const ArtistCard: React.FC<{ artist: Artist }> = ({ artist }) => {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group relative p-3 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border/40 hover:border-surface-border transition-all duration-200 flex flex-col items-center text-center"
    >
      <div className="relative w-32 h-32 rounded-full overflow-hidden mb-3 bg-surface-elevated shadow-md shadow-black/40">
        <img
          src={artist.avatarUrl || ''}
          alt={artist.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="w-full px-2">
        <h4 className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate flex items-center justify-center gap-1">
          {artist.name}
          {artist.verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
        </h4>
        <p className="text-xs text-muted truncate mt-0.5">Artist</p>
      </div>
    </Link>
  );
};
