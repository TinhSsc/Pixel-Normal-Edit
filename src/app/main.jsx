import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ToolsApp from './ToolsApp.jsx'

const searchParams = new URLSearchParams(window.location.search);
const pathParts = window.location.pathname.split('/').filter(Boolean);

let lang = 'en';
let pathTool = null;

if (pathParts.length > 0 && ['vi', 'en', 'id', 'ru', 'th'].includes(pathParts[0])) {
  lang = pathParts[0];
  pathTool = pathParts[1];
} else {
  pathTool = pathParts[0];
}

let tool = pathTool || searchParams.get('tool');

if (tool) {
  localStorage.setItem('last_visited_tool', tool);
} else if (searchParams.get('page') === 'editor') {
  tool = 'editor';
} else {
  tool = 'home';
}

// Make lang available globally before i18n initializes
window.__APP_LANG_FROM_URL__ = lang;

const isEditor = tool === 'editor';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isEditor ? <App /> : <ToolsApp />}
  </StrictMode>,
)
