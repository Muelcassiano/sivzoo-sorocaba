# SIVZOO Sorocaba · Sistema de Investigação e Vigilância de Zoonoses

> **Prefeitura Municipal de Sorocaba / SP · Secretaria da Saúde · Divisão de Zoonoses / CCZ**  
> *Plataforma Integrada de Inteligência Epidemiológica, Gestão de Focos Zoosanitários, Cartografia Geoespacial e Vigilância Ativa de Contatos Humanos em Conformidade com a LGPD.*

---

## 🏛️ Apresentação & Contexto Epidemiológico

O **SIVZOO Sorocaba (Sistema de Investigação de Zoonoses)** é uma plataforma analítica e operacional concebida para atender à alta complexidade das zoonoses de interesse em saúde pública no município de **Sorocaba/SP**. Integrado à rotina dos médicos veterinários da rede pública e privada, biólogos e técnicos da Divisão de Zoonoses, o sistema processa notificações zoosanitárias, gerencia laudos laboratoriais, acompanha tratamentos com antifúngicos/leishmanicidas e monitora a transmissão para seres humanos em estreita consonância com as diretrizes do **Ministério da Saúde** e da **Vigilância Epidemiológica Municipal (VE / SINAN)**.

A base oficial consolidada contempla **582 fichas de notificação oficiais de 2026**, abrangendo os quatro agravos centrais monitorados no município:

1. **Esporotricose Animal & Humana (*Sporothrix brasiliensis*)**:
   - Micose subcutânea de alta transmissão zoonótica, com nítido predomínio em felinos domésticos não castrados e com acesso à rua.
   - Acompanhamento de lesões ulceradas crônicas em focinho, face e extremidades; controle do fornecimento assistido de **Itraconazol (100mg)** e notificação compulsória imediata de tutores ou contactantes com lesões suspeitas para avaliação na rede de Unidades Básicas de Saúde (UBS).
2. **Leishmaniose Visceral Canina (LVC - *Leishmania infantum*)**:
   - Transmitida pelo vetor flebotomíneo *Lutzomyia longipalpis* ("mosquito-palha").
   - Fluxo de triagem diagnóstica com **Teste Rápido DPP (Dual Path Platform)** e confirmação sorológica por **ELISA** no **Instituto Adolfo Lutz (IAL)**; distribuição monitorada de coleiras repelentes impregnadas com deltametrina a 4% (**Scalibor**) e inquérito censitário em áreas de risco.
3. **Leptospirose Animal (*Leptospira interrogans*)**:
   - Zoonose bacteriana veiculada pela urina de roedores sinantrópicos; diagnóstico por Soroaglutinação Microscópica (MAT) e desencadeamento de ações focais de desratização e saneamento ambiental.
4. **Vigilância Passiva da Raiva Animal (*Lyssavirus*)**:
   - Monitoramento contínuo de quirópteros caídos (morcegos hematófagos e não-hematófagos), imunofluorescência direta (IFD) e prova biológica em camundongos no IAL, além da profilaxia antirrábica de cães e gatos em áreas limítrofes.

---

## ⚡ Destaques & Arquitetura de Design

