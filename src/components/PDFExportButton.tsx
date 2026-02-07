import { useState } from 'react';
import { Point, Segment, Unit } from '../types';
import { generateProductionPDF } from '../lib/pdfGenerator';
import './PDFExportButton.css';

interface PDFExportButtonProps {
  points: Point[];
  segments: Segment[];
  unit: Unit;
  projectName?: string;
  materialInfo?: string;
  thickness?: number;
  disabled?: boolean;
  disabledTitle?: string;
}

const PDFExportButton = ({
  points,
  segments,
  unit,
  projectName,
  materialInfo,
  thickness,
  disabled,
  disabledTitle,
}: PDFExportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportPDF = async () => {
    if (segments.length === 0) {
      alert('No segments to export. Add dimensions before generating PDF.');
      return;
    }

    setIsGenerating(true);
    try {
      await generateProductionPDF({
        points,
        segments,
        unit,
        projectName,
        materialInfo,
        thickness,
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Error generating PDF. Check console for more details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      className="pdf-export-button"
      onClick={handleExportPDF}
      disabled={!!disabled || isGenerating || segments.length === 0}
      title={
        disabledTitle ??
        (disabled
          ? 'Export disabled'
          : 'Generate PDF for production department')
      }
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 2V8H20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 13H14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 17H14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{isGenerating ? 'Generating...' : 'Export PDF'}</span>
    </button>
  );
};

export default PDFExportButton;
