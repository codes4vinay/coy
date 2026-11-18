export interface KeepAliveOptions {
  url?: string;
  signal?: AbortSignal;
  once?: boolean;
}

export function runKeepAlive(options?: KeepAliveOptions): Promise<void>;
