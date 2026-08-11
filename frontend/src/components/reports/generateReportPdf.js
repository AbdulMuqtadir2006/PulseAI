import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Screenshots the live rendered DOM node (scale:2) into a PNG, then paginates
// that image across A4 pages — this (not jsPDF's own text renderer) is what
// makes Arabic RTL shaping come out correct in the exported PDF.
export async function generateReportPdf(node, filename = "pulseguard-report.pdf") {
  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  let heightLeft = imgH;
  let position = 0;
  const imgData = canvas.toDataURL("image/png");

  pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
  heightLeft -= pageH;

  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename);
}
