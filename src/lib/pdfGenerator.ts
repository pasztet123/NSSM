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

  // Add sketch - find canvas in DOM and capture three versions
  if (yPos < pageHeight - 80) {
    try {
      const canvasElement = document.querySelector('canvas.dimension-canvas') as HTMLCanvasElement;
      
      if (canvasElement) {
        // Find the toggle buttons
        const toggleButtons = Array.from(document.querySelectorAll('.toggle-dimensions-btn')) as HTMLButtonElement[];
        const lengthsButton = toggleButtons[0]; // Lengths button
        const anglesButton = toggleButtons[1]; // Angles button
        
        // Save original state
        const wasLengthsActive = lengthsButton?.classList.contains('active');
        const wasAnglesActive = anglesButton?.classList.contains('active');
        
        // First capture - WITH everything (lengths + angles)
        if (lengthsButton && !wasLengthsActive) {
          lengthsButton.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (anglesButton && !wasAnglesActive) {
          anglesButton.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const canvasWithAll = await html2canvas(canvasElement, {
          background: '#ffffff',
        });
        const imgDataWithAll = canvasWithAll.toDataURL('image/png');
        
        // Second capture - ONLY lengths (no angles)
        if (anglesButton && anglesButton.classList.contains('active')) {
          anglesButton.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const canvasLengthsOnly = await html2canvas(canvasElement, {
          background: '#ffffff',
        });
        const imgDataLengthsOnly = canvasLengthsOnly.toDataURL('image/png');
        
        // Third capture - WITHOUT anything (clean)
        if (lengthsButton && lengthsButton.classList.contains('active')) {
          lengthsButton.click();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const canvasClean = await html2canvas(canvasElement, {
          background: '#ffffff',
        });
        const imgDataClean = canvasClean.toDataURL('image/png');
        
        // Restore original state
        if (lengthsButton && wasLengthsActive !== lengthsButton.classList.contains('active')) {
          lengthsButton.click();
        }
        if (anglesButton && wasAnglesActive !== anglesButton.classList.contains('active')) {
          anglesButton.click();
        }
        
        const imgWidth = contentWidth;
        const imgHeight = (canvasWithAll.height * imgWidth) / canvasWithAll.width;
        const maxImgHeight = 100;

        // Add sketch WITH all dimensions and angles
        if (yPos + maxImgHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Sketch with Dimensions and Angles:', margin, yPos);
        yPos += 6;

        doc.addImage(imgDataWithAll, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, maxImgHeight));
        yPos += Math.min(imgHeight, maxImgHeight) + 15;
        
        // Add sketch WITH lengths only (no angles)
        if (yPos + maxImgHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        
        doc.setFontSize(12);
        doc.text('Sketch with Lengths Only (No Angles):', margin, yPos);
        yPos += 6;

        doc.addImage(imgDataLengthsOnly, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, maxImgHeight));
        yPos += Math.min(imgHeight, maxImgHeight) + 15;
        
        // Add sketch WITHOUT anything (clean version)
        if (yPos + maxImgHeight > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
        }
        
        doc.setFontSize(12);
        doc.text('Clean Sketch (No Dimensions or Angles):', margin, yPos);
        yPos += 6;

        doc.addImage(imgDataClean, 'PNG', margin, yPos, imgWidth, Math.min(imgHeight, maxImgHeight));
        yPos += Math.min(imgHeight, maxImgHeight) + 10;
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
