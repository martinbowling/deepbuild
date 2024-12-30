'use client';

import { useState, useRef, useEffect } from 'react';
import { FileTree } from './FileTree';
import { Editor } from './Editor';
import { ProjectChat } from './ProjectChat';
import { StoredProject, FileImplementation } from '@/lib/types';
import { useFiles } from '@/hooks/useFiles';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import JSZip from 'jszip';

interface ProjectViewProps {
  project: StoredProject;
  onBack: () => void;
}

export function ProjectView({ project: initialProject, onBack }: ProjectViewProps) {
  const [selectedFile, setSelectedFile] = useState<FileImplementation | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isInitialSetup] = useState(() => 
    initialProject.files.every(f => !f.content)
  );
  const { updateProjectFile, currentProject, refreshProject, loading, deleteProject } = useFiles();
  const { sendMessage } = useChat();
  const chatRef = useRef<{ addMessage: (message: string) => void }>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Keep project data fresh
  useEffect(() => {
    if (initialProject.id) {
      refreshProject(initialProject.id);
    }
  }, [initialProject.id, refreshProject]);

  // Use the current project data instead of the initial project
  const project = currentProject || initialProject;

  const handleFileRefresh = async (file: FileImplementation) => {
    try {
      setIsRegenerating(true);
      
      await updateProjectFile(project.id, file.path, {
        status: 'regenerating'
      });

      chatRef.current?.addMessage(
        `🔄 Regenerating file: ${file.path}...`
      );

      const filePrompt = `Based on this project brief: ${JSON.stringify(project.brief)}

Please provide the complete implementation for the file: ${file.path}
Purpose: ${project.brief.project_brief.technical_outline.basic_structure.files.find(f => f.file === file.path)?.purpose}

Provide the complete file content in a format that can be directly used.
Include any necessary imports, configurations, and full implementation details.
Ensure the code follows best practices and includes proper error handling.`;

      const { message, response } = await sendMessage(filePrompt, 'implementation');
      
      // Show only the assistant reply in chat
      chatRef.current?.addMessage(message);

      if (response?.files_to_create?.[0]?.content) {
        await updateProjectFile(project.id, file.path, {
          content: response.files_to_create[0].content,
          status: 'completed',
          error: undefined
        });

        chatRef.current?.addMessage(`✅ Successfully updated ${file.path}`);
      } else {
        throw new Error('No file content in response');
      }
    } catch (error) {
      console.error(`Error refreshing file ${file.path}:`, error);
      await updateProjectFile(project.id, file.path, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      chatRef.current?.addMessage(
        `❌ Error regenerating ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAnswersComplete = async (answers: Record<string, string>) => {
    try {
      if (!chatRef.current) {
        console.error('Chat ref is not available');
        return;
      }

      setIsRegenerating(true);
      
      // Get the list of files from the brief
      const filesToCreate = project.brief.project_brief.technical_outline.basic_structure.files;
      
      chatRef.current?.addMessage(
        `Thank you for answering all the questions! Based on your answers:
${Object.entries(answers)
  .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
  .join('\n\n')}

I'll now generate the following files:
${filesToCreate.map(f => `- ${f.file}`).join('\n')}`
      );
      
      for (const fileInfo of filesToCreate) {
        try {
          // Update file status to pending
          await updateProjectFile(project.id, fileInfo.file, {
            status: 'pending'
          });

          // Refresh project to update UI
          await refreshProject(project.id);

          chatRef.current?.addMessage(
            `\n🔄 Now generating: ${fileInfo.file}\nPurpose: ${fileInfo.purpose}`
          );

          const filePrompt = `Based on this project brief: ${JSON.stringify(project.brief)}

Additional context from clarifying questions:
${Object.entries(answers)
  .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
  .join('\n\n')}

Please provide a complete implementation for the file: ${fileInfo.file}
Purpose: ${fileInfo.purpose}

Your response must follow the implementation system prompt format with <final_json> tags.
Focus on creating this specific file with proper implementation details.`;

          const { message, response } = await sendMessage(filePrompt, 'implementation');
          
          // Show the thought process and explanation
          if (response?.thought_process) {
            chatRef.current?.addMessage(
              `💭 Implementation approach for ${fileInfo.file}:
              
Problem Analysis: ${response.thought_process.problem_analysis}

Solution Approach: ${response.thought_process.solution_approach}

Implementation Plan:
${response.thought_process.implementation_plan}

Potential Issues:
${response.thought_process.potential_issues}`
            );
          }

          // Extract file content
          let fileContent = '';
          let explanation = '';
          
          if (response) {
            // First try to get content from files_to_create
            const fileToCreate = response.files_to_create?.find((f: { path: string }) => f.path === fileInfo.file);
            if (fileToCreate?.content) {
              fileContent = fileToCreate.content;
              explanation = response.assistant_reply || '';
              console.log('Found content in files_to_create:', { path: fileToCreate.path, contentLength: fileContent.length });
            }
            // Fallback to files_to_edit if no creation found
            const fileToEdit = response.files_to_edit?.find((f: { path: string }) => f.path === fileInfo.file);
            if (!fileContent && fileToEdit?.new_snippet) {
              fileContent = fileToEdit.new_snippet;
              explanation = fileToEdit.change_reason || '';
              console.log('Found content in files_to_edit:', { path: fileToEdit.path, contentLength: fileContent.length });
            }
          }

          if (!fileContent) {
            console.error('No file content found. Response structure:', {
              hasFilesToCreate: !!response?.files_to_create,
              filesToCreateLength: response?.files_to_create?.length,
              hasFilesToEdit: !!response?.files_to_edit,
              filesToEditLength: response?.files_to_edit?.length
            });
            throw new Error('No valid file content found in response JSON');
          }

          // Update file with content and status
          await updateProjectFile(project.id, fileInfo.file, {
            content: fileContent,
            status: 'completed',
            error: undefined
          });

          // Refresh project to update UI
          await refreshProject(project.id);

          // Show the explanation in chat
          if (explanation) {
            chatRef.current?.addMessage(explanation);
          }

          chatRef.current?.addMessage(
            `✅ Successfully generated ${fileInfo.file}`
          );

        } catch (error) {
          console.error(`Error generating file ${fileInfo.file}:`, error);
          await updateProjectFile(project.id, fileInfo.file, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          // Refresh project to update UI
          await refreshProject(project.id);

          chatRef.current?.addMessage(
            `❌ Error generating ${fileInfo.file}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      await refreshProject(project.id);
      
      chatRef.current?.addMessage(
        `\n🎉 Project setup complete! All files have been generated successfully.

What would you like to work on next? I can help you with:

1. Understanding how the code works
2. Making modifications or improvements
3. Adding new features
4. Testing and debugging
5. Or anything else you'd like to explore!

Just let me know what interests you and I'll be happy to help.`
      );

    } catch (error) {
      console.error('Error implementing project:', error);
      chatRef.current?.addMessage(
        `❌ Error during project setup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleBack = () => {
    onBack();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(project.id);
      onBack();
    }
  };

  const handleExport = async () => {
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading projects...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleExport}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowSettings(true)}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* File Tree */}
        <div className="w-64 border-r border-border bg-muted/30">
          <FileTree 
            files={project.files}
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            onFileRefresh={handleFileRefresh}
          />
        </div>

        {/* Editor */}
        <div className="flex-1 border-r border-border">
          {selectedFile ? (
            <Editor
              file={selectedFile}
              language={getLanguageFromPath(selectedFile.path)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select a file to view or edit
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="w-96 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <ProjectChat 
              ref={chatRef}
              project={project}
              currentFile={selectedFile}
              disabled={false}
              inputDisabled={isRegenerating}
              isInitialSetup={isInitialSetup}
              brief={isInitialSetup ? project.brief : undefined}
              onAnswersComplete={handleAnswersComplete}
            />
          </div>
        </div>
      </div>

      {showSettings && (
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
      )}
    </div>
  );
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'jsx': return 'javascript';
    case 'tsx': return 'typescript';
    case 'css': return 'css';
    case 'html': return 'html';
    case 'json': return 'json';
    default: return 'plaintext';
  }
} 