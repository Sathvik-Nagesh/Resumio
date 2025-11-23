import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { ResumeData } from "@/lib/types";

export async function exportAsDocx(resume: ResumeData): Promise<void> {
    const sections: Paragraph[] = [];

    // Header
    sections.push(
        new Paragraph({
            text: resume.contact.name,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
        })
    );

    sections.push(
        new Paragraph({
            text: resume.contact.title,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
        })
    );

    const contactInfo = [
        resume.contact.email,
        resume.contact.phone,
        resume.contact.location,
    ].filter(Boolean).join(" | ");

    sections.push(
        new Paragraph({
            text: contactInfo,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    );

    // Summary
    sections.push(
        new Paragraph({
            text: "PROFESSIONAL SUMMARY",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
        })
    );

    sections.push(
        new Paragraph({
            text: resume.summary,
            spacing: { after: 400 },
        })
    );

    // Experience
    sections.push(
        new Paragraph({
            text: "EXPERIENCE",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
        })
    );

    resume.experience.forEach((exp) => {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: exp.role, bold: true }),
                    new TextRun({ text: ` | ${exp.company}` }),
                ],
                spacing: { before: 200, after: 50 },
            })
        );

        sections.push(
            new Paragraph({
                text: `${exp.location} | ${exp.startDate} - ${exp.endDate}`,
                spacing: { after: 100 },
            })
        );

        exp.bullets.forEach((bullet) => {
            sections.push(
                new Paragraph({
                    text: bullet,
                    bullet: { level: 0 },
                    spacing: { after: 50 },
                })
            );
        });
    });

    // Education
    sections.push(
        new Paragraph({
            text: "EDUCATION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 100 },
        })
    );

    resume.education.forEach((edu) => {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: edu.degree, bold: true }),
                ],
                spacing: { before: 200, after: 50 },
            })
        );

        sections.push(
            new Paragraph({
                text: `${edu.school}, ${edu.location}`,
                spacing: { after: 50 },
            })
        );

        sections.push(
            new Paragraph({
                text: `${edu.startDate} - ${edu.endDate}`,
                spacing: { after: 100 },
            })
        );
    });

    // Skills
    sections.push(
        new Paragraph({
            text: "SKILLS",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 100 },
        })
    );

    resume.skills.forEach((group) => {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: `${group.label}: `, bold: true }),
                    new TextRun({ text: group.skills.join(", ") }),
                ],
                spacing: { after: 100 },
            })
        );
    });

    // Projects
    if (resume.projects.length > 0) {
        sections.push(
            new Paragraph({
                text: "PROJECTS",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 100 },
            })
        );

        resume.projects.forEach((project) => {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: project.name, bold: true }),
                    ],
                    spacing: { before: 200, after: 50 },
                })
            );

            sections.push(
                new Paragraph({
                    text: project.description,
                    spacing: { after: 100 },
                })
            );
        });
    }

    // Create document
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: sections,
            },
        ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const safeName = (resume.contact.name || "Resume").replace(/[^a-z0-9]/gi, "_");
    saveAs(blob, `${safeName}_Resume.docx`);
}
