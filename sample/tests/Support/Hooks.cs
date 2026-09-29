using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using Reqnroll;
using Reqnroll.BoDi;

namespace CustomerPortal.Specs.Support;

[Binding]
public sealed class Hooks(IObjectContainer container, ScenarioContext scenario)
{
    private static readonly string ArtifactsDir = Path.Combine(AppContext.BaseDirectory, "artifacts");

    [BeforeScenario(Order = 0)]
    public void StartBrowser()
    {
        var options = new ChromeOptions();
        if (TestSettings.Headless) options.AddArgument("--headless=new");
        options.AddArgument("--window-size=1280,800");
        // Selenium Manager resolves a chromedriver matching the installed Chrome.
        var driver = new ChromeDriver(options);
        container.RegisterInstanceAs<IWebDriver>(driver);
        container.RegisterInstanceAs(new Ui(driver));

        // Test isolation: restore the shared seed (web/src/api/seed.ts).
        driver.Navigate().GoToUrl(new Uri(TestSettings.BaseUrl, "/?reset=1"));
    }

    [AfterScenario]
    public void StopBrowser()
    {
        var driver = container.Resolve<IWebDriver>();
        try
        {
            if (scenario.TestError is not null) SaveEvidence(driver);
        }
        finally
        {
            driver.Quit();
        }
    }

    /// <summary>Same evidence shape as the web contracts, so a failure can be diffed against the expected state.</summary>
    private void SaveEvidence(IWebDriver driver)
    {
        var name = string.Concat(scenario.ScenarioInfo.Title.Split(Path.GetInvalidFileNameChars()));
        var dir = Path.Combine(ArtifactsDir, $"{DateTime.UtcNow:yyyyMMddTHHmmss}-{name}");
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "dom.html"), driver.PageSource);
        ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile(Path.Combine(dir, "screenshot.png"));
        TestContext.AddTestAttachment(Path.Combine(dir, "screenshot.png"));
        TestContext.Progress.WriteLine($"Failure evidence: {dir}");
    }
}