- **Identidade Visual Municipal Oficial:** Paleta azulada profunda (`#002b5c`, `#003875`, `#0a4b8f`) inspirada no portal oficial da Prefeitura de Sorocaba, conferindo seriedade, contraste nobre e acabamento premium tanto no **Modo Claro** quanto no **Modo Escuro**.
- **Superfícies Tintadas de Alta Legibilidade:** Eliminação de fundos brancos planos e estéreis nos cards e diagramas, substituídos por gradientes suaves, bordas de contraste suave e tipografia técnica balanceada.
- **Fila Operacional Lateralmente Otimizada:** Área de exibição das notificações com largura expandida (`max-w-[1880px]`), desenhada com proporções calculadas para exibir **todas as 9 colunas de dados essenciais sem necessidade de barra de rolagem horizontal** em telas de desktop e laptops padrão.
- **Top Bar Travada com Persistência Cartográfica:** Barra de navegação e cabeçalho municipal afixados no topo (`sticky top-0 z-40`), garantindo acesso imediato aos controles do sistema em qualquer nível de rolagem.
- **Acessibilidade Governamental e-MAG / WCAG 2.1 AA:** Redimensionamento dinâmico de texto (`A`, `A+`, `A++`), modo de Alto Contraste para baixa visão, links de salto (`Skip links`) e alternância clara/escura sincronizada em `localStorage`.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Interface & Core** | **React 18 + TypeScript** | Componentização modular e tipagem estrita de todos os modelos de zoonoses |
| **Estilização** | **Tailwind CSS v4** | Design system responsivo com temas claro/escuro e microinterações táteis |
| **GIS & Mapeamento** | **Leaflet GIS + OpenStreetMap** | Georreferenciamento de focos, raios sanitários e camadas GeoJSON de UBSs |
| **Gráficos & Análise** | **SVG Reativo + CSS Transforms** | Curvas epidemiológicas com diagramação estatística e interpolação suave |
| **Ícones** | **Lucide React** | Iconografia semântica e acessível |
| **Formulários & LGPD** | **LimeSurvey Integration Core** | Ingestão de CSV, decodificador de anexos em base64 e isolamento de PII |
| **Interoperabilidade** | **REDCap Ready Architecture** | Estruturação de dados compatível com plataformas de pesquisa clínica |

---

## 🚀 Módulos & Funcionalidades Detalhadas

### 1. Painel Geral & Inteligência Epidemiológica Dinâmica
- **Sincronização Multidimensional Reativa:**
  - O seletor de **Ano** (2019 a 2026) e de **Agravo** (Esporotricose, Leishmaniose, Leptospirose, Raiva, Todos) conecta de forma instantânea todos os elementos da tela: os 4 cards de KPI superiores, o Diagrama de Controle e a Fila Operacional de Notificações.
  - **Fidelidade Real de Dados:** Quando o operador seleciona um ano sem registros no banco (ex: 2025 ou anos anteriores), todos os cards e a curva do diagrama refletem com precisão o estado zero (`0 registros`, `0 confirmados`, curva zerada no piso), impedindo indução a erro ou distorções analíticas.
- **Diagrama de Controle / Canal Endêmico com Transição Suave:**
  - Gráfico estatístico comparativo entre o número de casos reais e os limiares endêmicos históricos (Esperado / Mediana, Faixa de Alerta e Limiar Epidêmico).
  - Animação e interpolação fluida das linhas durante a alteração dos filtros de agravo e ano, simulando movimento orgânico dos pontos sem cortes abruptos.
  - Alternância entre visualização **Mensal** (Jan–Dez) e **Semanal** (Semanas Epidemiológicas SE 01 a SE 30), com recortes temporais estratégicos (*Maior Incidência* e *Último Trimestre*).

### 2. Módulo de Investigação Epidemiológica & Acompanhamento Zoosanitário
- **Fichas Completas de Notificação:**
  - Consulta detalhada das 582 ocorrências com busca universal por ID, nome do animal, espécie, raça, tutor, bairro de Sorocaba, clínica veterinária e número REDCap.
- **Modal Integrado de Auditoria do Biólogo:**
  - Aba de **Investigação Técnica:** registro de amostras, exame laboratorial (Citologia, Cultura fúngica, Teste Rápido DPP, ELISA, MAT, IFD), laboratório executor (CCZ, IAL, TECSA) e desfecho clínico (*Em Tratamento*, *Alta*, *Óbito*, *Eutanásia*).
  - Aba de **Entrada LimeSurvey & Anexos:** inspeção dos dados brutos informados pelo veterinário na ponta.
  - Aba de **Encaminhamento VE:** geração instantânea do comunicado oficial de transmissão humana para a Vigilância Epidemiológica Municipal.
  - Aba de **Retorno ao Veterinário:** composição automática de e-mail de contrarreferência técnica ao médico veterinário notificante.
  - Função nativa de **Impressão da Ficha Oficial** para prontuário físico.

