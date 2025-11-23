import { ResumeData } from "@/lib/types";

export function exportAsTxt(resume: ResumeData): void {
    let text = "";

    // Header
    text += `${resume.contact.name}\n`;
    text += `${resume.contact.title}\n`;
    text += `${resume.contact.email} | ${resume.contact.phone} | ${resume.contact.location}\n`;
    if (resume.contact.linkedin) text += `LinkedIn: ${resume.contact.linkedin}\n`;
    if (resume.contact.website) text += `Website: ${resume.contact.website}\n`;
    if (resume.contact.github) text += `GitHub: ${resume.contact.github}\n`;
    text += "\n";

    // Summary
    text += "PROFESSIONAL SUMMARY\n";
    text += "=".repeat(50) + "\n";
    text += `${resume.summary}\n\n`;

    // Experience
    text += "EXPERIENCE\n";
    text += "=".repeat(50) + "\n";
    resume.experience.forEach((exp) => {
        text += `${exp.role} | ${exp.company}\n`;
        text += `${exp.location} | ${exp.startDate} - ${exp.endDate}\n`;
        exp.bullets.forEach((bullet) => {
            text += `  • ${bullet}\n`;
        });
        text += "\n";
    });

    // Education
    text += "EDUCATION\n";
    text += "=".repeat(50) + "\n";
    resume.education.forEach((edu) => {
        text += `${edu.degree}\n`;
        text += `${edu.school}, ${edu.location}\n`;
        text += `${edu.startDate} - ${edu.endDate}\n`;
        if (edu.details && edu.details.length > 0) {
            edu.details.forEach((detail) => {
                text += `  • ${detail}\n`;
            });
        }
        text += "\n";
    });

    // Skills
    text += "SKILLS\n";
    text += "=".repeat(50) + "\n";
    resume.skills.forEach((group) => {
        text += `${group.label}: ${group.skills.join(", ")}\n`;
    });
    text += "\n";

    // Projects
    if (resume.projects.length > 0) {
        text += "PROJECTS\n";
        text += "=".repeat(50) + "\n";
        resume.projects.forEach((project) => {
            text += `${project.name}\n`;
            text += `${project.description}\n`;
            if (project.technologies.length > 0) {
                text += `Technologies: ${project.technologies.join(", ")}\n`;
            }
            if (project.impact) {
                text += `Impact: ${project.impact}\n`;
            }
            text += "\n";
        });
    }

    // Certifications
    if (resume.certifications.length > 0) {
        text += "CERTIFICATIONS\n";
        text += "=".repeat(50) + "\n";
        resume.certifications.forEach((cert) => {
            text += `${cert.name} - ${cert.issuer} (${cert.year})\n`;
        });
    }

    // Create and download
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const { saveAs } = require("file-saver");
    const safeName = (resume.contact.name || "Resume").replace(/[^a-z0-9]/gi, "_");
    saveAs(blob, `${safeName}_Resume.txt`);
}
