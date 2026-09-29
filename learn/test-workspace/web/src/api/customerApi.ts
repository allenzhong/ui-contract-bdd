// Fake backend persisted in localStorage, with latency so tests must wait on
// observable state rather than on timing.
import { countries, seedCustomer, type Country, type Customer } from './seed';

const KEY = 'sample.customer';
const LATENCY_MS = 300;

const delay = <T,>(value: T) => new Promise<T>((r) => setTimeout(() => r(value), LATENCY_MS));

export function resetStore(): void {
  localStorage.setItem(KEY, JSON.stringify(seedCustomer));
}

export function getCustomer(): Promise<Customer> {
  const raw = localStorage.getItem(KEY);
  return delay(raw ? (JSON.parse(raw) as Customer) : seedCustomer);
}

export function saveCustomer(customer: Customer): Promise<Customer> {
  localStorage.setItem(KEY, JSON.stringify(customer));
  return delay(customer);
}

export function getCountries(): Promise<Country[]> {
  return delay(countries);
}
