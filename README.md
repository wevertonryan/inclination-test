# Plano de Projeto Ágil — Inclination Test

**Data de revisão:** 23/08/2026
**Prazo real de entrega (disciplina ISW-036):** app, documentação e slides prontos até 20/11/2026 (buffer de 1 semana antes do prazo formal de 23/11/2026)
**Meta interna do time:** projeto substancialmente concluído até 13/11/2026, deixando a última semana livre para imprevistos
**Orçamento:** R$ 0,00
**Metodologia:** Kanban

> **Legenda:** 🟨 = ainda depende de confirmação do Professor ou de informação que falta. Tudo que não está marcado já foi definido pelo time.

---

## 1. Contexto do projeto

| Campo | Informação |
|---|---|
| Nome do projeto | Inclination Test |
| Problema | Prova de Inclinação e Prova de Mar em barcos hoje são feitas manualmente com pêndulo e mangueira de nível — processo lento e sujeito a erro humano. |
| Objetivo principal | Simplificar esse processo de medição usando uma ferramenta que qualquer um já tem: o celular. Automatizar a medição e a geração dos dados da Prova de Inclinação e da Prova de Mar usando os sensores nativos do aparelho. |
| Público-alvo | Engenheiros Navais e Arquitetos Navais Autônomos. |
| Stakeholder / Product Owner | Professor da Escola Naval. |
| Equipe | Weverton Ryan e Pedro Mineo |
| Plataforma | Android apenas, por enquanto. |
| Tecnologia | React Native com Expo. |
| Login/contas de usuário | Não terá, nesta fase — é uma aplicação apenas de medição. Login só seria necessário para recursos futuros, como transmissão de dados em tempo real. |

---

## 2. Metodologia

**Kanban.**

A escolha é exclusivamente por preferência do time: como somos apenas duas pessoas, a comunicação entre nós já é fluida no dia a dia, então não há necessidade das cerimônias formais do Scrum. O que realmente precisamos é de um quadro Kanban para gerenciar as atividades e deixar claro o que cada um está fazendo — evitando retrabalho e mantendo visibilidade do progresso.

Colunas sugeridas do quadro: `A Fazer` → `Em andamento` → `Em validação/teste` → `Concluído`.

> ⚠️ A disciplina organiza as entregas em "Sprints" semanais e "Epics" — usamos essa nomenclatura no cronograma (Seção 7) só para bater com o calendário oficial da disciplina, mas o gerenciamento do dia a dia do time é via Kanban, não Scrum.

---

## 3. Visão, objetivos e critérios de sucesso

**Visão do produto:** ser a ferramenta de referência para Engenheiros e Arquitetos Navais realizarem Provas de Inclinação e de Mar de forma digital, prática e confiável, substituindo o pêndulo e a mangueira pelos sensores do próprio celular.

**Objetivo de negócio:** o objetivo real não é provar que sensores de celular têm precisão para uso profissional (embora isso esteja embutido no processo) — é simplificar o processo de medição usando uma ferramenta acessível a qualquer engenheiro. A validação técnica dos sensores é o caminho, não o fim.

### Critérios de sucesso

O sucesso do projeto tem dois horizontes:

- **Visão de longo prazo (fora do escopo do MVP):** a aplicação ser aprovada por algum órgão oficial e passar a ser usada de fato por Engenheiros Navais em situações reais.
- **Para o MVP (o que define sucesso agora):**
  - Erro de medição do ângulo de inclinação até **5%** de imprecisão comparado ao método do pêndulo 🟨 *(valor sugerido pelo time como aceitável para esta primeira instância; falta confirmar com o Professor se é esse o número que ele espera)*.
  - Dados gerados pelo app aprovados pelo Professor como equivalentes ao método tradicional.
  - App testado em pelo menos 1 embarcação real antes do prazo final.
  - O Professor aprovar a aplicação como adequada.

---

## 4. Escopo e MVP

