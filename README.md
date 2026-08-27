# Plano de Projeto Ágil de Software — Inclination Test

## 1. Introdução

O **Inclination Test** é um aplicativo móvel para automatizar a Prova de Inclinação e a Prova de Mar de embarcações, hoje realizadas manualmente com pêndulo e mangueira de nível. O app usa os sensores nativos do celular (acelerômetro, giroscópio, magnetômetro) para medir o ângulo de inclinação da embarcação, comparando o resultado com o método tradicional para validar sua precisão.

Este documento formaliza o projeto ágil de software referente ao Projeto Integrador do 5º semestre, descrevendo a solução, seu contexto, a arquitetura básica, o planejamento de atividades, responsabilidades e os marcos de entrega do semestre. O foco será exclusivamente para a entrega do MVP, com menção sobre planos futuros, mas que ainda não está definido.

### Contexto de negócio

Este projeto está sendo desenvolvido como Projeto Integrador da Fatec, tendo o professor Alex Prado como stakeholder envolvido.

**Canvas do Modelo de Negócio:**

| Bloco | Conteúdo |
|---|---|
| Segmentos de Clientes | Engenheiros Navais e Arquitetos Navais Autônomos |
| Proposta de Valor | Medir inclinação (Prova de Inclinação / Prova de Mar) de forma prática e confiavel, usando o celular em vez métodos manuais, como pêndulo e mangueira de nível |
| Canais | Divulgação acadêmica pelo professor da Naval Alex Prado; distribuição via Google Play; Escola de Inovadores (Analisando se vamos realmente fazer); |
| Relacionamento com Clientes | Suporte direto/comunidade acadêmica nesta fase; uso self-service pelo app |
| Fontes de Receita | Não definido neste estágio |
| Recursos Principais | Equipe de desenvolvimento (2 pessoas), conhecimento de domínio do Professor, ferramentas de desenvolvimento |
| Atividades-Chave | Desenvolvimento do app de maneira continua |
| Parcerias Principais | Professor Alex Prado; Fatec Jahu |
| Estrutura de Custos | Custo hora de 2 desenvolvedores "Juniors" - R$30,00/h |

### Contexto do aplicativo móvel

O app é isolado/standalone nesta fase do MVP: toda a medição, cálculo e armazenamento acontecem localmente no dispositivo, pois é uma aplicação para ser utilizada para fins de medição na própria embarcação.

Ele não faz parte de um ecossistema maior hoje, mas foi desenhado prevendo evolução futura (fora do escopo deste MVP) para integrar uma plataforma com transmissão de dados em tempo real e login de usuário.

### Motivação

O processo atual de Prova de Inclinação depende de instrumentos analógicos (pêndulo, mangueira de nível) e leitura manual, sujeita a erro humano e a um setup mais lento. A motivação do projeto é simplificar esse processo usando uma ferramenta que qualquer engenheiro naval já tem em mãos — o celular — tornando a medição mais rápida sem abrir mão da precisão exigida pela prática profissional.

### Identificação do grupo de trabalho
O trabalho da equipe será distribuido conforme a demanda for aparecendo, não terá papeis fixos para cada membro

| Campo | Informação |
|---|---|
| Nome da equipe | JLY |
| Weverton Ryan (Porta Voz) | HTML, CSS, JS, React, C#, Node.js, MongoDB, C#, Docker, Lógica de Programação, Estrutura de Dados, Big Data, Gestão de Projetos |
| Pedro Mineo | HTML, CSS, JS, React, C#, Node.js, SQL, MongoDB, PHP, Habilidades de Comunicação |
### Repositório

