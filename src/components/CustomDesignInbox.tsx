import React from 'react';
import { Download } from 'lucide-react';
import { CustomDesignRequest, CustomDesignStatus } from '../types';
import { faceShapeLabel, frameShapeLabel } from '../utils/format';
import { buildFrameGeometry } from '../utils/frameGenerator';
import { downloadCutFile } from '../utils/cutFileDownload';

const STATUSES: { value: CustomDesignStatus; label: string }[] = [
  { value: 'new', label: 'Baru' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'in_production', label: 'Diproduksi' },
  { value: 'done', label: 'Selesai' },
];

interface CustomDesignInboxProps {
  designs: CustomDesignRequest[];
  onUpdateStatus: (designId: string, status: CustomDesignStatus) => void;
}

/** Admin list of custom frame designs sent by buyers, with their cutting files */
export const CustomDesignInbox: React.FC<CustomDesignInboxProps> = ({ designs, onUpdateStatus }) => {
  if (designs.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-line text-muted text-sm">
        Belum ada desain custom yang dikirim.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {designs.map((d) => {
        const g = buildFrameGeometry(d.params);
        const pad = 4;
        return (
          <div key={d.id} className="p-6 rounded-3xl bg-white border border-line shadow-card grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 rounded-2xl bg-soft p-4 flex items-center">
              <svg
                viewBox={`${-g.width / 2 - pad} ${g.top - pad} ${g.width + pad * 2} ${g.height + pad * 2}`}
                className="w-full h-auto"
                role="img"
                aria-label={`Desain ${d.sizeCode}`}
              >
                <path d={`${g.front} ${g.lenses.join(' ')}`} fill="#5a3826" fillRule="evenodd" />
              </svg>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-base text-ink">{d.customerName}</h4>
                  <p className="text-sm text-muted">{d.contact}</p>
                </div>
                <select
                  value={d.status}
                  onChange={(e) => onUpdateStatus(d.id, e.target.value as CustomDesignStatus)}
                  aria-label="Status desain"
                  className="h-10 px-4 rounded-full border border-line text-sm text-ink bg-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {[
                  ['Ukuran', d.sizeCode],
                  ['Bentuk', frameShapeLabel(d.params.shape)],
                  ['Kayu', d.wood],
                  ['Wajah', d.faceShape ? `${faceShapeLabel(d.faceShape)} · PD ${d.estimatedPd} mm` : 'Tanpa scan'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="text-ink">{value}</dd>
                  </div>
                ))}
              </dl>

              {(d.params.engraving || d.note) && (
                <div className="text-sm text-body space-y-1">
                  {d.params.engraving && <p>Ukiran: “{d.params.engraving}”</p>}
                  {d.note && <p>Catatan: {d.note}</p>}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {(['svg', 'dxf'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => downloadCutFile(d.params, format, `bj-homemade-${d.id}`)}
                    className="h-10 px-4 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {format.toUpperCase()}
                  </button>
                ))}
                <span className="text-xs text-muted">{new Date(d.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
