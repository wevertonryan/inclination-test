# TELAS — Especificação de Interface

> Documento de referência para criação do design das telas. Descreve a organização visual, os elementos de interface, os estados e os fluxos de navegação. Não define cores, tipografia, ícones específicos ou acabamento visual.

## Visão geral da experiência

O aplicativo é organizado em telas verticais, com um cabeçalho no topo e uma barra de navegação fixa no rodapé. O conteúdo ocupa o espaço entre esses dois elementos.

A navegação principal é feita pela barra inferior, com cinco destinos: Home, Calibragem, Relatórios, Testes e Configurações.

A barra de navegação é ocultada na tela de Relatório e durante a gravação na Home, criando uma experiência mais imersiva nesses momentos.

## Estrutura geral das telas

### Cabeçalho
- Faixa fixa no topo da tela.
- Organizado em três áreas:
  - **Esquerda**: ação principal da tela ou indicador de status.
  - **Centro**: título da tela.
  - **Direita**: ação secundária.
- O título permanece centralizado mesmo quando há ações apenas em um dos lados.
- Pode ser ocultado em estados de imersão, como durante a gravação.

### Conteúdo
- Área principal da tela, com rolagem vertical quando necessário.
- Respeita o espaço do cabeçalho no topo e da barra de navegação no rodapé.
- Pode conter cartões, listas, tabelas, gráficos, medidores e botões de ação.

### Barra de navegação inferior
- Barra fixa no rodapé.
- Cinco destinos, cada um com ícone e rótulo:
  - **Home**
  - **Calibragem**
  - **Relatórios**
  - **Testes**
  - **Configurações**
- O destino correspondente à tela atual aparece em destaque.
- O toque em um destino troca a tela exibida.

### Sobreposições
- **Modal**: cartão centralizado sobre a tela, com fundo escurecido, título, conteúdo e ações.
- **Painel informativo**: cartão sobreposto sem escurecer o conteúdo ao fundo, usado para informações rápidas.
- **Camada de gravação**: sobreposição em tela cheia usada durante a gravação na Home.
- **Mensagem temporária**: aviso breve exibido na parte inferior da tela após uma ação.

## Padrões de interface

### Cartões
- Blocos usados para agrupar informações.
- Aparecem em relatórios, gráficos, medidas e dados brutos.
- Podem conter título, subtítulo, legenda, conteúdo principal e ações.

### Listas
- Itens organizados verticalmente, com espaçamento entre si.
- Cada item pode funcionar como um cartão clicável.
- Usadas na lista de relatórios e na lista de sensores.

### Tabelas
- Organizadas em linhas e colunas, com cabeçalho.
- Usadas na Calibragem, nas medidas do relatório e nos dados brutos.

### Busca e filtros
- Campo de busca com ícone à esquerda com placeholder.
- Botão circular de filtro ao lado do campo.
- Filtros apresentados em um modal com grupos de etiquetas selecionáveis.
- Rótulo acima da lista indica se os resultados estão completos ou filtrados.

### Botões de ação circular
- Botões redondos e flutuantes, posicionados acima da barra de navegação.
- Usados para ações principais: gravar na Home e calibrar na Calibragem.
- Permanecem visíveis sobre o conteúdo.

### Estados vazios
- Mensagem centralizada na área de conteúdo.
- Usada quando não há resultados.

## Elementos recorrentes

### Indicador de status do sensor
- Elemento clicável exibido no lado esquerdo do cabeçalho da Home.
- Combina o ícone de sensor com um selo de status.
- Ao tocar, leva para a tela de Calibragem.
- Estados possíveis:
  - Calibrado.
  - Não calibrado.
  - Não identificado.
  - Erro na calibragem.

### Inclinômetro
- Instrumento circular que representa visualmente a inclinação em dois eixos: **Trim** e **Roll**.
- Possui duas escalas sobrepostas:
  - **Escala do Trim**: escala vertical deslocável, com graduação de 0 a 90 graus para cima e para baixo. Os números relevantes ficam centralizados na coluna vertical e as marcações ficam distribuídas nos lados esquerdo e direito.
  - **Escala do Roll**: anel externo circular, com graduação de 0 a 180 graus, marcações a cada 10 graus e números a cada 30 graus.
- No centro, há uma linha horizontal fixa que representa o Trim e um ponteiro superior que representa o Roll.
- Abaixo do instrumento, há uma legenda com dois itens:
  - **TRIM** e o valor atual em graus.
  - **ROLL** e o valor atual em graus.
