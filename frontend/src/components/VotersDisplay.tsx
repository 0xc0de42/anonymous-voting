import React from 'react';

export type VotersDisplayProps = {
  maxVoters?: number;
  inscribed?: number;
  voted?: number;
};

export default function VotersDisplay({
  maxVoters,
  inscribed,
  voted,
}: VotersDisplayProps) {
  const max = Number.isFinite(maxVoters) ? (maxVoters as number) : undefined;
  const ins = Number.isFinite(inscribed) ? (inscribed as number) : 0;
  const vt = Number.isFinite(voted) ? (voted as number) : 0;

  const pctIns = max ? Math.min(100, Math.round((ins / max) * 100)) : 0;
  const pctVoted = max ? Math.min(100, Math.round((vt / max) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-sm text-gray-600">
        <div>
          <span className="font-semibold text-gray-800">Max voters:</span>{' '}
          {max ?? '-'}
        </div>
        <div>
          <span className="font-semibold text-gray-800">Inscribed:</span>{' '}
          {Number.isFinite(inscribed) ? ins : '-'}
        </div>
        <div>
          <span className="font-semibold text-gray-800">Voted:</span>{' '}
          {Number.isFinite(voted) ? vt : '-'}
        </div>
      </div>

      {/* Inscribed progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Inscribed</span>
          <span>{pctIns}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${pctIns}%` }}
          />
        </div>
      </div>

      {/* Voted progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Voted</span>
          <span>{pctVoted}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${pctVoted}%` }}
          />
        </div>
      </div>
    </div>
  );
}
