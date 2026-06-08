import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Register service worker
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
