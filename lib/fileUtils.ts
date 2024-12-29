import { File } from './types';

const RECOGNIZED_EXTENSIONS = ['.css', '.html', '.js', '.ts', '.json', '.md'];

export function guessFilesInMessage(message: string): string[] {
  const words = message.split(/\s+/);
  return words.filter(word => 
    RECOGNIZED_EXTENSIONS.some(ext => word.includes(ext)) || word.includes('/')
  ).map(word => word.trim().replace(/['"]/g, ''));
}

export function ensureFileInContext(files: File[], path: string): boolean {
  return files.some(file => file.path === path);
}

export function validateFiles(paths: string[], files: File[]): Record<string, File> {
  const validFiles: Record<string, File> = {};
  
  paths.forEach(path => {
    const file = files.find(f => f.path === path);
    if (file) {
      validFiles[path] = file;
    }
  });

  return validFiles;
}