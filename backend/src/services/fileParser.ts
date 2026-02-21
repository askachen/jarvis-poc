import fs from 'fs';
import path from 'path';

export async function parseFile(filePath: string, mimeType: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  try {
    // Plain text files
    if (ext === '.txt' || mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf-8');
    }

    // CSV
    if (ext === '.csv' || mimeType === 'text/csv') {
      return fs.readFileSync(filePath, 'utf-8');
    }

    // PDF
    if (ext === '.pdf' || mimeType === 'application/pdf') {
      const pdfParse = await import('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse.default(buffer);
      return data.text;
    }

    // Excel
    if (
      ext === '.xlsx' ||
      ext === '.xls' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel'
    ) {
      const XLSX = await import('xlsx');
      const workbook = XLSX.readFile(filePath);
      const sheets = workbook.SheetNames.map((name) => {
        const ws = workbook.Sheets[name];
        return `=== Sheet: ${name} ===\n${XLSX.utils.sheet_to_csv(ws)}`;
      });
      return sheets.join('\n\n');
    }

    // Word documents
    if (
      ext === '.docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    // Images - return a note that the image was uploaded
    if (
      mimeType.startsWith('image/') ||
      ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)
    ) {
      return `[Image file uploaded: ${path.basename(filePath)}]`;
    }

    return `[File uploaded: ${path.basename(filePath)} — text extraction not supported for this format]`;
  } catch (error) {
    console.error('File parse error:', error);
    throw new Error(`Failed to parse file: ${(error as Error).message}`);
  }
}
