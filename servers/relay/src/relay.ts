/**
 * Copyright 2025 The Artinet Project
 * SPDX-License-Identifier: Apache-2.0
 */
import { AgentType, IAgentRelay, ClientConfig } from "./types/index.js";
import { AgentManager } from "./manager.js";
import {
  A2AClient,
  AgentCard,
  A2AService,
  MessageSendParams,
  SendMessageSuccessResult,
  TaskQueryParams,
  Task,
  TaskIdParams,
} from "@artinet/sdk";
import { RelayConfig, scanAgents } from "./scan.js";

/**
 * @description AgentRelay is a class that manages the agents and their interactions.
 * It scans for agents on the network and registers them.
 * It also provides a way to send messages to the agents and get tasks from them.
 * It also provides a way to get the agent card and search for agents.
 */
export class AgentRelay extends AgentManager implements IAgentRelay {
  constructor(config: RelayConfig, agents: Map<string, AgentType> = new Map()) {
    super(agents);
    this.findAgents(config);
  }
  private async findAgents(config: RelayConfig): Promise<void> {
    const configs = await scanAgents(config).catch((error) => {
      console.error(`Error scanning agents: ${error}`);
      return [];
    });
    for (const config of configs) {
      await this.registerAgent(config).catch((error) => {
        console.error(`Error registering agent: ${error}`);
      });
    }
  }
  async registerAgent(agent: AgentType | ClientConfig): Promise<AgentCard> {
    let agentCard: AgentCard;
    if (agent instanceof A2AClient) {
      agentCard = await agent.agentCard();
    } else if (agent instanceof A2AService) {
      agentCard = agent.agentCard;
    } else if (
      "url" in agent &&
      "headers" in agent &&
      "fallbackPath" in agent
    ) {
      try {
        agent = new A2AClient(agent.url, agent.headers, agent.fallbackPath);
        agentCard = await agent.agentCard();
      } catch (error) {
        console.error("error creating client for agent: ", error);
        throw error;
      }
    } else {
      throw new Error("Invalid agent type");
    }
    super.setAgent(agent);
    return agentCard;
  }
  deregisterAgent(id: string): void {
    super.deleteAgent(id);
  }
  async sendMessage(
    agentId: string,
    messageParams: MessageSendParams
  ): Promise<SendMessageSuccessResult> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    const sendMessageResult = await agent.sendMessage(messageParams);
    if (!sendMessageResult) {
      throw new Error(`Failed to send message to agent ${agentId}`);
    }
    return sendMessageResult;
  }
  async getTask(agentId: string, taskQuery: TaskQueryParams): Promise<Task> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    const task = await agent.getTask(taskQuery);
    if (!task) {
      throw new Error(`Task ${agentId} not found`);
    }
    return task;
  }
  async cancelTask(agentId: string, taskId: TaskIdParams): Promise<Task> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    const task = await agent.cancelTask(taskId);
    if (!task) {
      throw new Error(`Task ${agentId} not found`);
    }
    return task;
  }
  async getAgentCard(agentId: string): Promise<AgentCard> {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    if (agent instanceof A2AClient) {
      return await agent.agentCard();
    } else if (agent instanceof A2AService) {
      return agent.agentCard;
    } else {
      throw new Error(`Invalid agent type`);
    }
  }
  async searchAgents(query: string): Promise<AgentCard[]> {
    const agents = this.getAgents();
    return (
      await Promise.all(
        agents.map(async (agent) =>
          agent instanceof A2AClient ? await agent.agentCard() : agent.agentCard
        )
      )
    ).filter(
      (agentCard) =>
        agentCard.name.toLowerCase().includes(query.toLowerCase()) ||
        agentCard.description.toLowerCase().includes(query.toLowerCase()) ||
        agentCard.skills.some(
          (skill) =>
            skill.name.toLowerCase().includes(query.toLowerCase()) ||
            skill.description.toLowerCase().includes(query.toLowerCase())
        )
    );
  }
}
