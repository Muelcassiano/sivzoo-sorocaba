import React, { useState } from 'react';
import { CasoZoonoses } from '../types/zoonoses';
import { 
  ShieldAlert, 
  Users, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  ArrowRight,
  Printer,
  FileSpreadsheet
} from 'lucide-react';

interface AlertasVeViewProps {
  casos: CasoZoonoses[];
  onSelectCaso: (caso: CasoZoonoses) => void;
  onUpdateCaso: (caso: CasoZoonoses) => void;
}

export const AlertasVeView: React.FC<AlertasVeViewProps> = ({
  casos,
  onSelectCaso,
  onUpdateCaso,
}) => {
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendentes' | 'notificados'>('todos');

  // Filter cases with human lesions or bites/accidents
  const humanCases = casos.filter(c => c.pessoasComLesoes === 'Sim');
  
  const displayedCases = humanCases.filter(c => {
    if (filterStatus === 'pendentes') return !c.notificadoVE;
    if (filterStatus === 'notificados') return !!c.notificadoVE;
    return true;
  });

  const handleNotifyVE = (caso: CasoZoonoses) => {
    const updated: CasoZoonoses = {
      ...caso,
      notificadoVE: true,
      dataNotificacaoVE: new Date().toISOString().split('T')[0],
      observacoesTecnicas: (caso.observacoesTecnicas ? caso.observacoesTecnicas + '\n' : '') +
        `[${new Date().toLocaleDateString('pt-BR')}] Notificação oficial de transmissão humana encaminhada à Vigilância Epidemiológica Municipal e UBS de abrangência.`
    };
    onUpdateCaso(updated);
  };

  const handlePrintGuia = (caso: CasoZoonoses) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 rounded-lg shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950 dark:text-rose-200">
                Protocolo Especial de Vigilância Epidemiológica: Casos Humanos Notificados
              </h2>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 max-w-3xl leading-relaxed">
                Fichas de notificação zoosanitária em que os médicos veterinários ou técnicos relataram tutores, familiares ou contactantes com lesões de pele suspeitas (Esporotricose Humana) ou mordeduras de risco (Raiva). Exige encaminhamento imediato à UBS de referência do munícipe.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-rose-900 dark:text-rose-200 tabular-nums">
              {humanCases.length}
            </span>
            <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">
              fichas com<br/>alerta ativo
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium">
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterStatus === 'todos'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todos ({humanCases.length})
          </button>
          <button
            onClick={() => setFilterStatus('pendentes')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterStatus === 'pendentes'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Aguardando Envio à VE ({humanCases.filter(c => !c.notificadoVE).length})
          </button>
          <button
            onClick={() => setFilterStatus('notificados')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              filterStatus === 'notificados'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Já Notificados ({humanCases.filter(c => !!c.notificadoVE).length})
          </button>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando {displayedCases.length} de {humanCases.length} fichas prioritárias
        </span>
      </div>

      {/* Grid of Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCases.map(caso => {
          const isNotified = !!caso.notificadoVE;

          return (
            <div
              key={caso.id}
              className={`border rounded-xl p-4 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
                isNotified
                  ? 'border-emerald-300 dark:border-emerald-900/60 bg-gradient-to-br from-[#f2fbf5] via-[#e8f7ee] to-[#ddf4e6] dark:bg-slate-900'
                  : 'border-rose-400 dark:border-rose-900/80 bg-gradient-to-br from-[#fff0f3] via-[#ffe5e9] to-[#fed8de] dark:bg-rose-950/30'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {caso.id}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                      {caso.agravo}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isNotified
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                  }`}>
                    {isNotified ? 'VE Acionada' : 'Aguardando VE'}
                  </span>
                </div>

                {/* Body Details */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">TUTOR / MUNÍCIPE COM LESÃO</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {caso.tutorNome}
                    </span>
                    {caso.tutorTelefone && (
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px] mt-0.5">
                        📞 {caso.tutorTelefone}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">TERRITÓRIO / ENDEREÇO</span>
                    <div className="flex items-start gap-1 text-slate-700 dark:text-slate-300 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{caso.tutorBairro || 'Sorocaba'} - {caso.tutorEndereco || 'Endereço registrado'} {caso.tutorNumero || ''}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">ANIMAL FONTE DA TRANSMISSÃO</span>
                    <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                      {caso.animalNome} ({caso.especie}) · Resultado: <strong>{caso.resultadoFinal}</strong>
                    </span>
                  </div>

                  {caso.detalhesCasoHumano && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                      <strong>Descrição do Médico:</strong> {caso.detalhesCasoHumano}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectCaso(caso)}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir Ficha</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5">
                  {!isNotified ? (
                    <button
                      onClick={() => handleNotifyVE(caso)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded transition-colors cursor-pointer shadow-xs"
                      title="Registrar encaminhamento à Vigilância Epidemiológica"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Notificar VE</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePrintGuia(caso)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
                      title="Imprimir Guia de Encaminhamento para UBS"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Guia UBS</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
