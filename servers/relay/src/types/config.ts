/**
 * Copyright 2025 The Artinet Project
 * SPDX-License-Identifier: Apache-2.0
 */
import { RemoteServerConfigSchema } from "@artinet/types";
import { AgentType } from "./manager.js";
import { z } from "zod";

export const RuntimeServerConfigSchema = RemoteServerConfigSchema.extend({
  removed: z.boolean().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  fallbackPath: z.string().optional(),
});
export type RuntimeServerConfig = z.infer<typeof RuntimeServerConfigSchema>;
export const AgentRuntimeSchema = z.record(
  z.string(),
  RuntimeServerConfigSchema
);
export type AgentRuntime = z.infer<typeof AgentRuntimeSchema>;

export interface IRuntimeSync {
  getRuntime(): Promise<AgentRuntime>;
  updateRuntime(data: AgentRuntime): Promise<boolean>;
}

export interface RuntimeLoaderConfig {
  configPath: string;
}

export interface SyncConfig extends Partial<RuntimeLoaderConfig> {
  abortSignal: AbortSignal;
  syncInterval: number;
}

export interface ScanConfig {
  host: string;
  startPort: number;
  endPort: number;
  headers?: Record<string, string>;
  fallbackPath?: string;
  threads?: number;
}

export interface AgentRelayConfig extends Partial<SyncConfig> {
  callerId: string;
  scanConfig?: ScanConfig;
  agents?: Map<string, AgentType>;
}
