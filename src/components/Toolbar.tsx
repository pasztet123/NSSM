import { Unit, EditMode } from '../types';
import './Toolbar.css';

interface ToolbarProps {
  mode: 'select' | 'addPoint' | 'addSegment';
  editMode?: EditMode;
  onModeChange: (mode: 'select' | 'addPoint' | 'addSegment') => void;
  onEditModeChange?: (mode: EditMode) => void;
  onClearAll: () => void;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  onOpenModelCatalog: () => void;
  onOpenSketchCatalog: () => void;
  onSaveSketch: () => void;
  onToggle3DViewer?: () => void;
  show3DViewer?: boolean;
  onOpenUploader: () => void;
}

const Toolbar = ({ 
  mode, 
  editMode,
  onModeChange, 
  onEditModeChange,
  onClearAll, 
  unit, 
  onUnitChange,
  onOpenModelCatalog,
  onOpenSketchCatalog,
  onSaveSketch,
  onOpenUploader,
}: ToolbarProps) => {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button
          className={`toolbar-button ${mode === 'select' ? 'active' : ''}`}
          onClick={() => onModeChange('select')}
          title="Select and move points"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Select
        </button>
        <button
          className={`toolbar-button ${mode === 'addPoint' ? 'active' : ''}`}
          onClick={() => onModeChange('addPoint')}
          title="Add new point"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="16" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Point
        </button>
        <button
          className={`toolbar-button ${mode === 'addSegment' ? 'active' : ''}`}
          onClick={() => onModeChange('addSegment')}
          title="Add segment between two points"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="5" cy="12" r="2" fill="currentColor"/>
            <circle cx="19" cy="12" r="2" fill="currentColor"/>
          </svg>
          Add Segment
        </button>
      </div>

      <div className="toolbar-section">
        <button
          className={`toolbar-button ${editMode === 'free' ? 'active' : ''}`}
          onClick={() => onEditModeChange('free')}
          title="Free movement - no constraints"
        >
          Free
        </button>
        <button
          className={`toolbar-button ${editMode === 'lockLength' ? 'active' : ''}`}
          onClick={() => onEditModeChange('lockLength')}
          title="Lock length - change angle only"
        >
          Lock Length
        </button>
        <button
          className={`toolbar-button ${editMode === 'lockAngle' ? 'active' : ''}`}
          onClick={() => onEditModeChange('lockAngle')}
          title="Lock angle - change length only"
        >
          Lock Angle
        </button>
      </div>
      
      <div className="toolbar-section">
        <button
          className="toolbar-button save-sketch-button"
          onClick={onSaveSketch}
          title="Save current sketch"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="17 21 17 13 7 13 7 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 3 7 8 15 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Save
        </button>
        <button
          className="toolbar-button danger"
          onClick={onClearAll}
          title="Clear all points and segments"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Clear
        </button>
      </div>
      
      <div className="toolbar-section">
        <button
          className="toolbar-button model-button"
          onClick={onOpenModelCatalog}
          title="Open model catalog"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          3D Models
        </button>
        <button
          className="toolbar-button sketch-button"
          onClick={onOpenSketchCatalog}
          title="Open 2D sketch catalog"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          2D Sketches
        </button>
        <button
          className="toolbar-button upload-button"
          onClick={onOpenUploader}
          title="Upload your 3D model"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Upload
        </button>
      </div>
      
      <div className="toolbar-section">
        <button
          className={`toolbar-button ${unit === 'mm' ? 'active' : ''}`}
          onClick={() => onUnitChange('mm')}
        >
          mm
        </button>
        <button
          className={`toolbar-button ${unit === 'inch' ? 'active' : ''}`}
          onClick={() => onUnitChange('inch')}
        >
          in
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
