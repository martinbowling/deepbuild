"use client";

import { useState } from 'react';
import { ProjectView } from '@/components/ProjectView';
import { Button } from '@/components/ui/button';
import { Plus, Settings2 } from 'lucide-react';
import { ProjectCard } from '@/components/ProjectCard';
import { useFiles } from '@/hooks/useFiles';
import { NewProjectModal } from '@/components/NewProjectModal';
import { useChat } from '@/hooks/useChat';
import { getConfig } from '@/lib/config';
import { fileManager } from '@/lib/fileOperations';
import { StoredProject } from '@/lib/types';
import JSZip from 'jszip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings } from '@/components/Settings';

export default function Dashboard() {
  const [selectedProject, setSelectedProject] = useState<StoredProject | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { projects, deleteProject, refreshProjects, saveProject } = useFiles();
  const { sendMessage } = useChat();

  const handleCreateProject = async (name: string, description: string) => {
    try {
      // Check if API is configured
      const config = getConfig();
      const apiKey = config.selectedModel === 'deepseek' ? config.deepseekKey : config.hyperbolicKey;
      
      if (!apiKey) {
        throw new Error(`Please configure your ${config.selectedModel === 'deepseek' ? 'DeepSeek' : 'Hyperbolic'} API key in settings before creating a project.`);
      }

      // First get the project brief with clarifying questions
      const { message, response } = await sendMessage(
        `Create a project brief for the following utility app: ${description}`,
        'brief'
      );

      console.log('Raw API Response:', message);
      console.log('Parsed Response:', response);

      if (!response?.project_brief?.technical_outline?.basic_structure?.files) {
        throw new Error('Invalid project brief format: Missing required structure');
      }
      
      // Save initial project state
      const projectId = await saveProject(name, response);
      const project = await fileManager.getProject(projectId);
      
      if (project) {
        // Show the project view which will handle the questions and file generation
        setShowNewProject(false);
        setSelectedProject(project);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        // Ensure we refresh the projects list after deletion
        await refreshProjects();
        // If we're viewing the deleted project, go back to the dashboard
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleExport = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const zip = new JSZip();

    // Add all project files to the zip
    project.files.forEach(file => {
      zip.file(file.path, file.content || '');
    });

    // Generate the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Create download link
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (selectedProject) {
    return (
      <ProjectView 
        project={selectedProject} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  return (
    <div className="container py-8 px-12">
      <div className="flex items-center justify-between mb-12">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            🚀 DeepBuild Projects
          </h1>
          <p className="text-muted-foreground">
            Create and manage your AI-powered projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowNewProject(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => setSelectedProject(project)}
            onDelete={() => handleDelete(project.id)}
            onExport={() => handleExport(project.id)}
          />
        ))}
        {projects.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No projects yet. Create one to get started!
          </div>
        )}
      </div>

      <NewProjectModal
        open={showNewProject}
        onOpenChange={setShowNewProject}
        onProjectCreate={handleCreateProject}
      />

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Settings</DialogTitle>
            <DialogDescription>
              Configure your AI model preferences and API keys
            </DialogDescription>
          </DialogHeader>
          <Settings />
        </DialogContent>
      </Dialog>
    </div>
  );
}