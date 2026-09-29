// Shared test data. The same records back component tests (contracts) and the
// E2E environment ("/?reset=1"), so accessible names in contracts match runtime.
export interface Customer {
  id: string;
  fullName: string;
  countryCode: string;
  newsletter: boolean;
}

export interface Country {
  code: string;
  name: string;
}

export const countries: Country[] = [
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

export const seedCustomer: Customer = {
  id: 'C-1001',
  fullName: 'Aroha Smith',
  countryCode: 'AU',
  newsletter: false,
};