**Dentro do escopo do MVP:**
- Captura de dados dos sensores nativos (acelerômetro, giroscópio, magnetômetro) para cálculo do ângulo de inclinação.
- Calibração do sensor em 1 clique, ou automaticamente antes de cada medição.
- Cálculo do ângulo de banda (Prova de Inclinação) e registro de série temporal (Prova de Mar).
- Registro do valor medido manualmente (pêndulo) ao lado do valor do app, para comparação de precisão.
- Geração dos dados/relatório da prova 🟨 *(ainda não decidimos se isso é um documento exportável ou só uma tela de resultados no próprio app — ver Seção 13)*.
- Interface simples para uso em campo (no convés).

**Fora do escopo do MVP:**
- Visualização remota em tempo real para terceiros fora do barco.
- Armazenamento em nuvem / sincronização automática (ex. Supabase).
- Contas de usuário / login (só necessário quando tivermos transmissão em tempo real).
- iOS — por enquanto restringimos a alguns dispositivos Android, pois precisamos confirmar se os sensores desses aparelhos são realmente adequados para medições de alta precisão. Se isso for confirmado como não sendo um problema, a restrição de plataforma pode ser reavaliada.
- Certificação oficial junto a órgãos marítimos — processo separado, não é entregável de software.

**Premissas:**
- Teremos acesso a pelo menos um celular Android para testes de sensores.
- Teremos acesso a uma embarcação real para o teste de campo antes do prazo final.
- O Professor atua como avaliador técnico/validador do método, além de Product Owner.

**Dependências críticas:**
- Validar com o Professor as fórmulas/método de cálculo da Prova de Inclinação — conhecimento de domínio que o time de dev não tem.
- Confirmar se o `expo-sensors` é preciso e configurável o suficiente para o que precisamos, ou se será necessário acesso mais direto aos sensores nativos (com pouca ou nenhuma camada de abstração). Isso pode exigir calibração e testes específicos por dispositivo.
- Agendar com o Professor o acesso à embarcação real para teste de campo.

---

## 5. Equipe

Ambos os membros desenvolvem todas as etapas da aplicação juntos; a divisão de tarefas específica é combinada conforme a demanda for aparecendo, sem papéis fixos.

| Membro | Conhecimentos |
|---|---|
| Membro 1 | Node.js, MongoDB, C#, Docker, lógica de programação, estrutura de dados, big data, levantamento de requisitos, gestão de projetos |
| Membro 2 | 🟨 **Pendente** — Peter, preencha aqui seus conhecimentos técnicos (pode incluir os mesmos que o Membro 1 já tem, se for o caso) |

**Product Owner:** o Professor da Escola Naval.

---

## 6. Backlog do produto (Épicos e histórias)

> Estimativas em Story Points são iniciais (Fibonacci: 1,2,3,5,8,13) e serão recalibradas depois do primeiro Sprint, já que não temos velocity histórica.

| ID | Épico | História de usuário | Prioridade | SP |
|---|---|---|---|---|
| US-01 | Épico 1 — Fundação | Como dev, quero configurar o projeto React Native/Expo com acesso aos sensores nativos, para ter a base técnica do app. | P0 | 5 |
| US-02 | Épico 1 — Fundação | Como engenheiro naval, quero calibrar o sensor (em 1 clique ou automaticamente antes da medição), para garantir que o ponto zero esteja correto. | P0 | 8 |
| US-03 | Épico 1 — Fundação | Como engenheiro naval, quero medir o ângulo de inclinação em tempo real na tela, para acompanhar a Prova de Inclinação. | P0 | 8 |
| US-04 | Épico 1 — Fundação | Como engenheiro naval, quero que o app filtre o ruído dos dados do sensor, para reduzir erro de leitura. | P0 | 8 |
| US-07 | Épico 2 — Confiabilidade | Como PO, quero registrar o valor medido manualmente (pêndulo) ao lado do valor do app, para comparar precisão. | P0 | 5 |
| US-05 | Épico 2 — Confiabilidade | Como arquiteto naval, quero registrar uma série temporal de inclinação durante a navegação (Prova de Mar). | P1 | 8 |
| US-06 | Épico 2 — Confiabilidade | Como engenheiro naval, quero que os dados coletados e o ângulo calculado sejam documentados/exportados, para formalizar a prova. | P1 | 5 |
| US-09 | Épico 2 — Confiabilidade | Como engenheiro naval, quero que os dados fiquem salvos no celular após a medição, para não perder o resultado se o app fechar. | P1 | 5 |
| US-10 | Épico 2 — Confiabilidade | Como engenheiro naval, quero usar o app sem internet, pois embarcações costumam não ter sinal. | P1 | 3 |
| US-08 | Épico 3 — Campo e fechamento | Como engenheiro naval, quero uma interface legível sob luz solar/no convés, para operar o app em condições reais. | P1 | 3 |
| US-11 (futuro) | Pós-MVP | Como stakeholder fora do barco, quero visualizar os dados em tempo real remotamente. | P2 | 13 |
| US-12 (futuro) | Pós-MVP | Como dono dos dados, quero que as medições sejam enviadas automaticamente para um servidor. | P2 | 8 |

