'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { AIResponse, StoredProject, ProjectBrief, FileImplementation } from './types';

interface ProjectDB extends DBSchema {
  projects: {
    key: string;
    value: StoredProject;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'hyperbolic-projects';
const STORE_NAME = 'projects';

export class FileManager {
  private db: IDBPDatabase<ProjectDB> | null = null;

  constructor() {
    // Initialize the database when the class is instantiated
    this.init().catch(console.error);
  }

  async init() {
    if (this.db) return; // Already initialized
    
    try {
      this.db = await openDB<ProjectDB>(DB_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('by-timestamp', 'timestamp');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async saveProject(name: string, brief: ProjectBrief): Promise<string> {
    if (!this.db) await this.init();
    
    const project: StoredProject = {
      id: crypto.randomUUID(),
      name,
      timestamp: Date.now(),
      brief,
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
      files: brief.project_brief.technical_outline.basic_structure.files.map(file => ({
        path: file.file,
        content: '',
        status: 'pending'
      }))
    };

    await this.db!.put(STORE_NAME, project);
    return project.id;
  }

  async updateProjectFile(projectId: string, filePath: string, implementation: Partial<FileImplementation>) {
    if (!this.db) await this.init();
    
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const fileIndex = project.files.findIndex(f => f.path === filePath);
    if (fileIndex === -1) {
      project.files.push({
        path: filePath,
        content: implementation.content || '',
        status: implementation.status || 'pending'
      });
    } else {
      project.files[fileIndex] = {
        ...project.files[fileIndex],
        ...implementation
      };
    }

    await this.db!.put(STORE_NAME, project);
  }

  async getProject(id: string): Promise<StoredProject | undefined> {
    if (!this.db) await this.init();
    return this.db!.get(STORE_NAME, id);
  }

  async listProjects(): Promise<StoredProject[]> {
    try {
      if (!this.db) await this.init();
      const projects = await this.db!.getAllFromIndex(STORE_NAME, 'by-timestamp');
      return projects || [];
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  }

  async exportProject(id: string): Promise<void> {
    const project = await this.getProject(id);
    if (!project) throw new Error('Project not found');

    const zip = new JSZip();

    // Add files to create
    for (const file of project.response.files_to_create) {
      zip.file(file.path, file.content);
    }

    // For files to edit, we'll create a separate directory
    const editsDir = zip.folder('edited_files');
    for (const edit of project.response.files_to_edit) {
      editsDir!.file(edit.path, edit.new_snippet);
    }

    // Add metadata file
    const metadata = {
      thought_process: project.response.thought_process,
      assistant_reply: project.response.assistant_reply,
      edits: project.response.files_to_edit.map(edit => ({
        path: edit.path,
        reason: edit.change_reason,
      })),
    };
    zip.file('project-metadata.json', JSON.stringify(metadata, null, 2));

    // Generate and save zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${project.name}-${project.id.slice(0, 8)}.zip`);
  }

  async parseAIResponse(responseText: string): Promise<AIResponse> {
    try {
      if (!responseText) {
        throw new Error('Empty response from AI');
      }

      console.log('Parsing response:', responseText);

      // Check if response is incomplete
      if (!responseText.includes('</final_json>')) {
        // Get everything after the last complete JSON object if any
        const lastJsonEnd = responseText.lastIndexOf('}');
        const incompleteContent = lastJsonEnd > -1 ? 
          responseText.substring(lastJsonEnd + 1) : 
          responseText;

        // Request continuation
        const continuationResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'assistant',
                content: responseText
              },
              {
                role: 'user',
                content: 'Please continue your response. Make sure to complete the JSON and include the closing </final_json> tag.'
              }
            ],
            type: 'implementation'
          })
        });

        if (!continuationResponse.ok) {
          throw new Error('Failed to get response continuation');
        }

        const continuationData = await continuationResponse.json();
        responseText += '\n' + continuationData.choices[0].message.content;

        // Recursively parse the complete response
        return this.parseAIResponse(responseText);
      }

      // Extract JSON between <final_json> tags
      const match = responseText.match(/<final_json>([\s\S]*?)<\/final_json>/);
      if (!match) {
        // If no tags found, try parsing the entire response as JSON
        try {
          const response: AIResponse = JSON.parse(responseText);
          if (this.validateAIResponse(response)) {
            return response;
          }
          throw new Error('Invalid response structure');
        } catch {
          throw new Error('No JSON found between final_json tags and invalid JSON format');
        }
      }

      const jsonStr = match[1];
      const response: AIResponse = JSON.parse(jsonStr);

      if (!this.validateAIResponse(response)) {
        throw new Error('Invalid response structure');
      }

      return response;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  }

  private validateAIResponse(response: any): response is AIResponse {
    return (
      response &&
      typeof response === 'object' &&
      'thought_process' in response &&
      'assistant_reply' in response &&
      Array.isArray(response.files_to_create) &&
      Array.isArray(response.files_to_edit)
    );
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    try {
      await this.db!.delete(STORE_NAME, id);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
}

export const fileManager = new FileManager();