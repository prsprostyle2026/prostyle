// Browser-only: turns a rendered A4 sheet (.bill-sheet) into a PDF file for sharing.
// The libraries are loaded on demand so they don't slow down normal page loads.

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export async function sheetToPdf(sheet: HTMLElement, fileName: string): Promise<File> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  // Capture the sheet itself at full size. html-to-image renders a copy of the element,
  // so the on-screen fit-to-phone scaling of its parent doesn't affect the result.
  const canvas = await toCanvas(sheet, {
    // 3x keeps the payment QR crisp enough to scan from the PDF or a printout.
    pixelRatio: 3,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: { boxShadow: "none", margin: "0" },
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const imgHeightMm = (canvas.height * A4_WIDTH_MM) / canvas.width;
  const image = canvas.toDataURL("image/jpeg", 0.92);
  // A very long bill continues on further pages.
  for (let offset = 0, page = 0; offset < imgHeightMm - 0.5; offset += A4_HEIGHT_MM, page++) {
    if (page > 0) pdf.addPage();
    pdf.addImage(image, "JPEG", 0, -offset, A4_WIDTH_MM, imgHeightMm, undefined, "FAST");
  }
  return new File([pdf.output("blob")], fileName, { type: "application/pdf" });
}

// "INV/2026-27/004" + "Pradeep K" -> "INV-2026-27-004_Pradeep_K.pdf"
export function pdfFileName(number: string, customerName: string) {
  const clean = (s: string) => s.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_");
  return `${clean(number)}${customerName.trim() ? `_${clean(customerName)}` : ""}.pdf`;
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
