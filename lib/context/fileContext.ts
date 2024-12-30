import { createContext, useContext, useCallback } from 'react';
import { File } from '@/lib/types';
import { clearProjectFromStorage } from '@/lib/fileUtils';

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

export function useFiles() {
  const clearProject = useCallback((projectId: string) => {
    clearProjectFromStorage(projectId);
    setCurrentProject(null);
  }, []);

  return {
    currentProject,
    updateProjectFile,
    refreshProject,
    clearProject,
  };
}