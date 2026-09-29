Feature: Customer profile
  As a customer
  I want to keep my profile details up to date
  So that my account information is correct

  # Owned by the tester. Tags @AC-nnn link each scenario to the acceptance
  # criterion and to the web flow test that produced its UI contract.

  Background:
    Given I am on my customer profile

  @AC-101
  Scenario: Update my full name
    When I change my full name to "Aroha Ngata"
    And I save my profile
    Then I see the confirmation "Profile saved"
    And after reloading the page my full name is "Aroha Ngata"

  @AC-102
  Scenario Outline: Change my country
    When I choose "<country>" as my country
    And I save my profile
    Then I see the confirmation "Profile saved"
    And after reloading the page my country is "<country>"

    Examples:
      | country        |
      | New Zealand    |
      | United Kingdom |

  @AC-103
  Scenario: Full name is required
    When I clear my full name
    And I save my profile
    Then I see the error "Full name is required"
