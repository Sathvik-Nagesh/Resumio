import { nanoid } from "nanoid";

import { ResumeData, ExperienceEntry, EducationEntry, ProjectEntry, CertificationEntry, SkillGroup } from "@/lib/types";

const DEFAULT_SKILL_GROUPS: SkillGroup[] = [
  { label: "Technical", skills: [] },
  { label: "Soft Skills", skills: [] },
  { label: "Tools", skills: [] },
];

const ensureBullets = (bullets?: string[]) => (bullets && bullets.length ? bullets : []);

const ensureArray = <T>(value?: T[]) => (value && value.length ? value : []);

export function normalizeResume(data: ResumeData): ResumeData {
  const experience: ExperienceEntry[] = ensureArray(data.experience).map((exp) => ({
    id: exp.id ?? nanoid(),
    role: exp.role ?? "",
    company: exp.company ?? "",
    location: exp.location ?? "",
    startDate: exp.startDate ?? "",
    endDate: exp.endDate ?? "",
    bullets: ensureBullets(exp.bullets),
    technologies: ensureArray(exp.technologies),
  }));

  const education: EducationEntry[] = ensureArray(data.education).map((edu) => ({
    id: edu.id ?? nanoid(),
    school: edu.school ?? "",
    degree: edu.degree ?? "",
    startDate: edu.startDate ?? "",
    endDate: edu.endDate ?? "",
    location: edu.location ?? "",
    details: ensureArray(edu.details),
  }));

  const projects: ProjectEntry[] = ensureArray(data.projects).map((project) => ({
    id: project.id ?? nanoid(),
    name: project.name ?? "",
    description: project.description ?? "",
    impact: project.impact ?? "",
    technologies: ensureArray(project.technologies),
    link: project.link,
  }));

  const certifications: CertificationEntry[] = ensureArray(data.certifications).map((cert) => ({
    id: cert.id ?? nanoid(),
    name: cert.name ?? "",
    issuer: cert.issuer ?? "",
    year: cert.year ?? "",
  }));

  const skills: SkillGroup[] = ensureArray(data.skills).length
    ? ensureArray(data.skills).map((group) => ({
        label: group.label ?? "General",
        skills: ensureArray(group.skills),
      }))
    : DEFAULT_SKILL_GROUPS;

  return {
    contact: {
      name: data.contact?.name ?? "",
      title: data.contact?.title ?? "",
      email: data.contact?.email ?? "",
      phone: data.contact?.phone ?? "",
      location: data.contact?.location ?? "",
      website: data.contact?.website,
      linkedin: data.contact?.linkedin,
      github: data.contact?.github,
    },
    summary: data.summary ?? "",
    experience,
    education,
    skills,
    projects,
    certifications,
    keywords: ensureArray(data.keywords),
    jobDescription: data.jobDescription,
  };
}
