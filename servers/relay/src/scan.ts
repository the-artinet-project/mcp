import { ClientConfig } from "./types/index.js";
import * as portscanner from "portscanner";

export interface RelayConfig {
  host: string;
  startPort: number;
  endPort: number;
  headers?: Record<string, string>;
  fallbackPath?: string;
}

export async function scanAgents(config: RelayConfig): Promise<ClientConfig[]> {
  console.log(
    `Scanning for agents on ${config.host}:${config.startPort}-${config.endPort}...`
  );

  // Use Promise.all for faster parallel scanning
  const portChecks = [];
  for (let port = config.startPort; port <= config.endPort; port++) {
    portChecks.push(
      portscanner
        .checkPortStatus(port, config.host)
        .then((status) => ({ port, status }))
    );
  }

  const results = await Promise.all(portChecks);
  const openPorts: number[] = results
    .filter((r) => r.status === "open")
    .map((r) => r.port);
  if (!openPorts?.length) {
    return [];
  }
  console.log(`Found ${openPorts.length} open ports: ${openPorts.join(", ")}`);
  const configs: ClientConfig[] = [];
  // Try to register agents on open ports
  for (const port of openPorts) {
    try {
      configs.push({
        url: `http://${config.host}:${port}`,
        headers: config.headers,
        fallbackPath: config.fallbackPath,
      });
      console.log(`✓ Agent registered from port ${port}`);
    } catch (error) {
      console.log(`✗ Port ${port} open but not an agent`);
    }
  }
  return configs;
}
