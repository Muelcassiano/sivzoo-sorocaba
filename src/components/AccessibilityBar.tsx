import React from 'react';
import { Sun, Moon, Eye, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface AccessibilityBarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  onChangeFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  onResetAccessibility: () => void;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  isDarkMode,
  onToggleDarkMode,
  fontSize,
  onChangeFontSize,
  isHighContrast,
  onToggleHighContrast,
  onResetAccessibility,
}) => {
  return (
    <aside 
      className="bg-[#00224a] dark:bg-[#001a38] border-b border-[#001733] dark:border-slate-800 text-blue-50 text-xs py-1 px-4"
      aria-label="Barra de Acessibilidade do Governo Municipal"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Skip Link for screen readers */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-emerald-700 focus:text-white rounded text-xs"
        >
          Ir para o conteúdo principal (Alt + 1)
        </a>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline font-medium text-[11px] text-blue-200">
            Acessibilidade e-MAG / WCAG:
          </span>

          {/* Font Size controls */}
          <div className="flex items-center gap-0.5 border border-white/25 rounded bg-white/10 px-1 py-0.5" role="group" aria-label="Ajuste do tamanho da fonte">
            <button
              onClick={() => onChangeFontSize('normal')}
              className={`px-1.5 py-0.5 text-[11px] font-bold rounded cursor-pointer ${fontSize === 'normal' ? 'bg-white text-[#00224a]' : 'text-blue-100 hover:bg-white/15'}`}
              title="Tamanho padrão de texto"
              aria-label="Tamanho de texto normal"
            >
              A
            </button>
            <button
              onClick={() => onChangeFontSize('large')}
              className={`px-1.5 py-0.5 text-xs font-bold rounded cursor-pointer ${fontSize === 'large' ? 'bg-white text-[#00224a]' : 'text-blue-100 hover:bg-white/15'}`}
              title="Aumentar texto (+15%)"
              aria-label="Aumentar texto"
            >
              A+
            </button>
            <button
              onClick={() => onChangeFontSize('xlarge')}
              className={`px-1.5 py-0.5 text-sm font-bold rounded cursor-pointer ${fontSize === 'xlarge' ? 'bg-white text-[#00224a]' : 'text-blue-100 hover:bg-white/15'}`}
              title="Aumentar texto máximo (+30%)"
              aria-label="Texto muito grande"
            >
              A++
            </button>
          </div>

          {/* High Contrast Mode */}
          <button
            onClick={onToggleHighContrast}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors cursor-pointer ${
              isHighContrast
                ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold'
                : 'bg-white/10 border-white/25 text-blue-50 hover:bg-white/20'
            }`}
            title="Alternar modo de alto contraste para baixa visão"
            aria-pressed={isHighContrast}
          >
            <Eye className="w-3 h-3" />
            <span>Alto Contraste</span>
          </button>
        </div>

        {/* Right side: Light/Dark and Reset */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDarkMode}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/25 bg-white/10 text-blue-50 hover:bg-white/20 text-[11px] font-medium cursor-pointer transition-colors"
            title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            aria-label={isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-100" />
                <span>Modo Escuro</span>
              </>
            )}
          </button>

          {(fontSize !== 'normal' || isHighContrast) && (
            <button
              onClick={onResetAccessibility}
              className="inline-flex items-center gap-1 text-[11px] text-blue-200 hover:text-white cursor-pointer"
              title="Restaurar padrões de visualização"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
