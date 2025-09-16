import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Heatseeker from './App';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next";

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Heatseeker />
    <Analytics /> {/* Vercel Analytics component */}
    <SpeedInsights /> {/* Vercel Insights component */}
  </React.StrictMode>
);