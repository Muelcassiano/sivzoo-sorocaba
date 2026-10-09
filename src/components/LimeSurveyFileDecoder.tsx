import React, { useState } from 'react';
import { Paperclip, FileText, Image, Download, Check, Copy, Folder, Server, Info, ShieldCheck } from 'lucide-react';
import { parseLimeSurveyJsonAttachments } from '../services/storage';

export const LimeSurveyFileDecoder: React.FC = () => {
  const sampleInput = `[{"title":"","comment":"","size":273.9951171875,"name":"image-(4).jpg","filename":"fu_cka9s6waqsvd5h8","ext":"jpg"},{"title":"","comment":"","size":4607.060546875,"name":"17899993604724982705799673244382.jpg","filename":"fu_d275t4hinvf8uxu","ext":"jpg"}]`;

  const [inputCode, setInputCode] = useState(sampleInput);
  const [surveyId, setSurveyId] = useState('673263');
  const [copiedScript, setCopiedScript] = useState(false);

  const decodedFiles = parseLimeSurveyJsonAttachments(inputCode);

  const bashScript = `#!/bin/bash
# Script de sincronização de anexos do LimeSurvey para o servidor de Zoonoses
# Prefeitura de Sorocaba - Divisão de Zoonoses
SURVEY_ID="${surveyId}"
LIMESURVEY_DIR="/var/www/html/limesurvey/upload/surveys/\${SURVEY_ID}/files"
BACKUP_DIR="/var/zoonoses/anexos_laudos/\${SURVEY_ID}"

echo "Sincronizando anexos da enquete \${SURVEY_ID}..."
mkdir -p \${BACKUP_DIR}

# Copia preservando permissões e metadados com auditoria
rsync -avz --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \${LIMESURVEY_DIR}/ \${BACKUP_DIR}/

echo "Concluído! Os arquivos estão acessíveis na rede municipal interna com conformidade LGPD."`;

  return (
    <div className="space-y-6">
      {/* Educational Header Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-emerald-950">
              Como o LimeSurvey gerencia fotos e laudos em PDF nos servidores municipais?
            </h3>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Você notou que ao baixar o CSV ou consultar o banco, as fotos não aparecem diretamente, mas sim um código como <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[11px]">fu_cka9s6waqsvd5h8</code>. Isso acontece por <strong>design de segurança do LimeSurvey</strong>:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-emerald-900 list-disc list-inside">
              <li>O LimeSurvey nunca salva o arquivo binário direto na tabela SQL (isso deixaria o banco de dados pesado e lento).</li>
              <li>O arquivo físico é renomeado para uma hash segura (ex: <code className="font-mono">fu_cka9s...</code>) e salvo no disco do servidor em: <strong className="font-mono text-[11px]">/upload/surveys/673263/files/</strong>.</li>
              <li>Na coluna da planilha e no banco de dados fica salvo um <strong>JSON de metadados</strong> contendo o nome original, tamanho, extensão e o código hash do arquivo.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Decoder Tool */}
      <div className="bg-gradient-to-b from-[#f8fbfe] to-[#edf4fc] border border-[#b8d4f0] rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#cbdff2] pb-3">
          <div>
            <h4 className="text-sm font-bold text-[#002b5c] flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-600" />
              <span>Decodificador de Anexos LimeSurvey em Tempo Real</span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Cole abaixo a sequência de caracteres ou o código da célula do CSV para extrair as fotos e gerar os caminhos exatos no servidor.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-semibold">ID do Questionário:</span>
            <input
              type="text"
              value={surveyId}
              onChange={e => setSurveyId(e.target.value)}
              className="w-20 px-2 py-1 bg-white border border-[#b8d4f0] rounded-lg font-mono text-center text-xs font-bold text-[#002b5c] shadow-2xs"
            />
          </div>
        </div>

        {/* Textarea Input */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Código JSON extraído do formulário / banco de dados / CSV:
          </label>
          <textarea
            rows={3}
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            placeholder='Ex: [{"title":"","name":"foto_lesao.jpg","filename":"fu_cka9s6waqsvd5h8","ext":"jpg"}]'
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        {/* Decoded Results Grid */}
        <div>
          <h5 className="text-xs font-semibold text-slate-800 mb-2">
            Arquivos Identificados ({decodedFiles.length}):
          </h5>

          {decodedFiles.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded border border-slate-200 text-center text-xs text-slate-400">
              Nenhum arquivo válido encontrado no JSON informado. Verifique se a formatação contém o padrão LimeSurvey com colchetes <code className="font-mono">[{`{...}`}]</code>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {decodedFiles.map((file, idx) => {
                const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(file.ext?.toLowerCase());
                const serverPath = `/var/www/html/limesurvey/upload/surveys/${surveyId}/files/${file.filename}`;
                const webUrl = `https://survey.sorocaba.sp.gov.br/upload/surveys/${surveyId}/files/${file.filename}`;

                return (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {isImg ? (
                            <Image className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <strong className="text-xs text-slate-900 truncate max-w-[200px]" title={file.name}>
                            {file.name}
                          </strong>
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          {file.ext}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400">Hash no disco: </span>
                          <code className="font-mono font-semibold text-slate-800">{file.filename}</code>
                        </div>
                        {file.size && (
                          <div>
                            <span className="text-slate-400">Tamanho: </span>
                            <span className="font-mono">{(file.size / 1024).toFixed(2)} MB</span>
                          </div>
                        )}
                        <div className="pt-1">
                          <span className="text-slate-400 block text-[10px]">Caminho no Linux da Prefeitura:</span>
                          <code className="block bg-slate-100 p-1 rounded font-mono text-[10px] text-slate-700 break-all select-all">
                            {serverPath}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <button
                        onClick={() => {
                          alert(`Simulação de Acesso ao Arquivo no Servidor:\n\nNome Real: ${file.name}\nCódigo Hash: ${file.filename}\nCaminho no Servidor: ${serverPath}\nURL Interna: ${webUrl}`);
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar / Visualizar</span>
                      </button>

                      <span className="text-[10px] text-slate-400 font-mono">
                        Item #{idx + 1}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Guide for IT / Linux Admin of Prefeitura de Sorocaba */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-700" />
            <span>Instruções para a Equipe de TI da Prefeitura (DTI / Controladoria)</span>
          </h4>

          <button
            onClick={() => {
              navigator.clipboard.writeText(bashScript);
              setCopiedScript(true);
              setTimeout(() => setCopiedScript(false), 2500);
            }}
            className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded border border-slate-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Script Copiado!' : 'Copiar Script Bash'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Para que a equipe de biólogos da Zoonoses acesse as fotos de lesões e laudos laboratoriais na nova aplicação sem precisar baixar planilhas manuais, a TI pode configurar:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <strong className="text-slate-900 block mb-1">Opção A (Recomendada via API Oficial):</strong>
            <p className="text-slate-600">
              O LimeSurvey possui a API <strong>RemoteControl 2 (JSON-RPC)</strong> nativa. Através da função <code className="font-mono text-emerald-800">get_response_uploaded_files()</code>, o nosso sistema paralelo consulta o número da notificação e recebe o arquivo em base64 direto do servidor, com total autenticação e criptografia.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <strong className="text-slate-900 block mb-1">Opção B (Pasta Compartilhada ou Proxy Seguro):</strong>
            <p className="text-slate-600">
              Criar uma rota de proxy autenticada no servidor web Nginx/Apache que mapeia <code className="font-mono text-emerald-800">/api/zoonoses/anexos/:filename</code> diretamente para <code className="font-mono text-slate-700">/upload/surveys/673263/files/</code>, validando se o usuário logado possui a role <span className="font-semibold">Biólogo / Zoonoses</span> (LGPD Art. 7º e 11º).
            </p>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-[11px] font-mono text-slate-500 block mb-1">Script de automação para cron job municipal:</span>
          <pre className="bg-slate-900 text-slate-100 p-3 rounded-md font-mono text-[11px] overflow-x-auto leading-relaxed">
            {bashScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
