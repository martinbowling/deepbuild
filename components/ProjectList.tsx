'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StoredProject } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreateProject } from './CreateProject';

interface ProjectListProps {
  onProjectSelect: (project: StoredProject) => void;
}

export function ProjectList({ onProjectSelect }: ProjectListProps) {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Load projects from localStorage on mount
  useEffect(() => {
    const loadProjects = () => {
      const storedProjects = Object.entries(localStorage)
        .filter(([key]) => key.startsWith('project-'))
        .map(([_, value]) => JSON.parse(value) as StoredProject);
      setProjects(storedProjects);
    };

    loadProjects();
    
    // Listen for storage changes
    window.addEventListener('storage', loadProjects);
    return () => window.removeEventListener('storage', loadProjects);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No projects yet. Click "New Project" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card 
              key={project.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onProjectSelect(project)}
            >
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>
                  {project.brief.project_brief.app_summary.purpose}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Describe your project and I'll help you build it.
            </DialogDescription>
          </DialogHeader>
          <CreateProject 
            onProjectCreated={(project) => {
              setShowCreateDialog(false);
              onProjectSelect(project);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 