### 3. Módulo GIS - Cartografia de Focos & Abrangência Territorial
- **Visualização Espacial em Camadas:**
  - Plotagem georreferenciada de todas as Unidades Básicas de Saúde (UBSs) de Sorocaba e dos focos de zoonoses classificados por cor e severidade.
  - Círculos de abrangência sanitária de 1 km e 3 km para avaliação de saturação e dispersão do vetor.
  - **Legenda Cartográfica Integrada no Rodapé:** Posicionamento arquitetado logo abaixo do canvas do mapa para garantir **0% de sobreposição**, permitindo que nenhum ponto ou popup fique obstruído.
  - Botões para alternar entre legenda fixada no rodapé e modo flutuante compacto, além de opção de recolher/expandir.
- **Modo Tela Cheia Imersivo:**
  - Expansão do mapa para 100% da viewport do navegador com recalculo instantâneo de quadrantes (`map.invalidateSize`).
  - Fechamento facilitado via botão dedicado ou tecla de atalho **`ESC`**.
- **Ranking de Risco e Matriz por Bairro:**
  - Tabela agregada com classificação decrescente de bairros mais incidentes (ex: Vila Hortência, Éden, Brigadeiro Tobias, Wanel Ville, Campolim) para priorização de equipes volantes de campo.

### 4. Módulo de Alertas VE (Vigilância de Contatos e Lesões Humanas)
- **Cumprimento da Portaria MS nº 264/2020:**
  - Painel exclusivo que segrega e destaca todas as fichas com resposta afirmativa para *"Pessoas com lesões de pele suspeitas ou acidentes com o animal"*.
  - Indicador de status de acionamento: fichas *Aguardando Envio à VE* vs. *VE Acionada*.
  - Despacho imediato direcionado à UBS de residência do munícipe para busca ativa domiciliar.

### 5. Descompactador e Decoder de Anexos LimeSurvey
- **Auditoria Segura de Arquivos em Conformidade com a LGPD:**
  - Decodificação de cadeias de metadados JSON geradas pelo LimeSurvey (ex: hashes `fu_cka9s...`), revelando nome original do arquivo, tamanho e extensão.
  - Geração de script Bash automatizado (`rsync`) para sincronização segura entre o storage do servidor Web do LimeSurvey e o repositório auditado da Divisão de Zoonoses.

### 6. Exportação & Interoperabilidade com o REDCap
- Exportação completa da base de dados normalizada em formato CSV compatível com o **REDCap (Research Electronic Data Capture)**, facilitando estudos em parceria com universidades e centros de referência em infectologia.

---

## 🔄 Fluxos de Trabalho Operacionais Concretos

Abaixo são descritos três fluxos de trabalho reais executados na rotina da saúde pública de Sorocaba com o apoio do SIVZ:

### Exemplo 1: Notificação de Esporotricose Felina com Lesão em Humano
```
[Clínica Veterinária / UBS] 
       │
       ▼ (Preenche formulário no LimeSurvey da Prefeitura de Sorocaba)
[Entrada no SIVZ] 
       │ ── Registrado ID SZ-2026-XXXX com flag "Alerta VE: Sim"
       ▼
[Triagem na Divisão de Zoonoses / CCZ]
       │ ── Biólogo acessa o Painel de Alertas VE
       │ ── Abre a ficha no Modal de Investigação Técnica
       ▼
[Geração de Despacho para a VE Municipal]
       │ ── Sistema emite comunicado oficial para a UBS do bairro (ex: UBS Vila Hortência)
       │ ── Equipe da Estratégia Saúde da Família (ESF) realiza busca ativa no domicílio
       │ ── Munícipe é avaliado por médico do SUS e inicia Itraconazol humano gratuito
       ▼
[Conduta Zoosanitária com o Paciente Felino]
       │ ── Zoonoses cadastra fornecimento de Itraconazol manipulado animal
       │ ── Monitoramento periódico do tutor por telefone
       │ ── Desfecho final registrado no SIVZ: "Alta por Cura Clínica"
```

