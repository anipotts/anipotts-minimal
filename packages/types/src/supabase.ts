import type { Thought } from './thought';
import type { Project } from './project';
import type { PageContent } from './cms';

// Database type for Supabase typed client.
// Manual approximation; replace with `supabase gen types` output when available.
export interface Database {
  public: {
    Tables: {
      thoughts: {
        Row: Thought;
        Insert: Partial<Thought> & Pick<Thought, 'title'>;
        Update: Partial<Thought>;
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & Pick<Project, 'title'>;
        Update: Partial<Project>;
      };
      page_content: {
        Row: PageContent<string>;
        Insert: Partial<PageContent<string>>;
        Update: Partial<PageContent<string>>;
      };
    };
  };
}
