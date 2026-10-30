import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker for full offline support & automatic updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('App update ready');
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

