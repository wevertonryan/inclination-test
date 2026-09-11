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

### 🔜 Calibragem (a especificar)
- Lista com **1 sensor (Acelerômetro)** + status + botão que calibra de uma vez.
- Status possíveis: Calibrado / Não Calibrado / Calibrando / Não identificado / Erro na Calibragem.

### 🔜 Relatórios, Relatório (detalhe), Teste de Integridade, Configurações
- A especificar tela a tela. A tela Relatórios já recebe a lista de relatórios salvos pelo store do App.