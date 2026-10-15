Leia os seguintes arquivos para saber informações sobre o projeto e o contexto que ele se encontra
    - [Documentação do projeto](README.md) : É o plano do projeto, engloba o todo e o que almejamos alcançar para este projeto, leia ele para entender o que queremos construir
    - [Documentação Tecnica](DOCUMENTAÇÃO.MD) : É a Documentação Tecnica da aplicação, contém a lógica do que foi desenvolvida, a organização das pastas, tecnológias e em que etapa do desenvolvimento estamos. Leia ele para entender sobre o código desenvolvido
Este projeto é um app .NET MAUI (.NET 10): a lógica pura fica em `InclinationTest.Core` (biblioteca `net10.0`) e é coberta por testes xUnit em `InclinationTest.Core.Tests`
A solução `.NET` fica em `src/`. Rode os comandos a partir de `src/`
Para compilar: `dotnet build`. Para rodar os testes: `dotnet test InclinationTest.Core.Tests/InclinationTest.Core.Tests.csproj`. Antes de entregar, rode `dotnet format --verify-no-changes`
Não altere testes já implementados, se precisar de alguma alteração pergunte antes
Após terminar de fazer alguma alteração atualize a documentação para estar tudo sempre coerente entre Projeto e Documentação