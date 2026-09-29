namespace CustomerPortal.Specs.Support;

public static class TestSettings
{
    public static Uri BaseUrl { get; } = new(Environment.GetEnvironmentVariable("WEB_BASE_URL") ?? "http://localhost:8080");

    /// <summary>Set HEADED=1 to watch the browser.</summary>
    public static bool Headless { get; } = Environment.GetEnvironmentVariable("HEADED") != "1";

    public static TimeSpan Timeout { get; } = TimeSpan.FromSeconds(10);
}