🟨 A divisão em "Épico 1 / 2 / 3" acima é uma proposta do time para bater com os 3 marcos (EP1/EP2/EP3) da disciplina — ainda falta confirmar com as informações que a disciplina passou sobre como cada marco deve ser entregue (ver Seção 13).

**Exemplo de critério de aceitação (US-07, crítica para o projeto):**
```
Dado que uma medição manual (pêndulo) foi registrada como referência,
Quando o usuário insere esse valor no app junto à medição do sensor,
Então o app deve calcular e exibir a diferença percentual entre os dois valores,
E esse dado deve constar no resultado final para fins de validação.
```

---

## 7. Cronograma e Sprints

Cronograma alinhado ao calendário oficial da disciplina (sprints semanais). Estamos entrando agora na **Semana 04**.

| Semana | Data | O que a disciplina pede | O que o time entrega |
|---|---|---|---|
| 04 | 24–30/08 | **EP1** — Canvas de Modelo de Negócio + Plano de Projeto | Finalizar este plano e o Canvas |
| 05 (Sprint 01) | 31/08–06/09 | Sprint 01 | Setup do projeto (US-01) + spike técnico: verificar se `expo-sensors` atende à precisão necessária + confirmar com o Professor: fórmulas de cálculo, norma de referência, formato do relatório, data para teste em embarcação |
| 06 (Sprint 02) | 07–13/09 | Sprint 02 | Calibração do sensor (US-02) |
| 07 (Sprint 03) | 14–20/09 | Sprint 03 | Medição de ângulo em tempo real (US-03) |
| 08 (Sprint 04) | 21–27/09 | Sprint 04 | Filtragem de ruído (US-04) |
| 09 | 28/09–04/10 | **EP2** — Pitch 1º marco (Épico 1) + Documentação | Demonstrar Épico 1 completo (setup → calibração → medição → filtragem) |
| 10 (Sprint 05) | 05–11/10 | Sprint 05 | Comparação com pêndulo (US-07) |
| 11 (Sprint 06) ⚠️ feriado | 12–18/10 | Sprint 06 | Prova de Mar — série temporal (US-05) |
| 12 (Sprint 07) | 19–25/10 | Sprint 07 | Geração dos dados/relatório da prova (US-06) |
| 13 (Sprint 08) | 26/10–01/11 | Sprint 08 | Persistência local (US-09) + modo offline (US-10) |
| 14 | 02–08/11 | **EP3** — Pitch 2º marco (Épico 2) + Documentação | Demonstrar Épico 2 completo (confiabilidade + Prova de Mar + relatório + offline) |
| 15 (Sprint 09) | 09–15/11 | Sprint 09 + IV Congresso de Tecnologia | Usabilidade de campo (US-08) + início do teste real em embarcação — **meta interna: tudo pronto até 13/11** |
| 16 (Sprint 10) ⚠️ feriado | 16–22/11 | Sprint 10 + **EF — Entrega Final** | Ajustes finais, aprovação do Professor, empacotamento de entregáveis (App + Doc + Slides) — **pronto até 20/11** |
| 17 | 23–27/11 | Semana do Projeto Integrador de DSM | Semana de reserva/contingência (prazo formal da disciplina) |

> ⚠️ **Risco de cronograma:** o teste real em embarcação (dependência externa) está planejado para a Semana 15, mas ainda não tem data confirmada com o Professor. Se ele revelar problemas de precisão, o buffer é curto. Recomendo agendar essa data o quanto antes (ver Sprint 01).

---

## 8. Definition of Ready / Definition of Done

