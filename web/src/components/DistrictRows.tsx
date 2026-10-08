import { useState } from 'react';
import type { UserLocation } from '../utils/storage';
import { OFFICES } from '../data/offices';
import Explainer from './Explainer';
import { placeName } from '../utils/place';

interface Row {
  key: string;
  label: string;
  value: string;
  officeId?: string;
  district?: string | null;
}

export default function DistrictRows({ location }: { location: UserLocation }) {
  const [open, setOpen] = useState<string | null>(null);
  const place = location.place || placeName(location);
  const rows: Row[] = [
    { key: 'county', label: 'County', value: 'Mecklenburg', officeId: 'meck-commission-atlarge' },
    { key: 'place', label: 'City/Town', value: place },
    {
      key: 'house',
      label: 'U.S. House',
      value: location.district,
      officeId: 'us-house',
      district: location.district,
    },
    {
      key: 'senate',
      label: 'NC Senate',
      value: location.ncSenate ? `District ${location.ncSenate}` : 'Not matched',
      officeId: 'nc-senate',
    },
    {
      key: 'ncHouse',
      label: 'NC House',
      value: location.ncHouse ? `District ${location.ncHouse}` : 'Not matched',
      officeId: 'nc-house',
    },
    {
      key: 'commission',
      label: 'County Commission',
      value: location.commission ? `District ${location.commission}` : 'Not matched',
      officeId: 'meck-commission-district',
      district: location.commission,
    },
  ];

  return (
    <div className="drows">
      {rows.map((row) => {
        const explainer = row.officeId ? OFFICES[row.officeId] : undefined;
        const isOpen = open === row.key;
        return (
          <div key={row.key} className="drows__item">
            {explainer ? (
              <button
                type="button"
                className="drows__row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : row.key)}
              >
                <span className="drows__label">{row.label}</span>
                <span className="drows__value">{row.value}</span>
              </button>
            ) : (
              <div className="drows__row drows__row--static">
                <span className="drows__label">{row.label}</span>
                <span className="drows__value">{row.value}</span>
              </div>
            )}
            {isOpen && explainer && (
              <div className="drows__panel">
                <Explainer explainer={explainer} district={row.district} />
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        .drows {
          background: var(--color-surface);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .drows__item + .drows__item {
          border-top: 1px solid var(--color-border-light);
        }
        .drows__row {
          display: flex;
          justify-content: space-between;
          gap: var(--space-4);
          padding: var(--space-3) var(--space-5);
          min-height: var(--tap-target-min);
          align-items: center;
          width: 100%;
          text-align: left;
          background: transparent;
        }
        .drows__row:not(.drows__row--static):hover {
          background: var(--color-surface-subtle);
        }
        .drows__label {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        .drows__value {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text-primary);
          text-align: right;
        }
        .drows__panel {
          padding: 0 var(--space-5) var(--space-4);
          background: var(--color-surface-subtle);
        }
      `}</style>
    </div>
  );
}
