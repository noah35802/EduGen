import { resources } from "../data/mockData";

export const resourceService = {
  async getResources() {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return resources;
  },
  async uploadResource(fileName: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      id: crypto.randomUUID(),
      fileName,
      status: "Uploaded",
      processingStatus: "AI-ready",
    };
  },
};
