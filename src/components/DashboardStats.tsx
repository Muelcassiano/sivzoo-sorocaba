import React, { useState, useMemo } from 'react';
import { CasoZoonoses, AgravoType } from '../types/zoonoses';
import { 
  AlertTriangle, 
  Users, 
  Activity, 
  ShieldAlert, 
  ArrowUpRight, 
  Calendar, 
  TrendingUp, 
  Flame, 
  FileText,
  CheckCircle2
} from 'lucide-react';

import { EndemicChannelChart } from './EndemicChannelChart';

interface DashboardStatsProps {
  casos: CasoZoonoses[];
  selectedYear?: number;
  onSelectYear?: (year: number) => void;
  selectedAgravo?: AgravoType | 'Todos';
  onSelectAgravo: (agravo: AgravoType | 'Todos') => void;
  onFilterHumanLesions: () => void;
  onFilterPending: () => void;
  onFilterActiveTreatment: () => void;
  isDarkMode?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  casos,
  selectedYear = 2026,
  onSelectYear,
  selectedAgravo = 'Todos',
  onSelectAgravo,
  onFilterHumanLesions,
  onFilterPending,
  onFilterActiveTreatment,
  isDarkMode = false,
}) => {
  // Casos do ano selecionado
  const casosAno = useMemo(() => {
    return casos.filter(c => {
      if (!c.dataNotificacao) return false;
      return c.dataNotificacao.startsWith(String(selectedYear));
    });
  }, [casos, selectedYear]);

  // Casos filtrados por ano E por agravo selecionado
  const casosFiltrados = useMemo(() => {
    return casosAno.filter(c => {
      if (selectedAgravo !== 'Todos' && c.agravo !== selectedAgravo) return false;
      return true;
    });
  }, [casosAno, selectedAgravo]);

  const totalCasos = casosFiltrados.length;
  const positivos = casosFiltrados.filter(c => c.resultadoFinal === 'Positivo' || c.resultadoFinal === 'Positivo CE').length;
  const taxaPositividade = totalCasos > 0 ? Math.round((positivos / totalCasos) * 100) : 0;
  
  const casosHumanos = casosFiltrados.filter(c => c.pessoasComLesoes === 'Sim');
  const casosHumanosSemVE = casosHumanos.filter(c => !c.notificadoVE).length;
  
  const emTratamento = casosFiltrados.filter(c => c.statusInvestigacao === 'Em Tratamento').length;
  const emInvestigacao = casosFiltrados.filter(c => c.statusInvestigacao === 'Em Investigação').length;
  const obitosEutanasia = casosFiltrados.filter(c => c.statusInvestigacao === 'Óbito' || c.statusInvestigacao === 'Eutanásia').length;
  const altas = casosFiltrados.filter(c => c.statusInvestigacao === 'Alta').length;

  const countEspo = casosAno.filter(c => c.agravo === 'Esporotricose').length;
  const countLeish = casosAno.filter(c => c.agravo === 'Leishmaniose').length;
  const countLepto = casosAno.filter(c => c.agravo === 'Leptospirose').length;
  const countRaiva = casosAno.filter(c => c.agravo === 'Raiva').length;

  return (
    <div className="space-y-6">
      {/* Primary KPI Grid (Reflecting the true filtered dataset by year and agravo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Geral */}
        <div className="bg-gradient-to-br from-[#ebf3fb] via-[#e1ecf7] to-[#d4e4f5] dark:from-slate-900 dark:to-slate-900 border border-[#b4cfeb] dark:border-slate-800 p-4 rounded-xl shadow-xs hover:border-[#8bb5df] hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-400 text-xs font-semibold gap-1">
            <span className="truncate">
              Total de Fichas ({selectedYear})
              {selectedAgravo !== 'Todos' && (
                <span className="ml-1 text-blue-900 dark:text-emerald-400 font-bold">· {selectedAgravo}</span>
              )}
            </span>
            <div className="p-1.5 bg-[#0e3b68] dark:bg-emerald-950/80 rounded-md text-white dark:text-emerald-400 shrink-0 shadow-2xs">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#0a274c] dark:text-slate-100 font-mono tabular-nums">
              {totalCasos}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {totalCasos === 1 ? 'registro consolidado' : 'registros consolidados'}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-700 dark:text-slate-400 flex items-center gap-1.5 border-t border-[#c6dcf0] dark:border-slate-800 pt-2 font-medium">
            <span className="font-bold text-[#0c3c69] dark:text-emerald-400">{positivos} confirmados</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-slate-600 dark:text-slate-400">{taxaPositividade}% positividade</span>
          </div>
        </div>

        {/* Card 2: Lesões em Humanos / Alerta VE */}
        <div 
          onClick={onFilterHumanLesions}
          className="bg-gradient-to-br from-[#fff0f2] via-[#ffe3e7] to-[#fed4dc] dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 p-4 rounded-xl hover:border-rose-500 dark:hover:border-rose-700 transition-all cursor-pointer group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between text-rose-900 dark:text-rose-300 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>Lesões em Humanos / Alerta VE</span>
            </span>
            <div className="p-1.5 bg-rose-600 dark:bg-rose-900/80 rounded-md text-white dark:text-rose-300 shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-rose-950 dark:text-rose-100 font-mono tabular-nums">
              {casosHumanos.length}
            </span>
            <span className="text-xs text-rose-800 dark:text-rose-400 font-bold">fichas com alerta</span>
          </div>
          <div className="mt-3 text-[11px] text-rose-800 dark:text-rose-300 flex items-center gap-1.5 border-t border-rose-300 dark:border-rose-800/80 pt-2 font-medium">
            <span className="font-bold">{casosHumanosSemVE} aguardando envio</span>
            <span aria-hidden="true" className="text-rose-400">·</span>
            <span className="group-hover:underline font-bold text-rose-950 dark:text-rose-200">Ver e Acionar VE →</span>
          </div>
        </div>

        {/* Card 3: Em Tratamento Ativo */}
        <div 
          onClick={onFilterActiveTreatment}
          className="bg-gradient-to-br from-[#eef9f3] via-[#e2f5eb] to-[#d4efe1] dark:from-slate-900 dark:to-slate-900 border border-[#a4dbc0] dark:border-slate-800 p-4 rounded-xl hover:border-[#76c99f] dark:hover:border-blue-700 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-emerald-900 dark:text-slate-400 text-xs font-semibold">
            <span>Em Tratamento Ativo</span>
            <div className="p-1.5 bg-emerald-700 dark:bg-blue-950/80 rounded-md text-white dark:text-blue-400 shadow-2xs">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#064e3b] dark:text-blue-200 font-mono tabular-nums">
              {emTratamento}
            </span>
            <span className="text-xs text-emerald-800 dark:text-slate-400 font-medium">animais assistidos</span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-800 dark:text-slate-400 flex items-center gap-1.5 border-t border-[#b7e4ce] dark:border-slate-800 pt-2">
            <span className="font-medium">Itraconazol / Scalibor</span>
            <span aria-hidden="true" className="text-emerald-400">·</span>
            <span className="font-bold text-[#064e3b] dark:text-emerald-400">{altas} altas curadas</span>
          </div>
        </div>

        {/* Card 4: Pendentes de Investigação */}
        <div 
          onClick={onFilterPending}
          className="bg-gradient-to-br from-[#fffdf0] via-[#fef7db] to-[#fcf0c2] dark:from-slate-900 dark:to-slate-900 border border-[#ead58c] dark:border-slate-800 p-4 rounded-xl hover:border-[#dfc059] dark:hover:border-amber-700 transition-all cursor-pointer shadow-xs hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-amber-900 dark:text-slate-400 text-xs font-semibold">
            <span>Em Investigação</span>
            <div className="p-1.5 bg-amber-600 dark:bg-amber-950/80 rounded-md text-white dark:text-amber-400 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#78350f] dark:text-amber-200 font-mono tabular-nums">
              {emInvestigacao}
            </span>
            <span className="text-xs text-amber-800 dark:text-slate-400 font-medium">aguardando biólogo/laudo</span>
          </div>
          <div className="mt-3 text-[11px] text-amber-800 dark:text-slate-400 flex items-center gap-1.5 border-t border-[#e8d28a] dark:border-slate-800 pt-2">
            <span className="font-medium">Coleta / Citologia / ELISA</span>
            <span aria-hidden="true" className="text-amber-400">·</span>
            <span className="font-semibold text-purple-800 dark:text-purple-400">{obitosEutanasia} óbitos/eutanásias</span>
          </div>
        </div>
      </div>

      {/* Diagrama de Controle / Canal Endêmico - Curvas Epidemiológicas */}
      <EndemicChannelChart 
        casos={casos} 
        selectedYear={selectedYear}
        onSelectYear={onSelectYear}
        selectedAgravo={selectedAgravo}
        onSelectAgravo={onSelectAgravo}
        isDarkMode={isDarkMode} 
      />

      {/* Disease Distribution Segmented Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#002b5c] dark:text-slate-100 flex items-center gap-2">
            <span>Distribuição por Agravo no Município de Sorocaba ({selectedYear})</span>
            <span className="font-mono text-xs text-[#002b5c] dark:text-slate-300 bg-[#dce9f7] dark:bg-slate-800 px-2 py-0.5 rounded border border-[#b8d4f0] dark:border-slate-700 font-bold">
              Total: {casosAno.length}
            </span>
          </h2>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {selectedAgravo !== 'Todos' ? (
              <button 
                onClick={() => onSelectAgravo('Todos')}
                className="text-[#002b5c] dark:text-emerald-400 font-bold hover:underline cursor-pointer bg-blue-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded border border-blue-300"
              >
                Limpar filtro ({selectedAgravo}) &times;
              </button>
            ) : (
              <span className="font-medium text-slate-600 dark:text-slate-400">Clique no card para filtrar todo o painel</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Esporotricose */}
          <div 
            onClick={() => onSelectAgravo(selectedAgravo === 'Esporotricose' ? 'Todos' : 'Esporotricose')}
            className={`p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-md group shadow-xs ${
              selectedAgravo === 'Esporotricose'
                ? 'border-2 border-orange-500 ring-2 ring-orange-400/40 bg-gradient-to-br from-[#ffedd5] to-[#fed7aa] dark:bg-orange-950/40'
                : 'border border-orange-300/90 dark:border-slate-800 bg-gradient-to-br from-[#fff7ed] via-[#ffedd5] to-[#fed7aa]/40 dark:bg-slate-900 hover:border-orange-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-950 dark:text-slate-200 group-hover:text-orange-700 dark:group-hover:text-orange-400">
                Esporotricose Animal
              </span>
              <span className="text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 bg-orange-600 dark:bg-orange-950/60 text-white dark:text-orange-300 rounded shadow-2xs">
                {countEspo} {countEspo === 1 ? 'ficha' : 'fichas'}
              </span>
            </div>
            <p className="text-[11px] text-orange-900/80 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Predomínio felino. Lesões ulceradas em face, focinho e patas. Transmissão zoonótica ativa.
            </p>
            <div className="mt-2 text-[10px] text-orange-800/80 dark:text-slate-500 flex items-center gap-1.5 font-medium border-t border-orange-200/80 pt-1.5">
              <span>{casosAno.filter(c => c.agravo === 'Esporotricose' && c.resultadoFinal.startsWith('Pos')).length} confirmados</span>
              <span aria-hidden="true" className="text-orange-400">·</span>
              <span className="text-rose-700 dark:text-rose-400 font-bold">{casosAno.filter(c => c.agravo === 'Esporotricose' && c.pessoasComLesoes === 'Sim').length} c/ lesão humana</span>
            </div>
          </div>

          {/* Leishmaniose */}
          <div 
            onClick={() => onSelectAgravo(selectedAgravo === 'Leishmaniose' ? 'Todos' : 'Leishmaniose')}
            className={`p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-md group shadow-xs ${
              selectedAgravo === 'Leishmaniose'
                ? 'border-2 border-purple-500 ring-2 ring-purple-400/40 bg-gradient-to-br from-[#f3e8ff] to-[#e9d5ff] dark:bg-purple-950/40'
                : 'border border-purple-300/90 dark:border-slate-800 bg-gradient-to-br from-[#faf5ff] via-[#f3e8ff] to-[#e9d5ff]/40 dark:bg-slate-900 hover:border-purple-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-400">
                Leishmaniose Visceral Canina
              </span>
              <span className="text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 bg-purple-700 dark:bg-purple-950/60 text-white dark:text-purple-300 rounded shadow-2xs">
                {countLeish} {countLeish === 1 ? 'ficha' : 'fichas'}
              </span>
            </div>
            <p className="text-[11px] text-purple-900/80 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Vetor Lutzomyia longipalpis. Triagem TR DPP e confirmação ELISA/IAL com inquérito censitário.
            </p>
            <div className="mt-2 text-[10px] text-purple-800/80 dark:text-slate-500 flex items-center gap-1.5 font-medium border-t border-purple-200/80 pt-1.5">
              <span>{casosAno.filter(c => c.agravo === 'Leishmaniose' && c.resultadoFinal === 'Positivo').length} reagentes</span>
              <span aria-hidden="true" className="text-purple-400">·</span>
              <span>Encoleiramento Scalibor</span>
            </div>
          </div>

          {/* Leptospirose */}
          <div 
            onClick={() => onSelectAgravo(selectedAgravo === 'Leptospirose' ? 'Todos' : 'Leptospirose')}
            className={`p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-md group shadow-xs ${
              selectedAgravo === 'Leptospirose'
                ? 'border-2 border-sky-500 ring-2 ring-sky-400/40 bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd] dark:bg-sky-950/40'
                : 'border border-sky-300/90 dark:border-slate-800 bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#bae6fd]/40 dark:bg-slate-900 hover:border-sky-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-950 dark:text-slate-200 group-hover:text-sky-700 dark:group-hover:text-sky-400">
                Leptospirose Animal
              </span>
              <span className="text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 bg-sky-700 dark:bg-sky-950/60 text-white dark:text-sky-300 rounded shadow-2xs">
                {countLepto} {countLepto === 1 ? 'ficha' : 'fichas'}
              </span>
            </div>
            <p className="text-[11px] text-sky-900/80 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Bactéria Leptospira interrogans. Exame MAT com identificação de sorovares de roedores.
            </p>
            <div className="mt-2 text-[10px] text-sky-800/80 dark:text-slate-500 flex items-center gap-1.5 font-medium border-t border-sky-200/80 pt-1.5">
              <span>{casosAno.filter(c => c.agravo === 'Leptospirose' && c.resultadoFinal === 'Positivo').length} reagentes</span>
              <span aria-hidden="true" className="text-sky-400">·</span>
              <span>Desratização focal</span>
            </div>
          </div>

          {/* Raiva */}
          <div 
            onClick={() => onSelectAgravo(selectedAgravo === 'Raiva' ? 'Todos' : 'Raiva')}
            className={`p-3.5 rounded-xl cursor-pointer transition-all hover:shadow-md group shadow-xs ${
              selectedAgravo === 'Raiva'
                ? 'border-2 border-rose-500 ring-2 ring-rose-400/40 bg-gradient-to-br from-[#ffe4e6] to-[#fecdd3] dark:bg-rose-950/40'
                : 'border border-rose-300/90 dark:border-slate-800 bg-gradient-to-br from-[#fff1f2] via-[#ffe4e6] to-[#fecdd3]/40 dark:bg-slate-900 hover:border-rose-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950 dark:text-slate-200 group-hover:text-rose-700 dark:group-hover:text-rose-400">
                Vigilância da Raiva
              </span>
              <span className="text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 bg-rose-700 dark:bg-rose-950/60 text-white dark:text-rose-300 rounded shadow-2xs">
                {countRaiva} {countRaiva === 1 ? 'ficha' : 'fichas'}
              </span>
            </div>
            <p className="text-[11px] text-rose-900/80 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              Coleta de quirópteros caídos e profilaxia de cães/gatos agressores. IFD no IAL.
            </p>
            <div className="mt-2 text-[10px] text-rose-800/80 dark:text-slate-500 flex items-center gap-1.5 font-medium border-t border-rose-200/80 pt-1.5">
              <span>100% Sorocaba</span>
              <span aria-hidden="true" className="text-rose-400">·</span>
              <span>Bloqueio vacinal preventivo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
