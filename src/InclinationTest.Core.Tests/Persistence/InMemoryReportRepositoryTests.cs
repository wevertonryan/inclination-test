using InclinationTest.Core.Persistence;

namespace InclinationTest.Core.Tests.Persistence;

public class InMemoryReportRepositoryTests : ReportRepositoryContractTests
{
    protected override IReportRepository CreateRepository() => new InMemoryReportRepository();
}
