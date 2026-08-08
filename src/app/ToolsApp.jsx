import { Suspense, lazy, useState, useEffect } from 'react';
import { Icon, ICONS } from '../shared/ui/icons';
import { t } from '../i18n/i18n.js';

const HomePage = lazy(() => import('../features/mini-tools/home/HomePage.jsx'));
const ConvertPage = lazy(() => import('../features/mini-tools/convert/ConvertPage.jsx'));
const CompressPage = lazy(() => import('../features/mini-tools/compress/CompressPage.jsx'));
const ResizePage = lazy(() => import('../features/mini-tools/resize/ResizePage.jsx'));
const CropPage = lazy(() => import('../features/mini-tools/crop/CropPage.jsx'));
const RotatePage = lazy(() => import('../features/mini-tools/rotate/RotatePage.jsx'));
const FramesToMediaPage = lazy(() => import('../features/mini-tools/frames-to-media/FramesToMediaPage.jsx'));
const MediaToFramesPage = lazy(() => import('../features/mini-tools/media-to-frames/MediaToFramesPage.jsx'));
const GifSimplifyPage = lazy(() => import('../features/mini-tools/gif-simplify/GifSimplifyPage.jsx'));

export default function ToolsApp() {
  const MINI_TOOLS_ROUTES = ['home', 'convert', 'compress', 'resize', 'crop', 'rotate', 'frames-to-media', 'media-to-frames', 'gif-simplify'];

  const getRoute = () => {
    const path = window.location.pathname.split('/').filter(Boolean)[0];
    if (path && MINI_TOOLS_ROUTES.includes(path)) return path;

    const params = new URLSearchParams(window.location.search);
    if (params.has('tool') && params.get('tool') !== '') return params.get('tool');
    const lastTool = localStorage.getItem('last_visited_tool');
    if (lastTool && lastTool !== 'editor') return lastTool;
    return 'home';
  };
  const [route, setRoute] = useState(getRoute());


  if (!MINI_TOOLS_ROUTES.includes(route)) {
    window.location.href = '/';
    return null;
  }

  return (
    <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'var(--text-muted)'}}><Icon name={ICONS.LOADER} className="spin" style={{width: 24, height: 24, marginRight: 8}}/>{t('status.loading')}</div>}>
      {route === 'home' && <HomePage />}
      {route === 'convert' && <ConvertPage />}
      {route === 'compress' && <CompressPage />}
      {route === 'resize' && <ResizePage />}
      {route === 'crop' && <CropPage />}
      {route === 'rotate' && <RotatePage />}
      {route === 'frames-to-media' && <FramesToMediaPage />}
      {route === 'media-to-frames' && <MediaToFramesPage />}
      {route === 'gif-simplify' && <GifSimplifyPage />}
    </Suspense>
  );
}
