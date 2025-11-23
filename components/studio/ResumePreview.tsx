"use client";

import { ResumeData, TemplateVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResumePreviewProps {
  data: ResumeData;
  template: TemplateVariant;
}

const headingClass = "text-xs font-semibold uppercase tracking-[0.35em] text-slate-500";

const MarkdownText = ({ children, className }: { children: string; className?: string }) => {
  if (!children) return null;

  // Simple parser for **bold**
  const parts = children.split(/(\*\*.*?\*\*)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </span>
  );
};

// Safely return a part of a date string split by space. If the input is unexpected,
// fall back to the original string (or empty string if not provided).
const safeDatePart = (date?: string, index = 0) => {
  const parts = typeof date === "string" ? date.split(" ") : [];
  return parts[index] ?? date ?? "";
};
export function ResumePreview({ data, template }: ResumePreviewProps) {
  const renderTemplate = () => {
    switch (template) {
      case "aurora":
        return <AuroraTemplate data={data} />;
      case "noir":
        return <NoirTemplate data={data} />;
      case "serif":
        return <SerifTemplate data={data} />;
      case "grid":
        return <GridTemplate data={data} />;
      case "capsule":
        return <CapsuleTemplate data={data} />;
      case "linear":
        return <LinearTemplate data={data} />;
      case "focus":
        return <FocusTemplate data={data} />;
      case "metro":
        return <MetroTemplate data={data} />;
      case "elevate":
        return <ElevateTemplate data={data} />;
      case "minimal":
        return <MinimalTemplate data={data} />;
      case "legacy":
        return <LegacyTemplate data={data} />;
      default:
        return <AuroraTemplate data={data} />;
    }
  };

  return (
    <div className="relative w-[816px] min-h-[1056px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
      {renderTemplate()}
    </div>
  );
}

// AURORA - Gradient header with frosted glass sections
function AuroraTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="h-full">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-12 py-10 text-white">
        <h1 className="text-5xl font-bold tracking-tight">{data.contact.name}</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-slate-300">{data.contact.title}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-200">
          <span>{data.contact.email}</span>
          <span>•</span>
          <span>{data.contact.phone}</span>
          <span>•</span>
          <span>{data.contact.location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8 px-12 py-10">
        {/* Summary */}
        <Section title="Professional Summary">
          <p className="text-base leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
        </Section>

        {/* Experience */}
        <Section title="Experience">
          <div className="space-y-6">
            {data.experience.map((exp) => (
              <div key={exp.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{exp.role}</h3>
                    <p className="text-sm text-slate-600">{exp.company} • {exp.location}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wider text-slate-400">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-slate-400">▸</span>
                      <span><MarkdownText>{bullet}</MarkdownText></span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        {/* Two Column */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Education */}
          <Section title="Education">
            {data.education.map((edu) => (
              <div key={edu.id} className="space-y-1">
                <h4 className="font-semibold text-slate-900">{edu.degree}</h4>
                <p className="text-sm text-slate-600">{edu.school}</p>
                <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </Section>

          {/* Skills */}
          <Section title="Skills">
            <div className="space-y-3">
              {data.skills.map((group, idx) => (
                <div key={`${group.label}-${idx}`}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// NOIR - Dark sidebar with monochrome design
function NoirTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="flex h-full">
      {/* Dark Sidebar */}
      <div className="w-72 bg-slate-900 px-8 py-10 text-white">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold leading-tight">{data.contact.name}</h1>
            <p className="mt-2 text-xs uppercase tracking-[0.4em] text-slate-400">{data.contact.title}</p>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p>{data.contact.email}</p>
            <p>{data.contact.phone}</p>
            <p>{data.contact.location}</p>
          </div>

          {/* Skills in Sidebar */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Skills</h3>
            {data.skills.map((group, idx) => (
              <div key={`${group.label}-${idx}`} className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">{group.label}</p>
                <div className="space-y-1">
                  {group.skills.map((skill) => (
                    <div key={skill} className="text-sm text-slate-300">{skill}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Certifications */}
          {data.certifications.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Certifications</h3>
              {data.certifications.map((cert) => (
                <div key={cert.id} className="text-sm text-slate-300">
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-xs text-slate-500">{cert.issuer} • {cert.year}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-8 px-10 py-10">
        <Section title="Summary">
          <p className="text-base leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
        </Section>

        <Section title="Experience">
          <div className="space-y-6">
            {data.experience.map((exp) => (
              <div key={exp.id} className="border-l-4 border-slate-900 pl-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                  <span className="text-xs text-slate-500">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600">{exp.company} • {exp.location}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-slate-400">•</span>
                      <span><MarkdownText>{bullet}</MarkdownText></span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Education">
          {data.education.map((edu) => (
            <div key={edu.id} className="space-y-1">
              <h4 className="font-bold text-slate-900">{edu.degree}</h4>
              <p className="text-sm text-slate-600">{edu.school} • {edu.location}</p>
              <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
            </div>
          ))}
        </Section>
      </div>
    </div >
  );
}

// SERIF - Elegant serif typography
function SerifTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="h-full px-16 py-12">
      {/* Header - Centered */}
      <div className="border-b-2 border-slate-300 pb-6 text-center">
        <h1 className="font-serif text-6xl font-light tracking-tight text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          {data.contact.name}
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.4em] text-slate-600">{data.contact.title}</p>
        <div className="mt-4 flex justify-center gap-3 text-sm text-slate-600">
          <span>{data.contact.email}</span>
          <span>|</span>
          <span>{data.contact.phone}</span>
          <span>|</span>
          <span>{data.contact.location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-10 space-y-10">
        <Section title="Summary">
          <p className="text-center text-base italic leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
        </Section>

        <Section title="Professional Experience">
          <div className="space-y-8">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-serif text-2xl font-medium text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {exp.role}
                  </h3>
                  <span className="text-sm text-slate-500">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-600">{exp.company} • {exp.location}</p>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx} className="ml-5 list-disc"><MarkdownText>{bullet}</MarkdownText></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid gap-10 md:grid-cols-2">
          <Section title="Education">
            {data.education.map((edu) => (
              <div key={edu.id} className="space-y-1">
                <h4 className="font-serif text-lg font-medium text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {edu.degree}
                </h4>
                <p className="text-sm text-slate-600">{edu.school}</p>
                <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </Section>

          <Section title="Core Competencies">
            <div className="space-y-3">
              {data.skills.map((group, idx) => (
                <div key={`${group.label}-${idx}`}>
                  <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{group.label}</p>
                  <p className="text-sm text-slate-700">{group.skills.join(" • ")}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div >
    </div >
  );
}

// GRID - Dense two-column card layout
function GridTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="h-full bg-slate-50">
      {/* Compact Header */}
      <div className="bg-slate-900 px-10 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data.contact.name}</h1>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{data.contact.title}</p>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>{data.contact.email}</p>
            <p>{data.contact.phone}</p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid gap-4 p-8 md:grid-cols-2">
        {/* Left Column - Experience */}
        <div className="space-y-4">
          {data.experience.map((exp) => (
            <div key={exp.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-slate-900">{exp.role}</h3>
                <span className="text-[10px] uppercase text-slate-400">{safeDatePart(exp.startDate, 1) || exp.startDate}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{exp.company}</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-700">
                {exp.bullets.slice(0, 3).map((bullet, idx) => (
                  <li key={idx} className="flex gap-1">
                    <span className="text-slate-400">→</span>
                    <span><MarkdownText>{bullet}</MarkdownText></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Right Column - Other Sections */}
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
          </div>

          {/* Skills Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Skills</h3>
            <div className="mt-2 space-y-2">
              {data.skills.map((group, idx) => (
                <div key={`${group.label}-${idx}`}>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{group.label}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {group.skills.map((skill) => (
                      <span key={skill} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education Card */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Education</h3>
            <div className="mt-2 space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-sm font-semibold text-slate-900">{edu.degree}</p>
                  <p className="text-xs text-slate-600">{edu.school}</p>
                  <p className="text-[10px] text-slate-500">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Projects if any */}
          {data.projects.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Projects</h3>
              <div className="mt-2 space-y-2">
                {data.projects.slice(0, 2).map((project) => (
                  <div key={project.id}>
                    <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                    <p className="text-xs text-slate-600">{project.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}

// CAPSULE - Rounded, pill-style design
function CapsuleTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="h-full bg-gradient-to-br from-emerald-50 to-teal-50 px-12 py-10">
      {/* Rounded Header */}
      <div className="rounded-full border-2 border-emerald-200 bg-white px-8 py-6 text-center shadow-lg">
        <h1 className="text-4xl font-bold text-slate-900">{data.contact.name}</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-slate-600">{data.contact.title}</p>
        <div className="mt-3 flex justify-center gap-3 text-sm text-slate-600">
          <span>{data.contact.email}</span>
          <span>•</span>
          <span>{data.contact.phone}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-8 space-y-6">
        {/* Summary Pill */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Summary</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
        </div>

        {/* Experience Pills */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Experience</h3>
          {data.experience.map((exp) => (
            <div key={exp.id} className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{exp.role}</h4>
                  <p className="text-sm text-slate-600">{exp.company}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                  {exp.startDate} - {exp.endDate}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {exp.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span><MarkdownText>{bullet}</MarkdownText></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Two Column Pills */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Education */}
          <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Education</h3>
            <div className="mt-3 space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <p className="font-semibold text-slate-900">{edu.degree}</p>
                  <p className="text-sm text-slate-600">{edu.school}</p>
                  <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.skills.flatMap(group => group.skills).map((skill) => (
                <span key={skill} className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// LINEAR - Timeline with vertical line
function LinearTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="h-full bg-gradient-to-br from-orange-50 to-amber-50 px-12 py-10">
      {/* Header */}
      <div className="border-b-4 border-orange-400 pb-6">
        <h1 className="text-5xl font-bold text-slate-900">{data.contact.name}</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.3em] text-slate-600">{data.contact.title}</p>
        <div className="mt-3 flex gap-4 text-sm text-slate-600">
          <span>{data.contact.email}</span>
          <span>•</span>
          <span>{data.contact.phone}</span>
          <span>•</span>
          <span>{data.contact.location}</span>
        </div>
      </div>

      {/* Content with Sidebar */}
      <div className="mt-8 flex gap-8">
        {/* Left Sidebar */}
        <div className="w-64 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-700">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-700">Skills</h3>
            <div className="mt-2 space-y-2">
              {data.skills.map((group, idx) => (
                <div key={`${group.label}-${idx}`}>
                  <p className="text-xs font-semibold text-slate-500">{group.label}</p>
                  <p className="text-sm text-slate-700">{group.skills.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-orange-700">Education</h3>
            <div className="mt-2 space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-sm font-semibold text-slate-900">{edu.degree}</p>
                  <p className="text-xs text-slate-600">{edu.school}</p>
                  <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1">
          <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-orange-700">Experience Timeline</h3>
          <div className="relative border-l-4 border-orange-300 pl-8">
            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="relative mb-8 pb-8">
                {/* Timeline Dot */}
                <div className="absolute -left-[18px] top-1 h-4 w-4 rounded-full border-4 border-orange-400 bg-white"></div>

                <div className="rounded-lg bg-white p-4 shadow-md">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-lg font-bold text-slate-900">{exp.role}</h4>
                    <span className="text-xs text-orange-600">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{exp.company} • {exp.location}</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {exp.bullets.map((bullet, bidx) => (
                      <li key={bidx} className="flex gap-2">
                        <span className="text-orange-400">▸</span>
                        <span><MarkdownText>{bullet}</MarkdownText></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div >
  );
}

// FOCUS - Minimal with focus on content
function FocusTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="h-full bg-white px-16 py-12">
      {/* Simple Header */}
      <div className="border-b border-slate-300 pb-6">
        <h1 className="text-5xl font-light text-slate-900">{data.contact.name}</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.5em] text-slate-500">{data.contact.title}</p>
        <div className="mt-3 text-sm text-slate-600">
          {data.contact.email} • {data.contact.phone} • {data.contact.location}
        </div>
      </div>

      {/* Content */}
      <div className="mt-8 space-y-8">
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Summary</h2>
          <p className="text-base leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Experience</h2>
          <div className="space-y-6">
            {data.experience.map((exp) => (
              <div key={exp.id} className="border-l-2 border-slate-200 pl-6 hover:border-slate-400 transition-colors">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold text-slate-900">{exp.role}</h3>
                  <span className="text-sm text-slate-500">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{exp.company} • {exp.location}</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx} className="ml-4 list-disc"><MarkdownText>{bullet}</MarkdownText></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="space-y-1">
                <p className="font-semibold text-slate-900">{edu.degree}</p>
                <p className="text-sm text-slate-600">{edu.school}</p>
                <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Skills</h2>
            <div className="space-y-2">
              {data.skills.map((group, idx) => (
                <div key={`${group.label}-${idx}`}>
                  <p className="text-xs font-semibold text-slate-500">{group.label}</p>
                  <p className="text-sm text-slate-700">{group.skills.join(" • ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

// METRO - Bold urban design
function MetroTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="flex h-full">
      {/* Left Column - Dark */}
      <div className="w-80 bg-slate-950 px-8 py-10 text-white">
        <div className="space-y-8">
          <div>
            <div className="mb-2 h-1 w-12 bg-red-500"></div>
            <h1 className="text-4xl font-black uppercase leading-tight tracking-tight">{data.contact.name}</h1>
            <p className="mt-3 text-xs uppercase tracking-[0.4em] text-slate-400">{data.contact.title}</p>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p>{data.contact.email}</p>
            <p>{data.contact.phone}</p>
            <p>{data.contact.location}</p>
          </div>

          <div>
            <div className="mb-3 h-1 w-12 bg-red-500"></div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em]">Skills</h3>
            <div className="mt-3 space-y-3">
              {data.skills.map((group, idx) => (
                <div key={`${group.label}-${idx}`}>
                  <p className="text-xs font-bold text-red-400">{group.label}</p>
                  <div className="mt-1 space-y-1">
                    {group.skills.map((skill) => (
                      <div key={skill} className="text-sm text-slate-300">{skill}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 h-1 w-12 bg-red-500"></div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em]">Education</h3>
            <div className="mt-3 space-y-3">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <p className="text-sm font-bold text-white">{edu.degree}</p>
                  <p className="text-xs text-slate-400">{edu.school}</p>
                  <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Light */}
      <div className="flex-1 bg-white px-10 py-10">
        <div className="space-y-8">
          <div>
            <div className="mb-3 h-1 w-16 bg-red-500"></div>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900">Summary</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
          </div>

          <div>
            <div className="mb-3 h-1 w-16 bg-red-500"></div>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900">Experience</h2>
            <div className="mt-4 space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id} className="border-l-4 border-red-500 pl-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xl font-black uppercase text-slate-900">{exp.role}</h3>
                    <span className="text-xs font-bold text-red-600">{safeDatePart(exp.startDate, 1) || exp.startDate}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-600">{exp.company}</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="font-bold text-red-500">■</span>
                        <span><MarkdownText>{bullet}</MarkdownText></span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

// ELEVATE - Executive premium design
function ElevateTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="h-full">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-700 px-12 py-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-wide">{data.contact.name}</h1>
            <p className="mt-2 text-sm uppercase tracking-[0.4em] text-purple-200">{data.contact.title}</p>
          </div>
          <div className="h-16 w-16 rounded-full border-4 border-purple-300 bg-purple-100"></div>
        </div>
        <div className="mt-4 flex gap-6 text-sm text-purple-200">
          <span>{data.contact.email}</span>
          <span>|</span>
          <span>{data.contact.phone}</span>
          <span>|</span>
          <span>{data.contact.location}</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gradient-to-br from-purple-50 to-white px-12 py-10">
        <div className="space-y-8">
          {/* Executive Summary */}
          <div className="rounded-xl border-l-4 border-purple-600 bg-white p-6 shadow-lg">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-purple-900">Executive Summary</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
          </div>

          {/* Experience */}
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-purple-900">Leadership Experience</h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id} className="rounded-xl bg-white p-6 shadow-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{exp.role}</h3>
                      <p className="mt-1 text-sm font-medium text-purple-700">{exp.company} • {exp.location}</p>
                    </div>
                    <span className="rounded-full bg-purple-100 px-4 py-1 text-xs font-semibold text-purple-800">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-purple-500">◆</span>
                        <span><MarkdownText>{bullet}</MarkdownText></span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Two Column */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-purple-900">Education</h2>
              <div className="mt-3 space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-semibold text-slate-900">{edu.degree}</p>
                    <p className="text-sm text-slate-600">{edu.school}</p>
                    <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-purple-900">Core Competencies</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.skills.flatMap(group => group.skills).map((skill) => (
                  <span key={skill} className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// MINIMAL - Clean ATS-optimized
function MinimalTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="h-full bg-white px-14 py-12">
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4">
        <h1 className="text-4xl font-bold text-slate-900">{data.contact.name}</h1>
        <p className="mt-1 text-sm text-slate-600">{data.contact.title}</p>
        <div className="mt-2 text-sm text-slate-600">
          {data.contact.email} | {data.contact.phone} | {data.contact.location}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 space-y-6">
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase text-slate-900">Summary</h2>
          <p className="text-sm leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-900">Experience</h2>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-bold text-slate-900">{exp.role}</h3>
                  <span className="text-xs text-slate-600">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className="text-sm text-slate-700">{exp.company}, {exp.location}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {exp.bullets.map((bullet, idx) => (
                    <li key={idx}><MarkdownText>{bullet}</MarkdownText></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold uppercase text-slate-900">Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mt-2">
              <p className="font-bold text-slate-900">{edu.degree}</p>
              <p className="text-sm text-slate-700">{edu.school}, {edu.location}</p>
              <p className="text-xs text-slate-600">{edu.startDate} - {edu.endDate}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold uppercase text-slate-900">Skills</h2>
          {data.skills.map((group, idx) => (
            <div key={`${group.label}-${idx}`} className="mt-1">
              <span className="font-semibold text-slate-900">{group.label}: </span>
              <span className="text-sm text-slate-700">{group.skills.join(", ")}</span>
            </div>
          ))}
        </div>

        {data.certifications.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase text-slate-900">Certifications</h2>
            {data.certifications.map((cert) => (
              <p key={cert.id} className="text-sm text-slate-700">
                {cert.name} - {cert.issuer}, {cert.year}
              </p>
            ))}
          </div>
        )}
      </div>
    </div >
  );
}

// LEGACY - Traditional with modern touches
function LegacyTemplate({ data }: { data: ResumeData }) {
  return (
    <div className="flex h-full bg-slate-50">
      {/* Left Sidebar */}
      <div className="w-72 border-r-4 border-teal-500 bg-white px-8 py-10">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{data.contact.name}</h1>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-600">{data.contact.title}</p>
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            <p>{data.contact.email}</p>
            <p>{data.contact.phone}</p>
            <p>{data.contact.location}</p>
          </div>

          <div>
            <h3 className="mb-3 border-b-2 border-teal-500 pb-1 text-sm font-bold uppercase text-slate-900">Skills</h3>
            <div className="space-y-3">
              {data.skills.map((group, idx) => (
                <div key={`${group.label}-${idx}`}>
                  <p className="text-xs font-semibold text-teal-700">{group.label}</p>
                  <ul className="mt-1 space-y-1 text-sm text-slate-700">
                    {group.skills.map((skill) => (
                      <li key={skill}>• {skill}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 border-b-2 border-teal-500 pb-1 text-sm font-bold uppercase text-slate-900">Education</h3>
            {data.education.map((edu) => (
              <div key={edu.id} className="space-y-1">
                <p className="text-sm font-bold text-slate-900">{edu.degree}</p>
                <p className="text-xs text-slate-600">{edu.school}</p>
                <p className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</p>
              </div>
            ))}
          </div>

          {data.certifications.length > 0 && (
            <div>
              <h3 className="mb-3 border-b-2 border-teal-500 pb-1 text-sm font-bold uppercase text-slate-900">Certifications</h3>
              <div className="space-y-2">
                {data.certifications.map((cert) => (
                  <div key={cert.id}>
                    <p className="text-xs font-semibold text-slate-900">{cert.name}</p>
                    <p className="text-xs text-slate-600">{cert.issuer}, {cert.year}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-10 py-10">
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 border-b-2 border-teal-500 pb-1 text-sm font-bold uppercase text-slate-900">Professional Summary</h2>
            <p className="text-sm leading-relaxed text-slate-700"><MarkdownText>{data.summary}</MarkdownText></p>
          </div>

          <div>
            <h2 className="mb-4 border-b-2 border-teal-500 pb-1 text-sm font-bold uppercase text-slate-900">Professional Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                    <span className="text-xs text-slate-600">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-700">{exp.company} | {exp.location}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx}><MarkdownText>{bullet}</MarkdownText></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {data.projects.length > 0 && (
            <div>
              <h2 className="mb-3 border-b-2 border-teal-500 pb-1 text-sm font-bold uppercase text-slate-900">Projects</h2>
              <div className="space-y-3">
                {data.projects.map((project) => (
                  <div key={project.id}>
                    <h4 className="font-bold text-slate-900">{project.name}</h4>
                    <p className="text-sm text-slate-700">{project.description}</p>
                    {project.impact && <p className="text-xs italic text-slate-600">{project.impact}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}

// Helper Section Component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
