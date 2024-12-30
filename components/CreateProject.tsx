'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChat } from '@/hooks/useChat';
import { fileManager } from '@/lib/fileOperations';
import { StoredProject, FileImplementation } from '@/lib/types';

interface CreateProjectProps {
  onProjectCreated: (project: StoredProject) => void;
}

export function CreateProject({ onProjectCreated }: CreateProjectProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || isLoading) return;

    setIsLoading(true);
    try {
      const response = await sendMessage(
        `Create a project brief for a ${description}. Include implementation details and file structure.`,
        'brief'
      );

      if (!response) throw new Error('No response from AI');

      // Extract JSON from between final_json tags
      const match = response.match(/<final_json>([^]*?)<\/final_json>/);
      if (!match) {
        throw new Error('Invalid response format: Missing JSON data');
      }

      const parsedResponse = JSON.parse(match[1].trim());
      if (!parsedResponse?.project_brief?.technical_outline?.basic_structure?.files) {
        throw new Error('Invalid project brief format: Missing required structure');
      }

      const files: FileImplementation[] = parsedResponse.project_brief.technical_outline.basic_structure.files.map((f: { file: string; purpose: string }) => ({
        path: f.file,
        content: '',
        status: 'pending'
      }));

      const project: StoredProject = {
        id: `project-${Date.now()}`,
        name,
        timestamp: Date.now(),
        brief: parsedResponse,
        response: {
          thought_process: {
            problem_analysis: '',
            solution_approach: '',
            implementation_plan: '',
            potential_issues: ''
          },
          assistant_reply: '',
          files_to_create: [],
          files_to_edit: []
        },
        files
      };

      // Save using fileManager instead of direct localStorage
      await fileManager.saveProject(name, parsedResponse);
      onProjectCreated(project);
    } catch (error) {
      console.error('Error creating project:', error);
      // TODO: Show error to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Project"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Project Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you want to build..."
          required
          rows={5}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Project'}
      </Button>
    </form>
  );
} 