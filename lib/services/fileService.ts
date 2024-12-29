import { File, FileToCreate, FileToEdit } from '@/lib/types';
import { validateFilePath, validateFileContent } from '@/lib/validation/fileValidation';

export class FileService {
  private files: File[];

  constructor(initialFiles: File[] = []) {
    this.files = initialFiles;
  }

  async createFile(operation: FileToCreate): Promise<File[]> {
    validateFilePath(operation.path);
    validateFileContent(operation.content);

    const newFile: File = {
      path: operation.path,
      content: operation.content,
    };

    this.files = [...this.files.filter(f => f.path !== operation.path), newFile];
    return this.files;
  }

  async editFile(operation: FileToEdit): Promise<File[]> {
    const file = this.files.find(f => f.path === operation.path);
    if (!file) {
      throw new Error(`File not found: ${operation.path}`);
    }

    if (!file.content.includes(operation.originalSnippet)) {
      throw new Error(`Original content not found in file: ${operation.path}`);
    }

    validateFileContent(operation.newSnippet);

    const newContent = file.content.replace(
      operation.originalSnippet,
      operation.newSnippet
    );

    this.files = this.files.map(f =>
      f.path === operation.path ? { ...f, content: newContent } : f
    );

    return this.files;
  }

  getFiles(): File[] {
    return this.files;
  }

  getFile(path: string): File | undefined {
    return this.files.find(f => f.path === path);
  }
}