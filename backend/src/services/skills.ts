import AdmZip from 'adm-zip';

export interface ParsedSkill {
  name: string;
  description?: string;
  content: string;
}

export async function parseSkillZip(buffer: Buffer): Promise<ParsedSkill> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  // Find SKILL.MD (case-insensitive, handles nested paths)
  const skillEntry = entries.find(
    (e) => e.entryName.split('/').pop()?.toUpperCase() === 'SKILL.MD'
  );

  if (!skillEntry) {
    throw new Error('SKILL.md not found in the zip archive');
  }

  const content = skillEntry.getData().toString('utf8');

  // Parse YAML frontmatter
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  let name = '';
  let description: string | undefined;

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];

    const nameMatch = frontmatter.match(/^name:\s*["']?(.+?)["']?\s*$/m);
    if (nameMatch) {
      name = nameMatch[1].trim();
    }

    const descMatch = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m);
    if (descMatch) {
      description = descMatch[1].trim();
    }
  }

  if (!name) {
    throw new Error('SKILL.md must have a "name" field in YAML frontmatter');
  }

  return { name, description, content };
}
