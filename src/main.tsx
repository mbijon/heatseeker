import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Heatseeker from './App';
import { Analytics } from '@vercel/analytics/react';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Heatseeker />
    <Analytics /> {/* Render the Vercel Analytics component */}
  </React.StrictMode>
);