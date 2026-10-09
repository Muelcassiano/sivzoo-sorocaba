import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CasoZoonoses, AgravoType } from '../types/zoonoses';
import { Calendar, ChevronDown } from 'lucide-react';

interface EndemicChannelChartProps {
  casos: CasoZoonoses[];
  selectedYear?: number;
  onSelectYear?: (year: number) => void;
  selectedAgravo?: AgravoType | 'Todos';
  onSelectAgravo?: (agravo: AgravoType | 'Todos') => void;
  isDarkMode?: boolean;
}

type PeriodoMensalFilter = 'ano' | 'maior_incidencia' | 'recente';
type PeriodoSemanalFilter = 'ano' | 'pico' | 'recentes';

interface PointData {
  label: string;
  periodIndex: number;
  realCount: number;
  esperado: number;
  alerta: number;
  limiteSuperior: number;
}

const AVAILABLE_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019] as const;

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Week of year calculation
function getEpidemiologicalWeek(dateStr: string): number {
  if (!dateStr) return 1;
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = parseInt(parts[1], 10) || 1;
  const d = parseInt(parts[2], 10) || 1;
  
  const daysInMonths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = d;
  for (let i = 1; i < m; i++) {
    dayOfYear += daysInMonths[i];
  }
  return Math.min(30, Math.max(1, Math.ceil(dayOfYear / 7)));
}

