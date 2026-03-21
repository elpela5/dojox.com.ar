import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Error logging to localStorage for debugging
const logError = (error: Error, context: string) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    context,
    message: error.message,
    stack: error.stack,
  };
  
  try {
    const logs = JSON.parse(localStorage.getItem("appErrors") || "[]");
    logs.push(errorLog);
    if (logs.length > 10) logs.shift();
    localStorage.setItem("appErrors", JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to log error", e);
  }
};

// Global error handler
window.addEventListener("error", (event) => {
  logError(new Error(event.message), "Global Error");
});

window.addEventListener("unhandledrejection", (event) => {
  logError(new Error(String(event.reason)), "Unhandled Promise Rejection");
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  const error = "El elemento root no fue encontrado en el DOM. Revisa index.html";
  logError(new Error(error), "Root Element Not Found");
  document.body.innerHTML = `
    <div style=\"color: #ff0000; font-family: Arial, sans-serif; padding: 20px; background: #ffe0e0; border: 2px solid red; margin: 10px;\">
      <h1 style=\"margin-top: 0;\">❌ Error Crítico</h1>
      <p>${error}</p>
      <p style=\"color: #666; font-size: 12px;\">Revisa la consola del navegador para más detalles.</p>
    </div>
  `;
} else {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    const err = error as Error;
    logError(err, "React Render");
    document.body.innerHTML = `
      <div style=\"color: #ff0000; font-family: Arial, sans-serif; padding: 20px; background: #ffe0e0; border: 2px solid red; margin: 10px;\">
        <h1 style=\"margin-top: 0;\">❌ Error al inicializar React</h1>
        <p><strong>Mensaje:</strong> ${err.message}</p>
        <pre style=\"background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;\">${err.stack || "No hay stack trace disponible"}</pre>
        <p style=\"color: #666; font-size: 12px;\">Los errores se han guardado en localStorage. Abre la consola del navegador para más detalles.</p>
      </div>
    `;
  }
}