**Pronto para entrar no fluxo (DoR):**
- História no formato "Como... quero... para...", com critério de aceitação Given/When/Then.
- Dependências técnicas identificadas.
- Quando aplicável, fórmula/método naval validado com o Professor.

**Concluído (DoD):**
- Código funcionando no dispositivo Android de teste.
- Critério de aceitação validado manualmente.
- Sem bugs bloqueantes conhecidos.
- Código versionado (Git).
- Validado com dado de referência manual, quando envolver precisão de medição.

---

## 9. Qualidade e testes

| Tipo de teste | Estratégia | Prioridade |
|---|---|---|
| Testes unitários | Funções de cálculo de ângulo e filtragem de ruído | Alta |
| Testes funcionais | Fluxo completo: calibrar → medir → gerar dados | Alta |
| Testes de precisão | Comparação sistemática entre valor do app e valor do pêndulo, em múltiplas condições | **Crítica** |
| Testes de regressão | Reexecutar comparação de precisão a cada mudança na lógica de cálculo | Alta |
| Testes de campo | Local, por enquanto; teste em embarcação real depende de agenda com o Professor | Alta |
| Testes de desempenho | Latência de atualização do ângulo em tela (meta: <500ms) | Média |

**Critério central:** nenhuma funcionalidade de medição é considerada pronta sem comparação documentada com o método manual.

---

## 10. Arquitetura e aspectos técnicos

- App em **React Native + Expo** — escolhido pela experiência prévia do time com Node.js e React.
- Módulo de captura de sensores (acelerômetro, giroscópio, magnetômetro) — 🟨 usando `expo-sensors` provisoriamente; a confirmar se atende à precisão/controle necessários ou se será preciso acesso mais direto ao hardware (com calibração e testes específicos por dispositivo).
- Módulo de filtragem de ruído (ex. filtro complementar ou Kalman simples).
- Módulo de cálculo do ângulo de inclinação.
- Persistência local no dispositivo — sem backend/nuvem no MVP.
- Infraestrutura gratuita: GitHub para versionamento, Expo EAS Build (camada gratuita) para gerar o APK de teste.

---

## 11. Gestão de riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Sensores do celular não atingem precisão suficiente | Crítico | Testar precisão desde o Sprint 01; comparar sistematicamente com o pêndulo |
| `expo-sensors` não dar controle/precisão suficiente | Alto | Spike técnico no Sprint 01; alternativa é acesso mais direto ao hardware |
| Falta de acesso a embarcação real para teste | Alto | Agendar com o Professor já no Sprint 01, não deixar para a Semana 15 |
| Conhecimentos do Membro 2 ainda não mapeados | Médio | Preencher a Seção 5 e redistribuir tarefas conforme necessário |
| Orçamento zero limita ferramentas | Médio | Usar apenas camadas gratuitas (Expo, GitHub) |

---

## 12. Comunicação e entregáveis

**Comunicação:** por ser um time de 2 pessoas, a comunicação do dia a dia é direta (sem cerimônias formais); o quadro Kanban é o ponto único de verdade sobre o andamento. Reunião com o Professor ao final de cada marco (EP1/EP2/EP3) para validação técnica.

**O que precisa ser entregue até o prazo final:**
- Aplicação funcionando.
- Documentação (inclui modelo de negócio Canvas e arquitetura).
- Apresentação em slides.

---

## 13. Pendências — o que falta confirmar

**Com o Professor:**
1. O valor de X% de erro aceitável é 5%, como o time sugeriu, ou o Professor tem outro número em mente?
2. Fórmulas/método de cálculo da Prova de Inclinação e da Prova de Mar.
3. Existe uma norma específica (IMO, NORMAM, ISO) que a prova precisa seguir?
4. Data e embarcação disponíveis para o teste de campo real.
5. Formato do relatório/dados finais — documento exportável ou só tela no app?

**Internas, do time:**
6. Conhecimentos técnicos do Membro 2 (Seção 5).
7. Informações sobre como os 3 marcos (EP1/EP2/EP3 → Épicos 1/2/3) devem ser entregues, conforme passado pela disciplina — a proposta da Seção 6/7 é uma hipótese do time até isso ser confirmado.
