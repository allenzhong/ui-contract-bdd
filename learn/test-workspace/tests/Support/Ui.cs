using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

namespace CustomerPortal.Specs.Support;

/// <summary>
/// Generic, component-agnostic browser actions. Every wait targets an observable
/// condition; there are no sleeps. Page objects compose these with generated locators.
/// </summary>
public sealed class Ui(IWebDriver driver)
{
    private readonly WebDriverWait _wait = CreateWait(driver);

    private static WebDriverWait CreateWait(IWebDriver driver)
    {
        var wait = new WebDriverWait(driver, TestSettings.Timeout);
        // React re-renders can replace an element between lookup and use; overlays can briefly intercept clicks.
        wait.IgnoreExceptionTypes(typeof(StaleElementReferenceException), typeof(ElementClickInterceptedException));
        return wait;
    }

    public IWebDriver Driver => driver;

    public void Open(string route) => driver.Navigate().GoToUrl(new Uri(TestSettings.BaseUrl, route));

    public void Reload() => driver.Navigate().Refresh();

    public IWebElement Visible(By by) => Until<IWebElement?>(d =>
    {
        var e = d.FindElements(by).FirstOrDefault();
        return e is { Displayed: true } ? e : null;
    }, $"{by} to be visible")!;

    public void Hidden(By by) => Until(d => d.FindElements(by).All(e => !SafeDisplayed(e)), $"{by} to be hidden");

    public void Click(By by) => Until(_ =>
    {
        var e = Visible(by);
        if (!e.Enabled) return false;
        e.Click();
        return true;
    }, $"{by} to be clickable");

    /// <summary>
    /// Replace an input's value. IWebElement.Clear() does not raise React's onChange,
    /// so select-all + delete is used to keep controlled components in sync.
    /// </summary>
    public void Fill(By by, string text)
    {
        var e = Visible(by);
        e.Click();
        var selectAll = OperatingSystem.IsMacOS() ? Keys.Command : Keys.Control;
        e.SendKeys(selectAll + "a");
        e.SendKeys(Keys.Delete);
        if (text.Length > 0) e.SendKeys(text);
        Until(_ => e.GetDomProperty("value") == text, $"{by} value to be \"{text}\"");
    }

    /// <summary>Click the item of a repeated element whose visible name matches exactly.</summary>
    public void ClickByName(By repeated, string name) => Until(d =>
    {
        var match = d.FindElements(repeated).FirstOrDefault(e => SafeDisplayed(e) && Normalize(e.Text) == name);
        if (match is null) return false;
        match.Click();
        return true;
    }, $"{repeated} named \"{name}\"");

    public string Text(By by) => Normalize(Visible(by).Text);

    public string Value(By by) => Visible(by).GetDomProperty("value") ?? "";

    /// <summary>Wait until the element's text equals the expected value, then return it.</summary>
    public string TextEventually(By by, string expected)
    {
        string actual = "";
        try
        {
            Until(_ => (actual = Text(by)) == expected, $"{by} text to be \"{expected}\"");
        }
        catch (WebDriverTimeoutException) { }
        return actual;
    }

    public string ValueEventually(By by, string expected)
    {
        string actual = "";
        try
        {
            Until(_ => (actual = Value(by)) == expected, $"{by} value to be \"{expected}\"");
        }
        catch (WebDriverTimeoutException) { }
        return actual;
    }

    private T Until<T>(Func<IWebDriver, T> condition, string description)
    {
        _wait.Message = $"Timed out waiting for {description}";
        return _wait.Until(condition);
    }

    private static bool SafeDisplayed(IWebElement e)
    {
        try { return e.Displayed; }
        catch (StaleElementReferenceException) { return false; }
    }

    private static string Normalize(string s) => string.Join(' ', s.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
}