- O valor de Trim move a escala vertical para cima ou para baixo.
- O valor de Roll gira a escala circular.
- O elemento é apenas informativo, sem interação.
- Na Home, fica centralizado verticalmente quando não há gravação. Ao iniciar a gravação, sobe para abrir espaço para o gráfico. Ao encerrar, volta ao centro.

### Gráfico de linhas Trim × Roll
- Gráfico com duas linhas: Trim e Roll.
- Cabeçalho com o nome do gráfico e a legenda das duas séries.
- Eixo vertical com valores em graus.
- Eixo horizontal com marcações de tempo.
- Linha horizontal de referência no centro.
- Aparece durante a gravação na Home e na tela de Relatório.

### Medidor de abertura angular
- Medidor em forma de arco aberto na parte superior.
- Exibe o intervalo entre o menor e o maior valor de Roll.
- O arco preenchido representa a abertura entre os valores mínimo e máximo.
- Abaixo do arco, aparece o valor da abertura em graus.
- Legenda: "Abertura (máx − mín)".

## Home

### Cabeçalho
- Lado esquerdo: indicador de status do sensor.
- Centro: título "Home".
- O cabeçalho inteiro é ocultado durante a gravação.

### Conteúdo — sem gravação
- Inclinômetro centralizado verticalmente na área de conteúdo, acompanhado da leitura de Trim e Roll.
- Botão circular de gravar, flutuante, posicionado logo acima da barra de navegação.
- Nenhum outro bloco de conteúdo é exibido.

### Conteúdo — durante a gravação
- Cronômetro centralizado no topo da tela, sobreposto ao conteúdo.
- Inclinômetro com o mesmo modelo da Home, posicionado na parte superior, dando espaço ao gráfico.
- Cartão compacto do gráfico Trim × Roll abaixo do Inclinômetro, sem legenda, indicadores de janela/taxa ou estatísticas adicionais.
- Barra de ações inferior com três botões apenas com símbolos:
  - **Cancelar**: botão circular à esquerda.
  - **Pausar/Retomar**: botão circular central, alternando entre os dois estados.
  - **Salvar**: botão circular à direita.
- Cabeçalho e barra de navegação permanecem ocultos.

### Modal de cancelamento
- Modal centralizado na tela.
- Título: "Cancelar gravação?"
- Texto de aviso informando que os dados serão perdidos.
- Ações:
  - **Voltar**: fecha o modal e mantém a gravação.
  - **Cancelar gravação**: descarta os dados e encerra a gravação.

### Modal de salvamento
- Modal centralizado na tela.
- Título: "Salvar gravação".
- Campo de texto com o nome da gravação.
- Sem informações adicionais de dispositivo, sincronização ou contagem de amostras.
- Ações:
  - **Voltar**: fecha o modal e mantém a gravação.
  - **Salvar**: cria o relatório e encerra a gravação.

### Fluxo de gravação
1. A tela inicia com o Inclinômetro centralizado e o botão de gravar visível.
2. Ao tocar em gravar, o cabeçalho e a barra de navegação desaparecem.
3. O cronômetro, o gráfico e a barra de ações aparecem.
4. O Inclinômetro sobe para acomodar o gráfico.
5. O usuário pode pausar e retomar a gravação pelo botão central.
6. O usuário pode cancelar ou salvar a gravação.
7. Ao cancelar ou salvar, a tela retorna ao estado inicial.

## Calibragem

### Cabeçalho
- Título "Calibragem".

### Conteúdo
- Lista de sensores em formato de tabela.
- Cabeçalho da tabela com as colunas **Sensor** e **Status**.
- Cada linha apresenta:
  - Ícone do sensor.
  - Nome do sensor.
  - Botão de status.
- Sensores listados:
  - Acelerômetro.
  - Giroscópio.
  - Magnetômetro.
  - Barômetro.
  - GPS.

### Status dos sensores
- Calibrado.
- Não calibrado.
- Não identificado.
- Erro na calibragem.
- Calibrando.

### Ação de calibrar
- Botão circular flutuante, acima da barra de navegação.
- Permanece desabilitado enquanto a calibração está em andamento.
- Ao calibrar, cada sensor elegível passa por dois estados: Calibrando e Calibrado.
- Sensores com status "Não identificado" não participam da calibração.

