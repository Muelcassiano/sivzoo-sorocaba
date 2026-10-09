import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertOctagon, HelpCircle, Code, Copy, Check, FileSpreadsheet, Lock } from 'lucide-react';

export const LimeSurveyIntegrationGuide: React.FC = () => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);

  const sqlSchema = `-- Schema Recomendado pela Controladoria & Zoonoses de Sorocaba
-- Criação da tabela satélite de investigação técnica (LGPD-compliant)
-- O LimeSurvey mantém a tabela 'lime_survey_673263' apenas como porta de entrada (imutável).

CREATE TABLE IF NOT EXISTS public.zoonoses_investigacao (
    id SERIAL PRIMARY KEY,
    limesurvey_response_id INT UNIQUE NOT NULL, -- Chave estrangeira lógica para a resposta do formulário
    agravo VARCHAR(30) NOT NULL, -- Esporotricose, Leishmaniose, Leptospirose, Raiva
    
    -- Local Provável de Infecção (LPI)
    lpi_endereco VARCHAR(255),
    lpi_bairro VARCHAR(100),
    lpi_tipo VARCHAR(10) DEFAULT 'AUT', -- AUT (Autóctone), IMP (Importado), IND (Indeterminado)
    
    -- Amostra e Laboratório
    coleta_realizada VARCHAR(20) DEFAULT 'Sim',
    veterinario_coleta VARCHAR(100),
    data_coleta DATE,
    exame_diagnostico VARCHAR(50), -- Citologia, Cultura, Teste Rápido DPP, ELISA, PCR, MAT
    laboratorio VARCHAR(50) DEFAULT 'CCZ', -- DZ, CCZ, FAS, TECSA, IAL
    analista_nome VARCHAR(100),
    analista_registro VARCHAR(30), -- ex: CRBio 33514/01-D
    data_analise DATE,
    laudo_observacao TEXT,
    
    -- Desfecho Epidemiológico
    resultado_final VARCHAR(30) NOT NULL, -- Positivo, Positivo CE, Negativo, etc.
    status_investigacao VARCHAR(30) NOT NULL, -- Em Investigação, Em Tratamento, Alta, Óbito, Eutanásia
    
    -- Vigilância Epidemiológica / Humano
    pessoas_com_lesoes VARCHAR(20) DEFAULT 'Não',
    detalhes_caso_humano TEXT,
    notificado_ve BOOLEAN DEFAULT FALSE,
    data_notificacao_ve DATE,
    
    -- Tratamento do Animal
    tratamento_iniciado VARCHAR(10) DEFAULT 'Não',
    tratamento_medicamento VARCHAR(255), -- ex: Itraconazol 100mg SID
    tratamento_data_inicio DATE,
    data_obito DATE,
    data_eutanasia DATE,
    data_alta DATE,
    
    -- REDCap / SINAN
    redcap_id VARCHAR(50),
    sincronizado_redcap BOOLEAN DEFAULT FALSE,
    observacoes_tecnicas TEXT,
    
    -- Auditoria LGPD
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_por VARCHAR(100) NOT NULL
);

-- Índice para buscas rápidas por ID da resposta e por Bairro
CREATE INDEX idx_zoonoses_response_id ON public.zoonoses_investigacao(limesurvey_response_id);
CREATE INDEX idx_zoonoses_lpi_bairro ON public.zoonoses_investigacao(lpi_bairro);`;

  const apiSnippet = `// Exemplo de Conexão Segura com a API do LimeSurvey (RemoteControl 2)
// Node.js / Express no servidor interno da Prefeitura de Sorocaba

import axios from 'axios';

const LIMESURVEY_URL = 'https://survey.sorocaba.sp.gov.br/index.php/admin/remotecontrol';
const USERNAME = process.env.LIMESURVEY_API_USER;
const PASSWORD = process.env.LIMESURVEY_API_PASSWORD;

// 1. Obter Session Key
async function getSessionKey() {
  const res = await axios.post(LIMESURVEY_URL, {
    method: 'get_session_key',
    params: [USERNAME, PASSWORD],
    id: 1
  });
  return res.data.result;
}

// 2. Buscar novas respostas não investigadas da enquete 673263
export async function sincronizarRespostasLimeSurvey(surveyId = 673263) {
  const sessionKey = await getSessionKey();
  
  const res = await axios.post(LIMESURVEY_URL, {
    method: 'export_responses',
    params: [
      sessionKey,
      surveyId,
      'json',      // Formato limpo
      'pt-BR',     // Idioma
      'complete',  // Apenas finalizadas
      'code',      // Códigos semânticos mapeados (VetNome, TutorNome, etc.)
      'short'      // Cabeçalho simplificado
    ],
    id: 2
  });

  // O resultado vem codificado em base64
  const decodedJson = Buffer.from(res.data.result, 'base64').toString('utf-8');
  const responses = JSON.parse(decodedJson);
  
  // 3. Encerrar sessão
  await axios.post(LIMESURVEY_URL, {
    method: 'release_session_key',
    params: [sessionKey],
    id: 3
  });

  return responses;
}`;

  return (
    <div className="space-y-6">
      {/* Resposta Direta às Dúvidas do Usuário */}
      <div className="bg-gradient-to-b from-[#f8fbfe] to-[#edf4fc] border border-[#b8d4f0] rounded-xl p-5 shadow-xs">
        <h3 className="text-base font-extrabold text-[#002b5c] flex items-center gap-2 mb-3">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span>Esclarecimento Técnico às Suas Dúvidas Principais</span>
        </h3>

        <div className="space-y-4 text-xs text-slate-700">
          {/* Pergunta 1 */}
          <div className="p-4 bg-white/90 border border-[#c4daf0] rounded-lg space-y-2 shadow-2xs">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span>1. Devo criar as perguntas dos biólogos dentro do LimeSurvey (ocultas) ou numa aplicação/tabela separada?</span>
            </h4>
            <div className="text-slate-600 leading-relaxed space-y-2">
              <p>
                <strong>Resposta Técnica e Jurídica: Crie em uma tabela/aplicação externa separada!</strong> Esse padrão chama-se <em>Extension Table (Tabela Satélite de Investigação)</em>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-rose-50 border border-rose-200 p-3 rounded">
                  <span className="font-semibold text-rose-900 block mb-1">Por que NÃO deixar campos ocultos no LimeSurvey:</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                    <li>Se um dia você alterar ou desativar o questionário no LimeSurvey para mudar uma pergunta, pode desconfigurar ou arquivar a tabela do banco, perdendo dados da investigação.</li>
                    <li>Qualquer usuário avançado que inspecione o código-fonte HTML ou requisição do formulário poderia ver a existência de campos de "Eutanásia", "Investigação Policial", etc.</li>
                    <li>O LimeSurvey não possui histórico de auditoria relacional (quem alterou o laudo no dia 15, quem mudou o remédio no dia 20).</li>
                  </ul>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded">
                  <span className="font-semibold text-emerald-900 block mb-1">Vantagens da Tabela Satélite Externa (SIVZ):</span>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800">
                    <li>O formulário do LimeSurvey atua puramente como <strong>Porta de Entrada (Declaração Notificante)</strong>, ficando 100% íntegro e imutável.</li>
                    <li>Os biólogos têm um sistema próprio, rápido, com dashboards, geolocalização e sem as travas de interface do LimeSurvey.</li>
                    <li>Conformidade total com a LGPD: permissões restritas a servidores concursados, com logs de quem acessou cada CPF.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Pergunta 2 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">
              2. É possível conectar diretamente ao banco do LimeSurvey sem infringir a LGPD e as orientações da Controladoria de Sorocaba?
            </h4>
            <div className="text-slate-600 leading-relaxed space-y-1">
              <p>
                <strong>Sim, 100% viável e em total conformidade com a LGPD (Lei Federal 13.709/2018).</strong>
              </p>
              <p>
                A exigência da Controladoria de Sorocaba de sair do Google Forms foi motivada pela transferência internacional de dados e servidores públicos de terceiros (nuvem pública). Ao manter o LimeSurvey e esta aplicação nos servidores da própria Prefeitura de Sorocaba (<code className="font-mono text-slate-800">*.sorocaba.sp.gov.br</code>):
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 pl-2 pt-1">
                <li><strong>Base Legal da LGPD:</strong> Art. 7º, Inciso II (cumprimento de obrigação legal ou regulatória pelo controlador) e Art. 7º, Inciso VIII (tutela da saúde, exclusivamente, em procedimento realizado por profissionais de saúde, serviços de saúde ou autoridade sanitária).</li>
                <li><strong>Segurança:</strong> O banco de dados MySQL/PostgreSQL permanece dentro da DMZ municipal. O aplicativo dos biólogos autentica com usuário e senha corporativos (LDAP/Active Directory da prefeitura).</li>
              </ul>
            </div>
          </div>

          {/* Pergunta 3 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">
              3. O que são os códigos de fotos/laudos no CSV e como acessá-los?
            </h4>
            <div className="text-slate-600 leading-relaxed text-[11px] space-y-1">
              <p>
                O código como <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">fu_cka9s6waqsvd5h8</code> é o identificador único do arquivo no disco do servidor Linux da prefeitura. Ele fica armazenado fisicamente em:
              </p>
              <code className="block bg-slate-900 text-slate-100 p-2 rounded font-mono text-[11px]">
                /var/www/html/limesurvey/upload/surveys/673263/files/fu_cka9s6waqsvd5h8
              </code>
              <p>
                Na aba <strong>"Anexos & Decoder"</strong> deste sistema, disponibilizamos uma ferramenta que interpreta automaticamente esse código, lê o nome original do arquivo (ex: <code className="font-mono">image-(4).jpg</code>) e permite o download direto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Script para a Equipe de Banco de Dados */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h4 className="text-sm font-semibold text-slate-900">
              Script SQL para a Equipe de TI de Sorocaba (PostgreSQL / MySQL)
            </h4>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(sqlSchema);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 2500);
            }}
            className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Basta a equipe de TI executar este script no mesmo banco de dados ou em banco dedicado. Ele cria a estrutura exata para armazenar as investigações dos biólogos sem alterar as tabelas nativas do LimeSurvey:
        </p>

        <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-md font-mono text-[11px] overflow-x-auto leading-relaxed max-h-72">
          {sqlSchema}
        </pre>
      </div>

      {/* Integração Automática com a API RemoteControl 2 */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-700" />
            <h4 className="text-sm font-semibold text-slate-900">
              Sincronização Automática via API LimeSurvey (RemoteControl 2)
            </h4>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(apiSnippet);
              setCopiedApi(true);
              setTimeout(() => setCopiedApi(false), 2500);
            }}
            className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedApi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedApi ? 'Copiado!' : 'Copiar Código API'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Para que as notificações preenchidas pelos médicos veterinários caiam <strong>automaticamente e em tempo real</strong> nesta tela sem necessidade de baixar e subir planilhas CSV manuais:
        </p>

        <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-md font-mono text-[11px] overflow-x-auto leading-relaxed max-h-72">
          {apiSnippet}
        </pre>
      </div>
    </div>
  );
};
