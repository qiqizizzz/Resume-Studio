declare module "pagedjs" {
  export class Previewer {
    preview(content: string, stylesheets?: Array<string | Record<string, string>>, renderTo?: HTMLElement): Promise<unknown>;
  }
}
