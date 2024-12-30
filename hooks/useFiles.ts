'use client';

import { useState, useEffect, useCallback } from 'react';
import { fileManager } from '@/lib/fileOperations';
import { StoredProject, ProjectBrief } from '@/lib/types';

export function useFiles() {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<StoredProject | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      const allProjects = await fileManager.getAllProjects();
      setProjects(allProjects.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, []);

  const refreshProject = useCallback(async (projectId: string) => {
    try {
      const project = await fileManager.getProject(projectId);
      if (project) {
        setCurrentProject(project);
        // Update the project in the projects list atomically
        setProjects(prev => {
          const projectIndex = prev.findIndex(p => p.id === projectId);
          if (projectIndex === -1) return prev;
          const newProjects = [...prev];
          newProjects[projectIndex] = project;
          return newProjects;
        });
      }
    } catch (error) {
      console.error('Error refreshing project:', error);
    }
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        await refreshProjects();
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [refreshProjects]);

  const saveProject = async (name: string, brief: ProjectBrief) => {
    const projectId = await fileManager.saveProject(name, brief);
    await refreshProjects();
    return projectId;
  };

  const updateProjectFile = async (projectId: string, filePath: string, updates: { content?: string; status?: 'pending' | 'completed' | 'error' | 'regenerating'; error?: string }) => {
    await fileManager.updateProjectFile(projectId, filePath, updates);
    // After updating a file, refresh both the current project and the projects list
    await Promise.all([
      refreshProject(projectId),
      refreshProjects()
    ]);
  };

  const deleteProject = async (projectId: string) => {
    try {
      // Immediately update UI state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      
      // Then perform the actual deletion
      await fileManager.deleteProject(projectId);
      
      // Refresh the list to ensure consistency
      await refreshProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      // If deletion fails, refresh to restore the original state
      await refreshProjects();
    }
  };

  return {
    projects,
    loading,
    saveProject,
    updateProjectFile,
    deleteProject,
    refreshProjects,
    refreshProject,
    currentProject
  };
}