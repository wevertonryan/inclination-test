Leia [Documentação Tecnica](DOCUMENTAÇÃO.MD) e [Documentação do projeto](README.md) para entender o contexto do projeto
Verifique se o "STATUS ATUAL DO PROJETO" em [Documentação Tecnica](DOCUMENTAÇÃO.MD) está alinhado com o que tem no projeto em sí, se tiver algo fora atualize
Este projeto é um app .NET MAUI (.NET 10): a lógica pura fica em `InclinationTest.Core` (biblioteca `net10.0`) e é coberta por testes xUnit em `InclinationTest.Core.Tests`
A solução `.NET` fica em `src/`. Rode os comandos a partir de `src/`
Para compilar: `dotnet build`. Para rodar os testes: `dotnet test InclinationTest.Core.Tests/InclinationTest.Core.Tests.csproj`. Antes de entregar, rode `dotnet format --verify-no-changes`
Não altere testes já implementados, se precisar de alguma alteração pergunte antes
Após terminar de fazer alguma alteração atualize a documentação para estar tudo sempre coerente entre Projeto e Documentação