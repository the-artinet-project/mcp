/**
 * Copyright 2025 The Artinet Project
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  Agent,
  AgentCard,
  MessageSendParams,
  Task,
  TaskIdParams,
  TaskQueryParams,
  SendMessageSuccessResult,
  A2AClient,
} from "@artinet/sdk";

export interface ClientConfig {
  url: URL | string;
  headers?: Record<string, string>;
  fallbackPath?: string;
}

export type AgentType = Agent | A2AClient;

export interface IAgentManager {
  getAgent(id: string): AgentType | undefined;
  setAgent(agent: AgentType): Promise<void>;
  deleteAgent(id: string): void;
  getAgents(): AgentType[];
  getAgentCount(): number;
  getAgentIds(): string[];
}

export interface IAgentRelay extends IAgentManager {
  registerAgent(agent: AgentType | ClientConfig): Promise<AgentCard>;
  deregisterAgent(agentId: string): void;
  sendMessage(
    agentId: string,
    messageParams: MessageSendParams
  ): Promise<SendMessageSuccessResult>;
  getTask(agentId: string, taskQuery: TaskQueryParams): Promise<Task>;
  cancelTask(agentId: string, taskId: TaskIdParams): Promise<Task>;
  getAgentCard(agentId: string): Promise<AgentCard | undefined>;
  searchAgents(query: string): Promise<AgentCard[]>;
}
