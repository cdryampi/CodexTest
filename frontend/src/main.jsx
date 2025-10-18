import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Flowbite } from 'flowbite-react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './index.css';
import './store/useUI';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Flowbite>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </Flowbite>
    </HelmetProvider>
  </React.StrictMode>
);
