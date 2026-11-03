import React from 'react';

interface SpotifyBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const SpotifyBadge: React.FC<SpotifyBadgeProps> = ({
  className = '',
  size = 'sm',
  showLabel = false,
}) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <span
      title="Streamed via official Spotify Web Playback SDK"
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30 font-semibold tracking-wide select-none ${
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      } ${className}`}
    >
      <svg
        className={`${iconSize} fill-current flex-shrink-0`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.685.473-1.043.255-2.857-1.745-6.455-2.14-10.692-1.172-.41.093-.815-.164-.908-.574-.093-.41.164-.815.574-.908 4.636-1.06 8.608-.611 11.814 1.356.358.218.473.685.255 1.043zm1.467-3.262c-.275.448-.86.592-1.308.317-3.27-2.01-8.256-2.593-12.124-1.418-.503.153-1.037-.134-1.19-.637-.153-.503.134-1.037.637-1.19 4.417-1.34 9.907-.692 13.668 1.62.448.275.592.86.317 1.308zm.126-3.41c-3.922-2.33-10.384-2.544-14.12-1.408-.6.183-1.242-.158-1.424-.758-.182-.6.158-1.242.758-1.424 4.29-1.302 11.423-1.055 15.932 1.62.542.321.72 1.025.398 1.567-.321.542-1.025.72-1.544.403z" />
      </svg>
      {showLabel && <span>Spotify</span>}
    </span>
  );
};
