import { useEffect, useState } from 'react';
import { getCountries, getCustomer, saveCustomer } from '@/api/customerApi';
import type { Country, Customer } from '@/api/seed';
import { CountrySelect } from '@/components/CountrySelect';
import { Toast } from '@/components/Toast';

export function CustomerProfilePage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCustomer(), getCountries()]).then(([c, list]) => {
      setCustomer(c);
      setCountries(list);
    });
  }, []);

  if (!customer) {
    return (
      <p role="status" data-testid="profile-loading">
        Loading profile…
      </p>
    );
  }

  const update = (patch: Partial<Customer>) => {
    setToast(null);
    setCustomer({ ...customer, ...patch });
  };

  const save = async () => {
    if (!customer.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    setError(null);
    setSaving(true);
    await saveCustomer(customer);
    setSaving(false);
    setToast('Profile saved');
  };

  return (
    <main data-testid="profile-page">
      <h1>Customer profile</h1>
      <form
        aria-label="Customer profile"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="field">
          <label htmlFor="fullName" className="label">
            Full name
          </label>
          <input
            id="fullName"
            data-testid="profile-full-name"
            value={customer.fullName}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'fullName-error' : undefined}
            onChange={(e) => update({ fullName: e.target.value })}
          />
          {error && (
            <p id="fullName-error" role="alert" data-testid="profile-full-name-error" className="error">
              {error}
            </p>
          )}
        </div>
        <CountrySelect
          label="Country"
          testId="profile-country"
          countries={countries}
          value={customer.countryCode}
          onChange={(countryCode) => update({ countryCode })}
        />
        <div className="field">
          <label>
            <input
              type="checkbox"
              data-testid="profile-newsletter"
              checked={customer.newsletter}
              onChange={(e) => update({ newsletter: e.target.checked })}
            />{' '}
            Subscribe to newsletter
          </label>
        </div>
        <button type="submit" data-testid="profile-save" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
      <Toast message={toast} />
    </main>
  );
}
