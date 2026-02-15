export const ACTION_VERBS = [
  "accelerated",
  "achieved",
  "architected",
  "automated",
  "built",
  "captured",
  "created",
  "delivered",
  "designed",
  "developed",
  "drove",
  "enabled",
  "engineered",
  "enhanced",
  "expanded",
  "implemented",
  "improved",
  "launched",
  "led",
  "modernized",
  "optimized",
  "orchestrated",
  "owned",
  "pioneered",
  "reduced",
  "shipped",
  "streamlined",
  "spearheaded",
  "scaled",
  "transformed",
];

export const METRIC_REGEX = /(\d+%?)|(\$\d+)|(\b(?:million|billion|thousand|k)\b)/i;

export const REQUIRED_SECTIONS = [
  "summary",
  "experience",
  "education",
  "skills",
];

export const ATS_KEYWORD_SYNONYMS: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "nodejs", "node.js"],
  typescript: ["ts"],
  kubernetes: ["k8s"],
  cicd: ["ci/cd", "continuous integration", "continuous delivery"],
  devops: ["platform engineering", "sre", "site reliability"],
  "site reliability": ["sre"],
  cybersecurity: ["security", "infoSec", "information security", "soc"],
  "security operations center": ["soc"],
  ai: ["ml", "machine learning", "llm", "generative ai"],
  "machine learning": ["ml"],
  "artificial intelligence": ["ai"],
  sql: ["postgres", "mysql", "postgresql", "sqlite"],
  react: ["reactjs", "react.js", "next.js", "nextjs"],
  aws: ["amazon web services"],
  gcp: ["google cloud", "google cloud platform"],
  azure: ["microsoft azure"],
};

export const ROLE_PROFILE_KEYWORDS: Record<string, string[]> = {
  security: ["security", "soc", "siem", "incident", "vulnerability", "threat", "iam", "compliance"],
  data: ["sql", "python", "etl", "warehouse", "analytics", "spark", "dbt", "airflow"],
  frontend: ["react", "typescript", "javascript", "css", "ui", "accessibility", "next.js"],
  backend: ["api", "microservices", "database", "node", "java", "go", "scalability", "distributed"],
  devops: ["kubernetes", "docker", "terraform", "cloud", "cicd", "monitoring", "sre"],
  product: ["roadmap", "stakeholder", "experiment", "kpi", "metrics", "market", "gtm"],
};
