import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CasoZoonoses, AgravoType } from '../types/zoonoses';
import { SOROCABA_UBS_LIST, SOROCABA_DEFAULT_GEOJSON } from '../data/sorocabaGeoJson';
import { getCoordinatesForAddress, SOROCABA_CENTER } from '../data/sorocabaBairrosCoords';
import { 
  MapPin, 
  Flame, 
  Layers, 
  Upload, 
  Filter, 
  Crosshair, 
  Info, 
  ShieldCheck, 
  CheckSquare, 
  Square,
  Activity,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface EpidemiologicalMapProps {
  casos: CasoZoonoses[];
  onSelectBairro: (bairro: string) => void;
  onSelectAgravo: (agravo: AgravoType) => void;
  onSelectCaso?: (caso: CasoZoonoses) => void;
  isDarkMode?: boolean;
}

export const EpidemiologicalMap: React.FC<EpidemiologicalMapProps> = ({
  casos,
  onSelectBairro,
  onSelectAgravo,
  onSelectCaso,
  isDarkMode = false,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'matrix'>('map');
  const [selectedColegiado, setSelectedColegiado] = useState<'Todos' | 'Sudoeste' | 'Noroeste' | 'Centro Norte' | 'Centro Sul' | 'Norte' | 'Leste'>('Todos');
  const [filterAgravo, setFilterAgravo] = useState<AgravoType | 'Todos'>('Todos');
  const [onlyConfirmed, setOnlyConfirmed] = useState(false);
  const [onlyHumanContact, setOnlyHumanContact] = useState(false);

  // Fullscreen and Legend Controls
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const [legendPlacement, setLegendPlacement] = useState<'docked' | 'floating'>('docked');

  // Layer Visibility Toggles
  const [showCoveragePolygons, setShowCoveragePolygons] = useState(true);
  const [showUbsPoints, setShowUbsPoints] = useState(true);
  const [showCaseMarkers, setShowCaseMarkers] = useState(true);

  // Custom GeoJSON storage
  const [customGeoJson, setCustomGeoJson] = useState<any | null>(null);
  const [customGeoJsonFileName, setCustomGeoJsonFileName] = useState<string>('');
  const [customGeoJsonError, setCustomGeoJsonError] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    tileLayer?: L.TileLayer;
    coverageLayer?: L.LayerGroup;
    ubsLayer?: L.LayerGroup;
    casesLayer?: L.LayerGroup;
    customGeoJsonLayer?: L.GeoJSON;
  }>({});

  // Filtered cases for the map
  const filteredCasos = useMemo(() => {
    return casos.filter(c => {
      if (filterAgravo !== 'Todos' && c.agravo !== filterAgravo) return false;
      if (onlyConfirmed && !(c.resultadoFinal === 'Positivo' || c.resultadoFinal === 'Positivo CE')) return false;
      if (onlyHumanContact && c.pessoasComLesoes !== 'Sim') return false;
      
      if (selectedColegiado !== 'Todos') {
        const ubsMatch = SOROCABA_UBS_LIST.find(u => 
          u.colegiado === selectedColegiado && 
          u.bairrosAtendidos.some(b => b.toLowerCase().includes((c.tutorBairro || '').toLowerCase()))
        );
        if (!ubsMatch) return false;
      }
      return true;
    });
  }, [casos, filterAgravo, onlyConfirmed, onlyHumanContact, selectedColegiado]);

  // Aggregate breakdown for cartographic legend
  const legendCounts = useMemo(() => {
    const counts = {
      esporotricose: 0,
      leishmaniose: 0,
      leptospirose: 0,
      raiva: 0,
      total: filteredCasos.length,
    };
    filteredCasos.forEach(c => {
      if (c.agravo === 'Esporotricose') counts.esporotricose++;
      else if (c.agravo === 'Leishmaniose') counts.leishmaniose++;
      else if (c.agravo === 'Leptospirose') counts.leptospirose++;
      else if (c.agravo === 'Raiva') counts.raiva++;
    });
    return counts;
  }, [filteredCasos]);

  // Handle ESC key to exit fullscreen smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Invalidate map size whenever fullscreen, view mode or legend layout toggles
  useEffect(() => {
    if (viewMode !== 'map' || !mapInstanceRef.current) return;
    const t1 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 80);
    const t2 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isFullscreen, viewMode, isLegendCollapsed, legendPlacement]);

  // Aggregate stats by neighborhood for matrix view
  const bairroStats = useMemo(() => {
    const map: Record<string, {
      total: number;
      positivos: number;
      casosHumanos: number;
      esporotricose: number;
      leishmaniose: number;
      leptospirose: number;
      raiva: number;
    }> = {};

    casos.forEach(c => {
      const b = (c.tutorBairro || 'Sorocaba (Não Especificado)').trim();
      if (!map[b]) {
        map[b] = {
          total: 0,
          positivos: 0,
          casosHumanos: 0,
          esporotricose: 0,
          leishmaniose: 0,
          leptospirose: 0,
          raiva: 0,
        };
      }
      map[b].total++;
      if (c.resultadoFinal === 'Positivo' || c.resultadoFinal === 'Positivo CE') {
        map[b].positivos++;
      }
      if (c.pessoasComLesoes === 'Sim') {
        map[b].casosHumanos++;
      }
      if (c.agravo === 'Esporotricose') map[b].esporotricose++;
      if (c.agravo === 'Leishmaniose') map[b].leishmaniose++;
      if (c.agravo === 'Leptospirose') map[b].leptospirose++;
      if (c.agravo === 'Raiva') map[b].raiva++;
    });

    const list = Object.entries(map).map(([bairro, stats]) => {
      let nivelRisco: 'Alto' | 'Médio' | 'Baixo' = 'Baixo';
      if (stats.positivos >= 10 || stats.casosHumanos >= 3) nivelRisco = 'Alto';
      else if (stats.positivos >= 3 || stats.casosHumanos >= 1) nivelRisco = 'Médio';

      return {
        bairro,
        ...stats,
        nivelRisco,
      };
    });

    return list.sort((a, b) => b.positivos - a.positivos || b.total - a.total);
  }, [casos]);

  // Initialize Leaflet Map safely without leaks or container errors
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    // Destroy existing instance to prevent "Map container is already initialized"
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: SOROCABA_CENTER,
      zoom: 12,
      zoomControl: false,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    layersRef.current.coverageLayer = L.layerGroup().addTo(map);
    layersRef.current.ubsLayer = L.layerGroup().addTo(map);
    layersRef.current.casesLayer = L.layerGroup().addTo(map);

    // Official OpenStreetMap tiles (100% free, NO API key required)
    const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors · Divisão de Zoonoses Sorocaba';

    layersRef.current.tileLayer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      className: isDarkMode ? 'dark-map-tiles' : '',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate size immediately and after delay to ensure smooth rendering
    map.invalidateSize();
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, isDarkMode]);

  // Render Official UBS Points and Coverage Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || viewMode !== 'map') return;

    const coverageGroup = layersRef.current.coverageLayer;
    const ubsGroup = layersRef.current.ubsLayer;

    if (coverageGroup) coverageGroup.clearLayers();
    if (ubsGroup) ubsGroup.clearLayers();

    // 1. Coverage Polygons
    if (showCoveragePolygons && coverageGroup) {
      SOROCABA_DEFAULT_GEOJSON.features
        .filter((f: any) => f.geometry.type === 'Polygon')
        .forEach((feat: any) => {
          const props = feat.properties;
          if (selectedColegiado !== 'Todos' && props.colegiado !== selectedColegiado) {
            return;
          }

          const coords = feat.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]] as [number, number]);

          const polygon = L.polygon(coords, {
            color: props.stroke || '#0284c7',
            weight: 2,
            opacity: 0.85,
            fillColor: props.fill || '#38bdf8',
            fillOpacity: isDarkMode ? 0.12 : 0.16,
            dashArray: '4, 4',
          });

          polygon.bindTooltip(
            `<div class="text-xs font-sans">
              <strong class="text-slate-900 font-bold">${props.nome}</strong><br/>
              <span class="text-slate-600">Colegiado: ${props.colegiado} | Raio: ~${props.raioKm} km</span><br/>
              <span class="text-slate-500 text-[11px]">Bairros: ${props.bairros}</span>
            </div>`,
            { sticky: true, className: 'leaflet-sorocaba-tooltip' }
          );

          polygon.addTo(coverageGroup);
        });
    }

    // 2. UBS Point Markers
    if (showUbsPoints && ubsGroup) {
      SOROCABA_UBS_LIST.forEach(ubs => {
        if (selectedColegiado !== 'Todos' && ubs.colegiado !== selectedColegiado) {
          return;
        }

        const iconHtml = `
          <div style="
            background: #059669; 
            color: white; 
            border: 2px solid #ffffff; 
            box-shadow: 0 2px 6px rgba(0,0,0,0.35); 
            width: 28px; 
            height: 28px; 
            border-radius: 8px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
          ">
            🏥
          </div>
        `;

        const ubsIcon = L.divIcon({
          className: 'custom-ubs-icon',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = L.marker([ubs.lat, ubs.lng], { icon: ubsIcon });

        const popupContent = `
          <div style="font-family: inherit; min-width: 220px; font-size: 12px; color: #1e293b;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
              <strong style="color: #047857; font-size: 13px;">${ubs.name}</strong>
              <span style="background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">
                ${ubs.colegiado}
              </span>
            </div>
            <p style="margin: 3px 0;"><strong>Endereço:</strong> ${ubs.endereco}</p>
            <p style="margin: 3px 0;"><strong>Telefone:</strong> ${ubs.telefone}</p>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
              <strong>Bairros Cobertos:</strong><br/>
              ${ubs.bairrosAtendidos.join(', ')}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          autoPan: true,
          autoPanPadding: [50, 50],
          maxWidth: 320,
        });
        marker.addTo(ubsGroup);
      });
    }
  }, [viewMode, showCoveragePolygons, showUbsPoints, selectedColegiado, isDarkMode]);

  // Render Case Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || viewMode !== 'map') return;

    const casesGroup = layersRef.current.casesLayer;
    if (!casesGroup) return;

    casesGroup.clearLayers();

    if (!showCaseMarkers) return;

    filteredCasos.forEach(caso => {
      const coords = getCoordinatesForAddress(caso.tutorBairro, caso.id);

      // Color coding per Agravo
      let color = '#ea580c'; // Esporotricose = Orange
      let agravoLabel = 'Esporotricose';
      if (caso.agravo === 'Leishmaniose') {
        color = '#9333ea'; // Purple
        agravoLabel = 'Leishmaniose';
      } else if (caso.agravo === 'Leptospirose') {
        color = '#0284c7'; // Blue
        agravoLabel = 'Leptospirose';
      } else if (caso.agravo === 'Raiva') {
        color = '#e11d48'; // Red/Crimson
        agravoLabel = 'Raiva';
      }

      const isPos = caso.resultadoFinal === 'Positivo' || caso.resultadoFinal === 'Positivo CE';
      const hasHumanLesion = caso.pessoasComLesoes === 'Sim';

      const pinSize = hasHumanLesion ? 16 : (isPos ? 12 : 9);
      const strokeColor = hasHumanLesion ? '#ef4444' : '#ffffff';
      const strokeWidth = hasHumanLesion ? 3 : 2;

      const markerHtml = `
        <div style="
          background-color: ${color}; 
          width: ${pinSize}px; 
          height: ${pinSize}px; 
          border-radius: 50%; 
          border: ${strokeWidth}px solid ${strokeColor}; 
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          ${hasHumanLesion ? 'animation: pulse 1.8s infinite;' : ''}
        "></div>
      `;

      const icon = L.divIcon({
        className: 'case-pin-icon',
        html: markerHtml,
        iconSize: [pinSize, pinSize],
        iconAnchor: [pinSize / 2, pinSize / 2],
        popupAnchor: [0, -pinSize / 2],
      });

      const marker = L.marker(coords, { icon });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; color: #1e293b; min-width: 240px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 6px;">
            <span style="font-weight: 700; color: ${color}; font-size: 13px;">${agravoLabel} · ${caso.id}</span>
            <span style="font-size: 10px; background: ${isPos ? '#fee2e2' : '#f1f5f9'}; color: ${isPos ? '#991b1b' : '#475569'}; padding: 1px 6px; border-radius: 4px; font-weight: 600;">
              ${caso.resultadoFinal}
            </span>
          </div>

          <p style="margin: 2px 0;"><strong>Animal:</strong> ${caso.animalNome} (${caso.especie || 'Animal'})</p>
          <p style="margin: 2px 0;"><strong>Tutor:</strong> ${caso.tutorNome}</p>
          <p style="margin: 2px 0;"><strong>Bairro:</strong> ${caso.tutorBairro || 'Sorocaba'}</p>
          <p style="margin: 2px 0; font-size: 11px; color: #64748b;"><strong>Notificado:</strong> ${caso.dataNotificacao}</p>
          
          ${hasHumanLesion ? `
            <div style="margin-top: 6px; background: #fff1f2; border: 1px solid #fecdd3; padding: 4px 6px; border-radius: 4px; color: #9f1239; font-size: 11px; font-weight: 600;">
              ⚠️ Transmissão Humana Relatada (VE Acionada)
            </div>
          ` : ''}

          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">
            <button id="btn-case-${caso.id.replace(/[^a-zA-Z0-9]/g, '_')}" style="background: #047857; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Abrir Investigação Completa →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        autoPan: true,
        autoPanPadding: [50, 50],
        maxWidth: 320,
      });

      marker.on('popupopen', () => {
        const btnId = `btn-case-${caso.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const btn = document.getElementById(btnId);
        if (btn && onSelectCaso) {
          btn.onclick = () => {
            onSelectCaso(caso);
          };
        }
      });

      marker.addTo(casesGroup);
    });
  }, [viewMode, filteredCasos, showCaseMarkers, onSelectCaso]);

  // Handle Custom GeoJSON file upload
  const handleGeoJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomGeoJsonFileName(file.name);
    setCustomGeoJsonError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || (parsed.type !== 'FeatureCollection' && parsed.type !== 'Feature')) {
          throw new Error('Arquivo não possui estrutura GeoJSON válida (Feature ou FeatureCollection).');
        }

        setCustomGeoJson(parsed);

        const map = mapInstanceRef.current;
        if (map) {
          if (layersRef.current.customGeoJsonLayer) {
            map.removeLayer(layersRef.current.customGeoJsonLayer);
          }

          const customLayer = L.geoJSON(parsed, {
            style: (feature) => ({
              color: '#0d9488',
              weight: 2,
              fillColor: '#14b8a6',
              fillOpacity: 0.2,
            }),
            onEachFeature: (feature, layer) => {
              if (feature.properties) {
                const props = feature.properties;
                layer.bindPopup(`
                  <div style="font-size: 12px;">
                    <strong>${props.name || props.nome || 'Região GeoJSON'}</strong><br/>
                    ${Object.entries(props).slice(0, 5).map(([k, v]) => `<div><b>${k}:</b> ${v}</div>`).join('')}
                  </div>
                `);
              }
            }
          }).addTo(map);

          layersRef.current.customGeoJsonLayer = customLayer;

          try {
            const bounds = customLayer.getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [40, 40] });
            }
          } catch (err) {
            // ignore bounds calculation error
          }
        }
      } catch (err: any) {
        setCustomGeoJsonError(err.message || 'Falha ao processar arquivo GeoJSON.');
      }
    };
    reader.readAsText(file);
  };

  const centerOnSorocaba = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(SOROCABA_CENTER, 12);
    }
  };

  return (
    <div className={isFullscreen ? "fixed inset-0 z-[2000] bg-slate-950 flex flex-col p-3 sm:p-4 overflow-hidden text-slate-100" : "space-y-4"}>
      {/* Top Header & Switcher (only shown when not in fullscreen mode) */}
      {!isFullscreen && (
        <div className="bg-gradient-to-r from-[#f8fbfe] via-[#edf4fc] to-[#f8fbfe] dark:bg-slate-900 border border-[#b8d4f0] dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#002b5c] dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-emerald-500" />
                <span>Mapeamento Geoespacial de Focos & Abrangência Territorial</span>
              </h2>
              <span className="text-[11px] font-mono bg-blue-100 dark:bg-emerald-950 text-[#002b5c] dark:text-emerald-400 px-2.5 py-0.5 rounded border border-blue-300 dark:border-emerald-800 font-bold">
                OpenStreetMap + GeoJSON UBS
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Visualização cartográfica oficial das Unidades Básicas de Saúde, zonas circulares de cobertura sanitária e {filteredCasos.length} focos ativos de zoonoses em Sorocaba.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-[#cbdff2] dark:border-slate-700 bg-[#e2ecf7] dark:bg-slate-800 p-0.5 text-xs font-medium">
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-[#002b5c] text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-[#002b5c]'
                }`}
              >
                Mapa Interativo
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-[#002b5c] text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-400 hover:text-[#002b5c]'
                }`}
              >
                Ranking de Risco por Bairro
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'map' ? (
        <div className={isFullscreen ? "flex-1 flex flex-col min-h-0 space-y-2" : "grid grid-cols-1 lg:grid-cols-4 gap-4"}>
          {/* Main Map Box */}
          <div className={isFullscreen ? "flex-1 flex flex-col min-h-0 space-y-2" : "lg:col-span-3 space-y-3"}>
            
            {/* Quick Controls Bar (adapts between standard and fullscreen) */}
            <div className={`${isFullscreen ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'} border rounded-lg p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-xs`}>
              
              <div className="flex flex-wrap items-center gap-2.5">
                {isFullscreen && (
                  <div className="flex items-center gap-1.5 mr-1 font-bold text-slate-100">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="hidden sm:inline">Sorocaba · Focos & UBS</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                      Tela Cheia
                    </span>
                  </div>
                )}

                {/* Agravo Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Agravo:</span>
                  <select
                    value={filterAgravo}
                    onChange={(e) => setFilterAgravo(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="Todos">Todos os Agravos (582)</option>
                    <option value="Esporotricose">Esporotricose Felina/Canina (416)</option>
                    <option value="Leishmaniose">Leishmaniose Visceral Canina (97)</option>
                    <option value="Leptospirose">Leptospirose Canina (62)</option>
                    <option value="Raiva">Raiva Animal / Quirópteros (7)</option>
                  </select>
                </div>

                {/* Colegiado Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 hidden md:inline">Colegiado:</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {(['Todos', 'Sudoeste', 'Noroeste', 'Centro Norte', 'Centro Sul', 'Norte', 'Leste'] as const).map(col => (
                      <button
                        key={col}
                        onClick={() => setSelectedColegiado(col)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          selectedColegiado === col
                            ? 'bg-emerald-700 text-white font-semibold'
                            : isFullscreen
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Centralizar, Legenda Toggle, Fullscreen Toggle */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Reset Center button */}
                <button
                  onClick={centerOnSorocaba}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border cursor-pointer text-xs transition-colors ${
                    isFullscreen
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Recentralizar Mapa em Sorocaba"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Centralizar</span>
                </button>

                {/* Legenda Toggle Button */}
                <button
                  onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs cursor-pointer transition-colors ${
                    !isLegendCollapsed
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium'
                      : isFullscreen
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title={isLegendCollapsed ? 'Expandir Legenda Cartográfica' : 'Recolher Legenda Cartográfica'}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isLegendCollapsed ? 'Ver Legenda' : 'Recolher Legenda'}</span>
                  {isLegendCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>

                {/* Fullscreen Toggle Button */}
                {isFullscreen ? (
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium cursor-pointer text-xs shadow-xs transition-colors"
                    title="Recolher e sair do modo Tela Cheia (ESC)"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Recolher Tela Cheia</span>
                    <kbd className="hidden sm:inline text-[9px] bg-rose-800/80 px-1 py-0.5 rounded font-mono">ESC</kbd>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium cursor-pointer text-xs shadow-xs transition-colors"
                    title="Expandir visualização do mapa em tela cheia"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Tela Cheia</span>
                  </button>
                )}
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div className={`relative border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 shadow-inner ${
              isFullscreen ? 'flex-1 w-full min-h-0' : 'h-[580px]'
            }`}>
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Floating Legend (rendered ONLY if user explicitly chose floating mode and not collapsed) */}
              {legendPlacement === 'floating' && !isLegendCollapsed && (
                <div className="absolute bottom-4 right-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-lg text-[11px] max-w-xs space-y-2">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      Legenda Cartográfica
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setLegendPlacement('docked')}
                        className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:underline px-1 cursor-pointer"
                        title="Fixar no rodapé abaixo do mapa para liberar a visão"
                      >
                        Fixar no Rodapé
                      </button>
                      <button
                        onClick={() => setIsLegendCollapsed(true)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                        title="Recolher Legenda"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-orange-500 border border-white inline-block"></span>
                        <span className="text-slate-700 dark:text-slate-300">Esporotricose Felina</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{legendCounts.esporotricose}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-purple-600 border border-white inline-block"></span>
                        <span className="text-slate-700 dark:text-slate-300">Leishmaniose Visceral</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{legendCounts.leishmaniose}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-sky-600 border border-white inline-block"></span>
                        <span className="text-slate-700 dark:text-slate-300">Leptospirose Canina</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{legendCounts.leptospirose}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-600 border border-white inline-block"></span>
                        <span className="text-slate-700 dark:text-slate-300">Raiva Animal / Quiróptero</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{legendCounts.raiva}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🏥</span>
                        <span className="text-slate-700 dark:text-slate-300">UBS Sorocaba</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">15</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-2 rounded border border-dashed border-sky-500 bg-sky-400/20 inline-block"></span>
                      <span className="text-slate-700 dark:text-slate-300">Abrangência Sanitária UBS</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Legenda Cartográfica no Rodapé (Posição Ideal: 0% de sobreposição com pontos ou popups!) */}
            {legendPlacement === 'docked' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 sm:p-3 text-xs shadow-xs transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Legenda Cartográfica do Território
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {filteredCasos.length} focos ativos no filtro
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLegendPlacement('floating')}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer hidden sm:inline"
                      title="Alternar para card flutuante sobre o mapa"
                    >
                      Mudar para Flutuante
                    </button>
                    <button
                      onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium cursor-pointer transition-colors"
                      title={isLegendCollapsed ? 'Expandir Legenda' : 'Recolher Legenda'}
                    >
                      <span>{isLegendCollapsed ? 'Expandir Legenda' : 'Recolher'}</span>
                      {isLegendCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {!isLegendCollapsed && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white shadow-xs shrink-0"></span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">Esporotricose</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{legendCounts.esporotricose} focos</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-white shadow-xs shrink-0"></span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">Leishmaniose</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{legendCounts.leishmaniose} focos</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="w-3.5 h-3.5 rounded-full bg-sky-600 border-2 border-white shadow-xs shrink-0"></span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">Leptospirose</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{legendCounts.leptospirose} focos</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white shadow-xs shrink-0"></span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">Raiva Animal</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{legendCounts.raiva} focos</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-sm shrink-0">🏥</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">UBS Municipal</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">15 unidades</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="w-4 h-3 rounded border border-dashed border-sky-500 bg-sky-400/25 shrink-0"></span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">Abrangência UBS</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Polígonos</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side Controls & Layers Panel (hidden when in fullscreen to maximize map canvas) */}
          {!isFullscreen && (
            <div className="space-y-4">
            {/* Layers Toggle Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Camadas Territoriais</span>
              </h3>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCoveragePolygons}
                    onChange={(e) => setShowCoveragePolygons(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Áreas de Abrangência (Polígonos UBS)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUbsPoints}
                    onChange={(e) => setShowUbsPoints(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Pontos das 15 UBS Municipais</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCaseMarkers}
                    onChange={(e) => setShowCaseMarkers(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Focos e Casos Notificados</span>
                </label>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Filtros de Investigação:</div>
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyConfirmed}
                    onChange={(e) => setOnlyConfirmed(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Apenas Casos Confirmados (Positivos)</span>
                </label>
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyHumanContact}
                    onChange={(e) => setOnlyHumanContact(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Apenas com Transmissão Humana Relatada</span>
                </label>
              </div>
            </div>

            {/* Custom GeoJSON Loader (User requirement) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Importar GeoJSON Oficial</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Você pode carregar o arquivo GeoJSON municipal com as camadas vetorizadas das UBS, limites de distritos ou colegiados para plotagem imediata sobre o mapa.
              </p>

              <label className="block">
                <span className="sr-only">Escolher arquivo GeoJSON</span>
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleGeoJsonUpload}
                  className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-emerald-50 dark:file:bg-emerald-950 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 cursor-pointer"
                />
              </label>

              {customGeoJsonFileName && (
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded border border-emerald-200 dark:border-emerald-800 truncate">
                  ✓ Camada ativa: {customGeoJsonFileName}
                </div>
              )}

              {customGeoJsonError && (
                <div className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/60 p-2 rounded border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{customGeoJsonError}</span>
                </div>
              )}
            </div>

            {/* UBS Municipal Health Units list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>UBS de Referência ({SOROCABA_UBS_LIST.length})</span>
                <span className="text-[10px] text-emerald-600">Sorocaba/SP</span>
              </h3>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
                {SOROCABA_UBS_LIST.map(ubs => (
                  <div
                    key={ubs.id}
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([ubs.lat, ubs.lng], 14);
                      }
                    }}
                    className="p-2 rounded border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-colors"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span className="truncate">{ubs.name}</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {ubs.colegiado}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {ubs.endereco}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      ) : (
        /* Matrix View: Ranking and Detailed Territorial Analysis */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Territórios Notificados em 2026</div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {bairroStats.length} bairros
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Base oficial consolidada com todos os 582 registros da Divisão de Zoonoses
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 p-4 rounded-lg">
              <div className="text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Áreas Críticas de Alta Transmissão</span>
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-rose-900 dark:text-rose-200 tabular-nums">
                {bairroStats.filter(b => b.nivelRisco === 'Alto').length} bairros
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                Concentração elevada com risco iminente de contaminação humana
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Epicentro de Esporotricose</div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {bairroStats[0]?.bairro || 'Vila Barão / Nova Sorocaba'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Zonas com maior densidade de felinos positivos e prescrição de Itraconazol
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Ranking Consolidado de Incidência Zoosanitária por Bairro
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Clique em um território para filtrar automaticamente a tabela de investigações epidemiológicas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bairroStats.slice(0, 18).map(item => (
                <div
                  key={item.bairro}
                  onClick={() => onSelectBairro(item.bairro)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer group hover:shadow-xs ${
                    item.nivelRisco === 'Alto'
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-400'
                      : item.nivelRisco === 'Médio'
                      ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 hover:border-amber-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className={`w-4 h-4 shrink-0 ${
                        item.nivelRisco === 'Alto' ? 'text-rose-600' : 'text-slate-400'
                      }`} />
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                        {item.bairro}
                      </h4>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.nivelRisco === 'Alto'
                        ? 'bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200'
                        : item.nivelRisco === 'Médio'
                        ? 'bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      Risco {item.nivelRisco}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {item.total}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Positivos</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                        {item.positivos}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Humanos</span>
                      <span className={`font-mono font-bold tabular-nums ${item.casosHumanos > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}>
                        {item.casosHumanos}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      {item.esporotricose > 0 && <span>Espo: {item.esporotricose}</span>}
                      {item.leishmaniose > 0 && <span>· LVC: {item.leishmaniose}</span>}
                      {item.leptospirose > 0 && <span>· Lepto: {item.leptospirose}</span>}
                      {item.raiva > 0 && <span>· Raiva: {item.raiva}</span>}
                    </div>

                    <span className="text-emerald-700 dark:text-emerald-400 font-medium shrink-0">
                      Ver Fichas →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sanitary Directives for Biologists based dynamically on data */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-5 text-xs text-slate-700 dark:text-slate-300 space-y-3">
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>Diretrizes Zoosanitárias Dinâmicas & Ações de Bloqueio em Sorocaba</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded border border-slate-200 dark:border-slate-700">
            <h5 className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
              Foco Oeste: Vila Barão, Simus & Nova Esperança
            </h5>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Foco intenso de Esporotricose. Priorizar visitas domiciliares de orientação, fornecimento de caixas seguras e notificação imediata à VE para lesões em humanos.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded border border-slate-200 dark:border-slate-700">
            <h5 className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
              Foco Norte: Habiteto, Vitória Régia & São Bento
            </h5>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Elevada taxa de felinos comunitários e errantes. Articular com protetores locais e UBS Habiteto para isolamento sanitário e cadastramento de contactantes.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded border border-slate-200 dark:border-slate-700">
            <h5 className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
              Vigilância Ativa LVC & Lepto: Éden, Brigadeiro & Barcelona
            </h5>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
              Coleta sorológica peridomiciliar de 100 metros para cães contactantes e vistorias de controle de roedores em áreas com alagamento sazonal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