### Painel informativo do sensor
- Aberto ao tocar no botão de status de uma linha.
- Não escurece o conteúdo ao fundo.
- Exibe:
  - Nome do sensor.
  - Descrição do estado atual.
- Aparece como um balão de mensagem apontando para o sensor

## Relatórios

### Cabeçalho
- Título "Relatórios".

### Conteúdo
- Área de busca no topo:
  - Ícone de busca dentro do campo de busca.
  - Campo de busca do tipo texto com placeholder de apoio "Buscar relatórios".
  - Botão circular de filtro à direita.
- Rótulo acima da lista:
  - "Todos os relatórios" quando não há busca nem filtros.
  - "Relatórios pesquisados/filtrados" quando há busca ou filtros aplicados.
- Lista de relatórios em cartões.
- Cada cartão apresenta:
  - Linha superior: título e data.
  - Linha inferior: localização.
  - Localização vazia é representada por um traço.
- Estado vazio:
  - Mensagem "Nenhum relatório encontrado" centralizada.
- Toque em um cartão abre a tela de Relatório.

### Modal de filtros
- Título: "Filtrar relatórios".
- Grupos de filtro:
  - **Data**: intervalo de datas selecionável, com os campos "De" e "Até".
  - **Localização**: etiquetas com as localizações disponíveis, com seleção múltipla.
  - **Tempo gravado**: campos para o usuário definir o tempo mínimo e o tempo máximo, em segundos.
- As etiquetas de localização ficam destacadas quando ativas.
- Ações:
  - **Limpar**: remove busca e filtros aplicados.
  - **Aplicar**: aplica os filtros selecionados e fecha o modal.

## Relatório

### Cabeçalho
- Lado esquerdo: botão de voltar para a lista de Relatórios.
- Centro: título "Relatório".
- Lado direito: botão de três pontos para abrir o menu de opções.
- A barra de navegação inferior não é exibida nesta tela.

### Sessão de informações
- Título do relatório.
- Localização.
- Data.
- Hora.
- Tempo registrado.

### Informações da gravação
- Subtítulo de seção "Informações da gravação".
- Medidor de abertura angular, mostra a abertura da gravação, min e max.
- Valor da abertura em graus.
- Legenda "Abertura (máx − mín)".

### Gráfico
- Cartão do gráfico Trim × Roll.
- Cabeçalho com nome do gráfico e legenda das séries.
- Eixo vertical com valores em graus.
- Eixo horizontal com marcações de tempo.

### Medidas
- Cartão em formato de tabela.
- Colunas: **Média** e **Desvio**.
- Linhas para **Trim** e **Roll**.
- Cada linha apresenta o nome da medida e os valores correspondentes.

### Dados brutos
- Título de seção "Dados brutos".
- Indicação da quantidade de leituras e do intervalo entre elas.
- Tabela com colunas **Nº**, **X**, **Y** e **Z**.
- Cabeçalho fixo da tabela.
- Lista de leituras.

### Menu de opções
- Título: "Opções do relatório".
- Ações:
  - **Excluir**.
  - **Exportar PDF**.
- A opção Excluir abre o diálogo de confirmação.
- A opção Exportar PDF fecha o menu e exibe a mensagem temporária "PDF exportado".

### Diálogo de confirmação de exclusão
- Título: "Excluir relatório?"
- Texto: "Esta ação não pode ser desfeita."
- Ações:
  - **Voltar**: fecha o diálogo.
  - **Excluir**: remove o relatório e retorna para a lista.

## Testes

### Cabeçalho
- Título "Testes".

### Conteúdo
- Área centralizada com o texto provisório:
  - "Tela Testes (Integridade) aguardando especificação."

## Configurações

### Cabeçalho
- Título "Configurações".

### Conteúdo
- Área centralizada com o texto provisório:
  - "Tela Configurações aguardando especificação."

## Fluxos de navegação

- **Home** → indicador de status do sensor → **Calibragem**.
- **Home** → gravar → salvar → relatório criado e disponível em **Relatórios**.
- **Relatórios** → cartão de relatório → **Relatório**.
- **Relatório** → voltar → **Relatórios**.
- **Relatório** → excluir → confirmação → **Relatórios**.
- **Barra de navegação** → alterna entre **Home**, **Calibragem**, **Relatórios**, **Testes** e **Configurações**.
