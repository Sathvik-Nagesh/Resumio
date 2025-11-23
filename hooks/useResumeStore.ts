import { create } from "zustand";
import { nanoid } from "nanoid";

import { ResumeData, TemplateVariant, AtsScoreResponse, ExperienceEntry, EducationEntry, ProjectEntry, CertificationEntry, SkillGroup } from "@/lib/types";
import { sampleResume } from "@/data/sampleResume";
import { normalizeResume } from "@/lib/resume";

interface ResumeState {
  resume: ResumeData;
  template: TemplateVariant;
  isLoading: {
    upload: boolean;
    ai: boolean;
    ats: boolean;
  };
  jobDescription: string;
  atsScore?: AtsScoreResponse;
  suggestions: string[];
  setResume: (payload: ResumeData) => void;
  updateSummary: (summary: string) => void;
  updateContact: (values: Partial<ResumeData["contact"]>) => void;
  addExperience: () => void;
  updateExperience: (id: string, values: Partial<ExperienceEntry>) => void;
  updateExperienceBullet: (id: string, bulletIndex: number, value: string) => void;
  addExperienceBullet: (id: string) => void;
  removeExperienceBullet: (id: string, index: number) => void;
  removeExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, values: Partial<EducationEntry>) => void;
  removeEducation: (id: string) => void;
  addProject: () => void;
  updateProject: (id: string, values: Partial<ProjectEntry>) => void;
  removeProject: (id: string) => void;
  addCertification: () => void;
  updateCertification: (id: string, values: Partial<CertificationEntry>) => void;
  removeCertification: (id: string) => void;
  updateSkills: (groups: SkillGroup[]) => void;
  setTemplate: (template: TemplateVariant) => void;
  setJobDescription: (jd: string) => void;
  setLoading: (key: keyof ResumeState["isLoading"], value: boolean) => void;
  setAtsScore: (score?: AtsScoreResponse) => void;
  setSuggestions: (items: string[]) => void;
}

const emptyExperience = (): ExperienceEntry => ({
  id: nanoid(),
  role: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "Present",
  bullets: [""],
});

const emptyEducation = (): EducationEntry => ({
  id: nanoid(),
  school: "",
  degree: "",
  location: "",
  startDate: "",
  endDate: "",
  details: [""],
});

const emptyProject = (): ProjectEntry => ({
  id: nanoid(),
  name: "",
  description: "",
  technologies: [],
});

const emptyCertification = (): CertificationEntry => ({
  id: nanoid(),
  name: "",
  issuer: "",
  year: new Date().getFullYear().toString(),
});

export const useResumeStore = create<ResumeState>((set) => ({
  resume: normalizeResume(sampleResume),
  template: "aurora",
  isLoading: {
    upload: false,
    ai: false,
    ats: false,
  },
  jobDescription: "",
  atsScore: undefined,
  suggestions: [],
  setResume: (payload) => set({ resume: normalizeResume(payload) }),
  updateSummary: (summary) =>
    set((state) => ({
      resume: { ...state.resume, summary },
    })),
  updateContact: (values) =>
    set((state) => ({
      resume: { ...state.resume, contact: { ...state.resume.contact, ...values } },
    })),
  addExperience: () =>
    set((state) => ({
      resume: { ...state.resume, experience: [...state.resume.experience, emptyExperience()] },
    })),
  updateExperience: (id, values) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: state.resume.experience.map((exp) => (exp.id === id ? { ...exp, ...values } : exp)),
      },
    })),
  updateExperienceBullet: (id, bulletIndex, value) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: state.resume.experience.map((exp) =>
          exp.id === id
            ? { ...exp, bullets: exp.bullets.map((bullet, index) => (index === bulletIndex ? value : bullet)) }
            : exp
        ),
      },
    })),
  addExperienceBullet: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: state.resume.experience.map((exp) =>
          exp.id === id ? { ...exp, bullets: [...exp.bullets, ""] } : exp
        ),
      },
    })),
  removeExperienceBullet: (id, indexToRemove) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: state.resume.experience.map((exp) =>
          exp.id === id
            ? { ...exp, bullets: exp.bullets.filter((_, index) => index !== indexToRemove) }
            : exp
        ),
      },
    })),
  removeExperience: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        experience: state.resume.experience.filter((exp) => exp.id !== id),
      },
    })),
  addEducation: () =>
    set((state) => ({
      resume: { ...state.resume, education: [...state.resume.education, emptyEducation()] },
    })),
  updateEducation: (id, values) =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: state.resume.education.map((item) => (item.id === id ? { ...item, ...values } : item)),
      },
    })),
  removeEducation: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        education: state.resume.education.filter((item) => item.id !== id),
      },
    })),
  addProject: () =>
    set((state) => ({
      resume: { ...state.resume, projects: [...state.resume.projects, emptyProject()] },
    })),
  updateProject: (id, values) =>
    set((state) => ({
      resume: {
        ...state.resume,
        projects: state.resume.projects.map((item) => (item.id === id ? { ...item, ...values } : item)),
      },
    })),
  removeProject: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        projects: state.resume.projects.filter((item) => item.id !== id),
      },
    })),
  addCertification: () =>
    set((state) => ({
      resume: { ...state.resume, certifications: [...state.resume.certifications, emptyCertification()] },
    })),
  updateCertification: (id, values) =>
    set((state) => ({
      resume: {
        ...state.resume,
        certifications: state.resume.certifications.map((item) => (item.id === id ? { ...item, ...values } : item)),
      },
    })),
  removeCertification: (id) =>
    set((state) => ({
      resume: {
        ...state.resume,
        certifications: state.resume.certifications.filter((item) => item.id !== id),
      },
    })),
  updateSkills: (groups) =>
    set((state) => ({
      resume: { ...state.resume, skills: groups },
    })),
  setTemplate: (template) => set({ template }),
  setJobDescription: (jobDescription) => set({ jobDescription }),
  setLoading: (key, value) =>
    set((state) => ({
      isLoading: { ...state.isLoading, [key]: value },
    })),
  setAtsScore: (atsScore) => set({ atsScore }),
  setSuggestions: (suggestions) => set({ suggestions }),
}));
