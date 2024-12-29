'use client';

import { useState, useCallback, useEffect } from 'react';
import { fileManager } from '@/lib/fileOperations';
import { AIResponse, StoredProject, ProjectBrief, FileImplementation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useFiles() {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [currentProject, setCurrentProject] = useState<StoredProject | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadProjects();
    }
  }, []);

  const loadProjects = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      setLoading(true);
      const loadedProjects = await fileManager.listProjects();
      setProjects(loadedProjects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveProject = useCallback(async (name: string, brief: ProjectBrief) => {
    try {
      const id = await fileManager.saveProject(name, brief);
      await loadProjects();
      return id;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save project',
        variant: 'destructive',
      });
      throw error;
    }
  }, [loadProjects, toast]);

  const refreshProject = useCallback(async (projectId: string) => {
    if (!projectId) return;
    try {
      const project = await fileManager.getProject(projectId);
      if (project) {
        setCurrentProject(project);
        // Also update the project in the projects list
        setProjects(prev => prev.map(p => 
          p.id === projectId ? project : p
        ));
      }
    } catch (error) {
      console.error('Error refreshing project:', error);
    }
  }, []);

  const updateProjectFile = useCallback(async (
    projectId: string, 
    filePath: string, 
    implementation: Partial<FileImplementation>
  ) => {
    try {
      await fileManager.updateProjectFile(projectId, filePath, implementation);
      // Immediately refresh the project to update the UI
      await refreshProject(projectId);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update file: ${filePath}`,
        variant: 'destructive',
      });
      throw error;
    }
  }, [refreshProject, toast]);

  const exportProject = useCallback(async (id: string) => {
    try {
      await fileManager.exportProject(id);
      toast({
        title: 'Success',
        description: 'Project exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export project',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const parseAIResponse = useCallback(async (responseText: string) => {
    try {
      return await fileManager.parseAIResponse(responseText);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse AI response',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await fileManager.deleteProject(id);
      await loadProjects(); // Refresh the list after deletion
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  }, [loadProjects, toast]);

  return {
    projects,
    currentProject,
    loading,
    loadProjects,
    saveProject,
    updateProjectFile,
    refreshProject,
    exportProject,
    deleteProject,
    parseAIResponse,
  };
}