Link do Repositório: [https://github.com/wevertonryan/inclination-test](https://github.com/wevertonryan/inclination-test)

---

## 2. Aplicativo para Dispositivo Móvel

### Visão do produto

Ser a ferramenta de referência para Engenheiros e Arquitetos Navais realizarem Provas de Inclinação e de Mar de forma digital, prática e confiável, substituindo o pêndulo e a mangueira pelos sensores do próprio celular. Quando completamente pronto e validado, o app deve ser aceito como método equivalente ao tradicional para uso real em campo.

### Objetivos do desenvolvimento do app

O app deve ser desenvolvido para simplificar o processo de medição da Prova de Inclinação e da Prova de Mar, hoje manual e dependente de instrumentos físicos específicos. Ele servirá para captar os dados dos sensores do celular, calibrá-los, calcular o ângulo de inclinação com precisão próxima à do método tradicional (pêndulo) e apresentar/registrar esse resultado — servindo tanto para uso prático em campo quanto como estudo acadêmico de viabilidade do uso de sensores de smartphone para esse fim.

### Arquitetura básica

O app é organizado em três camadas, todas rodando localmente no dispositivo (sem backend no MVP):

1. **Camada de Apresentação** (React Native/Expo): telas de Calibração, Medição, Prova de Mar e Resultado/Relatório.
2. **Núcleo de Processamento**: módulo de acesso aos sensores nativos (acelerômetro, giroscópio, magnetômetro), módulo de filtragem de ruído e módulo de cálculo do ângulo de inclinação.
3. **Persistência local**: armazenamento no próprio dispositivo, sem sincronização em nuvem nesta fase.

O fluxo é: os sensores nativos alimentam o módulo de sensores → os dados passam pelo filtro de ruído → o módulo de cálculo determina o ângulo → o resultado é exibido nas telas de Medição/Prova de Mar e gravado localmente → a tela de Resultado lê os dados salvos para gerar o relatório.

![Diagrama de Arquitetura](arquitetura.png)

### Metas e restrições da arquitetura

| Item | Definição | Justificativa |
|---|---|---|
| Tipo de app | Híbrido (React Native + Expo) | Time já tem experiência com Node.js/React, reduzindo a curva de aprendizado e acelerando o desenvolvimento dentro do prazo do semestre |
| Plataforma | Apenas Android nesta fase | Precisão dos sensores precisa ser validada por dispositivo; restringir a plataforma reduz a variável de hardware desconhecido. iOS pode ser reavaliado se a limitação de acesso a sensores não se confirmar um problema |
| Acesso a sensores | `expo-sensors`, com possível necessidade de acesso mais direto ao hardware 🟨 | A ser confirmado por spike técnico (Sprint 01) — a aplicação exige alta precisão, e ainda não se sabe se a camada de abstração do Expo é suficiente |
| Backend/nuvem | Nenhum no MVP | Escopo do MVP é validar a medição local; sincronização em nuvem é recurso futuro |
| Autenticação | Nenhuma no MVP | App é apenas de medição; login só seria necessário para recursos futuros como transmissão em tempo real |
| Orçamento de infraestrutura | R$ 0,00 — GitHub e camada gratuita do Expo EAS Build | Restrição de orçamento do projeto acadêmico |

---

## 3. Projeto Ágil de Software

### Escopo

**Dentro do escopo do MVP:**
- Captura de dados dos sensores nativos para cálculo do ângulo de inclinação.
- Calibração do sensor em 1 clique, ou automaticamente antes de cada medição.
- Cálculo do ângulo de banda (Prova de Inclinação) e registro de série temporal (Prova de Mar).
- Registro do valor medido manualmente (pêndulo) ao lado do valor do app, para comparação de precisão.
- Geração dos dados/relatório da prova 🟨 *(ainda não decidido se será documento exportável ou apenas tela de resultado no app)*.
- Interface para uso em campo (convés).

**Fora do escopo do MVP:**
- Visualização remota em tempo real para terceiros.
- Armazenamento em nuvem / sincronização automática.
- Contas de usuário / login.
- iOS (ver restrições de arquitetura).
- Certificação oficial junto a órgãos marítimos.

Não é o app completo da visão de produto: é o subconjunto necessário para validar, em ambiente real, se sensores de smartphone atingem precisão aceitável para a Prova de Inclinação — a evolução para produto completo (login, tempo real, nuvem) é trabalho futuro fora deste semestre.

### Papéis e responsabilidades

Por ser um time de 2 pessoas, ambos os membros desenvolvem todas as etapas da aplicação juntos, dividindo tarefas específicas conforme a demanda aparece — não há papéis fixos e estanques no dia a dia. Ainda assim, para fins de responsabilização formal:

| Papel | Responsável | Responsabilidades principais |
|---|---|---|
| Product Owner (PO) | Professor da disciplina | Prioriza o backlog, valida entregas de cada marco (EP2/EP3/EF), aprova a precisão obtida |
| Dev (Mobile Fullstack) | Membro 1 e Membro 2 | Implementação de todas as camadas do app (sensores, cálculo, UI, persistência) |
| Levantamento de requisitos / Gestão de projeto | Membro 1 | Organização do cronograma, levantamento de requisitos junto ao Professor |
| 🟨 Papel adicional | Membro 2 | A definir conforme os conhecimentos técnicos do Membro 2 (Seção 1) |
| QA (testes de precisão) | Membro 1 e Membro 2 | Validação cruzada dos resultados do app contra o método manual (pêndulo) |
| UX (usabilidade de campo) | Membro 1 e Membro 2 | Ajustes de legibilidade/usabilidade para uso no convés |

### Backlog do produto

> Estimativas em Story Points (Fibonacci: 1,2,3,5,8,13), a recalibrar após o primeiro Sprint.

| ID | Épico | História de usuário | Prioridade | SP |
|---|---|---|---|---|
| US-01 | Épico 1 | Como dev, quero configurar o projeto React Native/Expo com acesso aos sensores nativos, para ter a base técnica do app. | P0 | 5 |
| US-02 | Épico 1 | Como engenheiro naval, quero calibrar o sensor (em 1 clique ou automaticamente antes da medição), para garantir que o ponto zero esteja correto. | P0 | 8 |
| US-03 | Épico 1 | Como engenheiro naval, quero medir o ângulo de inclinação em tempo real na tela, para acompanhar a Prova de Inclinação. | P0 | 8 |
| US-04 | Épico 1 | Como engenheiro naval, quero que o app filtre o ruído dos dados do sensor, para reduzir erro de leitura. | P0 | 8 |
| US-07 | Épico 2 | Como PO, quero registrar o valor medido manualmente (pêndulo) ao lado do valor do app, para comparar precisão. | P0 | 5 |
| US-05 | Épico 2 | Como arquiteto naval, quero registrar uma série temporal de inclinação durante a navegação (Prova de Mar). | P1 | 8 |
| US-06 | Épico 2 | Como engenheiro naval, quero que os dados coletados e o ângulo calculado sejam documentados/exportados, para formalizar a prova. | P1 | 5 |
| US-09 | Épico 2 | Como engenheiro naval, quero que os dados fiquem salvos no celular após a medição, para não perder o resultado se o app fechar. | P1 | 5 |
| US-10 | Épico 2 | Como engenheiro naval, quero usar o app sem internet, pois embarcações costumam não ter sinal. | P1 | 3 |
| US-08 | Épico 3 | Como engenheiro naval, quero uma interface legível sob luz solar/no convés, para operar o app em condições reais. | P1 | 3 |
| US-11 (futuro) | Pós-MVP | Como stakeholder fora do barco, quero visualizar os dados em tempo real remotamente. | P2 | 13 |
| US-12 (futuro) | Pós-MVP | Como dono dos dados, quero que as medições sejam enviadas automaticamente para um servidor. | P2 | 8 |

**Exemplo de critério de aceitação (US-07):**
```
Dado que uma medição manual (pêndulo) foi registrada como referência,
Quando o usuário insere esse valor no app junto à medição do sensor,
Então o app deve calcular e exibir a diferença percentual entre os dois valores,
E esse dado deve constar no resultado final para fins de validação.
```

### Divisão do trabalho em grandes fases (marcos)

| Marco | Entrega | Data prevista |
|---|---|---|
| **EP2** | Pitch do 1º marco — Épico 1 completo (setup, calibração, medição em tempo real, filtragem de ruído) + entrega de documentação | Semana de 28/09 a 04/10/2026 🟨 *(dia exato a confirmar)* |
| **EP3** | Pitch do 2º marco — Épico 2 completo (comparação com pêndulo, Prova de Mar, geração de relatório, persistência local e modo offline) + entrega de documentação | Semana de 02 a 08/11/2026 🟨 *(dia exato a confirmar)* |
| **EF** | Entrega Final — Épico 3 concluído (usabilidade de campo, teste em embarcação real) + envio de todos os entregáveis (App, Documentação, Slides) | Até 20/11/2026 (meta interna: 13/11/2026), prazo formal da disciplina em 22/11/2026 |

### Planejamento de Sprints

| Mês/Épico | Sprint Nº | Foco/Objetivo da Sprint | Entregáveis/Histórias |
|---|---|---|---|
| Ago-Set / Épico 1 | Sprint 01 (31/08–06/09) | Base técnica do app + validar viabilidade dos sensores | Setup do projeto (US-01); spike técnico de precisão do `expo-sensors`; confirmar com o Professor fórmulas de cálculo, norma de referência, formato do relatório e data de teste em embarcação |
| Set / Épico 1 | Sprint 02 (07–13/09) | Calibração | Calibração do sensor (US-02) |
| Set / Épico 1 | Sprint 03 (14–20/09) | Medição em tempo real | Ângulo de inclinação em tempo real (US-03) |
| Set / Épico 1 | Sprint 04 (21–27/09) | Confiabilidade do dado bruto | Filtragem de ruído (US-04) |
| — | **EP2** (28/09–04/10) | Marco 1 | Demonstração do Épico 1 completo + documentação |
| Out / Épico 2 | Sprint 05 (05–11/10) | Validação de precisão | Comparação com pêndulo (US-07) |
| Out / Épico 2 | Sprint 06 (12–18/10) ⚠️ feriado | Prova de Mar | Série temporal de inclinação (US-05) |
| Out / Épico 2 | Sprint 07 (19–25/10) | Formalização dos dados | Geração do relatório/dados da prova (US-06) |
| Out-Nov / Épico 2 | Sprint 08 (26/10–01/11) | Robustez de uso em campo | Persistência local (US-09) + modo offline (US-10) |
| — | **EP3** (02–08/11) | Marco 2 | Demonstração do Épico 2 completo + documentação |
| Nov / Épico 3 | Sprint 09 (09–15/11) | Usabilidade e teste real | Interface para uso em campo (US-08); início do teste em embarcação real; IV Congresso de Tecnologia — meta interna: tudo pronto até 13/11 |
| Nov / Épico 3 | Sprint 10 (16–22/11) ⚠️ feriado | Fechamento | Ajustes finais, aprovação do Professor, empacotamento dos entregáveis (App + Doc + Slides) — pronto até 20/11 |
| — | **EF** (até 22/11) | Marco 3 / Entrega Final | Conclusão do Épico 3 e envio de todos os entregáveis |

> Semana de 23 a 27/11 é reserva de contingência da disciplina (Semana do Projeto Integrador de DSM), sem tarefas de sprint alocadas.

### Definição de preparada (Definition of Ready)

- História no formato "Como... quero... para...", com critério de aceitação Given/When/Then.
- Dependências técnicas identificadas.
- Quando envolver conhecimento naval (fórmulas, normas), validado previamente com o Professor.

### Definição de pronta (Definition of Done)

- Código funcionando no dispositivo Android de teste.
- Critério de aceitação validado manualmente.
- Sem bugs bloqueantes conhecidos.
- Código versionado no repositório Git.
- Quando envolver precisão de medição: validado com dado de referência manual (pêndulo).

### Gestão de riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Sensores do celular não atingem precisão suficiente | Média | Crítico | Testar precisão desde o Sprint 01; comparar sistematicamente com o pêndulo |
| `expo-sensors` não oferecer controle/precisão suficiente | Média | Alto | Spike técnico no Sprint 01; alternativa é acesso mais direto ao hardware |
| Falta de acesso a embarcação real para teste | Média | Alto | Agendar com o Professor já no Sprint 01, não deixar para a Sprint 09 |
| Conhecimentos do Membro 2 ainda não mapeados | Alta | Médio | Preencher a Seção 1 e redistribuir tarefas conforme necessário |
| Orçamento zero limita ferramentas | Baixa | Médio | Usar apenas camadas gratuitas (Expo, GitHub) |
| Atraso por dependência do Professor (fórmulas, normas, agenda) | Média | Alto | Levar essas perguntas já para a Sprint 01, com prazo de resposta combinado |