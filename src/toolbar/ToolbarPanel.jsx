import React, { useEffect } from 'react';
import { bindPopups } from '../js/core/popup-manager.js';
import ToolGroup from './ToolGroup';
import { toolbarConfig } from './toolbar-manager';

export default function ToolbarPanel() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toolbar-mounted'));
  }, []);

  useEffect(() => {
    let unbind = bindPopups('.toolbar', 'left');
    
    const rebind = () => {
      unbind();
      // Need a small timeout to let React render the new DOM elements first
      setTimeout(() => {
        unbind = bindPopups('.toolbar', 'left');
      }, 50);
    };

    window.addEventListener('hidden-tools-changed', rebind);
    window.addEventListener('pins-changed', rebind);

    return () => {
      unbind();
      window.removeEventListener('hidden-tools-changed', rebind);
      window.removeEventListener('pins-changed', rebind);
    };
  }, []);

  return (
    <div className="toolbar" style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      {toolbarConfig.groups.map(group => (
        <ToolGroup key={group.id} groupConfig={group} toolsConfig={toolbarConfig.tools} />
      ))}
    </div>
  );
}
