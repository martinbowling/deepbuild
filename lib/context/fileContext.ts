import { createContext, useContext } from 'react';
import { File } from '@/lib/types';

interface FileContextType {
  files: File[];
  addFile: (file: File) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  getFile: (path: string) => File | undefined;
}

export const FileContext = createContext<FileContextType | undefined>(undefined);

export function useFileContext() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
}