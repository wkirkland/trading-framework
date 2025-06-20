// types/next.d.ts
// Temporary type declarations for Next.js modules to resolve VS Code errors

declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: any;
  }
  
  export interface NextConfig {
    env?: Record<string, string>;
    images?: Record<string, any>;
    experimental?: Record<string, any>;
    eslint?: Record<string, any>;
    typescript?: Record<string, any>;
    [key: string]: any;
  }
}

declare module 'next/server' {
  export class NextResponse {
    static json(body: any, init?: ResponseInit): Response;
  }
  
  export class NextRequest extends Request {}
}