### Exemplo 2: Inquérito Censitário de Leishmaniose Visceral Canina (LVC)
```
[Coleta em Campo ou Clínica Particular]
       │
       ▼ (Cão com suspeita clínica: emagrecimento, onicogrifose, lesões de pele)
[Triagem Sorológica no CCZ Sorocaba]
       │ ── Teste Rápido DPP: Reagente
       ▼
[Encaminhamento ao Instituto Adolfo Lutz (IAL)]
       │ ── Amostra encaminhada com número de controle
       │ ── Exame ELISA Confirmatório: Positivo
       ▼
[Registro do Laudo no SIVZ & Delimitação Geoespacial]
       │ ── Biólogo altera status da ficha para "Confirmado Laboratorial"
       │ ── O mapa plota o ponto e ativa o buffer circular de 1 km
       ▼
[Ações de Bloqueio Vetorial & Manejo Ambiental]
       │ ── Instalação de coleira Scalibor (deltametrina 4%) no animal
       │ ── Equipe de campo inspeciona quintais vizinhos à procura de matéria orgânica
       │ ── Inquérito censitário canino executado no raio de abrangência
```

### Exemplo 3: Vigilância Passiva de Quirópteros para Prevenção da Raiva
```
[Munícipe liga para a Central 156 / Zoonoses]
       │
       ▼ (Relato de morcego caído durante o dia em calçada ou quintal)
[Recolhimento pelo CCZ Sorocaba]
       │ ── Equipe especializada resgata o espécime com EPIs adequados
       ▼
[Encaminhamento Laboratorial]
       │ ── Amostra de SNC enviada para Imunofluorescência Direta (IFD) no IAL
       ▼
[Registro no SIVZ]
       │ ── Identificação da espécie (ex: frugívoro, insetívoro ou desmodus)
       │ ── Laudo negativo: arquivamento da ficha com notificação territorial
       │ ── Se positivo: disparo imediato de bloqueio vacinal antirrábico em cães e gatos em 500 m
```

---

## 🗄️ Engenharia de Dados & Roadmap de Migração Cloud (Supabase / PostgreSQL)

### Diagnóstico da Base Atual
Atualmente, para fins de demonstração interativa e prototipação ágil, a base de dados opera em memória (`localStorage` e datasets estruturados no repositório). Embora altamente responsivo, esse modelo apresenta limitações para o ambiente corporativo municipal:
- Falta de concorrência multiusuário em tempo real entre veterinários externos, analistas do CCZ e médicos da VE.
- Necessidade de isolamento rigoroso de prontuários com Dados Pessoais Sensíveis (LGPD) contra acessos indevidos.
- Impossibilidade de consultas geoespaciais em larga escala diretamente no banco (ex: cálculo de raio sem carregar todos os pontos no cliente).

### Arquitetura Alvo: Banco de Dados Relacional Normalizado (Supabase)

Para a fase de implantação em produção nos servidores da Prefeitura, foi planejado o seguinte modelo relacional normalizado sobre **PostgreSQL** com a extensão **PostGIS**:

