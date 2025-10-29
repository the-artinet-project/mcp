import { RelayConfig, scanAgents } from "../src/scan.js";
import { AgentRelay } from "../src/relay.js";
import {
  createAgentServer,
  AgentBuilder,
  ExpressAgentServer,
  getContent,
} from "@artinet/sdk";
import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from "@jest/globals";
import { Server } from "http";

jest.setTimeout(10000);

describe("AgentRelay", () => {
  let agentServer: ExpressAgentServer;
  let server: Server;
  describe("scanAgents", () => {
    beforeEach(async () => {
      agentServer = createAgentServer({
        agent: AgentBuilder()
          .text(() => "hello world!")
          .createAgent({
            agentCard: {
              name: "test-agent",
              url: "http://localhost:3000/a2a",
              version: "1.0.0",
              protocolVersion: "0.3.0",
              defaultInputModes: ["text"],
              defaultOutputModes: ["text"],
              capabilities: {
                streaming: true,
                pushNotifications: true,
                stateTransitionHistory: true,
              },
              description: "A test agent",
              skills: [
                {
                  id: "test-skill",
                  name: "test-skill",
                  description: "A test skill",
                },
              ],
            },
          }),
      });
      server = agentServer.app.listen(3001, () => {
        console.log("Test agent server running on http://localhost:3001/a2a");
      });
    });
    afterEach(async () => {
      await server.close();
    });
    it("it should detect local agent server", async () => {
      const configs = await scanAgents({
        host: "localhost",
        startPort: 3001,
        endPort: 3001,
      });
      expect(configs).toHaveLength(1);
      expect(configs[0].url).toBe("http://localhost:3001");
      expect(configs[0].headers).toBeUndefined();
      expect(configs[0].fallbackPath).toBeUndefined();
    });

    it("should detect multiple local servers", async () => {
      const server2 = agentServer.app.listen(4002, () => {
        console.log("Test agent server running on http://localhost:3002/a2a");
      });
      const configs = await scanAgents({
        host: "localhost",
        startPort: 3001,
        endPort: 5000,
      });
      expect(configs).toHaveLength(2);
      expect(configs[0].url).toBe("http://localhost:3001");
      expect(configs[1].url).toBe("http://localhost:4002");
      await server2.close();
    });
    describe("Relay Operations", () => {
      let relay: AgentRelay;
      beforeEach(async () => {
        relay = new AgentRelay({
          host: new URL("http://127.0.0.1").hostname,
          startPort: 3000,
          endPort: 5000,
          fallbackPath: "/.well-known/agent-card.json",
        });
        //timeouts to allow enough time for the relay to be initialized
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });
      it("should capture agents on start", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(relay.getAgentCount()).toBe(1);
      });
      it("should get agentIds", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const agentIds = await relay.getAgentIds();
        expect(agentIds).toHaveLength(1);
        expect(agentIds).toContain("test-agent");
      });
      it("should get agentCount", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const agentCount = await relay.getAgentCount();
        expect(agentCount).toBe(1);
      });
      it("should get agent", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const agent = await relay.getAgent("test-agent");
        expect(agent).toBeDefined();
      });
      it("should get agentCard", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const agentCard = await relay.getAgentCard("test-agent");
        expect(agentCard).toBeDefined();
        expect(agentCard?.name).toBe("test-agent");
      });
      it("should search agents", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const agents = await relay.searchAgents("test-agent");
        expect(agents).toHaveLength(1);
        expect(agents[0].name).toBe("test-agent");
      });
      it("should send message", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const response = await relay.sendMessage("test-agent", {
          message: {
            role: "user",
            kind: "message",
            parts: [
              {
                text: "hello",
                kind: "text",
              },
            ],
            messageId: "123",
          },
        });
        expect(response).toBeDefined();
        const content = getContent(response);
        expect(content).toBe("hello world!");
      });
      it("should register agent", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const testAgent = AgentBuilder()
          .text(async ({ command }) => {
            await new Promise((resolve) => {
              setTimeout(() => {
                resolve("hello world!");
              }, 2000);
            });
            return "hello world!";
          })
          .createAgent({
            agentCard: {
              name: "test-agent-2",
              url: "http://localhost:3000/a2a",
              version: "1.0.0",
              protocolVersion: "0.3.0",
              defaultInputModes: ["text"],
              defaultOutputModes: ["text"],
              capabilities: {
                streaming: true,
                pushNotifications: true,
                stateTransitionHistory: true,
              },
              description: "A test agent",
              skills: [
                {
                  id: "test-skill",
                  name: "test-skill",
                  description: "A test skill",
                },
              ],
            },
          });
        const agentCard = await relay.registerAgent(testAgent);
        expect(agentCard).toBeDefined();
        expect(agentCard?.name).toBe("test-agent-2");
      });
      it("should get task", async () => {
        const testAgent = AgentBuilder()
          .text(async ({ command }) => {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return "hello world!";
          })
          .createAgent({
            agentCard: {
              name: "test-agent",
              url: "http://localhost:3000/a2a",
              version: "1.0.0",
              protocolVersion: "0.3.0",
              defaultInputModes: ["text"],
              defaultOutputModes: ["text"],
              capabilities: {
                streaming: true,
                pushNotifications: true,
                stateTransitionHistory: true,
              },
              description: "A test agent",
              skills: [
                {
                  id: "test-skill",
                  name: "test-skill",
                  description: "A test skill",
                },
              ],
            },
          });
        const agentCard = await relay.registerAgent(testAgent);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const response = relay.sendMessage(agentCard.name, {
          message: {
            role: "user",
            kind: "message",
            taskId: "123",
            parts: [
              {
                text: "hello",
                kind: "text",
              },
            ],
            messageId: "123",
          },
        });
        expect(response).toBeDefined();
        await new Promise((resolve) => setTimeout(resolve, 500));
        const task = await relay.getTask(agentCard.name, {
          id: "123",
        });
        expect(task).toBeDefined();
        expect(task?.status?.state).toBe("submitted");
        testAgent.stop();
      });
      it("should cancel task", async () => {
        const testAgent = AgentBuilder()
          .text(async ({ command }) => {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return "hello world!";
          })
          .createAgent({
            agentCard: {
              name: "test-agent",
              url: "http://localhost:3000/a2a",
              version: "1.0.0",
              protocolVersion: "0.3.0",
              defaultInputModes: ["text"],
              defaultOutputModes: ["text"],
              capabilities: {
                streaming: true,
                pushNotifications: true,
                stateTransitionHistory: true,
              },
              description: "A test agent",
              skills: [
                {
                  id: "test-skill",
                  name: "test-skill",
                  description: "A test skill",
                },
              ],
            },
          });
        const agentCard = await relay.registerAgent(testAgent);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const response = relay.sendMessage(agentCard.name, {
          message: {
            role: "user",
            kind: "message",
            taskId: "123",
            parts: [
              {
                text: "hello",
                kind: "text",
              },
            ],
            messageId: "123",
          },
        });
        expect(response).toBeDefined();
        await new Promise((resolve) => setTimeout(resolve, 500));
        const task = await relay.cancelTask(agentCard.name, {
          id: "123",
        });
        expect(task?.status?.state).toBe("canceled");
        testAgent.stop();
      });
    });
  });
  it("should pass empty array when no servers found", async () => {
    const configs = await scanAgents({
      host: "localhost",
      startPort: 3000,
      endPort: 6000,
    });
    expect(configs).toHaveLength(0);
  });
  it("relay should be empty when no agents found", async () => {
    const relay = new AgentRelay({
      host: "localhost",
      startPort: 3000,
      endPort: 6000,
    });
    expect(relay.getAgentCount()).toBe(0);
  });
});
