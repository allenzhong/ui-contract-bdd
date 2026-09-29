// Adapt into the existing Reqnroll hooks/fixtures. Requires Selenium WebDriver.
using System;
using System.IO;
using System.Text.Json;
using OpenQA.Selenium;

public static class SnapshotRecorder
{
    // Call before and after meaningful actions, including popup opening.
    public static void Capture(IWebDriver driver, string folder, string scenario, string step, string action)
    {
        Directory.CreateDirectory(folder);
        var js = (IJavaScriptExecutor)driver;
        var dom = js.ExecuteScript("return document.documentElement.outerHTML")?.ToString() ?? "";
        File.WriteAllText(Path.Combine(folder, "dom.html"), dom);
        var nodes = js.ExecuteScript(@"
            return [...document.querySelectorAll('[role],[aria-label],[data-testid]')]
              .map(e => ({tag: e.tagName, role: e.getAttribute('role'),
                name: e.getAttribute('aria-label') || e.textContent?.trim().slice(0,120),
                testId: e.getAttribute('data-testid'),
                expanded: e.getAttribute('aria-expanded'), selected: e.getAttribute('aria-selected')}));");
        File.WriteAllText(Path.Combine(folder, "accessibility.json"), JsonSerializer.Serialize(nodes));
        if (driver is ITakesScreenshot screenshots)
            screenshots.GetScreenshot().SaveAsFile(Path.Combine(folder, "screenshot.png"));
        File.WriteAllText(Path.Combine(folder, "metadata.json"), JsonSerializer.Serialize(new {
            scenario, step, action, url = driver.Url, timestamp = DateTimeOffset.UtcNow
        }));
        // Add browser-specific console/network collection in your fixture.
        // WARNING: redact credentials, tokens and personal data before sharing captures.
    }
}
