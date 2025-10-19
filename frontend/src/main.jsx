import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Flowbite } from 'flowbite-react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
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
            <SonnerProvider>
              <App />
            </SonnerProvider>
          </BrowserRouter>
        </AuthProvider>
      </Flowbite>
    </HelmetProvider>
  </React.StrictMode>
);
