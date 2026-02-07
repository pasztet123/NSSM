import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Point, Segment, Unit, convertFromPixels, getUnitLabel } from '../types';

export interface PDFGenerationOptions {
  points: Point[];
  segments: Segment[];
  unit: Unit;
  projectName?: string;
  materialInfo?: string;
  thickness?: number;
}

export const generateProductionPDF = async (options: PDFGenerationOptions): Promise<void> => {
  const {
    points,
    segments,
    unit,
    projectName = 'Product Specification',
    materialInfo,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let yPos = margin;

  // Header
  doc.setFillColor(22, 60, 107);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('PRODUCTION SPECIFICATION', margin, 12);
  
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString('pl-PL'), pageWidth - margin, 12, { align: 'right' });
  
  yPos = 35;

  // Dimensions Summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Dimensions Summary', margin, yPos);
  yPos += 8;

  const totalLength = segments.reduce((sum, segment) => {
    return sum + convertFromPixels(segment.length, unit);
  }, 0);

  const summaryHeight = materialInfo ? 33 : 25;
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 5, contentWidth, summaryHeight, 'F');

  doc.setFontSize(11);
  if (materialInfo) {
    doc.text(`Material: ${materialInfo}`, margin + 5, yPos + 2);
    yPos += 8;
  }
  doc.text(`Total Length: ${totalLength.toFixed(2)} ${getUnitLabel(unit)}`, margin + 5, yPos + 2);
  yPos += 8;
  doc.text(`Number of Segments: ${segments.length}`, margin + 5, yPos + 2);
  yPos += 8;
  const numberOfBends = Math.max(0, points.length - 2);
  doc.text(`Number of Bends: ${numberOfBends}`, margin + 5, yPos + 2);
  yPos += 15;

  // Segment Details
  doc.setFontSize(14);
  doc.text('Segment Details', margin, yPos);
  yPos += 8;

  // Table header
  doc.setFillColor(22, 60, 107);
  doc.setTextColor(255, 255, 255);
  doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
  
  doc.setFontSize(10);
  const colWidth = contentWidth / 3;
  doc.text('Segment', margin + 2, yPos);
  doc.text('Length', margin + colWidth + 2, yPos);
  doc.text('Angle', margin + 2 * colWidth + 2, yPos);
  yPos += 8;

  // Table rows
  doc.setTextColor(0, 0, 0);
  segments.forEach((segment, index) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }

    const label = segment.label || String.fromCharCode(65 + index);
    const lengthInUnits = convertFromPixels(segment.length, unit);
    const angleText = segment.angle !== undefined ? `${segment.angle.toFixed(1)}°` : '-';

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos - 5, contentWidth, 7, 'F');
    }

    doc.text(label, margin + 2, yPos);
    doc.text(`${lengthInUnits.toFixed(2)} ${getUnitLabel(unit)}`, margin + colWidth + 2, yPos);
    doc.text(angleText, margin + 2 * colWidth + 2, yPos);
    
    yPos += 7;
  });

  yPos += 10;

  // Add sketch - find canvas in DOM
  if (yPos < pageHeight - 80) {
    try {
      const canvasElement = document.querySelector('canvas.dimension-canvas') as HTMLCanvasElement;
      
      if (canvasElement) {
        const canvas = await html2canvas(canvasElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPos + imgHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }

        doc.addImage(imgData, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, 100));
        yPos += Math.min(imgHeight, 100) + 10;
      } else {
        doc.setFontSize(10);
        doc.text('(Canvas element not found)', margin, yPos);
        yPos += 10;
      }
    } catch (error) {
      console.error('Failed to capture canvas:', error);
      doc.setFontSize(10);
      doc.text('(Sketch could not be captured)', margin, yPos);
      yPos += 10;
    }
  }

  // Angle Analysis
  const segmentsWithAngles = segments.filter(s => s.angle !== undefined);
  if (segmentsWithAngles.length > 0) {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(14);
    doc.text('Angle Analysis', margin, yPos);
    yPos += 8;

    const totalAngle = segmentsWithAngles.reduce((sum, s) => sum + (s.angle || 0), 0);
    const avgAngle = totalAngle / segmentsWithAngles.length;

    doc.setFontSize(10);
    doc.text(`Total Angle Change: ${totalAngle.toFixed(1)}°`, margin, yPos);
    yPos += 6;
    doc.text(`Average Angle: ${avgAngle.toFixed(1)}°`, margin, yPos);
    yPos += 6;
    doc.text(`Segments with Angles: ${segmentsWithAngles.length}`, margin, yPos);
    yPos += 10;
  }

  // Footer
  const addFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by Sheet Metal Designer - Page ${pageNum}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // Save the PDF
  const fileName = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
};
