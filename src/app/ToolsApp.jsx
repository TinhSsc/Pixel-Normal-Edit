import { Suspense, lazy, useState, useEffect } from 'react';
import { Icon, ICONS } from '../shared/ui/icons';
import { t } from '../i18n/i18n.js';

const HomePage = lazy(() => import('../features/mini-tools/home/HomePage.jsx'));
const ConvertPage = lazy(() => import('../features/mini-tools/convert/ConvertPage.jsx'));
const CompressPage = lazy(() => import('../features/mini-tools/compress/CompressPage.jsx'));
const ResizePage = lazy(() => import('../features/mini-tools/resize/ResizePage.jsx'));
const CropPage = lazy(() => import('../features/mini-tools/crop/CropPage.jsx'));
const RotatePage = lazy(() => import('../features/mini-tools/rotate/RotatePage.jsx'));

export default function ToolsApp() {
  const getRoute = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('tool')) return params.get('tool');
    if (params.get('page') === 'tools') return window.location.hash.replace('#', '') || 'home';
    return '';
  };
  const [route, setRoute] = useState(getRoute());

  const MINI_TOOLS_ROUTES = ['home', 'convert', 'compress', 'resize', 'crop', 'rotate'];

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
    </Suspense>
  );
}
