import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ToolsApp from './ToolsApp.jsx'

const searchParams = new URLSearchParams(window.location.search);
let tool = searchParams.get('tool');

if (tool) {
  localStorage.setItem('last_visited_tool', tool);
} else if (searchParams.get('page') === 'editor') {
  tool = 'editor';
} else {
  tool = localStorage.getItem('last_visited_tool') === 'editor' ? 'editor' : 'home';
}

const isEditor = tool === 'editor';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isEditor ? <App /> : <ToolsApp />}
  </StrictMode>,
)
