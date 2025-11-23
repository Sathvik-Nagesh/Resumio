import { ResumeData } from "@/lib/types";

export async function exportAsPdf(resume: ResumeData, templateElement: HTMLElement): Promise<void> {
    // Dynamically import html2canvas and jspdf
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    // Create a container for the clone that is "visible" to the browser but off-screen
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.width = "816px"; // A4 width at 96 DPI
    container.style.zIndex = "-9999";
    document.body.appendChild(container);

    // Clone the element
    const clone = templateElement.cloneNode(true) as HTMLElement;
    clone.style.transform = "scale(1)";
    clone.style.width = "100%";
    clone.style.height = "auto";
    clone.style.margin = "0";
    container.appendChild(clone);

    try {
        // Wait a bit for the clone to render (fonts, images, etc.)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Capture with html2canvas
        const canvas = await html2canvas(clone, {
            scale: 2, // High resolution
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            width: 816,
            windowWidth: 816,
        });

        // Calculate PDF dimensions
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Create PDF
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Use JPEG with 0.98 quality (very high quality but much smaller size than PNG)
        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        // Handle multi-page
        let heightLeft = imgHeight;
        let position = 0;
        let page = 1;

        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            // Shift image up for next page
            pdf.addImage(imgData, "JPEG", 0, -pageHeight * page, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            page++;
        }

        // Save using native jsPDF save method which handles filenames better
        // Use optional chaining and a fallback so we don't access `name` when `contact` is undefined
        const safeName = (resume.contact?.name || "Resume").replace(/[^a-z0-9]/gi, "_");
        const fileName = `${safeName}_Resume.pdf`;

        pdf.save(fileName);

    } catch (error) {
        console.error("PDF Export failed:", error);
        throw error;
    } finally {
        // Clean up
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
}
