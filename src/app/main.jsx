import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ToolsApp from './ToolsApp.jsx'

const searchParams = new URLSearchParams(window.location.search);
const isEditor = searchParams.get('tool') === 'editor' || searchParams.get('page') === 'editor';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isEditor ? <App /> : <ToolsApp />}
  </StrictMode>,
)
