using CustomerPortal.Specs.Generated;
using CustomerPortal.Specs.Support;
using L = CustomerPortal.Specs.Generated.CustomerProfileLocators;

namespace CustomerPortal.Specs.Pages;

/// <summary>
/// User intents on the customer profile page. Each method follows the verified
/// recipe in Generated/CustomerProfile.recipes.md (produced by the bind-steps skill).
/// </summary>
public sealed class CustomerProfilePage(Ui ui)
{
    /// <summary>Recipes: every flow, steps 1–2.</summary>
    public void Open()
    {
        ui.Open(CustomerProfileLocators.Route);
        ui.Visible(L.Page);
    }

    /// <summary>customer-profile.update-full-name, step 3.</summary>
    public void SetFullName(string fullName) => ui.Fill(L.FullName, fullName);

    /// <summary>customer-profile.full-name-required, step 3.</summary>
    public void ClearFullName() => ui.Fill(L.FullName, "");

    /// <summary>
    /// customer-profile.change-country, steps 3–7: open the combobox, wait for the
    /// portaled listbox, pick the option by accessible name, wait for it to close.
    /// </summary>
    public void ChooseCountry(string countryName)
    {
        ui.Click(L.Country);
        ui.Visible(L.CountryListbox);
        ui.ClickByName(L.CountryOptions, countryName);
        ui.Hidden(L.CountryListbox);
    }

    /// <summary>
    /// Every flow: click Save. The wait that follows depends on the outcome
    /// (toast or validation error), so it belongs to the assertion methods.
    /// </summary>
    public void Save() => ui.Click(L.Save);

    /// <summary>Waits for the toast (recipe "wait until Toast is visible") and returns its text.</summary>
    public string ConfirmationMessage(string expected) => ui.TextEventually(L.Toast, expected);

    /// <summary>Waits for the validation alert and returns its text.</summary>
    public string FullNameError(string expected) => ui.TextEventually(L.FullNameError, expected);

    /// <summary>Recipes: "reload the page" + "wait until Page is visible".</summary>
    public void Reload()
    {
        ui.Reload();
        ui.Visible(L.Page);
    }

    public string FullName(string expected) => ui.ValueEventually(L.FullName, expected);

    public string Country(string expected) => ui.TextEventually(L.Country, expected);
}
