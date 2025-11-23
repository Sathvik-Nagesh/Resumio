import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-3xl flex-col gap-3 text-center",
        align === "left" && "text-left",
        className
      )}
    >
      {eyebrow ? (
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold text-slate-900 sm:text-4xl">{title}</h2>
      {description ? (
        <p className="text-base text-slate-600 sm:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
