import { ResumeData } from "@/lib/types";

const stripMarkdown = (value: string) => value.replace(/\*\*(.*?)\*\*/g, "$1").trim();

export async function exportAsPdf(resume: ResumeData): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const maxTextWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 16;
  let y = 18;

  const ensureSpace = (minRequired = 8) => {
    if (y + minRequired <= bottomLimit) return;
    pdf.addPage();
    y = 18;
  };

  const writeWrapped = (text: string, fontSize = 10, lineHeight = 5, indent = 0) => {
    const clean = stripMarkdown(text || "");
    if (!clean) return;
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(clean, maxTextWidth - indent);
    lines.forEach((line: string) => {
      ensureSpace(lineHeight);
      pdf.text(line, marginX + indent, y);
      y += lineHeight;
    });
  };

  const writeHeading = (title: string) => {
    ensureSpace(10);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(title.toUpperCase(), marginX, y);
    y += 5;
    pdf.setLineWidth(0.4);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 4;
    pdf.setFont("helvetica", "normal");
  };

  const writeBullet = (text: string) => {
    const clean = stripMarkdown(text);
    if (!clean) return;
    ensureSpace(5);
    pdf.setFontSize(10);
    pdf.text("•", marginX + 1, y);
    const lines = pdf.splitTextToSize(clean, maxTextWidth - 8);
    lines.forEach((line: string, idx: number) => {
      ensureSpace(5);
      pdf.text(line, marginX + 5, y);
      y += 5;
      if (idx === 0 && lines.length === 1) return;
    });
  };

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  writeWrapped(resume.contact.name || "Candidate Name", 20, 8);

  pdf.setFont("helvetica", "normal");
  writeWrapped(resume.contact.title || "", 11, 6);

  const contactLine = [resume.contact.email, resume.contact.phone, resume.contact.location]
    .filter(Boolean)
    .join("  |  ");
  writeWrapped(contactLine, 9, 5);
  y += 2;

  // Summary
  writeHeading("Professional Summary");
  writeWrapped(resume.summary, 10, 5);
  y += 3;

  // Experience
  writeHeading("Experience");
  resume.experience.forEach((exp) => {
    ensureSpace(12);
    pdf.setFont("helvetica", "bold");
    writeWrapped(`${exp.role} | ${exp.company}`, 11, 5);
    pdf.setFont("helvetica", "normal");
    writeWrapped(`${exp.location} | ${exp.startDate} - ${exp.endDate}`, 9, 5);
    exp.bullets.forEach((bullet) => writeBullet(bullet));
    y += 2;
  });

  // Education
  if (resume.education.length > 0) {
    writeHeading("Education");
    resume.education.forEach((edu) => {
      ensureSpace(10);
      pdf.setFont("helvetica", "bold");
      writeWrapped(edu.degree, 10, 5);
      pdf.setFont("helvetica", "normal");
      writeWrapped(`${edu.school}, ${edu.location}`, 9, 5);
      writeWrapped(`${edu.startDate} - ${edu.endDate}`, 9, 5);
      (edu.details || []).forEach((detail) => writeBullet(detail));
      y += 1;
    });
  }

  // Skills
  if (resume.skills.length > 0) {
    writeHeading("Skills");
    resume.skills.forEach((group) => {
      const line = `${group.label}: ${group.skills.join(", ")}`;
      writeWrapped(line, 9, 5);
    });
    y += 2;
  }

  // Projects
  if (resume.projects.length > 0) {
    writeHeading("Projects");
    resume.projects.forEach((project) => {
      ensureSpace(10);
      pdf.setFont("helvetica", "bold");
      writeWrapped(project.name, 10, 5);
      pdf.setFont("helvetica", "normal");
      writeWrapped(project.description, 9, 5);
      if (project.technologies.length > 0) {
        writeWrapped(`Technologies: ${project.technologies.join(", ")}`, 9, 5);
      }
      if (project.impact) {
        writeWrapped(`Impact: ${project.impact}`, 9, 5);
      }
      y += 1;
    });
  }

  // Certifications
  if (resume.certifications.length > 0) {
    writeHeading("Certifications");
    resume.certifications.forEach((cert) => {
      writeWrapped(`${cert.name} - ${cert.issuer} (${cert.year})`, 9, 5);
    });
  }

  const safeName = (resume.contact.name || "Resume").replace(/[^a-z0-9]/gi, "_");
  pdf.save(`${safeName}_Resume.pdf`);
}