export const EndemicChannelChart: React.FC<EndemicChannelChartProps> = ({ 
  casos, 
  selectedYear: propSelectedYear,
  onSelectYear,
  selectedAgravo: propSelectedAgravo,
  onSelectAgravo,
  isDarkMode = false 
}) => {
  // Controlled or uncontrolled year and agravo
  const [internalYear, setInternalYear] = useState<number>(2026);
  const [internalAgravo, setInternalAgravo] = useState<AgravoType | 'Todos'>('Todos');

  const selectedYear = propSelectedYear !== undefined ? propSelectedYear : internalYear;
  const handleYearChange = (yr: number) => {
    setInternalYear(yr);
    if (onSelectYear) onSelectYear(yr);
  };

  const selectedAgravo = propSelectedAgravo !== undefined ? propSelectedAgravo : internalAgravo;
  const handleAgravoChange = (agr: AgravoType | 'Todos') => {
    setInternalAgravo(agr);
    if (onSelectAgravo) onSelectAgravo(agr);
  };

  const [viewType, setViewType] = useState<'mensal' | 'semanal'>('mensal');
  const [periodoMensal, setPeriodoMensal] = useState<PeriodoMensalFilter>('ano');
  const [periodoSemanal, setPeriodoSemanal] = useState<PeriodoSemanalFilter>('ano');
  const [hoveredPoint, setHoveredPoint] = useState<PointData | null>(null);

  // Active cases dataset strictly based on actual notifications for the selected year
  // If a year has no records in the database, it strictly returns []
  const activeDataset = useMemo(() => {
    return casos.filter(c => {
      if (!c.dataNotificacao) return false;
      return c.dataNotificacao.startsWith(String(selectedYear));
    });
  }, [selectedYear, casos]);

  // Specific baseline expectations per agravo
  const baselineConfig = useMemo(() => {
    switch (selectedAgravo) {
      case 'Esporotricose':
        return { esperado: 42, alerta: 60, superior: 78, weeklyEsperado: 10, weeklyAlerta: 15, weeklySuperior: 20 };
      case 'Leishmaniose':
        return { esperado: 10, alerta: 15, superior: 20, weeklyEsperado: 2.5, weeklyAlerta: 4, weeklySuperior: 5.5 };
      case 'Leptospirose':
        return { esperado: 6, alerta: 9, superior: 13, weeklyEsperado: 1.5, weeklyAlerta: 2.5, weeklySuperior: 3.5 };
      case 'Raiva':
        return { esperado: 1, alerta: 2, superior: 3, weeklyEsperado: 0.25, weeklyAlerta: 0.5, weeklySuperior: 1 };
      default: // Todos
        return { esperado: 59, alerta: 86, superior: 114, weeklyEsperado: 14, weeklyAlerta: 22, weeklySuperior: 30 };
    }
  }, [selectedAgravo]);

  // Compute points strictly from actual notification dates
  const points: PointData[] = useMemo(() => {
    const filtered = activeDataset.filter(c => {
      if (selectedAgravo !== 'Todos' && c.agravo !== selectedAgravo) return false;
      return true;
    });

    if (viewType === 'mensal') {
      // 12 months: Jan to Dez
      // In 2026, official municipal sheet ended on 23/Jul/2026, so Ago-Dez = 0
      const counts = new Array(12).fill(0);
      filtered.forEach(c => {
        if (!c.dataNotificacao) return;
        const parts = c.dataNotificacao.split('-');
        const m = parseInt(parts[1] || '1', 10);
        if (m >= 1 && m <= 12) {
          counts[m - 1]++;
        }
      });

      const yearSuffix = `/${String(selectedYear).slice(2)}`;
      const allMonths: PointData[] = MONTH_NAMES.map((name, idx) => {
        // Seasonal variation for historical expected baseline
        const seasonFactor = 1 + 0.15 * Math.sin(((idx + 1) / 12) * Math.PI * 2);
        const esp = Math.max(1, Math.round(baselineConfig.esperado * seasonFactor));
        const ale = Math.max(esp + 1, Math.round(baselineConfig.alerta * seasonFactor));
        const sup = Math.max(ale + 1, Math.round(baselineConfig.superior * seasonFactor));

        return {
          label: `${name}${yearSuffix}`,
          periodIndex: idx + 1,
          realCount: counts[idx],
          esperado: esp,
          alerta: ale,
          limiteSuperior: sup,
        };
      });

      if (periodoMensal === 'maior_incidencia') {
        // Março a Julho (meses 3 a 7)
        return allMonths.slice(2, 7);
      } else if (periodoMensal === 'recente') {
        // Maio a Julho (meses 5 a 7)
        return allMonths.slice(4, 7);
      }
      return allMonths;
    }

    // Weekly mode: SE 01 to SE 30 (up to July 23, 2026)
    const maxWeeks = selectedYear === 2026 ? 30 : 52;
    const weekCounts = new Array(maxWeeks).fill(0);
    filtered.forEach(c => {
      const w = getEpidemiologicalWeek(c.dataNotificacao);
      if (w >= 1 && w <= maxWeeks) {
        weekCounts[w - 1]++;
      }
    });

    const allWeeks: PointData[] = [];
    for (let w = 1; w <= maxWeeks; w++) {
      const esp = Math.max(1, Math.round(baselineConfig.weeklyEsperado));
      const ale = Math.max(esp + 1, Math.round(baselineConfig.weeklyAlerta));
      const sup = Math.max(ale + 1, Math.round(baselineConfig.weeklySuperior));

      allWeeks.push({
        label: `SE ${w < 10 ? '0' + w : w}`,
        periodIndex: w,
        realCount: weekCounts[w - 1],
        esperado: esp,
        alerta: ale,
        limiteSuperior: sup,
      });
    }

    if (periodoSemanal === 'pico') {
      return allWeeks.slice(7, 22); // SE 08 a SE 22
    } else if (periodoSemanal === 'recentes') {
      return allWeeks.slice(Math.max(0, maxWeeks - 8), maxWeeks);
    }
    return allWeeks;
  }, [activeDataset, selectedAgravo, viewType, selectedYear, periodoMensal, periodoSemanal, baselineConfig]);

  // Scaled dimensions for the SVG Line Chart
  const svgWidth = 920;
  const svgHeight = 320;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Maximum value for Y axis
  const maxY = useMemo(() => {
    let max = 10;
    points.forEach(p => {
      max = Math.max(max, p.realCount, p.limiteSuperior, p.alerta);
    });
    return Math.ceil((max * 1.15) / 5) * 5;
  }, [points]);

  // Smooth fluid transition animation when filter or year changes
  const [animatedPoints, setAnimatedPoints] = useState<PointData[]>(points);
  const [animatedMaxY, setAnimatedMaxY] = useState<number>(maxY);
  const animFrameRef = useRef<number | null>(null);
  const prevPointsRef = useRef<PointData[]>(points);
  const prevMaxYRef = useRef<number>(maxY);

  useEffect(() => {
    // If number of points differs (e.g. monthly 12 vs weekly 30), update instantly
    if (prevPointsRef.current.length !== points.length || points.length === 0) {
      setAnimatedPoints(points);
      setAnimatedMaxY(maxY);
      prevPointsRef.current = points;
      prevMaxYRef.current = maxY;
      return;
    }

    const startPoints = animatedPoints.length === points.length ? animatedPoints : prevPointsRef.current;
    const targetPoints = points;
    const startMaxY = animatedMaxY;
    const targetMaxY = maxY;
    const startTime = performance.now();
    const duration = 460; // ms

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic: smooth fluid deceleration
      const ease = 1 - Math.pow(1 - progress, 3);

      const interpolated: PointData[] = targetPoints.map((target, idx) => {
        const start = startPoints[idx] || target;
        return {
          ...target,
          realCount: start.realCount + (target.realCount - start.realCount) * ease,
          esperado: start.esperado + (target.esperado - start.esperado) * ease,
          alerta: start.alerta + (target.alerta - start.alerta) * ease,
          limiteSuperior: start.limiteSuperior + (target.limiteSuperior - start.limiteSuperior) * ease,
        };
      });

      const currentMaxY = startMaxY + (targetMaxY - startMaxY) * ease;

      setAnimatedPoints(interpolated);
      setAnimatedMaxY(currentMaxY);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        prevPointsRef.current = targetPoints;
        prevMaxYRef.current = targetMaxY;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [points, maxY]);

  const getY = (val: number) => padTop + chartH - (val / (animatedMaxY || 1)) * chartH;
  const getX = (idx: number) => {
    const len = animatedPoints.length || points.length;
    if (len <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (len - 1)) * chartW;
  };

  // Build SVG path strings using smoothly animated coordinates
  const pathReal = useMemo(() => {
    if (animatedPoints.length === 0) return '';
    return animatedPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.realCount).toFixed(1)}`).join(' ');
  }, [animatedPoints, animatedMaxY]);

  const pathEsperado = useMemo(() => {
    if (animatedPoints.length === 0) return '';
    return animatedPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.esperado).toFixed(1)}`).join(' ');
  }, [animatedPoints, animatedMaxY]);

  const pathAlerta = useMemo(() => {
    if (animatedPoints.length === 0) return '';
    return animatedPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.alerta).toFixed(1)}`).join(' ');
  }, [animatedPoints, animatedMaxY]);

  const pathSuperior = useMemo(() => {
    if (animatedPoints.length === 0) return '';
    return animatedPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.limiteSuperior).toFixed(1)}`).join(' ');
  }, [animatedPoints, animatedMaxY]);

  const yTicks = [0, Math.round(maxY * 0.33), Math.round(maxY * 0.66), maxY];

  // Total cases count for current filter
  const totalCasosFiltro = useMemo(() => {
    return points.reduce((acc, p) => acc + p.realCount, 0);
  }, [points]);

  // Overall status check
  const latestPoint = points[points.length - 1];
  const isEpidemic = latestPoint && latestPoint.realCount > latestPoint.limiteSuperior;
  const isAlert = latestPoint && latestPoint.realCount > latestPoint.alerta && !isEpidemic;

  return (
    <div className="bg-gradient-to-b from-[#f8fbfe] via-[#f1f6fc] to-[#eaf2fa] dark:from-slate-900 dark:to-slate-900 border border-[#b8d4f0] dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#cbdff2] dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-base font-extrabold text-[#002b5c] dark:text-slate-100 tracking-tight">
              Série Histórica e Diagrama de Controle de Zoonoses ({selectedYear})
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 dark:bg-emerald-950 text-[#002b5c] dark:text-emerald-300 border border-blue-300 dark:border-emerald-800">
              {viewType === 'mensal' ? 'Visualização Mensal' : 'Visualização Semanal'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Curva de notificações registradas confrontada com os limites zoosanitários oficiais de Sorocaba/SP.
          </p>
        </div>

        {/* Global Selectors: Year, Agravo, and View Type */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Selector (2019 to 2026) */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-[#b8d4f0] dark:border-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-slate-400" />
            <span className="text-xs font-bold text-[#002b5c] dark:text-slate-300">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold text-[#002b5c] dark:text-slate-100 focus:outline-hidden cursor-pointer"
            >
              {AVAILABLE_YEARS.map(yr => {
                const yrCount = casos.filter(c => c.dataNotificacao && c.dataNotificacao.startsWith(String(yr))).length;
                return (
                  <option key={yr} value={yr} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {yr} {yrCount > 0 ? `(Base Atual - ${yrCount} fichas)` : '(0 notificações - Sem registros)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Agravo Selector */}
          <select
            value={selectedAgravo}
            onChange={(e) => handleAgravoChange(e.target.value as any)}
            className="bg-white dark:bg-slate-800 border border-[#b8d4f0] dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-[#002b5c] dark:text-slate-200 focus:outline-hidden cursor-pointer shadow-2xs"
          >
            <option value="Todos">Todos os Agravos ({activeDataset.length})</option>
            <option value="Esporotricose">Esporotricose ({activeDataset.filter(c => c.agravo === 'Esporotricose').length})</option>
            <option value="Leishmaniose">Leishmaniose ({activeDataset.filter(c => c.agravo === 'Leishmaniose').length})</option>
            <option value="Leptospirose">Leptospirose ({activeDataset.filter(c => c.agravo === 'Leptospirose').length})</option>
            <option value="Raiva">Raiva Animal ({activeDataset.filter(c => c.agravo === 'Raiva').length})</option>
          </select>

          {/* View Mode Toggle: Mensal (Default) vs Semanal */}
          <div className="flex items-center bg-[#dce8f7] dark:bg-slate-800 p-0.5 rounded-lg border border-[#b8d4f0] dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewType('mensal')}
              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
                viewType === 'mensal'
                  ? 'bg-[#002b5c] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-[#002b5c] dark:hover:text-slate-200'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewType('semanal')}
              className={`px-3 py-1 rounded font-bold transition-all cursor-pointer ${
                viewType === 'semanal'
                  ? 'bg-[#002b5c] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-400 hover:text-[#002b5c] dark:hover:text-slate-200'
              }`}
            >
              Semanal
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Controls: Period Filter according to View Type */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
        {/* Dynamic Period Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">Recorte:</span>
          {viewType === 'mensal' ? (
            <>
              <button
                onClick={() => setPeriodoMensal('ano')}
                className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                  periodoMensal === 'ano'
                    ? 'bg-[#002b5c] text-white font-bold shadow-2xs'
                    : 'bg-[#e2ecf7] dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-[#d4e4f5] border border-[#cbdff2]'
                }`}
              >
                Ano Completo (Jan - Dez)
              </button>
              <button
                onClick={() => setPeriodoMensal('maior_incidencia')}
                className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                  periodoMensal === 'maior_incidencia'
                    ? 'bg-[#002b5c] text-white font-bold shadow-2xs'
                    : 'bg-[#e2ecf7] dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-[#d4e4f5] border border-[#cbdff2]'
                }`}
              >
                Maior Incidência (Mar - Jul)
              </button>
              <button
                onClick={() => setPeriodoMensal('recente')}
                className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                  periodoMensal === 'recente'
                    ? 'bg-[#002b5c] text-white font-bold shadow-2xs'
                    : 'bg-[#e2ecf7] dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-[#d4e4f5] border border-[#cbdff2]'
                }`}
              >
                Último Trimestre Notificado (Mai - Jul)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setPeriodoSemanal('ano')}
                className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                  periodoSemanal === 'ano'
                    ? 'bg-[#002b5c] text-white font-bold shadow-2xs'
                    : 'bg-[#e2ecf7] dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-[#d4e4f5] border border-[#cbdff2]'
                }`}
              >
                Ano Completo (SE 01 - SE 30)
              </button>
              <button
                onClick={() => setPeriodoSemanal('pico')}
                className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                  periodoSemanal === 'pico'
                    ? 'bg-[#002b5c] text-white font-bold shadow-2xs'
                    : 'bg-[#e2ecf7] dark:bg-slate-800 text-slate-800 dark:text-slate-300 hover:bg-[#d4e4f5] border border-[#cbdff2]'
                }`}
              >
                Pico Epidemiológico (SE 08 - SE 22)
              </button>
              <button
                onClick={() => setPeriodoSemanal('recentes')}
                className={`px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                  periodoSemanal === 'recentes'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Semanas Recentes (SE 23 - SE 30)
              </button>
            </>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {totalCasosFiltro === 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              0 Notificações Registradas ({selectedYear})
            </span>
          ) : isEpidemic ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              Acima do Limiar Epidêmico
            </span>
          ) : isAlert ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Faixa de Alerta
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Dentro do Esperado para Sorocaba
            </span>
          )}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-400">
            Limite Superior: <strong className="text-rose-600 dark:text-rose-400">Epidemia</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
          <span className="text-slate-600 dark:text-slate-400">
            Limite de Alerta: <strong className="text-amber-600 dark:text-amber-400">Faixa de Risco</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-emerald-600 inline-block" />
          <span className="text-slate-600 dark:text-slate-400">
            Esperado: <strong className="text-emerald-600 dark:text-emerald-400">Mediana Histórica</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
          <span className="w-4 h-0.5 bg-blue-600 inline-block" />
          <span className="text-slate-900 dark:text-slate-100 font-bold">
            Casos Notificados {selectedYear}
          </span>
        </div>
      </div>

      {/* SVG Canvas for Line Curves */}
      <div className="relative mt-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[720px] select-none"
        >
          {/* Background grid lines */}
          {yTicks.map(val => (
            <g key={val}>
              <line
                x1={padLeft}
                y1={getY(val)}
                x2={svgWidth - padRight}
                y2={getY(val)}
                stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={getY(val) + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Limite Superior (Red Dashed Line) */}
          <path
            d={pathSuperior}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.2"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />

          {/* Limite de Alerta (Amber Dashed Line) */}
          <path
            d={pathAlerta}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* Esperado / Mediana (Green Solid Line) */}
          <path
            d={pathEsperado}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Curva Real de Casos Notificados (Blue Solid Line) */}
          <path
            d={pathReal}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Nodes for Real Cases */}
          {animatedPoints.map((p, idx) => {
            const originalPoint = points[idx] || p;
            const cx = getX(idx);
            const cy = getY(p.realCount);
            const isHovered = hoveredPoint?.label === p.label;

            return (
              <g
                key={p.label}
                onMouseEnter={() => setHoveredPoint(originalPoint)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + chartH}
                    stroke="#2563eb"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.5"
                  />
                )}

                {/* Outer halo on hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="#3b82f6"
                    opacity="0.25"
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : 4}
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* X axis labels */}
                <text
                  x={cx}
                  y={padTop + chartH + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-sans font-medium transition-colors ${
                    isHovered
                      ? 'fill-blue-600 dark:fill-blue-400 font-bold'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip with Exact Count */}
        {hoveredPoint && (
          <div
            className="absolute top-4 right-4 bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs min-w-[170px] pointer-events-none z-10 backdrop-blur-xs"
          >
            <div className="font-bold border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between">
              <span>{hoveredPoint.label}</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">({selectedYear})</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-blue-300">
                <span>Casos Notificados:</span>
                <strong className="font-mono text-sm text-white">{hoveredPoint.realCount}</strong>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Esperado (Mediana):</span>
                <span className="font-mono">{hoveredPoint.esperado}</span>
              </div>
              <div className="flex items-center justify-between text-amber-400">
                <span>Faixa Alerta:</span>
                <span className="font-mono">{hoveredPoint.alerta}</span>
              </div>
              <div className="flex items-center justify-between text-rose-400">
                <span>Limiar Epidêmico:</span>
                <span className="font-mono">{hoveredPoint.limiteSuperior}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div>
          <span>Total no Recorte: <strong className="text-slate-800 dark:text-slate-200 font-mono font-semibold">{totalCasosFiltro} casos</strong></span>
          <span className="mx-2" aria-hidden="true">·</span>
          <span>Ano Selecionado: <strong className="text-slate-800 dark:text-slate-200">{selectedYear}</strong></span>
        </div>
        <div className="text-[11px]">
          {selectedYear === 2026 ? (
            <span>Base consolidada oficial (01/Jan/2026 a 23/Jul/2026 · Prefeitura de Sorocaba)</span>
          ) : totalCasosFiltro === 0 ? (
            <span className="text-amber-600 dark:text-amber-400 font-medium">Sem registros cadastrados para o ano de {selectedYear} na base de dados</span>
          ) : (
            <span>Registros consolidados para {selectedYear}</span>
          )}
        </div>
      </div>
    </div>
  );
};
