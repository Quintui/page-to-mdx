export interface ConversionOptions {
  preserveImages?: boolean;
  preserveLinks?: boolean;
  includeMetadata?: boolean;
}

export function htmlToMdx(
  html: string,
  options: ConversionOptions = {}
): string {
  const {
    preserveImages = false,
    preserveLinks = false,
    includeMetadata = false,
  } = options;

  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove script and style elements
  const scriptsAndStyles = doc.querySelectorAll("script, style, noscript");
  scriptsAndStyles.forEach((el) => el.remove());

  // Start with the body content
  const bodyContent = doc.body || doc.documentElement;

  let mdx = "";

  // Add metadata if requested
  if (includeMetadata) {
    const title = doc.title || "Untitled";
    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
      "";

    mdx += "---\n";
    mdx += `title: "${title}"\n`;
    if (description) {
      mdx += `description: "${description}"\n`;
    }
    mdx += `date: "${new Date().toISOString()}"\n`;
    mdx += "---\n\n";
  }

  // Convert the content
  mdx += convertElement(bodyContent, 0, { preserveImages, preserveLinks });

  // Clean up the MDX
  return cleanupMdx(mdx);
}

function convertElement(
  element: Element,
  depth: number,
  options: ConversionOptions
): string {
  if (!element) return "";

  let result = "";
  const tagName = element.tagName.toLowerCase();

  // Handle different HTML elements
  switch (tagName) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      const level = parseInt(tagName.charAt(1));
      const headingText = getTextContent(element);
      result += "\n" + "#".repeat(level) + " " + headingText + "\n\n";
      break;

    case "p":
      const pText = convertChildren(element, depth, options);
      if (pText.trim()) {
        result += pText + "\n\n";
      }
      break;

    case "div":
    case "section":
    case "article":
    case "main":
      result += convertChildren(element, depth, options);
      break;

    case "ul":
    case "ol":
      result += convertList(element, depth, options, tagName === "ol");
      break;

    case "li":
      // This is handled by the list converter
      break;

    case "a":
      if (options.preserveLinks) {
        const href = element.getAttribute("href");
        const text = getTextContent(element);
        if (href && text) {
          result += `[${text}](${href})`;
        } else {
          result += text;
        }
      } else {
        result += getTextContent(element);
      }
      break;

    case "img":
      if (options.preserveImages) {
        const src = element.getAttribute("src");
        const alt = element.getAttribute("alt") || "";
        if (src) {
          result += `![${alt}](${src})`;
        }
      }
      break;

    case "strong":
    case "b":
      const strongText = getTextContent(element);
      result += `**${strongText}**`;
      break;

    case "em":
    case "i":
      const emText = getTextContent(element);
      result += `*${emText}*`;
      break;

    case "code":
      const codeText = getTextContent(element);
      result += `\`${codeText}\``;
      break;

    case "pre":
      const preText = getTextContent(element);
      result += "\n```\n" + preText + "\n```\n\n";
      break;

    case "blockquote":
      const quoteText = convertChildren(element, depth, options);
      const quotedLines = quoteText
        .split("\n")
        .map((line) => (line.trim() ? `> ${line}` : ">"))
        .join("\n");
      result += "\n" + quotedLines + "\n\n";
      break;

    case "br":
      result += "\n";
      break;

    case "hr":
      result += "\n---\n\n";
      break;

    case "table":
      result += convertTable(element, options);
      break;

    default:
      // For other elements, just get their text content
      result += convertChildren(element, depth, options);
      break;
  }

  return result;
}

function convertChildren(
  element: Element,
  depth: number,
  options: ConversionOptions
): string {
  let result = "";

  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        result += text + " ";
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      result += convertElement(child as Element, depth + 1, options);
    }
  }

  return result;
}

function convertList(
  listElement: Element,
  depth: number,
  options: ConversionOptions,
  isOrdered: boolean
): string {
  let result = "\n";
  const items = listElement.querySelectorAll(":scope > li");

  items.forEach((item, index) => {
    const prefix = isOrdered ? `${index + 1}. ` : "- ";
    const itemText = convertChildren(item, depth + 1, options).trim();
    result += prefix + itemText + "\n";
  });

  return result + "\n";
}

function convertTable(
  tableElement: Element,
  options: ConversionOptions
): string {
  const rows = tableElement.querySelectorAll("tr");
  if (rows.length === 0) return "";

  let result = "\n";

  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll("td, th");
    const cellTexts = Array.from(cells).map((cell) =>
      getTextContent(cell).replace(/\|/g, "\\|").trim()
    );

    result += "| " + cellTexts.join(" | ") + " |\n";

    // Add header separator after first row if it contains th elements
    if (rowIndex === 0 && row.querySelector("th")) {
      result += "| " + cellTexts.map(() => "---").join(" | ") + " |\n";
    }
  });

  return result + "\n";
}

function getTextContent(element: Element): string {
  return element.textContent?.replace(/\s+/g, " ").trim() || "";
}

function cleanupMdx(mdx: string): string {
  return (
    mdx
      // Remove excessive whitespace
      .replace(/\n{3,}/g, "\n\n")
      // Clean up spacing around headers
      .replace(/\n+#/g, "\n\n#")
      // Remove trailing whitespace
      .replace(/[ \t]+$/gm, "")
      // Ensure file ends with single newline
      .replace(/\n*$/, "\n")
      .trim()
  );
}
