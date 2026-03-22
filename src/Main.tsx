import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
    document.body.innerHTML = '<div style="color: #ff0000; font-family: Arial, sans-serif; padding: 20px; background: #ffe0e0; border: 2px solid red; margin: 10px;"><h1>Error: Root element not found</h1><p>El elemento root no existe en index.html</p></div>';
} else {
    try {
        createRoot(rootElement).render(<App />);
    } catch (error) {
        const err = error as Error;
        console.error("React error:", err);
        document.body.innerHTML = `<div style="color: #ff0000; font-family: Arial, sans-serif; padding: 20px; background: #ffe0e0; border: 2px solid red; margin: 10px;"><h1>Error: ${err.message}</h1><pre>${err.stack}</pre></div>`;
    }
}
