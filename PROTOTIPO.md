# Resumo do Protótipo — Inclination Test

## Objetivo

Protótipo **interativo** que simula o funcionamento do app, focado em definir a **interface gráfica e layout** de todas as telas do aplicativo final. **Sem** funcionalidades, sensores ou dados reais — tudo simulado.

## Decisões já tomadas

- **Stack:** projeto React normal (Vite), layout **exclusivo para mobile**, sem moldura de smartphone.
- **Execução:** você abre no celular via `npm run dev` acessando o IP da máquina pela rede.
- **Ritmo:** desenvolvimento **tela a tela**, com review/aprovação entre cada uma.
- **Simulações:** dados de sensor (X, Y, Z), gravação de registro, calibração, busca, etc., falsos apenas para demonstrar o funcionamento.

## Telas a desenvolver (ordem a confirmar)

1. **Home — Medição**
2. **Calibragem**
3. **Relatórios** (listagem/busca)
4. **Relatório** (detalhe)
5. **Teste de Integridade** (a especificar)
6. **Configurações** (a especificar)

## Navegação

Bottom Navigation Bar: **Home, Calibragem, Relatórios, Testes, Configurações**.
Em certos momentos (ex.: durante uma gravação) a nav bar é ocultada.

## Fluxo simulado de ponta a ponta

Gravar registro na Home → gera um relatório → aparece na listagem de Relatórios → abre no detalhe (com menu de Deletar/Exportar PDF).

## Status do desenvolvimento

Protótipo em `proto/` (Vite + React, arquitetura por telas, componentes e simuladores).

### ✅ Home — Medição (implementado)

**Estado normal (idle):**
- Header com **chip de sensor** (ícone de sensor + ícone de status colorido) — tocar leva para a Calibragem. Status: `✓` calibrado (verde), `✕` não calibrado (vermelho), `?` não identificado (cinza), `!` erro na calibragem (vermelho).
- **Slice de seleção** no canto superior direito acima dos gráficos: `XYZ` (três gráficos de linha, X âmbar / Y azul / Z verde) e `ABS` (um gráfico com a magnitude), ambos com ícone SVG + rótulo.
- **Gráficos de linha ao vivo** com dados simulados (~12 leituras/s, janela de 64 pontos). **Congelados quando não há gravação** — só se movem durante a gravação.
- **Botão de gravar**: círculo vermelho com círculo branco central, flutuante e centralizado acima da nav bar.

**Gravando/pausado (imersivo):**
- Header e nav bar **somem com animação** (header desliza para cima, nav bar desce). Volta ao normal ao cancelar/salvar.
- **Cronômetro** `00:00 · 000` (minutos·segundos·milésimos) no lugar do header, surge suave.
- Barra inferior (na posição da nav bar): **✕ vermelho** (cancelar) à esquerda, botão de gravar centralizado (mudou com a nav bar), **✓ verde** (salvar) à direita — os laterais surgem suave.
- Botão central: **⏸ duas barras** enquanto grava; **▶ play** quando pausado (retomar).
- **Pausa** para cronômetro e gráficos; retomar continua de onde parou.
- **Cancelar (✕)** → modal "Cancelar gravação?" + "Os dados registrados serão perdidos para sempre" com **[Voltar]** e **[Cancelar gravação]**.
- **Salvar (✓)** → modal com input de título + **[Voltar]** e **[Salvar]**. Ao salvar cria o registro (`{id, título, data, duração, média e desvio padrão por eixo, nº de amostras}`) no store do App e volta para a Home normal.

### ✅ Calibragem (implementado)
- Lista de **5 sensores** (Acelerômetro, Giroscópio, Magnetômetro, Barômetro, GPS) em **tabela invisível** (sem linhas/cards): `[ícone sensor] Nome ......... [status à direita]`, com cabeçalho discreto **SENSOR / STATUS**.
- Status possíveis: `✓` Calibrado (verde) · `✕` Não calibrado (vermelho) · `?` Não identificado (cinza) · `!` Erro na calibragem (vermelho) · spinner (âmbar, animado) para **Calibrando**.
- **Botão de calibragem em 1 clique**: redondo, âmbar, flutuante e centralizado acima da nav bar, com **ícone de chave de boca**. O layout não muda durante o processo.
- **Ao tocar**: sensores reconhecidos (≠ não identificado) passam por **spinner em sequência** (~650ms cada) e terminam **✓ Calibrado**; os **?** permanecem. Botão desabilitado durante a execução.
- **Sincronia com a Home**: ao final, o status do sensor da Home (Acelerômetro) atualiza para ✓ no chip do header.
- **Modal de status**: tocar no status de qualquer sensor abre um card flutuante (sem escurecer a tela, sem botão) explicando a situação daquele sensor — fecha ao tocar fora.

### ✅ Relatórios — Listagem (implementado)
- **Seed de exemplos**: 4 relatórios de exemplo no store (título, data, duração, localização, média/desvio); salvos na Home entram no topo.
- **Barra de busca**: campo arredondado com **lupa** dentro à esquerda + botão **funil** à direita (abre modal de filtros). Busca por **título ou localização** (case-insensitive).
- **Texto acima da lista**: "Todos os relatórios" por padrão; vira "Relatórios pesquisados/filtrados" com busca/filtro ativos.
- **Cards por item**: cada relatório em um card com **título · data à direita · localização abaixo** ("—" quando GPS desligado/vazio). Título/localização com ellipsis.
- **Modal de filtro (funil)**: grupos **Data**, **Localização** e **Tempo gravado** (≤30s · 30s–1min · ≥1min), com *chips* de valores derivados da lista, seleção múltipla, botões **Limpar** (zera) e **Aplicar** (fecha). Filtros combinam entre si e com a busca.
- **Estado vazio**: "Nenhum relatório encontrado" quando nada corresponde.
- Item tocável abre a tela de detalhe do relatório.

### ✅ Relatório — Detalhe (implementado)
- **Sem nav bar** nessa tela — a nav bar fica oculta e reaparece ao tocar em **‹ voltar** (retorna à listagem).
- **Header**: ‹ voltar + "Relatório" + **⋮** (abre modal com **Excluir** e **Exportar PDF**).
  - Excluir → confirmação "Excluir relatório?" ("Esta ação não pode ser desfeita") com [Voltar]/[Excluir]; ao confirmar remove da lista e volta.
  - Exportar PDF → toast curto "PDF exportado".
- **Seção Informações** (card): título em destaque, divisor, **Localização / Data (dd/mm/aaaa) / Hora (hh:mm:ss)**, divisor, **Tempo registrado (mm:ss)**.
- **Seção Informações da gravação**:
  - **Diferenciação em graus bem grande** com **gauge/arco SVG** (ponteiro): valor = **média do eixo X**, em âmbar.
  - **4 gráficos fixos** (X, Y, Z, Absoluto — magnitude) com séries simuladas determinísticas por relatório (hash do id + seno + ruído).
  - **Medidas**: tabela Média | Desvio para X, Y, Z, Absoluto (valores pt-BR com vírgula, ex. `3,2°`).

### 🔜 Teste de Integridade, Configurações
- A especificar tela a tela. A tela Relatórios já recebe a lista de relatórios salvos pelo store do App.