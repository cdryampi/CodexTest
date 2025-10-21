import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Flowbite } from 'flowbite-react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import i18n from './i18n/index.js';
import { I18nextProvider } from 'react-i18next';
import './index.css';
import './store/useUI';
import { AuthProvider } from './context/AuthContext.jsx';
import SonnerProvider from './components/ui/sonner-provider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Flowbite>
        <AuthProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <I18nextProvider i18n={i18n}>
              <SonnerProvider>
                <App />
              </SonnerProvider>
            </I18nextProvider>
          </BrowserRouter>
        </AuthProvider>
      </Flowbite>
    </HelmetProvider>
  </React.StrictMode>
);
