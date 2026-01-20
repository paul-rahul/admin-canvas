import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the markdown file
const markdownContent = fs.readFileSync(
  path.join(__dirname, "../USER_GUIDE.md"),
  "utf-8"
);

// Parse markdown and convert to docx paragraphs
const lines = markdownContent.split("\n");
const children = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith("# ")) {
    // H1
    children.push(
      new Paragraph({
        text: line.replace(/^#+\s*/, ""),
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );
  } else if (line.startsWith("## ")) {
    // H2
    children.push(
      new Paragraph({
        text: line.replace(/^#+\s*/, ""),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 150 },
      })
    );
  } else if (line.startsWith("### ")) {
    // H3
    children.push(
      new Paragraph({
        text: line.replace(/^#+\s*/, ""),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 150, after: 100 },
      })
    );
  } else if (line.startsWith("#### ")) {
    // H4
    children.push(
      new Paragraph({
        text: line.replace(/^#+\s*/, ""),
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 100, after: 50 },
      })
    );
  } else if (line.startsWith("- ") || line.startsWith("* ")) {
    // Bullet point
    children.push(
      new Paragraph({
        text: line.replace(/^[-*]\s*/, ""),
        bullet: { level: 0 },
        spacing: { after: 100 },
      })
    );
  } else if (line.trim() === "---") {
    // Horizontal rule - add spacing
    children.push(
      new Paragraph({
        text: "",
        spacing: { after: 200 },
      })
    );
  } else if (line.trim() === "") {
    // Empty line
    children.push(
      new Paragraph({
        text: "",
        spacing: { after: 50 },
      })
    );
  } else if (line.startsWith("|")) {
    // Table row - convert to paragraph with tab-separated text
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
    if (cells.length > 0 && !cells[0].includes("---")) {
      // Skip separator rows
      children.push(
        new Paragraph({
          text: cells.join("\t"),
          spacing: { after: 50 },
        })
      );
    }
  } else {
    // Regular paragraph
    const text = line.trim();
    if (text.length > 0) {
      // Handle bold and italic
      const parts = [];
      let currentText = text;
      let boldRegex = /\*\*(.+?)\*\*/g;
      let italicRegex = /\*(.+?)\*/g;
      
      // Simple text run for now (can be enhanced)
      children.push(
        new Paragraph({
          text: currentText.replace(/\*\*/g, "").replace(/\*/g, ""),
          spacing: { after: 100 },
        })
      );
    }
  }
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: children,
    },
  ],
});

// Generate and save
Packer.toBuffer(doc).then((buffer) => {
  const outputPath = path.join(__dirname, "../public/USER_GUIDE.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Successfully created ${outputPath}`);
  console.log(`   File size: ${(buffer.length / 1024).toFixed(2)} KB`);
});
