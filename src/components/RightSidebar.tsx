import React from 'react';
import './RightSidebar.css';

interface RightSidebarProps {
  show3DViewer: boolean;
  onToggle3DViewer: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ show3DViewer, onToggle3DViewer }) => {
  return (
    <div className="right-sidebar">
      <button
        className={`right-sidebar-button ${show3DViewer ? 'active' : ''}`}
        onClick={onToggle3DViewer}
        title={show3DViewer ? 'Hide 3D Viewer' : 'Show 3D Viewer'}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="9" y1="21" x2="9" y2="9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="button-text">
          {show3DViewer ? 'Hide' : 'Show'}
          <br />
          <strong>3D</strong>
        </span>
      </button>
    </div>
  );
};

export default RightSidebar;
