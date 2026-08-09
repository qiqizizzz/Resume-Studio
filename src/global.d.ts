import type { ResumeStudioApi } from "./types";

declare global {
  interface Window {
    resumeStudio?: ResumeStudioApi;
  }
}

export {};
