"use client";

import { ReactNode, useState, useCallback } from 'react';
import { File } from '@/lib/types';
import { FileContext } from './fileContext';

interface FileProviderProps {
  children: ReactNode;
}

export function FileProvider({ children }: FileProviderProps) {
  const [files, setFiles] = useState<File[]>([]);

  const addFile = useCallback((file: File) => {
    setFiles(prev => [...prev.filter(f => f.path !== file.path), file]);
  }, []);

  const updateFile = useCallback((path: string, content: string) => {
    setFiles(prev => prev.map(file => 
      file.path === path ? { ...file, content } : file
    ));
  }, []);

  const deleteFile = useCallback((path: string) => {
    setFiles(prev => prev.filter(file => file.path !== path));
  }, []);

  const getFile = useCallback((path: string) => {
    return files.find(file => file.path === path);
  }, [files]);

  return (
    <FileContext.Provider value={{ files, addFile, updateFile, deleteFile, getFile }}>
      {children}
    </FileContext.Provider>
  );
}