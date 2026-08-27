'use client';

type ChartValue = string | number | null | undefined;
type ChartRow = object;

type Series = {
  key: string;
  label: string;
  color: string;
  stroke?: string;
};

type DonutDatum = {
  key: string;
  label: string;
  value: number;
  color: string;
};

const LEFT = 8;
const RIGHT = 4;
const PLOT_WIDTH = 100 - LEFT - RIGHT;
const TOP = 18;
const BOTTOM = 42;

function read(row: ChartRow, key: string): ChartValue {
  return (row as Record<string, ChartValue>)[key];
}

function numberValue(row: ChartRow, key: string) {
  const value = read(row, key);
  const number = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function optionalNumberValue(row: ChartRow, key: string) {
  const value = read(row, key);
  if (value == null || value === '') return null;

  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function textValue(row: ChartRow, key: string) {
  return String(read(row, key) ?? '');
}

function shortLabel(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value.slice(8, 10)}/${value.slice(5, 7)}`;
  }

  return value;
}

function yFor(value: number, max: number, height: number) {
  const plotHeight = height - TOP - BOTTOM;
  return TOP + (1 - value / Math.max(max, 1)) * plotHeight;
}

function lineYFor(value: number, min: number, max: number, height: number) {
  const plotHeight = height - TOP - BOTTOM;
  const range = Math.max(max - min, 1);
  return TOP + (1 - (value - min) / range) * plotHeight;
}

function stackedMax(data: ChartRow[], series: Series[]) {
  return Math.max(
    1,
    ...data.map((row) =>
      series.reduce((total, item) => total + Math.max(0, numberValue(row, item.key)), 0)
    )
  );
}

function shouldShowLabel(index: number, count: number) {
  if (count <= 10) return true;
  if (index === 0 || index === count - 1) return true;
  return index % Math.ceil(count / 6) === 0;
}

function Legend({ items }: { items: Series[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm border border-slate-200"
            style={{ backgroundColor: item.color, borderColor: item.stroke ?? item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function DonutChart({
  data,
  height = 260,
  unit = '',
  totalLabel = 'Total',
}: {
  data: DonutDatum[];
  height?: number;
  unit?: string;
  totalLabel?: string;
}) {
  const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const radius = 68;
  const strokeWidth = 34;
  const circumference = 2 * Math.PI * radius;
  const segments = data.reduce<
    {
      item: DonutDatum;
      length: number;
      dashOffset: number;
    }[]
  >((items, item) => {
    const used = items.reduce((sum, segment) => sum + segment.length, 0);
    const length = total > 0 ? (Math.max(0, item.value) / total) * circumference : 0;

    return [
      ...items,
      {
        item,
        length,
        dashOffset: -used - circumference * 0.25,
      },
    ];
  }, []);

  return (
    <div className="min-w-0">
      <svg
        aria-label={totalLabel}
        role="img"
        width="100%"
        height={height}
        className="block"
      >
        <circle cx="50%" cy="46%" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        {segments.map(({ item, length, dashOffset }) => {
          return (
            <circle
              key={item.key}
              cx="50%"
              cy="46%"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${length} ${circumference}`}
              strokeDashoffset={dashOffset}
            >
              <title>{`${item.label}: ${item.value}${unit ? ` ${unit}` : ''}`}</title>
            </circle>
          );
        })}
        <text x="50%" y="44%" textAnchor="middle" className="fill-slate-500 text-xs">
          {totalLabel}
        </text>
        <text x="50%" y="53%" textAnchor="middle" className="fill-slate-900 text-xl font-semibold">
          {total}{unit ? ` ${unit}` : ''}
        </text>
      </svg>
      <Legend items={data.map((item) => ({ key: item.key, label: item.label, color: item.color }))} />
    </div>
  );
}

