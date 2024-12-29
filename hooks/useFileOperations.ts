import { useCallback } from 'react';
import { FileToCreate, FileToEdit, AIResponse } from '@/lib/types';
import { useFileContext } from '@/lib/context/fileContext';
import { FileService } from '@/lib/services/fileService';
import { showDiffPreview } from '@/lib/fileOperations';

export function useFileOperations() {
  const { files, addFile, updateFile } = useFileContext();
  const fileService = new FileService(files);

  const handleFileOperation = useCallback(async (response: AIResponse) => {
    try {
      // Handle file creations
      if (response.filesToCreate) {
        for (const operation of response.filesToCreate) {
          const updatedFiles = await fileService.createFile(operation);
          addFile(updatedFiles[updatedFiles.length - 1]);
        }
      }

      // Handle file edits
      if (response.filesToEdit) {
        for (const operation of response.filesToEdit) {
          console.log('Applying edit:', showDiffPreview(operation));
          const updatedFiles = await fileService.editFile(operation);
          const editedFile = updatedFiles.find(f => f.path === operation.path);
          if (editedFile) {
            updateFile(editedFile.path, editedFile.content);
          }
        }
      }
    } catch (error) {
      console.error('File operation error:', error);
      throw error;
    }
  }, [fileService, addFile, updateFile]);

  return {
    handleFileOperation,
  };
}