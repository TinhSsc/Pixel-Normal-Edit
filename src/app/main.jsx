import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ToolsApp from './ToolsApp.jsx'

const searchParams = new URLSearchParams(window.location.search);
const isTools = searchParams.has('tool') || searchParams.get('page') === 'tools';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isTools ? <ToolsApp /> : <App />}
  </StrictMode>,
)
