import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { PaymentReceipt } from '../../types';
import { buildMonthlyCollectionsSeries, MonthlyCollectionPoint } from '../../utils/financialUtils';

interface MonthlyCollectionsChartProps {
  payments: PaymentReceipt[];
  selectedMonthFilter: string;
  onSelectMonthFilter: (monthKey: string) => void;
  onAddPayment?: () => void;
}

type SeriesMode = 'total' | 'breakdown';

function formatCompactFCFA(val: number): string {
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',')}M`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace('.', ',')}k`;
  }
  return `${val}`;
}

function buildSmoothSvgPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    // Clamp control points vertically so curve doesn't overshoot below baseline or above top
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    const clampedCp1y = Math.max(minY, Math.min(maxY, cp1y));
    const clampedCp2y = Math.max(minY, Math.min(maxY, cp2y));

    path += ` C ${cp1x.toFixed(2)} ${clampedCp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${clampedCp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

export const MonthlyCollectionsChart: React.FC<MonthlyCollectionsChartProps> = ({
  payments,
  selectedMonthFilter,
  onSelectMonthFilter,
  onAddPayment,
}) => {
  const [seriesMode, setSeriesMode] = useState<SeriesMode>('total');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const series: MonthlyCollectionPoint[] = useMemo(
    () => buildMonthlyCollectionsSeries(payments, 6),
    [payments]
  );

  const total6Months = useMemo(() => series.reduce((sum, m) => sum + m.total, 0), [series]);
  const averageMonthly = Math.round(total6Months / Math.max(1, series.length));
  const bestMonth = useMemo(() => {
    return series.reduce((best, curr) => (curr.total > best.total ? curr : best), series[0]);
  }, [series]);

  const activeIndex = useMemo(() => {
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < series.length) {
      return hoveredIndex;
    }
    if (selectedMonthFilter !== 'all') {
      const idx = series.findIndex((m) => m.monthKey === selectedMonthFilter);
      if (idx !== -1) return idx;
    }
    return series.length - 1;
  }, [hoveredIndex, selectedMonthFilter, series]);

  const activePoint = series[activeIndex];

  // SVG chart coordinates
  const svgWidth = 820;
  const svgHeight = 250;
  const padLeft = 66;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 38;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxRawValue = useMemo(() => {
    const vals = series.map((m) => m.total);
    return Math.max(0, ...vals);
  }, [series]);

  const yMax = useMemo(() => {
    if (maxRawValue <= 0) return 100_000;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxRawValue)));
    const normalized = maxRawValue / magnitude;
    let niceFactor = 1;
    if (normalized <= 1.2) niceFactor = 1.2;
    else if (normalized <= 1.5) niceFactor = 1.5;
    else if (normalized <= 2) niceFactor = 2;
    else if (normalized <= 2.5) niceFactor = 2.5;
    else if (normalized <= 3) niceFactor = 3;
    else if (normalized <= 4) niceFactor = 4;
    else if (normalized <= 5) niceFactor = 5;
    else if (normalized <= 6) niceFactor = 6;
    else if (normalized <= 8) niceFactor = 8;
    else niceFactor = 10;
    return Math.ceil(niceFactor * magnitude);
  }, [maxRawValue]);

  const yTicks = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      value: Math.round(yMax * ratio),
      y: padTop + plotHeight - ratio * plotHeight,
    }));
  }, [yMax, padTop, plotHeight]);

  const xStep = series.length > 1 ? plotWidth / (series.length - 1) : plotWidth;
  const getX = (idx: number) => padLeft + idx * xStep;
  const getY = (val: number) => padTop + plotHeight - Math.min(1, Math.max(0, val / yMax)) * plotHeight;

  const totalCoords = series.map((m, idx) => ({ x: getX(idx), y: getY(m.total) }));
  const encadCoords = series.map((m, idx) => ({ x: getX(idx), y: getY(m.encadrement) }));
  const inscrCoords = series.map((m, idx) => ({ x: getX(idx), y: getY(m.inscription) }));

  const totalLinePath = buildSmoothSvgPath(totalCoords);
  const encadLinePath = buildSmoothSvgPath(encadCoords);
  const inscrLinePath = buildSmoothSvgPath(inscrCoords);

  const areaPath =
    totalCoords.length > 0
      ? `${totalLinePath} L ${totalCoords[totalCoords.length - 1].x} ${padTop + plotHeight} L ${totalCoords[0].x} ${padTop + plotHeight} Z`
      : '';

  const currentMonthPoint = series[series.length - 1];

  return (
    <section
      aria-label="Comparatif des encaissements mensuels sur les 6 derniers mois"
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/70">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Évolution des Encaissements Mensuels (6 derniers mois)
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Total 6 mois :{' '}
              <strong className="font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {total6Months.toLocaleString()} FCFA
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Moyenne mensuelle :{' '}
              <strong className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                {averageMonthly.toLocaleString()} FCFA
              </strong>
            </span>
            {bestMonth && bestMonth.total > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Pic :{' '}
                  <strong className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {bestMonth.fullLabel}
                  </strong>{' '}
                  <span className="font-mono tabular-nums">({bestMonth.total.toLocaleString()} FCFA)</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Interactive series toggle */}
          <div
            role="group"
            aria-label="Mode d'affichage du graphique"
            className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900/70 p-1 border border-slate-200 dark:border-slate-700"
          >
            <button
              type="button"
              onClick={() => setSeriesMode('total')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                seriesMode === 'total'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Courbe Globale
            </button>
            <button
              type="button"
              onClick={() => setSeriesMode('breakdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                seriesMode === 'breakdown'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Encadrement vs Inscription
            </button>
          </div>

          {selectedMonthFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectMonthFilter('all')}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Réinitialiser filtre mois
            </button>
          )}
        </div>
      </div>

      {/* Legend + Active Point Readout Bar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-5 rounded bg-emerald-600 dark:bg-emerald-400" />
            <span className="font-medium">Total encaissé</span>
          </div>
          {seriesMode === 'breakdown' && (
            <>
              <div className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-5 rounded bg-indigo-600 dark:bg-indigo-400" />
                <span className="font-medium">Frais d'encadrement</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-5 rounded bg-amber-500 dark:bg-amber-400" />
                <span className="font-medium">Frais d'inscription</span>
              </div>
            </>
          )}
        </div>

        {/* Active Month Inspection Readout */}
        {activePoint && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2">
            <span className="font-bold text-slate-900 dark:text-white">{activePoint.fullLabel}</span>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {activePoint.total.toLocaleString()} FCFA
            </span>
            <span className="text-slate-500 dark:text-slate-400 tabular-nums">
              ({activePoint.receiptCount} reçu{activePoint.receiptCount > 1 ? 's' : ''})
            </span>
            {seriesMode === 'breakdown' && (
              <>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                <span className="text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">
                  Encadr. {activePoint.encadrement.toLocaleString()} F
                </span>
                <span className="text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                  Inscr. {activePoint.inscription.toLocaleString()} F
                </span>
              </>
            )}
            {activePoint.changePercent !== null && (
              <span
                className={`inline-flex items-center gap-1 font-mono font-semibold tabular-nums ${
                  activePoint.changePercent > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : activePoint.changePercent < 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {activePoint.changePercent > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : activePoint.changePercent < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                <span>
                  {activePoint.changePercent > 0 ? '+' : ''}
                  {activePoint.changePercent}%
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Interactive SVG Line Chart */}
      <div className="relative mt-4 w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 sm:h-64 overflow-visible select-none"
          role="img"
          aria-label="Graphique linéaire comparant les encaissements des 6 derniers mois"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="paymentsTotalAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={svgWidth - padRight}
                y2={tick.y}
                className="stroke-slate-200 dark:stroke-slate-700/80"
                strokeWidth="1"
                strokeDasharray={idx === 0 ? undefined : '4 4'}
              />
              <text
                x={padLeft - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="fill-slate-500 dark:fill-slate-400 text-[11px] font-mono tabular-nums"
              >
                {formatCompactFCFA(tick.value)}
              </text>
            </g>
          ))}

          {/* Active Month Vertical Guide Line */}
          {activeIndex >= 0 && activeIndex < totalCoords.length && (
            <line
              x1={totalCoords[activeIndex].x}
              y1={padTop}
              x2={totalCoords[activeIndex].x}
              y2={padTop + plotHeight}
              className="stroke-emerald-500/40 dark:stroke-emerald-400/40"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Area under Total line (only in total mode for clarity) */}
          {seriesMode === 'total' && areaPath && (
            <path d={areaPath} fill="url(#paymentsTotalAreaGradient)" />
          )}

          {/* Total Encaissements Line */}
          {totalLinePath && (
            <path
              d={totalLinePath}
              fill="none"
              className="stroke-emerald-600 dark:stroke-emerald-400"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Breakdown Comparison Lines */}
          {seriesMode === 'breakdown' && (
            <>
              <path
                d={encadLinePath}
                fill="none"
                className="stroke-indigo-600 dark:stroke-indigo-400"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={inscrLinePath}
                fill="none"
                className="stroke-amber-500 dark:stroke-amber-400"
                strokeWidth="2.25"
                strokeDasharray="5 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Data Points & X-Axis Labels */}
          {series.map((m, idx) => {
            const pt = totalCoords[idx];
            const isActive = idx === activeIndex;
            const isSelectedFilter = selectedMonthFilter === m.monthKey;

            return (
              <g key={m.monthKey}>
                {/* Breakdown dots */}
                {seriesMode === 'breakdown' && (
                  <>
                    <circle
                      cx={encadCoords[idx].x}
                      cy={encadCoords[idx].y}
                      r={isActive ? 4.5 : 3.2}
                      className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-800"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={inscrCoords[idx].x}
                      cy={inscrCoords[idx].y}
                      r={isActive ? 4.5 : 3.2}
                      className="fill-amber-500 dark:fill-amber-400 stroke-white dark:stroke-slate-800"
                      strokeWidth="1.5"
                    />
                  </>
                )}

                {/* Total line node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive || isSelectedFilter ? 6 : 4}
                  className={`transition-all ${
                    isSelectedFilter
                      ? 'fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900'
                      : 'fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-slate-800'
                  }`}
                  strokeWidth={isActive || isSelectedFilter ? '2.5' : '2'}
                />

                {/* Value label above point when active or non-zero */}
                {(isActive || m.total > 0) && (
                  <text
                    x={pt.x}
                    y={Math.max(14, pt.y - 11)}
                    textAnchor="middle"
                    className={`text-[10.5px] font-mono tabular-nums transition-opacity ${
                      isActive
                        ? 'fill-slate-900 dark:fill-white font-bold'
                        : 'fill-slate-500 dark:fill-slate-400 font-medium'
                    }`}
                  >
                    {formatCompactFCFA(m.total)}
                  </text>
                )}

                {/* X-Axis Month Label */}
                <text
                  x={pt.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className={`text-[11.5px] ${
                    isActive || isSelectedFilter
                      ? 'fill-slate-900 dark:fill-white font-bold'
                      : 'fill-slate-500 dark:fill-slate-400 font-medium'
                  }`}
                >
                  {m.shortLabel}
                </text>

                {/* Wide column hit zone for effortless hover & click-to-filter */}
                <rect
                  x={pt.x - xStep / 2}
                  y={padTop - 8}
                  width={xStep}
                  height={plotHeight + 40}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onClick={() =>
                    onSelectMonthFilter(selectedMonthFilter === m.monthKey ? 'all' : m.monthKey)
                  }
                >
                  <title>{`${m.fullLabel} : ${m.total.toLocaleString()} FCFA (${m.receiptCount} reçu(s)) — Cliquer pour filtrer le journal`}</title>
                </rect>
              </g>
            );
          })}
        </svg>

        {/* Empty State Overlay when no payments exist in the last 6 months */}
        {total6Months === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-[1px] rounded-xl text-center px-4">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Aucun encaissement enregistré sur les 6 derniers mois ({series[0]?.shortLabel} – {currentMonthPoint?.shortLabel}).
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Les courbes mensuelles se mettront à jour automatiquement dès qu&apos;un règlement est encaissé.
            </p>
            {onAddPayment && (
              <button
                type="button"
                onClick={onAddPayment}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Encaisser un premier règlement</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 6-Month Comparative Strip (clickable to filter journal by month) */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/70 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {series.map((m, idx) => {
          const isSelected = selectedMonthFilter === m.monthKey;
          const isHovered = activeIndex === idx;
          return (
            <button
              key={m.monthKey}
              type="button"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelectMonthFilter(isSelected ? 'all' : m.monthKey)}
              className={`text-left px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                  : isHovered
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              title={`Filtrer le journal de caisse sur ${m.fullLabel}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                  {m.shortLabel}
                </span>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {m.receiptCount} r.
                </span>
              </div>
              <div className="mt-1 font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums truncate">
                {m.total.toLocaleString()} F
              </div>
              <div className="mt-0.5 text-[10px] font-mono tabular-nums">
                {m.changePercent === null ? (
                  <span className="text-slate-400">Base</span>
                ) : m.changePercent >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">+{m.changePercent}%</span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">{m.changePercent}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
