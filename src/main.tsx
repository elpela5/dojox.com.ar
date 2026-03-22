import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const element = document.getElementById('root');

if (element) {
    const root = createRoot(element);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    console.error('Failed to find the root element to render the app.');
}