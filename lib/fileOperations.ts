'use client';

import { StoredProject, FileImplementation, ProjectBrief } from './types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'deepbuild_db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const FILES_STORE = 'files';

class FileManager {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create projects store
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
          projectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create files store
        if (!db.objectStoreNames.contains(FILES_STORE)) {
          const fileStore = db.createObjectStore(FILES_STORE, { keyPath: 'id' });
          fileStore.createIndex('projectId', 'projectId', { unique: false });
          fileStore.createIndex('path', 'path', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  private getTransaction(storeNames: string | string[], mode: IDBTransactionMode = 'readonly'): IDBTransaction {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.transaction(storeNames, mode);
  }

  private getStore(transaction: IDBTransaction, storeName: string): IDBObjectStore {
    return transaction.objectStore(storeName);
  }

  async saveProject(name: string, brief: ProjectBrief): Promise<string> {
    await this.ensureDB();
    const projectId = uuidv4();
    
    const files = brief.project_brief.technical_outline.basic_structure.files.map(file => ({
      id: uuidv4(),
      projectId,
      path: file.file,
      content: '',
      status: 'pending' as const,
      purpose: file.purpose
    }));

    const project: StoredProject = {
      id: projectId,
      name,
      timestamp: Date.now(),
      brief,
      files
    };

    const transaction = this.getTransaction([PROJECTS_STORE, FILES_STORE], 'readwrite');
    const projectStore = this.getStore(transaction, PROJECTS_STORE);
    const fileStore = this.getStore(transaction, FILES_STORE);

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve(projectId);

      projectStore.put(project);
      files.forEach(file => fileStore.put(file));
    });
  }

  async getProject(id: string): Promise<StoredProject | null> {
    await this.ensureDB();
    const transaction = this.getTransaction([PROJECTS_STORE, FILES_STORE]);
    const projectStore = this.getStore(transaction, PROJECTS_STORE);
    const fileStore = this.getStore(transaction, FILES_STORE);

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);

      const projectRequest = projectStore.get(id);
      projectRequest.onsuccess = () => {
        const project = projectRequest.result;
        if (!project) {
          resolve(null);
          return;
        }

        const filesIndex = fileStore.index('projectId');
        const filesRequest = filesIndex.getAll(id);
        filesRequest.onsuccess = () => {
          resolve({ ...project, files: filesRequest.result });
        };
      };
    });
  }

  async getAllProjects(): Promise<StoredProject[]> {
    await this.ensureDB();
    const transaction = this.getTransaction([PROJECTS_STORE, FILES_STORE]);
    const projectStore = this.getStore(transaction, PROJECTS_STORE);
    const fileStore = this.getStore(transaction, FILES_STORE);

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);

      const projectsRequest = projectStore.getAll();
      projectsRequest.onsuccess = () => {
        const projects = projectsRequest.result;
        const filesIndex = fileStore.index('projectId');
        let completedProjects = 0;
        const projectsWithFiles: StoredProject[] = [];

        projects.forEach(project => {
          const filesRequest = filesIndex.getAll(project.id);
          filesRequest.onsuccess = () => {
            projectsWithFiles.push({ ...project, files: filesRequest.result });
            completedProjects++;
            if (completedProjects === projects.length) {
              resolve(projectsWithFiles);
            }
          };
        });
      };
    });
  }

  async updateProjectFile(projectId: string, filePath: string, updates: { content?: string; status?: 'pending' | 'completed' | 'error' | 'regenerating'; error?: string }): Promise<void> {
    await this.ensureDB();
    const transaction = this.getTransaction([FILES_STORE], 'readwrite');
    const fileStore = this.getStore(transaction, FILES_STORE);
    
    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      const filesIndex = fileStore.index('projectId');
      const filesRequest = filesIndex.getAll(projectId);
      
      filesRequest.onsuccess = () => {
        const files = filesRequest.result;
        const file = files.find(f => f.path === filePath);
        if (!file) {
          reject(new Error(`File not found: ${filePath}`));
          return;
        }

        fileStore.put({ ...file, ...updates });
      };
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.ensureDB();
    const transaction = this.getTransaction([PROJECTS_STORE, FILES_STORE], 'readwrite');
    const projectStore = this.getStore(transaction, PROJECTS_STORE);
    const fileStore = this.getStore(transaction, FILES_STORE);

    return new Promise((resolve, reject) => {
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();

      const filesIndex = fileStore.index('projectId');
      const filesRequest = filesIndex.getAll(id);
      
      filesRequest.onsuccess = () => {
        const files = filesRequest.result;
        projectStore.delete(id);
        files.forEach(file => fileStore.delete(file.id));
      };
    });
  }
}

export const fileManager = new FileManager();