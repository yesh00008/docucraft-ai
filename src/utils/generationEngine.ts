import { DocumentChunk } from '../store/useAppStore';

const LOREM_IPSUM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem."
];

const generateRandomMarkdown = (paragraphs: number) => {
  let content = "";
  for (let i = 0; i < paragraphs; i++) {
    const text = LOREM_IPSUM[Math.floor(Math.random() * LOREM_IPSUM.length)];
    if (i % 3 === 0) {
      content += `### Subsection ${i + 1}\n\n`;
    }
    if (i % 5 === 0) {
      content += `> ${text}\n\n`;
    } else {
      content += `${text} ${LOREM_IPSUM[Math.floor(Math.random() * LOREM_IPSUM.length)]}\n\n`;
    }
  }
  return content;
};

// Generator function that yields chunks
export async function* simulateDocumentGeneration(pageCount: number): AsyncGenerator<DocumentChunk, void, unknown> {
  let order = 0;

  for (let i = 1; i <= pageCount; i++) {
    // Artificial delay to simulate AI streaming (300-800ms per section)
    const delay = Math.floor(Math.random() * 500) + 300;
    await new Promise(resolve => setTimeout(resolve, delay));

    const chunk: DocumentChunk = {
      id: `chunk-${i}-${Date.now()}`,
      sectionTitle: `Chapter ${i}: The Advanced Concepts of System Design`,
      content: generateRandomMarkdown(Math.floor(Math.random() * 4) + 4),
      order: order++
    };

    yield chunk;
  }
}
