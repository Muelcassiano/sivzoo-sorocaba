import React, { useState } from 'react';
import { CasoZoonoses, StatusInvestigacao, ClassificacaoCaso } from '../types/zoonoses';
import { X, Save, ShieldAlert, Mail, FileText, CheckCircle2, AlertTriangle, Paperclip, ExternalLink, Printer } from 'lucide-react';

interface CaseInvestigationModalProps {
  caso: CasoZoonoses;
  onClose: () => void;
  onSave: (casoAtualizado: CasoZoonoses) => void;
}

export const CaseInvestigationModal: React.FC<CaseInvestigationModalProps> = ({
  caso,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<CasoZoonoses>({ ...caso });
  const [activeTab, setActiveTab] = useState<'investigacao' | 'original' | 've' | 'email'>('investigacao');
  const [showSaveAlert, setShowSaveAlert] = useState(false);

  const handleChange = (field: keyof CasoZoonoses, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  const generateRedCapCode = () => {
    const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    handleChange('redCapId', code);
    handleChange('sincronizadoRedCap', true);
  };

  // Quick email generator for private vet
  const emailAssunto = `[ZOONOSES SOROCABA] Notificação ${formData.id} - ${formData.animalNome} (${formData.tutorNome})`;
  const emailCorpo = `Prezado(a) Dr(a). ${formData.veterinarioNome},

Informamos que a Notificação de Agravo em Saúde Pública sob registro ${formData.id}, referente ao paciente felino/canino "${formData.animalNome}", tutorado por ${formData.tutorNome} (Bairro ${formData.tutorBairro}, Sorocaba/SP), foi devidamente processada e investigada pela Divisão de Zoonoses da Prefeitura de Sorocaba.

DADOS DA ANÁLISE EPIDEMIOLÓGICA:
- Agravo: ${formData.agravo}
- Exame Diagnóstico: ${formData.exameDiagnostico || 'Avaliação Clínico-Epidemiológica'}
- Laboratório: ${formData.laboratorio || 'Divisão de Zoonoses / CCZ'}
- Resultado Final: ${formData.resultadoFinal}
- Conduta Técnica: ${formData.statusInvestigacao}
${formData.tratamentoMedicamento ? `- Tratamento Registrado: ${formData.tratamentoMedicamento}` : ''}

OBSERVAÇÕES DA EQUIPE TÉCNICA:
${formData.observacoesTecnicas || 'Caso devidamente arquivado e monitorado junto à rede zoosanitária municipal.'}

Atenciosamente,
Equipe de Biólogos e Médicos Veterinários
Divisão de Zoonoses / CCZ - Prefeitura de Sorocaba
Telefone: (15) 3222-2484 · E-mail: zoonoses@sorocaba.sp.gov.br`;

  // Quick dispatch generator for VE (Vigilância Epidemiológica)
  const veDespacho = `COMUNICADO OFICIAL DE SUSPEITA ZOONÓTICA - ZOONOSES SOROCABA
À Vigilância Epidemiológica de Sorocaba (VE / SINAN)
Data do Encaminhamento: ${new Date().toLocaleDateString('pt-BR')}
Ref. Notificação Animal: ${formData.id} (${formData.agravo})

DADOS DO CASO ANIMAL:
- Animal: ${formData.animalNome} (${formData.especie} - ${formData.raca})
- Diagnóstico: ${formData.resultadoFinal} (${formData.exameDiagnostico || 'Clínico-Epidemiológico'})
- Local Provável de Infecção (LPI): ${formData.lpiEndereco || formData.tutorEndereco + ', ' + formData.tutorBairro}

DADOS DO CASO HUMANO SUSPEITO:
- Tutor / Responsável: ${formData.tutorNome}
- CPF: ${formData.tutorCpf || 'Não informado'}
- Endereço Residencial: ${formData.tutorEndereco}, Nº ${formData.tutorNumero || 'S/N'} - Bairro ${formData.tutorBairro}
- Telefone(s) de Contato: ${formData.tutorTelefone}
- Descrição da Lesão / Acidente: ${formData.detalhesCasoHumano || 'Munícipe relatou presença de lesões dermatológicas papulonodulares ulcerativas compatíveis com transmissão zoonótica após arranhadura/contato.'}

Solicitamos busca ativa e agendamento de consulta na Unidade Básica de Saúde (UBS) de referência do território para avaliação médica e prescrição de Itraconazol humano pelo SUS.

Responsável Técnico Zoonoses: ${formData.analistaNome || 'Bióloga Bruna Paola Manetta'}
Registro Profissional: ${formData.analistaRegistro || 'CRBio / CRMV'}`;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gradient-to-b from-[#f8fbfe] to-[#edf4fc] dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-[#b8d4f0] dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#cbdff2] dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#dbeafe] via-[#e8f2fc] to-[#dbeafe] dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-[#002b5c] dark:text-blue-300">
                  Caso {formData.id}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  · {formData.agravo}
                </span>
                {formData.pessoasComLesoes === 'Sim' && (
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-200/90 dark:bg-rose-950 px-2 py-0.5 rounded flex items-center gap-1 border border-rose-300">
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                    <span>Alerta VE Ativo</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Paciente: <strong className="text-slate-900 dark:text-slate-200">{formData.animalNome}</strong> · Tutor: {formData.tutorNome} ({formData.tutorBairro})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 text-slate-600 hover:text-[#002b5c] hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
              title="Imprimir Ficha de Investigação"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#cbdff2] dark:border-slate-800 px-5 gap-4 text-xs font-semibold bg-[#eef5fc] dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('investigacao')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'investigacao'
                ? 'border-[#002b5c] text-[#002b5c] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Ficha do Biólogo (Investigação)
          </button>

          <button
            onClick={() => setActiveTab('original')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'original'
                ? 'border-emerald-700 text-emerald-800 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrada LimeSurvey & Anexos ({formData.anexos?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('ve')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 've'
                ? 'border-rose-600 text-rose-800 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Encaminhamento VE</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`py-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1 ${
              activeTab === 'email'
                ? 'border-emerald-700 text-emerald-800 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Retorno ao Veterinário</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          
          {showSaveAlert && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Investigação técnica salva com sucesso no banco de dados local da Zoonoses!</span>
            </div>
          )}

          {/* TAB 1: FICHA DO BIÓLOGO */}
          {activeTab === 'investigacao' && (
            <div className="space-y-4">
              
              {/* Seção 1: Diagnóstico e Laboratório */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  1. Diagnóstico Laboratorial & Análise Técnica
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Coleta de Amostra?</label>
                    <select
                      value={formData.coletaRealizada || 'Sim'}
                      onChange={e => handleChange('coletaRealizada', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="Sim">Sim, realizada coleta</option>
                      <option value="Não">Não coletado</option>
                      <option value="Óbito sem coleta">Óbito antes da coleta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Método Diagnóstico</label>
                    <select
                      value={formData.exameDiagnostico || 'Citologia'}
                      onChange={e => handleChange('exameDiagnostico', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="Citologia">Citologia</option>
                      <option value="Cultura">Cultura Fúngica</option>
                      <option value="Citologia/Cultura">Citologia + Cultura</option>
                      <option value="Teste Rápido DPP">Teste Rápido DPP</option>
                      <option value="ELISA">ELISA (Confirmatório)</option>
                      <option value="PCR">PCR / Biologia Molecular</option>
                      <option value="MAT">MAT Leptospira (Microaglutinação)</option>
                      <option value="Clínico">Avaliação Clínico-Epidemiológica</option>
                      <option value="Sem Coleta">Sem Coleta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Laboratório Responsável</label>
                    <select
                      value={formData.laboratorio || 'DZ'}
                      onChange={e => handleChange('laboratorio', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="DZ">Divisão de Zoonoses (DZ Sorocaba)</option>
                      <option value="CCZ">CCZ (Centro de Controle de Zoonoses)</option>
                      <option value="IAL">IAL (Instituto Adolfo Lutz)</option>
                      <option value="FAS">FAS (Fundação Alexandra)</option>
                      <option value="TECSA">Laboratório TECSA</option>
                      <option value="CLINPATO">CLINPATO</option>
                      <option value="SORONEMER">SORONEMER</option>
                      <option value="Outro">Outro Laboratório</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Analista / Biólogo(a)</label>
                    <input
                      type="text"
                      value={formData.analistaNome || ''}
                      placeholder="Ex: Juliana Dias Mome Taver"
                      onChange={e => handleChange('analistaNome', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Registro Profissional</label>
                    <input
                      type="text"
                      value={formData.analistaRegistro || ''}
                      placeholder="Ex: CRBio 33514/01-D ou CRMV"
                      onChange={e => handleChange('analistaRegistro', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Data do Resultado / Análise</label>
                    <input
                      type="date"
                      value={formData.dataAnalise || ''}
                      onChange={e => handleChange('dataAnalise', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-slate-500 mb-1 font-medium">Laudo Técnico Microscópico / Observação Laboratorial</label>
                  <textarea
                    rows={2}
                    value={formData.laudoObservacao || ''}
                    placeholder="Ex: Presença de diversas estruturas leveduriformes de morfologia redonda e oval, sugestivas de Sporothrix spp."
                    onChange={e => handleChange('laudoObservacao', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              {/* Seção 2: Classificação e Desfecho Epidemiológico */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  2. Conclusão Epidemiológica & Evolução Clínica
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Resultado Final</label>
                    <select
                      value={formData.resultadoFinal}
                      onChange={e => handleChange('resultadoFinal', e.target.value as ClassificacaoCaso)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-semibold text-slate-900"
                    >
                      <option value="Positivo">Positivo (Laboratorial)</option>
                      <option value="Positivo CE">Positivo CE (Clínico-Epidemiológico)</option>
                      <option value="Negativo">Negativo (Laboratorial)</option>
                      <option value="Negativo CE">Negativo CE</option>
                      <option value="Indeterminado">Indeterminado</option>
                      <option value="Aguardando Amostra">Aguardando Amostra</option>
                      <option value="Descartado">Descartado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Situação / Status Atual</label>
                    <select
                      value={formData.statusInvestigacao}
                      onChange={e => handleChange('statusInvestigacao', e.target.value as StatusInvestigacao)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-semibold text-slate-900"
                    >
                      <option value="Em Investigação">Em Investigação</option>
                      <option value="Em Tratamento">Em Tratamento</option>
                      <option value="Alta">Alta Curada</option>
                      <option value="Óbito">Óbito</option>
                      <option value="Eutanásia">Eutanásia</option>
                      <option value="Fugiu">Fugiu</option>
                      <option value="Encerrado Negativo">Encerrado Negativo</option>
                      <option value="Descartado">Descartado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">LPI - Classificação</label>
                    <select
                      value={formData.lpiTipo || 'AUT'}
                      onChange={e => handleChange('lpiTipo', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    >
                      <option value="AUT">AUT (Autóctone Sorocaba)</option>
                      <option value="IMP">IMP (Importado de outro município)</option>
                      <option value="IND">IND (Indeterminado)</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-slate-500 mb-1 font-medium">LPI - Endereço Completo do Foco de Infecção</label>
                  <input
                    type="text"
                    value={formData.lpiEndereco || ''}
                    placeholder="Ex: Vila Barão - Rua Benedito Cirino Silva Filho, 53 B"
                    onChange={e => handleChange('lpiEndereco', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-1.5"
                  />
                </div>
              </div>

              {/* Seção 3: Tratamento e Conduta com o Animal */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  3. Conduta Terapêutica / Medicamentosa
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Tratamento Iniciado?</label>
                    <select
                      value={formData.tratamentoIniciado || 'Não'}
                      onChange={e => handleChange('tratamentoIniciado', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    >
                      <option value="Sim">Sim, iniciado</option>
                      <option value="Não">Não iniciado</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 mb-1 font-medium">Medicamento & Posologia</label>
                    <input
                      type="text"
                      value={formData.tratamentoMedicamento || ''}
                      placeholder="Ex: Itraconazol 100mg SID + Iodeto de Potássio 35mg"
                      onChange={e => handleChange('tratamentoMedicamento', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Contato Humano / Vigilância Epidemiológica */}
              <div className="bg-rose-50/70 p-3.5 rounded-lg border border-rose-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>4. Monitoramento de Lesões em Humanos (Alerta VE)</span>
                  </h4>

                  <span className="text-[11px] text-rose-700 font-medium">
                    Articulação Zoonoses + VE / UBS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                  <div>
                    <label className="block text-rose-900 mb-1 font-medium">Há pessoas com lesões suspeitas?</label>
                    <select
                      value={formData.pessoasComLesoes || 'Não'}
                      onChange={e => handleChange('pessoasComLesoes', e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded p-1.5 font-semibold text-rose-950"
                    >
                      <option value="Não">Não</option>
                      <option value="Sim">SIM (Transmissão Zoonótica)</option>
                      <option value="Não sei informar">Não sei informar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-rose-900 mb-1 font-medium">Encaminhado à Vigilância?</label>
                    <select
                      value={formData.notificadoVE ? 'Sim' : 'Não'}
                      onChange={e => handleChange('notificadoVE', e.target.value === 'Sim')}
                      className="w-full bg-white border border-rose-300 rounded p-1.5"
                    >
                      <option value="Não">Pendente de Notificação</option>
                      <option value="Sim">Notificado à VE / Ofício Enviado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-rose-900 mb-1 font-medium">Data do Envio à VE</label>
                    <input
                      type="date"
                      value={formData.dataNotificacaoVE || ''}
                      onChange={e => handleChange('dataNotificacaoVE', e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded p-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-rose-900 mb-1 font-medium">Detalhes dos Contactantes Humanos (Nomes, Sintomas, UBS)</label>
                  <textarea
                    rows={2}
                    value={formData.detalhesCasoHumano || ''}
                    placeholder="Ex: Sra. Maria com ferimentos ulcerados no antebraço e mãos após arranhão do felino. Encaminhada à UBS Vila Angélica."
                    onChange={e => handleChange('detalhesCasoHumano', e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

              {/* Seção 5: REDCap & Observações Técnicas */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    5. REDCap & Histórico Técnico de Vistorias
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={generateRedCapCode}
                      className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      Gerar Código REDCap
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Código REDCap</label>
                    <input
                      type="text"
                      value={formData.redCapId || ''}
                      placeholder="Ex: FHWPCT7W"
                      onChange={e => handleChange('redCapId', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 font-mono text-xs uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">Última Atualização Registrada Por</label>
                    <input
                      type="text"
                      value={formData.ultimaAtualizacaoPor || 'Bióloga Bruna Paola Manetta'}
                      onChange={e => handleChange('ultimaAtualizacaoPor', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1 font-medium">Histórico Cronológico & Notas de Campo da Zoonoses</label>
                  <textarea
                    rows={3}
                    value={formData.observacoesTecnicas || ''}
                    placeholder="Descreva as diligências, orientações passadas ao munícipe, termos de compromisso assinados, visitas domiciliares..."
                    onChange={e => handleChange('observacoesTecnicas', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ENTRADA LIMESURVEY & ANEXOS */}
          {activeTab === 'original' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-xs">
                <strong>Dados Imutáveis da Notificação Inicial (LimeSurvey):</strong> Estes foram os dados preenchidos pelo médico veterinário ou clínica no portal público municipal. A sua integridade é mantida como documento legal de entrada.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Notificante */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <h5 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    Médico Veterinário Notificante
                  </h5>
                  <dl className="space-y-1 text-xs">
                    <div><dt className="text-slate-500 inline">Nome: </dt><dd className="inline font-medium text-slate-800">{formData.veterinarioNome}</dd></div>
                    <div><dt className="text-slate-500 inline">CRMV-SP: </dt><dd className="inline text-slate-800">{formData.veterinarioCrmv || 'Não informado'}</dd></div>
                    <div><dt className="text-slate-500 inline">Clínica: </dt><dd className="inline text-slate-800">{formData.veterinarioClinica}</dd></div>
                    <div><dt className="text-slate-500 inline">Telefone: </dt><dd className="inline font-mono">{formData.veterinarioTelefone}</dd></div>
                    <div><dt className="text-slate-500 inline">E-mail: </dt><dd className="inline text-slate-800">{formData.veterinarioEmail || 'Não informado'}</dd></div>
                  </dl>
                </div>

                {/* Tutor */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <h5 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    Tutor / Proprietário
                  </h5>
                  <dl className="space-y-1 text-xs">
                    <div><dt className="text-slate-500 inline">Nome: </dt><dd className="inline font-medium text-slate-800">{formData.tutorNome}</dd></div>
                    <div><dt className="text-slate-500 inline">CPF: </dt><dd className="inline font-mono">{formData.tutorCpf || 'Não informado'}</dd></div>
                    <div><dt className="text-slate-500 inline">Telefone: </dt><dd className="inline font-mono">{formData.tutorTelefone}</dd></div>
                    <div><dt className="text-slate-500 inline">Endereço: </dt><dd className="inline text-slate-800">{formData.tutorEndereco}, {formData.tutorNumero || 'S/N'}</dd></div>
                    <div><dt className="text-slate-500 inline">Bairro / Cidade: </dt><dd className="inline text-slate-800">{formData.tutorBairro} - {formData.tutorMunicipio}</dd></div>
                  </dl>
                </div>

                {/* Animal */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <h5 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    Dados do Animal Suspeito
                  </h5>
                  <dl className="space-y-1 text-xs">
                    <div><dt className="text-slate-500 inline">Nome: </dt><dd className="inline font-bold text-slate-900">{formData.animalNome}</dd></div>
                    <div><dt className="text-slate-500 inline">Espécie / Raça: </dt><dd className="inline text-slate-800">{formData.especie} · {formData.raca}</dd></div>
                    <div><dt className="text-slate-500 inline">Idade / Sexo: </dt><dd className="inline text-slate-800">{formData.idade || 'Não informada'} · {formData.sexo}</dd></div>
                    <div><dt className="text-slate-500 inline">Castrado?: </dt><dd className="inline text-slate-800">{formData.castrado || 'Não sei informar'}</dd></div>
                    <div><dt className="text-slate-500 inline">Tipo Moradia / Acesso: </dt><dd className="inline text-slate-800">{formData.moradiaTipo || 'Casa'} · {formData.moradiaAcesso || 'Não informado'}</dd></div>
                  </dl>
                </div>

                {/* Sinais Clínicos Informados */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50">
                  <h5 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    Sintomas Declarados na Notificação
                  </h5>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">
                    {formData.sintomasDescricao}
                  </p>
                  {formData.distribuicaoLesoes && (
                    <div className="mt-2 text-[11px] text-slate-600">
                      <strong>Distribuição das lesões:</strong> {formData.distribuicaoLesoes}
                    </div>
                  )}
                  {formData.sinaisCodigosLvc && (
                    <div className="mt-2 text-[11px] text-slate-600">
                      <strong>Sinais LVC:</strong> {formData.sinaisCodigosLvc}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção dos Anexos do LimeSurvey */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white">
                <h5 className="font-semibold text-slate-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-emerald-700" />
                    <span>Arquivos e Laudos Anexados no LimeSurvey</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {formData.anexos?.length || 0} arquivo(s)
                  </span>
                </h5>

                {(!formData.anexos || formData.anexos.length === 0) ? (
                  <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded">
                    Nenhum arquivo ou foto foi anexado nesta notificação do LimeSurvey.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {formData.anexos.map((anexo, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            <span>{anexo.name}</span>
                            <span className="text-[10px] font-mono bg-slate-200 px-1 rounded text-slate-600 uppercase">
                              {anexo.ext}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Hash interno LimeSurvey: <strong className="text-slate-700">{anexo.filename}</strong>
                            {anexo.size ? ` · ${(anexo.size / 1024).toFixed(2)} MB` : ''}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Caminho no servidor: <code className="bg-slate-100 px-1 py-0.5 rounded">/var/www/html/limesurvey/upload/surveys/673263/files/{anexo.filename}</code>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Simulação de Download Seguro (LGPD):\n\nArquivo: ${anexo.name}\nCódigo Hash: ${anexo.filename}\nURL LimeSurvey: https://survey.sorocaba.sp.gov.br/index.php/admin/responses/sa/actionDownloadUploadedFile/surveyid/673263/responseid/${formData.limesurveyResponseId || 4}/filename/${anexo.filename}`);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Acessar Arquivo</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ENCAMINHAMENTO VIGILÂNCIA EPIDEMIOLÓGICA */}
          {activeTab === 've' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900 text-xs flex items-center justify-between">
                <span>
                  <strong>Comunicação Intersetorial (Zoonoses &rarr; Vigilância Epidemiológica):</strong> Use este modelo padronizado para encaminhar os dados à equipe de investigação humana da Secretaria da Saúde de Sorocaba.
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(veDespacho);
                    alert('Despacho oficial copiado para a área de transferência!');
                  }}
                  className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold cursor-pointer shrink-0 ml-3"
                >
                  Copiar Despacho
                </button>
              </div>

              <textarea
                rows={14}
                readOnly
                value={veDespacho}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3.5 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none"
              />
            </div>
          )}

          {/* TAB 4: RETORNO AO VETERINÁRIO */}
          {activeTab === 'email' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-100 border border-slate-200 rounded text-slate-800 text-xs flex items-center justify-between">
                <div>
                  <strong>Feedback Técnico ao Veterinário Notificante:</strong> E-mail pronto para envio com o resultado da análise diagnóstica e orientações municipais.
                </div>
                <button
                  onClick={() => {
                    const mailto = `mailto:${formData.veterinarioEmail || ''}?subject=${encodeURIComponent(emailAssunto)}&body=${encodeURIComponent(emailCorpo)}`;
                    window.location.href = mailto;
                  }}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold cursor-pointer shrink-0 ml-3 inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Abrir no E-mail</span>
                </button>
              </div>

              <div className="text-xs text-slate-600">
                <strong>Destinatário:</strong> {formData.veterinarioEmail || 'E-mail não cadastrado na ficha'} ({formData.veterinarioNome})
              </div>

              <textarea
                rows={12}
                readOnly
                value={emailCorpo}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3.5 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none"
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Última alteração: {formData.dataUltimaAtualizacao || 'Hoje'} por {formData.ultimaAtualizacaoPor || 'Zoonoses'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Investigação</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
