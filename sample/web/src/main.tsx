import { createRoot } from 'react-dom/client';
import { App } from './App';
import { resetStore } from './api/customerApi';
import './styles.css';

// Test isolation hook: E2E tests open "/?reset=1" to restore seed data.
const url = new URL(window.location.href);
if (url.searchParams.has('reset')) {
  resetStore();
  url.searchParams.delete('reset');
  window.history.replaceState(null, '', url);
}

createRoot(document.getElementById('root')!).render(<App />);