```sql
-- 1. Tabela Imutável de Entrada (Raw Survey Data do LimeSurvey)
CREATE TABLE public.limesurvey_raw_responses (
    id BIGSERIAL PRIMARY KEY,
    survey_id INT NOT NULL,
    response_id INT UNIQUE NOT NULL,
    raw_payload JSONB NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela Normalizada de Tutores & Munícipes (Protegida por RLS / LGPD)
CREATE TABLE public.tutores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) UNIQUE,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(30),
    email VARCHAR(150),
    endereco VARCHAR(255) NOT NULL,
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cep VARCHAR(10),
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Animais Notificados
CREATE TABLE public.animais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID REFERENCES public.tutores(id) ON DELETE RESTRICT,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(20) NOT NULL CHECK (especie IN ('Canina', 'Felina', 'Quiróptero', 'Outro')),
    raca VARCHAR(80),
    sexo VARCHAR(10),
    idade VARCHAR(30),
    castrado BOOLEAN,
    tem_acesso_rua BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela Central de Notificações de Zoonoses
CREATE TABLE public.notificacoes_zoonoses (
    id VARCHAR(30) PRIMARY KEY, -- ex: SZ-2026-0041
    animal_id UUID REFERENCES public.animais(id),
    agravo VARCHAR(30) NOT NULL CHECK (agravo IN ('Esporotricose', 'Leishmaniose', 'Leptospirose', 'Raiva')),
    data_notificacao DATE NOT NULL,
    semana_epidemiologica INT NOT NULL,
    ano INT NOT NULL,
    veterinario_nome VARCHAR(150),
    veterinario_crmv VARCHAR(30),
    veterinario_clinica VARCHAR(150),
    status_investigacao VARCHAR(30) NOT NULL DEFAULT 'Em Investigação',
    resultado_final VARCHAR(30) NOT NULL DEFAULT 'Aguardando Laudo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela Satélite de Laudos & Investigação Técnica do Biólogo
CREATE TABLE public.investigacoes_laboratoriais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notificacao_id VARCHAR(30) REFERENCES public.notificacoes_zoonoses(id) ON DELETE CASCADE,
    exame_diagnostico VARCHAR(80),
    laboratorio VARCHAR(80),
    data_coleta DATE,
    data_resultado DATE,
    analista_nome VARCHAR(150),
    analista_registro VARCHAR(50),
    laudo_observacoes TEXT,
    tratamento_medicamento VARCHAR(200),
    tratamento_inicio DATE,
    desfecho_data DATE,
    redcap_id VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Alertas de Transmissão Humana (Vigilância Epidemiológica)
CREATE TABLE public.alertas_ve_humanos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notificacao_id VARCHAR(30) REFERENCES public.notificacoes_zoonoses(id),
    tutor_id UUID REFERENCES public.tutores(id),
    detalhes_lesao TEXT NOT NULL,
    notificado_ve BOOLEAN DEFAULT FALSE,
    data_notificacao_ve DATE,
    ubs_referencia VARCHAR(150),
    protocolo_sinan VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Vantagens Estratégicas do Supabase no Ecossistema Municipal:
1. **Consultas Espaciais Nativas (PostGIS):**
   - Comandos como `ST_DWithin(foco.geom, ubs.geom, 1000)` permitirão calcular em milissegundos se um novo foco de leishmaniose está no raio de vigilância ativa de uma UBS.
2. **Row Level Security (RLS):**
   - Políticas granulares de segurança: biólogos e técnicos da Zoonoses acessam apenas dados do animal e laudos; profissionais de saúde da Vigilância Epidemiológica acessam os dados sigilosos dos contactantes humanos (CPF, prontuário); veterinários externos visualizam apenas suas próprias fichas submetidas.
3. **Webhooks e Edge Functions:**
   - Ingestão em tempo real acionada por webhook a cada submissão de formulário no LimeSurvey, eliminando a dependência de exportações manuais em CSV.

---

## 🔒 Conformidade Regulatória & LGPD

- **Lei Geral de Proteção de Dados (Lei nº 13.709/2018):**
  - Princípios de *finalidade* e *necessidade*: dados de munícipes são coletados com amparo no Art. 7º, Inciso VIII (tutela da saúde pública).
  - Sanitização de relatórios públicos com ofuscação automática de CPFs e telefones nos dashboards estatísticos e mapas abertos.
- **Modelo de Acessibilidade do Governo Federal (e-MAG):**
  - Conformidade com as normas para sítios e portais públicos brasileiros, garantindo pleno acesso a munícipes e servidores com deficiência visual ou motora.

---

## 📦 Guia de Instalação e Execução Local

### Pré-requisitos
- Node.js (versão 18 ou superior)
- Gerenciador de pacotes `npm`

### Passos de Instalação

1. Clone o repositório ou acesse a pasta do projeto:
   ```bash
   cd sivzoo-sorocaba
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.

4. Para compilar a versão otimizada para produção:
   ```bash
   npm run build
   ```

---

## 👨‍💻 Autoria & Perfil Profissional

Aplicação ***(NÃO OFICIAL)*** projetada e desenvolvida por um servidor público do setor buscando padrões rigorosos de **Engenharia de Software**, **Design de Interfaces Governamentais de Alto Padrão**, **Ciência de Dados em Saúde Pública e Epidemiologia Quantitativa**.

**Samuel Abreu**  
*Desenvolvedor de Software & Cientista de Dados*  
- **Email:** [samuel.abreux@gmail.com](mailto:samuel.abreux@gmail.com)  
- **Foco de Atuação:** Engenharia de Dados, Aplicações Web de Alta Performance, Arquitetura em Nuvem e Soluções para o Setor Público.

*Prefeitura Municipal de Sorocaba / SP · Vigilância em Saúde · 2026*
