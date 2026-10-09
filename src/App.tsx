/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { CasoZoonoses, AgravoType, FiltrosCasos } from './types/zoonoses';
import { getCasos, updateCaso, resetarCasos, saveCasos } from './services/storage';
import { Navbar } from './components/Navbar';
import { AccessibilityBar } from './components/AccessibilityBar';
import { DashboardStats } from './components/DashboardStats';
import { CaseTable } from './components/CaseTable';
import { CaseInvestigationModal } from './components/CaseInvestigationModal';
import { EpidemiologicalMap } from './components/EpidemiologicalMap';
import { AlertasVeView } from './components/AlertasVeView';
import { LimeSurveyFileDecoder } from './components/LimeSurveyFileDecoder';
import { LimeSurveyIntegrationGuide } from './components/LimeSurveyIntegrationGuide';
import { RedCapExportModal } from './components/RedCapExportModal';
import { NewNotificationModal } from './components/NewNotificationModal';
import { ImportCsvModal } from './components/ImportCsvModal';
import { ShieldAlert, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const [casos, setCasos] = useState<CasoZoonoses[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCaso, setSelectedCaso] = useState<CasoZoonoses | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [showRedCapModal, setShowRedCapModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Accessibility & Theme States
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sivz_theme') === 'dark';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  const [filtros, setFiltros] = useState<FiltrosCasos>({
    agravo: 'Todos',
    status: 'Todos',
    resultado: 'Todos',
    bairro: 'Todos',
    clinica: 'Todos',
    apenasComLesaoHumana: false,
    apenasPendentes: false,
    buscaTexto: '',
  });

  // Dashboard synchronized year and agravo filters
  const [dashboardYear, setDashboardYear] = useState<number>(2026);
  const [dashboardAgravo, setDashboardAgravo] = useState<AgravoType | 'Todos'>('Todos');

  const handleDashboardAgravoChange = (agravo: AgravoType | 'Todos') => {
    setDashboardAgravo(agravo);
    setFiltros(prev => ({ ...prev, agravo }));
  };

  const handleDashboardYearChange = (year: number) => {
    setDashboardYear(year);
  };

  // Filtered dataset for the dashboard operational table (synchronized with year & agravo)
  const casosDashboardTabela = useMemo(() => {
    return casos.filter(c => {
      if (!c.dataNotificacao || !c.dataNotificacao.startsWith(String(dashboardYear))) {
        return false;
      }
      if (dashboardAgravo !== 'Todos' && c.agravo !== dashboardAgravo) {
        return false;
      }
      return true;
    });
  }, [casos, dashboardYear, dashboardAgravo]);

  // Sync Dark Mode to <html> tag
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sivz_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sivz_theme', 'light');
    }
  }, [isDarkMode]);

  // Sync Font Scaling to <html> root element so all rem units & text scale noticeably
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-normal', 'font-large', 'font-xlarge');
    if (fontSize === 'normal') {
      root.classList.add('font-normal');
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.classList.add('font-large');
      root.style.fontSize = '17.5px';
    } else if (fontSize === 'xlarge') {
      root.classList.add('font-xlarge');
      root.style.fontSize = '21px';
    }
  }, [fontSize]);

  // Load initial data on mount
  useEffect(() => {
    const loaded = getCasos();
    setCasos(loaded);
  }, []);

  const handleSaveCaso = (casoAtualizado: CasoZoonoses) => {
    const updated = updateCaso(casoAtualizado);
    setCasos([...updated]);
    setSelectedCaso(casoAtualizado);
  };

  const handleAddNewCaso = (novoCaso: CasoZoonoses) => {
    const updated = updateCaso(novoCaso);
    setCasos([...updated]);
    setActiveTab('investigacoes');
  };

  const handleImportNovosCasos = (novosCasos: CasoZoonoses[]) => {
    const map = new Map<string, CasoZoonoses>();
    casos.forEach(c => map.set(c.id, c));
    novosCasos.forEach(c => map.set(c.id, c));
    const merged = Array.from(map.values());
    saveCasos(merged);
    setCasos(merged);
    setActiveTab('investigacoes');
  };

  const handleResetData = () => {
    if (confirm('Deseja restaurar a base oficial completa de 2026 com todas as 582 fichas reais de Sorocaba?')) {
      const reset = resetarCasos();
      setCasos([...reset]);
    }
  };

  // Quick navigation handlers from stats cards
  const handleSelectAgravo = (agravo: AgravoType) => {
    setFiltros(prev => ({ ...prev, agravo }));
    setActiveTab('investigacoes');
  };

  const handleFilterHumanLesions = () => {
    setActiveTab('alertas-ve');
  };

  const handleFilterPending = () => {
    setFiltros(prev => ({ ...prev, status: 'Em Investigação', agravo: 'Todos' }));
    setActiveTab('investigacoes');
  };

  const handleFilterActiveTreatment = () => {
    setFiltros(prev => ({ ...prev, status: 'Em Tratamento', agravo: 'Todos' }));
    setActiveTab('investigacoes');
  };

  const handleSelectBairro = (bairro: string) => {
    setFiltros(prev => ({ ...prev, bairro, agravo: 'Todos', status: 'Todos' }));
    setActiveTab('investigacoes');
  };

  const totalHumanAlerts = casos.filter(c => c.pessoasComLesoes === 'Sim').length;

  const getFontSizeClass = () => {
    if (fontSize === 'large') return 'text-[15px]';
    if (fontSize === 'xlarge') return 'text-[17px]';
    return 'text-sm';
  };

  return (
    <div className={`min-h-screen bg-[#edf3f8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors ${getFontSizeClass()} ${isHighContrast ? 'contrast-125' : ''}`}>
      {/* Acessibilidade Municipal (e-MAG / WCAG) */}
      <AccessibilityBar
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        onResetAccessibility={() => {
          setFontSize('normal');
          setIsHighContrast(false);
        }}
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewNotification={() => setShowNewModal(true)}
        onExportRedCap={() => setShowRedCapModal(true)}
        onImportCsv={() => setShowImportModal(true)}
        totalAlertsCount={casos.length}
        totalHumanLesionsCount={totalHumanAlerts}
      />

      {/* Municipal Context Header */}
      <div className="bg-gradient-to-r from-[#dbeafe] via-[#e9f2fb] to-[#dbeafe] dark:bg-slate-900 border-b border-[#b8d4f0] dark:border-slate-800 py-2.5 px-3 sm:px-6 lg:px-8 transition-colors shadow-2xs">
        <div className="max-w-[1880px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400 flex-wrap">
            <span className="font-extrabold text-[#002b5c] dark:text-blue-300 tracking-tight">Prefeitura de Sorocaba</span>
            <span aria-hidden="true" className="text-blue-300 dark:text-slate-600">·</span>
            <span className="font-semibold text-slate-800 dark:text-slate-300">Secretaria da Saúde</span>
            <span aria-hidden="true" className="text-blue-300 dark:text-slate-600">·</span>
            <span className="font-semibold text-slate-800 dark:text-slate-300">Divisão de Zoonoses</span>
            <span aria-hidden="true" className="text-blue-300 dark:text-slate-600">·</span>
            <span className="text-emerald-900 dark:text-emerald-300 font-bold bg-emerald-100/90 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">Conformidade LGPD (Servidores Municipais)</span>
          </div>

          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-400">
            <span>Base Oficial: <strong className="text-[#002b5c] dark:text-slate-100 font-mono font-bold">{casos.length} fichas notificadas</strong></span>
            <span aria-hidden="true" className="text-blue-300 dark:text-slate-600">·</span>
            <button
              onClick={handleResetData}
              className="text-[#0a4b8f] hover:text-[#002b5c] dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer font-medium transition-colors"
              title="Restaurar base original de 582 fichas de Sorocaba"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restaurar Base</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-[1880px] w-full mx-auto px-2 sm:px-4 lg:px-6 py-6">
        
        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardStats
              casos={casos}
              selectedYear={dashboardYear}
              onSelectYear={handleDashboardYearChange}
              selectedAgravo={dashboardAgravo}
              onSelectAgravo={handleDashboardAgravoChange}
              onFilterHumanLesions={handleFilterHumanLesions}
              onFilterPending={handleFilterPending}
              onFilterActiveTreatment={handleFilterActiveTreatment}
              isDarkMode={isDarkMode}
            />

            <div className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 bg-gradient-to-r from-[#e4effb] via-[#edf5fc] to-[#e4effb] dark:bg-slate-900/90 p-3 rounded-lg border border-[#c4daf0] dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-[#002b5c] dark:text-slate-100">
                    Fila Operacional de Notificações & Acompanhamentos
                  </h2>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-[#002b5c] text-white dark:bg-slate-800 dark:text-slate-200 shadow-2xs">
                    {casosDashboardTabela.length} {casosDashboardTabela.length === 1 ? 'registro' : 'registros'}
                  </span>
                  {(dashboardYear !== 2026 || dashboardAgravo !== 'Todos') && (
                    <span className="text-xs text-blue-900 dark:text-emerald-400 bg-blue-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-blue-300 dark:border-emerald-800 flex items-center gap-1.5 font-medium">
                      <span>Filtro ativo: {dashboardYear !== 2026 ? `Ano ${dashboardYear}` : ''} {dashboardAgravo !== 'Todos' ? `· ${dashboardAgravo}` : ''}</span>
                      <button 
                        onClick={() => {
                          setDashboardYear(2026);
                          setDashboardAgravo('Todos');
                          setFiltros(prev => ({ ...prev, agravo: 'Todos' }));
                        }}
                        className="hover:underline font-bold cursor-pointer ml-0.5"
                        title="Resetar para Ano 2026 / Todos os Agravos"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('investigacoes')}
                  className="text-xs text-[#0a4b8f] dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Abrir tabela completa com filtros avançados</span>
                  <span>&rarr;</span>
                </button>
              </div>

              <CaseTable
                casos={casosDashboardTabela}
                onOpenCase={c => setSelectedCaso(c)}
                filtros={filtros}
                setFiltros={setFiltros}
              />
            </div>
          </div>
        )}

        {/* TAB: INVESTIGAÇÕES (FULL TABLE FOCUS) */}
        {activeTab === 'investigacoes' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Módulo de Investigação Epidemiológica & Acompanhamento Zoosanitário
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Consulte as notificações recebidas do LimeSurvey ({casos.length} fichas), preencha laudos laboratoriais, atualize desfechos e monitore contactantes humanos.
                </p>
              </div>
            </div>

            <CaseTable
              casos={casos}
              onOpenCase={c => setSelectedCaso(c)}
              filtros={filtros}
              setFiltros={setFiltros}
            />
          </div>
        )}

        {/* TAB: MAPA DE FOCOS & UBS */}
        {activeTab === 'mapa' && (
          <div className="space-y-4">
            <EpidemiologicalMap
              casos={casos}
              onSelectBairro={handleSelectBairro}
              onSelectAgravo={handleSelectAgravo}
              onSelectCaso={c => setSelectedCaso(c)}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* TAB: ALERTAS & VE (CASOS HUMANOS) */}
        {activeTab === 'alertas-ve' && (
          <div className="space-y-4">
            <AlertasVeView
              casos={casos}
              onSelectCaso={c => setSelectedCaso(c)}
              onUpdateCaso={handleSaveCaso}
            />
          </div>
        )}

        {/* TAB: DECODER DE ANEXOS (ÁREA TÉCNICA) */}
        {activeTab === 'decoder' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Auditoria e Decodificador de Anexos do LimeSurvey
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Utilitário técnico para extração e decodificação das strings JSON de laudos e fotos anexadas no banco de dados municipal.
              </p>
            </div>

            <LimeSurveyFileDecoder />
          </div>
        )}

        {/* TAB: GUIA DE INTEGRAÇÃO & LGPD (ÁREA TÉCNICA) */}
        {activeTab === 'integracao' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Arquitetura do Sistema, Conexão com LimeSurvey & LGPD
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Diretrizes técnicas e justificativas de conformidade para a Controladoria Municipal e DTI de Sorocaba.
              </p>
            </div>

            <LimeSurveyIntegrationGuide />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 text-xs text-slate-500 dark:text-slate-400 text-center transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SIVZOO Sorocaba · Sistema de Investigação e Vigilância de Zoonoses
          </span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            Prefeitura Municipal de Sorocaba · Secretaria da Saúde · Divisão de Zoonoses
          </span>
        </div>
      </footer>

      {/* Modals */}
      {selectedCaso && (
        <CaseInvestigationModal
          caso={selectedCaso}
          onClose={() => setSelectedCaso(null)}
          onSave={handleSaveCaso}
        />
      )}

      {showNewModal && (
        <NewNotificationModal
          onClose={() => setShowNewModal(false)}
          onSaveNew={handleAddNewCaso}
        />
      )}

      {showRedCapModal && (
        <RedCapExportModal
          casos={casos}
          onClose={() => setShowRedCapModal(false)}
        />
      )}

      {showImportModal && (
        <ImportCsvModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportNovosCasos}
        />
      )}
    </div>
  );
}
