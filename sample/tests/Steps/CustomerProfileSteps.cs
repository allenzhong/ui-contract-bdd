using CustomerPortal.Specs.Pages;
using NUnit.Framework;
using Reqnroll;

namespace CustomerPortal.Specs.Steps;

/// <summary>Thin bindings: parse, delegate to the page object, assert the business outcome.</summary>
[Binding]
public sealed class CustomerProfileSteps(CustomerProfilePage profile)
{
    [Given("I am on my customer profile")]
    public void GivenIAmOnMyCustomerProfile() => profile.Open();

    [When("I change my full name to {string}")]
    public void WhenIChangeMyFullNameTo(string fullName) => profile.SetFullName(fullName);

    [When("I clear my full name")]
    public void WhenIClearMyFullName() => profile.ClearFullName();

    [When("I choose {string} as my country")]
    public void WhenIChooseAsMyCountry(string country) => profile.ChooseCountry(country);

    [When("I save my profile")]
    public void WhenISaveMyProfile() => profile.Save();

    [Then("I see the confirmation {string}")]
    public void ThenISeeTheConfirmation(string message) =>
        Assert.That(profile.ConfirmationMessage(message), Is.EqualTo(message));

    [Then("I see the error {string}")]
    public void ThenISeeTheError(string message) =>
        Assert.That(profile.FullNameError(message), Is.EqualTo(message));

    [Then("after reloading the page my full name is {string}")]
    public void ThenAfterReloadingMyFullNameIs(string fullName)
    {
        profile.Reload();
        Assert.That(profile.FullName(fullName), Is.EqualTo(fullName));
    }

    [Then("after reloading the page my country is {string}")]
    public void ThenAfterReloadingMyCountryIs(string country)
    {
        profile.Reload();
        Assert.That(profile.Country(country), Is.EqualTo(country));
    }
}
