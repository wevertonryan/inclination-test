using InclinationTest.Core.Models;

namespace InclinationTest.Core.Processing;

public interface IFilter
{
    MotionSample Process(MotionSample sample);
}
