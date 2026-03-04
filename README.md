#  ERP Calendario Automatizado - Sistema Integrado de Gestão e Pulverização Agrícola
<img width="1415" height="698" alt="image" src="https://github.com/user-attachments/assets/3a297ba3-4bd0-43e3-a0d0-b6c3999b6c79" />

> **Aviso de Confidencialidade:** O código-fonte deste projeto é privado por conter regras de negócio e propriedade intelectual da empresa. Este repositório serve como vitrine (showcase) da arquitetura, funcionalidades e impacto do sistema desenvolvido.

##  Visão Geral
O **ERP Calendario Automatizado** é uma plataforma *Cloud-Native* desenvolvida para digitalizar, integrar e automatizar 100% da rotina operacional de uma fazenda de grande porte. O sistema substitui fluxos manuais (cadernos, planilhas isoladas e mapas físicos coloridos à mão) por um fluxo de dados em tempo real, conectando a Administração, o Almoxarifado e o Campo (Pulverização).

Como **Líder Técnico e Arquiteto do Software**, diagnoquei os gargalos operacionais e projetei uma solução ponta a ponta que garante rastreabilidade total de insumos e atividades.

---

## 🛑 O Problema (Antes da Automação)
- **Desconexão de Dados:** A receita de tratamento era escrita em papel, o almoxarife gerava saídas em planilhas do Excel, e as devoluções eram conferidas manualmente.
- **Falta de Rastreabilidade:** O encarregado de campo anotava o término das pulverizações e os produtos usados em cadernos. Consultar o histórico de um lote exigia folhear papéis antigos.
- **Visualização Arcaica:** O controle espacial era feito pintando um mapa físico impresso da fazenda com marca-textos para indicar áreas tratadas.
- **Ruptura de Estoque:** Contagens manuais e físicas diárias eram necessárias para gerar listas de compras para a administração.

---

## 💡 A Solução e Arquitetura do Sistema
O sistema foi modularizado em frentes específicas de trabalho, todas consumindo um único Banco de Dados Relacional.

### 1. Módulo Administração (Gestão de Receitas)
- **Cadastro Centralizado:** Master data de insumos (com dosagem, carência e princípio ativo), quadras (variedade, hectares) e atividades operacionais.
- **Motor de Receitas:** Geração de ordens de tratamento vinculadas ao saldo do estoque em tempo real.
- **Legacy Match:** Geração de PDFs espelhados exatamente no formato legado (papel) da empresa para não causar atrito na adoção pelos funcionários mais antigos.
<img width="1428" height="732" alt="image" src="https://github.com/user-attachments/assets/f9abea97-37d7-499a-be74-4161f7ac5150" />
<img width="818" height="579" alt="image" src="https://github.com/user-attachments/assets/15254948-d3ff-4127-8836-fcdb3258948f" />


### 2. Módulo de Campo (Calendário Automatizado)
- **Lupa Integrada:** O encarregado não digita mais dados; ele puxa a receita "Pendente" enviada pelo ADM e a inicia.
- **Motor de Carência (Cronograma):** Ao finalizar uma atividade, o sistema calcula automaticamente a data final + período de carência química do produto, marcando no calendário a data exata da próxima janela de segurança.
- **Integração com Estoque:** O fechamento da atividade puxa automaticamente a quantidade real de "Bombas Aplicadas" direto do Almoxarifado.
<img width="1435" height="463" alt="image" src="https://github.com/user-attachments/assets/8ccb8e0a-b6f5-43ec-9e9e-df1e25b5a60f" />

<img width="1439" height="730" alt="image" src="https://github.com/user-attachments/assets/48831daa-52a2-4c4e-88e1-3915e7c9c5dc" />

### 3. Módulo Dashboard & Mapa Interativo SVG
- **Business Intelligence Embutido:** Dashboard com métricas de pulverizações em andamento, finalizadas e alertas de atraso.
- **Smart SVG Map:** Mapa vetorial da fazenda renderizado em tela. O sistema cruza os dados do banco e **pinta dinamicamente os lotes** conforme o status da operação.
- **Inspeção de Lote:** Clique sobre o talhão no mapa para abrir um card com os produtos aplicados, data, bombas utilizadas e carência química.
<img width="1426" height="727" alt="image" src="https://github.com/user-attachments/assets/4dad182d-c7c2-462e-b4a8-06bcfdd5c394" />
<img width="1438" height="732" alt="image" src="https://github.com/user-attachments/assets/bff2dea3-8090-49b8-b5ed-ac498cfb3a74" />

### 4. Módulo de Estoque (Almoxarifado)
- **Workflow de Ordem de Saída:** Importa os dados da Receita (ADM) com um clique e adiciona dados de logística (Turno, Nº Carreta, Bombas).
- **Lógica Avançada de Logística Reversa:** - Cálculo automático de devolução prevista `(Qtd Retirada - (Bombas Aplicadas * Dosagem))`.
  - **Alerta de Divergência:** O sistema acusa inconsistências na devolução fisíca em relação à teoria.
  - **Roteamento de Sobra:** Sistema permite registrar a transferência física de sobra de calda de um lote diretamente para a receita de outro lote, mantendo o controle de custos.

### 5. Supply Chain (Pedidos de Compra)
- **Cálculo de Necessidade:** Tela unificada confrontando produtos cadastrados vs. Saldo Atual, permitindo o preenchimento apenas da quantidade solicitada.
- **Funil de Recebimento:** O pedido baixado cai em um relatório de "Pendentes de Entrega". Na tela de "Entradas de Estoque" (recebimento de Nota Fiscal), o usuário puxa o pedido pendente com um clique, autopreenchimento de dados e fechamento do ciclo de compras.
<img width="1438" height="699" alt="image" src="https://github.com/user-attachments/assets/1a7b2e14-914b-423a-8f91-76ae2af600cd" />

---

## 🛠 Tecnologias Utilizadas
- **Frontend:** React, Vite (Renderização rápida, gestão complexa de estado).
- **Backend / Database:** Supabase, PostgreSQL (Banco de dados relacional, Autenticação, Row Level Security para proteção de dados).
- **Geração de Relatórios:** `jsPDF` e `jspdf-autotable` para relatórios complexos com desenhos de tabelas matemáticas e coordenadas vetoriais exatas.
- **Gráficos e Mapas:** Manipulação avançada do DOM com tags `SVG` interativas no React para mapeamento geográfico offline.

---

##  Impacto Gerado (Business Value)
- **Zero digitação dupla:** Dados inseridos uma vez trafegam por 4 departamentos diferentes sem erro humano.
- **Visibilidade Executiva:** O gestor não precisa mais ligar para o campo ou almoxarifado; o mapa pinta sozinho e o dashboard mostra o status de cada hectare em tempo real.
- **Controle de Perdas:** O módulo matemático de conferência de devolução reduziu o desperdício de defensivos agrícolas caros.
