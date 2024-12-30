// File and message types
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface File {
  path: string;
  content: string;
}

// API response types
export interface ChatResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// File operation types
export interface FileToCreate {
  path: string;
  content: string;
  purpose: string;
}

export interface FileToEdit {
  path: string;
  original_snippet: string;
  new_snippet: string;
  change_reason: string;
}

export interface AIResponse {
  thought_process: ThoughtProcess;
  assistant_reply: string;
  files_to_create: FileToCreate[];
  files_to_edit: FileToEdit[];
}

export interface ProjectBrief {
  project_brief: {
    app_summary: {
      name: string;
      purpose: string;
      main_features: string[];
    };
    technical_outline: {
      tech_stack: string[];
      external_dependencies: string[];
      basic_structure: {
        files: Array<{
          file: string;
          purpose: string;
        }>;
      };
    };
    implementation_notes: {
      starting_point: string;
      key_considerations: string[];
      potential_challenges: string[];
    };
  };
  clarifying_questions: Array<{
    question: string;
    why_needed: string;
  }>;
}

export interface StoredProject {
  id: string;
  name: string;
  timestamp: number;
  brief: ProjectBrief;
  files: FileImplementation[];
}

export interface FileImplementation {
  id: string;
  projectId: string;
  path: string;
  content: string;
  status: 'pending' | 'completed' | 'error' | 'regenerating';
  purpose: string;
  error?: string;
}

export interface ThoughtProcess {
  problem_analysis: string;
  solution_approach: string;
  implementation_plan: string;
  potential_issues: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}