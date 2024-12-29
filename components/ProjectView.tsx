'use client';

import { useState, useRef, useEffect } from 'react';
import { FileTree } from './FileTree';
import { Editor } from './Editor';
import { ProjectChat } from './ProjectChat';
import { StoredProject, FileImplementation } from '@/lib/types';
import { useFiles } from '@/hooks/useFiles';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
  const { updateProjectFile, parseAIResponse, currentProject, refreshProject } = useFiles();
  const { sendMessage } = useChat();
  const chatRef = useRef<{ addMessage: (message: string) => void }>(null);

  // Keep project data fresh
  useEffect(() => {
    refreshProject(initialProject.id);
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

        await refreshProject(project.id);
        chatRef.current?.addMessage(`✅ Successfully updated ${file.path}`);
      } else {
        throw new Error('No file content in response');
      }
    } catch (error) {
      console.error(`Error refreshing file ${file.path}:`, error);
      await updateProjectFile(project.id, file.path, {
        status: 'error',
        error: error.message
      });

      chatRef.current?.addMessage(
        `❌ Error regenerating ${file.path}: ${error.message}`
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAnswersComplete = async (answers: Record<string, string>) => {
    try {
      setIsRegenerating(true);
      
      for (const file of project.files) {
        try {
          await updateProjectFile(project.id, file.path, {
            status: 'pending'
          });

          chatRef.current?.addMessage(
            `🔄 Generating implementation for ${file.path}...`
          );

          const filePrompt = `Based on this project brief: ${JSON.stringify(project.brief)}

Additional context from clarifying questions:
${Object.entries(answers)
  .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
  .join('\n\n')}

Please provide the complete implementation for the file: ${file.path}
Purpose: ${project.brief.project_brief.technical_outline.basic_structure.files.find(f => f.file === file.path)?.purpose}`;

          const response = await sendMessage(filePrompt, 'implementation');
          
          // Parse the JSON response from within the tags
          const match = response.match(/<final_json>(.*?)<\/final_json>/s);
          if (!match) {
            throw new Error('Invalid response format');
          }

          const parsedResponse = JSON.parse(match[1]);
          
          // Show the assistant's explanation of what was implemented
          if (parsedResponse.assistant_reply) {
            chatRef.current?.addMessage(parsedResponse.assistant_reply);
          }

          const fileContent = parsedResponse.files_to_create?.[0]?.content;

          if (!fileContent) {
            throw new Error('No file content in response');
          }

          await updateProjectFile(project.id, file.path, {
            content: fileContent,
            status: 'completed',
            error: undefined
          });

          chatRef.current?.addMessage(
            `✅ Successfully generated ${file.path}`
          );
        } catch (error) {
          console.error(`Error generating file ${file.path}:`, error);
          await updateProjectFile(project.id, file.path, {
            status: 'error',
            error: error.message
          });

          chatRef.current?.addMessage(
            `❌ Error generating ${file.path}: ${error.message}`
          );
        }
      }

      await refreshProject(project.id);
      
      // Final message with next steps
      chatRef.current?.addMessage(
        `🎉 All files have been generated successfully! What would you like to work on next? I can help you with:

1. Understanding how the code works
2. Making modifications or improvements
3. Adding new features
4. Testing and debugging
5. Or anything else you'd like to explore!`
      );
    } catch (error) {
      console.error('Error implementing project:', error);
      chatRef.current?.addMessage(
        `❌ Error during project setup: ${error.message}`
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header with back button */}
      <div className="border-b border-border p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{project.name}</h2>
          <p className="text-sm text-muted-foreground">
            {project.brief.project_brief.app_summary.purpose}
          </p>
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
        <div className="w-96">
          <ProjectChat 
            ref={chatRef}
            project={project}
            currentFile={selectedFile}
            disabled={isRegenerating}
            isInitialSetup={isInitialSetup}
            brief={isInitialSetup ? project.brief : undefined}
            onAnswersComplete={handleAnswersComplete}
          />
        </div>
      </div>
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