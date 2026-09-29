// Flow tests: one per acceptance criterion. Each renders the real page in a
// real browser, drives it the way a user would, asserts the outcome and
// records a UI contract (contracts/*.contract.json + per-state HTML).
import { beforeEach, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { resetStore } from '@/api/customerApi';
import { App } from '@/App';
import '@/styles.css';
import { recordFlow } from '@/testing/uiContract';

let screen: Awaited<ReturnType<typeof render>>;

beforeEach(async () => {
  resetStore(); // same seed as the E2E environment's "/?reset=1"
  screen = await render(<App />);
});

function profileFlow(id: string, acceptance: string[]) {
  return recordFlow({
    id,
    page: 'CustomerProfile',
    route: '/',
    acceptance,
    fixture: 'seedCustomer',
    root: () => screen.container,
    remount: async () => {
      await screen.unmount();
      screen = await render(<App />);
    },
  });
}

const fullName = () => page.getByTestId('profile-full-name');
const country = () => page.getByTestId('profile-country');
const save = () => page.getByTestId('profile-save');
const toast = () => page.getByTestId('toast');
const profile = () => page.getByTestId('profile-page');

test('AC-101 update full name', async () => {
  const flow = profileFlow('customer-profile.update-full-name', ['AC-101']);
  await flow.state('loaded', { waitFor: profile() });
  await flow.fill(fullName(), 'Aroha Ngata');
  await flow.click(save());
  await flow.state('saved', { waitFor: toast() });
  await flow.outcome(toast(), { text: 'Profile saved' });
  await flow.reload();
  await flow.state('reloaded', { waitFor: profile() });
  await flow.outcome(fullName(), { value: 'Aroha Ngata' });
  await flow.save();
});

test('AC-102 change country', async () => {
  const flow = profileFlow('customer-profile.change-country', ['AC-102']);
  await flow.state('loaded', { waitFor: profile() });
  await flow.click(country());
  await flow.state('country-open', { waitFor: page.getByRole('listbox', { name: 'Country' }) });
  await flow.click(page.getByRole('option', { name: 'New Zealand', exact: true }), {
    closes: page.getByRole('listbox', { name: 'Country' }),
  });
  await flow.state('country-selected');
  await flow.outcome(country(), { text: 'New Zealand' });
  await flow.click(save());
  await flow.state('saved', { waitFor: toast() });
  await flow.outcome(toast(), { text: 'Profile saved' });
  await flow.reload();
  await flow.state('reloaded', { waitFor: profile() });
  await flow.outcome(country(), { text: 'New Zealand' });
  await flow.save();
});

test('AC-103 full name is required', async () => {
  const flow = profileFlow('customer-profile.full-name-required', ['AC-103']);
  await flow.state('loaded', { waitFor: profile() });
  await flow.fill(fullName(), '');
  await flow.click(save());
  await flow.state('validation-error', { waitFor: page.getByRole('alert') });
  await flow.outcome(page.getByTestId('profile-full-name-error'), { text: 'Full name is required' });
  await flow.save();
});
