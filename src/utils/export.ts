import { filenameFromMapName } from './filenames';

export const exportToJPEG = async (
  svgElement: SVGSVGElement,
  mapName?: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const bbox = svgElement.getBBox();
    const padding = 40;

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = bbox.width + padding * 2;
      canvas.height = bbox.height + padding * 2;

      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);
      }
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          const jpegUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = jpegUrl;
          a.download = `${filenameFromMapName(mapName)}.jpg`;
          a.click();
          URL.revokeObjectURL(jpegUrl);
          resolve();
        } else {
          reject(new Error('Failed to create JPEG blob'));
        }
      }, 'image/jpeg', 0.95);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.crossOrigin = 'anonymous';
    img.src = url;
  });
};

export const exportToPDF = async (
  svgElement: SVGSVGElement,
  mapName?: string
): Promise<void> => {
  const { jsPDF } = await import('jspdf');

  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const bbox = svgElement.getBBox();
    const padding = 40;

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = bbox.width + padding * 2;
      canvas.height = bbox.height + padding * 2;

      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);
      }
      URL.revokeObjectURL(url);

      try {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const pdfWidth = canvas.width > canvas.height ? 297 : 210;
        const pdfHeight = canvas.width > canvas.height ? 210 : 297;
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const aspectRatio = canvas.width / canvas.height;
        let finalWidth = pdfWidth - 20;
        let finalHeight = finalWidth / aspectRatio;

        if (finalHeight > pdfHeight - 20) {
          finalHeight = pdfHeight - 20;
          finalWidth = finalHeight * aspectRatio;
        }

        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
        pdf.save(`${filenameFromMapName(mapName)}.pdf`);
        resolve();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };

    img.crossOrigin = 'anonymous';
    img.src = url;
  });
};

export const exportToPNG = async (
  svgElement: SVGSVGElement,
  mapName?: string
): Promise<void> => {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      if (blob) {
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${filenameFromMapName(mapName)}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }
    });
  };

  img.src = url;
};

export const exportToSVG = (svgElement: SVGSVGElement, mapName?: string): void => {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameFromMapName(mapName)}.svg`;
  a.click();
  URL.revokeObjectURL(url);
};
