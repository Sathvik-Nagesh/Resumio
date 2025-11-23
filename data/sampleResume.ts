import { ResumeData } from "@/lib/types";

export const sampleResume: ResumeData = {
  contact: {
    name: "Sathvik Nagesh",
    title: "Senior Full-Stack Engineer",
    email: "sathvik.nagesh@example.com",
    phone: "+1 (555) 010-2244",
    location: "Bengaluru, India",
    website: "https://sathviknagesh.dev",
    linkedin: "https://linkedin.com/in/sathviknagesh",
    github: "https://github.com/sathvikn",
  },
  summary:
    "Full-stack engineer with 8+ years crafting resilient, design-forward web platforms. Blends product sense with systems thinking to ship AI-powered experiences that scale to millions of users.",
  experience: [
    {
      id: "exp-1",
      role: "Lead Software Engineer",
      company: "Nimbus Labs",
      location: "Remote",
      startDate: "Jan 2022",
      endDate: "Present",
      bullets: [
        "Architected a modular resume intelligence platform that powers 120K+ weekly job submissions.",
        "Improved ATS match rate by 34% by pairing Gemini-powered copy coaching with custom scoring heuristics.",
        "Scaled Next.js rendering infra to sub-second first paint using streaming and edge caching.",
      ],
      technologies: ["Next.js", "Node.js", "Go", "PostgreSQL", "GCP", "Gemini API"],
    },
    {
      id: "exp-2",
      role: "Senior Frontend Engineer",
      company: "LumenStack",
      location: "Bengaluru, India",
      startDate: "Aug 2019",
      endDate: "Dec 2021",
      bullets: [
        "Led the design system initiative adopting shadcn/ui principles across 14 product squads.",
        "Introduced experimentation tooling that increased activation conversion by 18%.",
        "Mentored 6 engineers, launching a frontend guild focused on accessibility and performance.",
      ],
      technologies: ["React", "TypeScript", "Storybook", "Framer Motion"],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "National Institute of Technology Karnataka",
      degree: "B.Tech, Computer Science",
      startDate: "2011",
      endDate: "2015",
      location: "Surathkal, India",
      details: ["Graduated with Honors", "President, Programming Club"],
    },
  ],
  skills: [
    {
      label: "Technical",
      skills: ["TypeScript", "Next.js", "Node.js", "GraphQL", "Tailwind CSS", "AWS", "GCP"],
    },
    {
      label: "AI & Data",
      skills: ["Gemini API", "LangChain", "Prompt Engineering", "PostgreSQL", "BigQuery"],
    },
    {
      label: "Soft Skills",
      skills: ["Product Strategy", "Team Leadership", "Mentorship", "Design Collaboration"],
    },
  ],
  projects: [
    {
      id: "proj-1",
      name: "SignalCanvas",
      description:
        "Interactive analytics canvas enabling recruiters to visualize candidate pipelines with live AI summaries.",
      technologies: ["Next.js", "D3.js", "Go"],
      impact: "Increased recruiter throughput by 22% by unifying data prep and outreach.",
      link: "https://signalcanvas.app",
    },
    {
      id: "proj-2",
      name: "Nimbus Resume AI",
      description: "End-to-end resume enhancer layering Gemini prompts over structured ATS scoring.",
      technologies: ["Next.js", "Node.js", "Gemini API"],
      impact: "Powered 1.1M+ AI-assisted resumes within the first 6 months.",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "Google Cloud Professional Cloud Architect",
      issuer: "Google",
      year: "2023",
    },
    {
      id: "cert-2",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon",
      year: "2022",
    },
  ],
  keywords: ["Next.js", "AI", "ATS", "Leadership"],
};