export function StackedBarChart({
  data,
  xKey,
  series,
  height = 260,
  unit = '',
}: {
  data: ChartRow[];
  xKey: string;
  series: Series[];
  height?: number;
  unit?: string;
}) {
  const max = stackedMax(data, series);
  const slot = PLOT_WIDTH / Math.max(data.length, 1);
  const gap = Math.min(2.2, slot * 0.35);
  const barWidth = Math.max(0.5, slot - gap);
  const ticks = [0, max / 2, max];

  return (
    <div className="min-w-0">
      <svg aria-label="Stacked bar chart" role="img" width="100%" height={height} className="block">
        {ticks.map((tick) => {
          const y = yFor(tick, max, height);
          return (
            <g key={tick}>
              <line x1={`${LEFT}%`} x2={`${LEFT + PLOT_WIDTH}%`} y1={y} y2={y} stroke="#e2e8f0" />
              <text x={`${LEFT - 1}%`} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {data.map((row, index) => {
          let previous = 0;
          const x = LEFT + index * slot + gap / 2;
          const label = textValue(row, xKey);

          return (
            <g key={`${label}-${index}`}>
              {series.map((item) => {
                const value = Math.max(0, numberValue(row, item.key));
                const yTop = yFor(previous + value, max, height);
                const yBottom = yFor(previous, max, height);
                previous += value;

                if (value <= 0) return null;

                return (
                  <rect
                    key={item.key}
                    x={`${x}%`}
                    y={yTop}
                    width={`${barWidth}%`}
                    height={Math.max(1, yBottom - yTop)}
                    fill={item.color}
                    stroke={item.stroke}
                  >
                    <title>{`${label} - ${item.label}: ${value}${unit ? ` ${unit}` : ''}`}</title>
                  </rect>
                );
              })}

              {shouldShowLabel(index, data.length) ? (
                <text
                  x={`${x + barWidth / 2}%`}
                  y={height - 14}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px]"
                >
                  {shortLabel(label)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <Legend items={series} />
    </div>
  );
}

export function LineChartSvg({
  data,
  xKey,
  yKey,
  label,
  color,
  height = 260,
  unit = '',
}: {
  data: ChartRow[];
  xKey: string;
  yKey: string;
  label: string;
  color: string;
  height?: number;
  unit?: string;
}) {
  const points = data
    .map((row, index) => ({ row, index, value: optionalNumberValue(row, yKey) }))
    .filter((point): point is { row: ChartRow; index: number; value: number } => point.value != null);
  const values = points.map((point) => point.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max((rawMax - rawMin) * 0.12, 1);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const ticks = [min, (min + max) / 2, max];

  return (
    <div className="min-w-0">
      <svg aria-label={label} role="img" width="100%" height={height} className="block">
        {ticks.map((tick) => {
          const y = lineYFor(tick, min, max, height);
          return (
            <g key={tick}>
              <line x1={`${LEFT}%`} x2={`${LEFT + PLOT_WIDTH}%`} y1={y} y2={y} stroke="#e2e8f0" />
              <text x={`${LEFT - 1}%`} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {points.slice(1).map((point, index) => {
          const previous = points[index];
          const x1 = LEFT + (previous.index / Math.max(data.length - 1, 1)) * PLOT_WIDTH;
          const x2 = LEFT + (point.index / Math.max(data.length - 1, 1)) * PLOT_WIDTH;

          return (
            <line
              key={`${textValue(point.row, xKey)}-${index}`}
              x1={`${x1}%`}
              y1={lineYFor(previous.value, min, max, height)}
              x2={`${x2}%`}
              y2={lineYFor(point.value, min, max, height)}
              stroke={color}
              strokeWidth={2}
            />
          );
        })}

        {points.map((point) => {
          const x = LEFT + (point.index / Math.max(data.length - 1, 1)) * PLOT_WIDTH;
          const date = textValue(point.row, xKey);

          return (
            <g key={`${date}-${point.index}`}>
              <circle cx={`${x}%`} cy={lineYFor(point.value, min, max, height)} r={3} fill={color}>
                <title>{`${date} - ${label}: ${point.value}${unit ? ` ${unit}` : ''}`}</title>
              </circle>
              {shouldShowLabel(point.index, data.length) ? (
                <text x={`${x}%`} y={height - 14} textAnchor="middle" className="fill-slate-500 text-[10px]">
                  {shortLabel(date)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <Legend items={[{ key: yKey, label, color }]} />
    </div>
  );
}

export function TrainingRhrChartSvg({
  data,
  xKey,
  barSeries,
  rhrKey,
  height = 320,
}: {
  data: ChartRow[];
  xKey: string;
  barSeries: Series[];
  rhrKey: string;
  height?: number;
}) {
  const barMax = stackedMax(data, barSeries);
  const rhrValues = data
    .map((row) => optionalNumberValue(row, rhrKey))
    .filter((value): value is number => value != null);
  const rhrMinRaw = Math.min(...rhrValues);
  const rhrMaxRaw = Math.max(...rhrValues);
  const rhrPad = Math.max((rhrMaxRaw - rhrMinRaw) * 0.12, 1);
  const rhrMin = rhrMinRaw - rhrPad;
  const rhrMax = rhrMaxRaw + rhrPad;
  const slot = PLOT_WIDTH / Math.max(data.length, 1);
  const gap = Math.min(1.4, slot * 0.35);
  const barWidth = Math.max(0.35, slot - gap);
  const barTicks = [0, barMax / 2, barMax];

  return (
    <div className="min-w-0">
      <svg aria-label="Training and resting heart rate chart" role="img" width="100%" height={height} className="block">
        {barTicks.map((tick) => {
          const y = yFor(tick, barMax, height);
          return (
            <g key={tick}>
              <line x1={`${LEFT}%`} x2={`${LEFT + PLOT_WIDTH}%`} y1={y} y2={y} stroke="#e2e8f0" />
              <text x={`${LEFT - 1}%`} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                {tick.toFixed(1)}
              </text>
            </g>
          );
        })}

        {data.map((row, index) => {
          let previous = 0;
          const x = LEFT + index * slot + gap / 2;
          const label = textValue(row, xKey);

          return (
            <g key={`${label}-${index}`}>
              {barSeries.map((item) => {
                const value = Math.max(0, numberValue(row, item.key));
                const yTop = yFor(previous + value, barMax, height);
                const yBottom = yFor(previous, barMax, height);
                previous += value;

                if (value <= 0) return null;

                return (
                  <rect
                    key={item.key}
                    x={`${x}%`}
                    y={yTop}
                    width={`${barWidth}%`}
                    height={Math.max(1, yBottom - yTop)}
                    fill={item.color}
                    stroke={item.stroke}
                  >
                    <title>{`${label} - ${item.label}: ${value.toFixed(2)} uur`}</title>
                  </rect>
                );
              })}

              {shouldShowLabel(index, data.length) ? (
                <text
                  x={`${x + barWidth / 2}%`}
                  y={height - 14}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px]"
                >
                  {shortLabel(label)}
                </text>
              ) : null}
            </g>
          );
        })}

        {rhrValues.length
          ? data.map((row, index) => {
              if (index === 0) return null;

              const previous = data[index - 1];
              const previousValue = optionalNumberValue(previous, rhrKey);
              const value = optionalNumberValue(row, rhrKey);
              if (previousValue == null || value == null) return null;

              const x1 = LEFT + ((index - 1) / Math.max(data.length - 1, 1)) * PLOT_WIDTH;
              const x2 = LEFT + (index / Math.max(data.length - 1, 1)) * PLOT_WIDTH;

              return (
                <line
                  key={`${textValue(row, xKey)}-rhr`}
                  x1={`${x1}%`}
                  y1={lineYFor(previousValue, rhrMin, rhrMax, height)}
                  x2={`${x2}%`}
                  y2={lineYFor(value, rhrMin, rhrMax, height)}
                  stroke="#0ea5e9"
                  strokeWidth={2}
                />
              );
            })
          : null}

        {data.map((row, index) => {
          const value = optionalNumberValue(row, rhrKey);
          if (value == null) return null;
          const x = LEFT + (index / Math.max(data.length - 1, 1)) * PLOT_WIDTH;
          const label = textValue(row, xKey);

          return (
            <circle
              key={`${label}-rhr-point`}
              cx={`${x}%`}
              cy={lineYFor(value, rhrMin, rhrMax, height)}
              r={3}
              fill="#0ea5e9"
            >
              <title>{`${label} - RHR: ${value} bpm`}</title>
            </circle>
          );
        })}
      </svg>
      <Legend items={[...barSeries, { key: rhrKey, label: 'RHR (bpm)', color: '#0ea5e9' }]} />
    </div>
  );
}
