'use client';

import { useState } from 'react';
import { Plus, MoreVertical, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFiles } from '@/hooks/useFiles';
import { useChat } from '@/hooks/useChat';
import { NewProjectModal } from '@/components/NewProjectModal';
import { BriefConfirmationDialog } from '@/components/BriefConfirmationDialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectView } from './ProjectView';
import { StoredProject } from '@/lib/types';
import { fileManager } from '@/lib/fileOperations';
import { getConfig } from '@/lib/config';

export default function HomeContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [briefConfirmationOpen, setBriefConfirmationOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [currentBrief, setCurrentBrief] = useState<any>(null);
  const [currentProjectData, setCurrentProjectData] = useState<{ name: string; description: string } | null>(null);
  const [selectedProject, setSelectedProject] = useState<StoredProject | null>(null);
  
  const { projects, loading, saveProject, updateProjectFile, exportProject, deleteProject, parseAIResponse } = useFiles();
  const { sendMessage, isLoading } = useChat();

  const handleCreateProject = async (name: string, description: string) => {
    try {
      // Check if API is configured
      const config = getConfig();
      const apiKey = config.selectedModel === 'deepseek' ? config.deepseekKey : config.hyperbolicKey;
      
      if (!apiKey) {
        throw new Error(`Please configure your ${config.selectedModel === 'deepseek' ? 'DeepSeek' : 'Hyperbolic'} API key in settings before creating a project.`);
      }

      const briefResponse = await sendMessage(
        `Create a project brief for the following utility app: ${description}`,
        'brief'
      );

      console.log('Raw API Response:', briefResponse);

      // Extract JSON from between final_json tags
      const match = briefResponse.match(/<final_json>([^]*?)<\/final_json>/);
      console.log('Regex match result:', match);
      
      if (!match) {
        throw new Error('Invalid response format: Missing JSON data');
      }

      const jsonContent = match[1].trim();
      console.log('Extracted JSON content:', jsonContent);

      const parsedBrief = JSON.parse(jsonContent);
      console.log('Parsed brief:', parsedBrief);

      if (!parsedBrief?.project_brief?.technical_outline?.basic_structure?.files) {
        throw new Error('Invalid project brief format: Missing required structure');
      }
      
      // First save the project
      const projectId = await saveProject(name, parsedBrief);
      // Then get the full project data
      const project = await fileManager.getProject(projectId);
      
      if (project) {
        setModalOpen(false);
        setSelectedProject(project);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const handleBriefConfirm = async (answers: Record<string, string>) => {
    if (!currentBrief || !currentProjectData) return;

    try {
      // First save the project with the brief
      const projectId = await saveProject(currentProjectData.name, currentBrief);

      // Process each file in the brief, including the answers in the context
      const files = currentBrief.project_brief.technical_outline.basic_structure.files;
      
      for (const file of files) {
        try {
          const filePrompt = `Based on this project brief: ${JSON.stringify(currentBrief)}

Additional context from clarifying questions:
${Object.entries(answers)
  .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
  .join('\n\n')}

Please provide the complete implementation for the file: ${file.file}
Purpose: ${file.purpose}

Provide the complete file content in a format that can be directly used.
Include any necessary imports, configurations, and full implementation details.
Ensure the code follows best practices and includes proper error handling.`;

          const implementationResponse = await sendMessage(filePrompt, 'implementation');
          console.log(`Implementation Response for ${file.file}:`, implementationResponse);

          // Parse the response and update the project
          const parsedResponse = await parseAIResponse(implementationResponse);
          
          // Update the file in storage using the hook method
          await updateProjectFile(projectId, file.file, {
            content: parsedResponse.files_to_create[0]?.content || '',
            status: 'completed'
          });
        } catch (error) {
          console.error(`Error implementing file ${file.file}:`, error);
          await updateProjectFile(projectId, file.file, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      }

      // Clean up
      setBriefConfirmationOpen(false);
      setCurrentBrief(null);
      setCurrentProjectData(null);
    } catch (error) {
      console.error('Error implementing project:', error);
      throw error;
    }
  };

  const handleBriefReject = () => {
    setBriefConfirmationOpen(false);
    setModalOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleBack = () => {
    setSelectedProject(null);
  };

  if (selectedProject) {
    return <ProjectView project={selectedProject} onBack={handleBack} />;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading projects...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>Created {new Date(project.timestamp).toLocaleDateString()}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      exportProject(project.id);
                    }}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Files
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {project.brief.project_brief.app_summary.purpose}
                </p>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Files:</p>
                  <div className="mt-1 space-y-1">
                    {project.files.map((file) => (
                      <div 
                        key={file.path}
                        className={`text-xs ${
                          file.status === 'completed' 
                            ? 'text-green-600' 
                            : file.status === 'error' 
                            ? 'text-red-600' 
                            : 'text-yellow-600'
                        }`}
                      >
                        {file.path} - {file.status}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          No projects found. Create one to get started!
        </div>
      )}

      <NewProjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onProjectCreate={handleCreateProject}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all its files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 