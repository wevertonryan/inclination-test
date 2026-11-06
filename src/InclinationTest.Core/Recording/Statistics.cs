namespace InclinationTest.Core.Recording;

public sealed class Statistics
{
    private long _count;
    private long _rollCount;
    private long _trimCount;
    private double _meanRoll;
    private double _meanTrim;
    private double _m2Roll;
    private double _m2Trim;
    private double _minRoll;
    private double _maxRoll;
    private double _minTrim;
    private double _maxTrim;

    public int Count => (int)_count;

    public double MeanRoll => _rollCount == 0 ? 0 : _meanRoll;

    public double StdRoll => _rollCount == 0 ? 0 : Math.Sqrt(_m2Roll / _rollCount);

    public double MeanTrim => _trimCount == 0 ? 0 : _meanTrim;

    public double StdTrim => _trimCount == 0 ? 0 : Math.Sqrt(_m2Trim / _trimCount);

    public double MinRoll => _rollCount == 0 ? 0 : _minRoll;

    public double MaxRoll => _rollCount == 0 ? 0 : _maxRoll;

    public double MinTrim => _trimCount == 0 ? 0 : _minTrim;

    public double MaxTrim => _trimCount == 0 ? 0 : _maxTrim;

    public void Add(double roll, double trim)
    {
        _count++;

        if (roll != 0)
        {
            _rollCount++;
            Accumulate(roll, _rollCount, ref _meanRoll, ref _m2Roll, ref _minRoll, ref _maxRoll);
        }

        if (trim != 0)
        {
            _trimCount++;
            Accumulate(trim, _trimCount, ref _meanTrim, ref _m2Trim, ref _minTrim, ref _maxTrim);
        }
    }

    public RecordingSummary ToSummary(long durationMs)
        => new(
            durationMs,
            Count,
            MeanRoll,
            StdRoll,
            MinRoll,
            MaxRoll,
            MeanTrim,
            StdTrim,
            MinTrim,
            MaxTrim);

    private static void Accumulate(
        double value,
        long count,
        ref double mean,
        ref double m2,
        ref double min,
        ref double max)
    {
        var delta = value - mean;
        mean += delta / count;
        m2 += delta * (value - mean);

        if (count == 1)
        {
            min = value;
            max = value;
        }
        else
        {
            if (value < min)
            {
                min = value;
            }

            if (value > max)
            {
                max = value;
            }
        }
    }
}
