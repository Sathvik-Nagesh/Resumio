import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export async function extractTextFromBuffer(buffer: Buffer, mimeType?: string, filename?: string) {
  const lower = filename?.toLowerCase() ?? "";

  if (!mimeType && filename) {
    if (lower.endsWith(".pdf")) {
      mimeType = "application/pdf";
    } else if (lower.endsWith(".docx")) {
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (lower.endsWith(".txt")) {
      mimeType = "text/plain";
    }
  }

  if (mimeType?.includes("pdf")) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mimeType?.includes("word") || lower.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  return buffer.toString("utf-8");
}
