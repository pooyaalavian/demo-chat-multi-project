import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { msalInstance } from './api/msal.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App instance={msalInstance}/>
  </React.StrictMode>,
)
