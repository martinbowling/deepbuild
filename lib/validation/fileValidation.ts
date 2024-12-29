const VALID_FILE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json', '.md'
];

export function validateFilePath(path: string): void {
  if (!path) {
    throw new Error('File path cannot be empty');
  }

  if (!VALID_FILE_EXTENSIONS.some(ext => path.endsWith(ext))) {
    throw new Error(`Invalid file extension. Supported extensions: ${VALID_FILE_EXTENSIONS.join(', ')}`);
  }

  if (path.includes('..')) {
    throw new Error('Path traversal is not allowed');
  }
}

export function validateFileContent(content: string): void {
  if (content === undefined || content === null) {
    throw new Error('File content cannot be null or undefined');
  }

  if (content.length > 1000000) { // 1MB limit
    throw new Error('File content exceeds maximum size limit');
  }
}

export function sanitizeFilePath(path: string): string {
  return path
    .replace(/[^a-zA-Z0-9-_./]/g, '') // Remove invalid characters
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/^\//, ''); // Remove leading slash
}