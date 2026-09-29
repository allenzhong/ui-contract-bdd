using OpenQA.Selenium;

namespace CustomerPortal.Specs.Support;

/// <summary>Locator conventions agreed with the web team (see docs/conventions.md).</summary>
public static class UiBy
{
    public static By TestId(string testId) => By.CssSelector($"[data-testid='{testId}']");

    /// <summary>One item of a repeated element, identified by its business key (data-key).</summary>
    public static By TestIdWithKey(string testId, string key) =>
        By.CssSelector($"[data-testid='{testId}'][data-key='{key}']");
}
