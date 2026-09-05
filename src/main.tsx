import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Guard console.error against benign runtime informational logs emitted by WebAssembly / TFLite or Firestore offline mode notices
const origError = console.error;
console.error = function (...args: any[]) {
  const msg = typeof args[0] === 'string' ? args[0] : args[0]?.message || '';
  if (
    typeof msg === 'string' &&
    (msg.includes('TensorFlow Lite') ||
      msg.includes('XNNPACK delegate') ||
      msg.startsWith('INFO: Created TensorFlow') ||
      msg.startsWith('INFO:') ||
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('operate in offline mode') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('code=unavailable'))
  ) {
    console.info(...args);
    return;
  }
  origError.apply(console, args);
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
