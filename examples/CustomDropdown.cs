// Example only: adapt locator and assertion to the actual observed component.
using System;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;

public static class CustomDropdown
{
    public static void Select(IWebDriver driver, string testId, string value)
    {
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
        var trigger = wait.Until(d => d.FindElement(By.CssSelector($"[data-testid='{testId}']")));
        trigger.Click();
        wait.Until(d => d.FindElement(By.CssSelector("[role='listbox']")));
        // Scope to the associated listbox when multiple popups can coexist.
        var option = wait.Until(d => {
            foreach (var e in d.FindElements(By.CssSelector("[role='listbox'] [role='option']")))
                if (e.Displayed && e.Text.Trim() == value) return e;
            return null;
        });
        option.Click();
        wait.Until(_ => trigger.Text.Contains(value, StringComparison.Ordinal));
    }
}
