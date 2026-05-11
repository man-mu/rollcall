// Mirrors CQUPTRollcall/Services/CenterWSClient.swift
//
// WebSocket client for the Center server. Auto-reconnects with exponential
// backoff. Sends rollcall_tasks summaries on every poll, broadcasts our own
// successful checkins, and reacts to rollcall_share messages from peers
// (auto-checkin if the same task is in our absent list).

export interface CenterEnv {
  url: string;
  clientID: string;
  secret: string;
  pauseSharedRollcall: boolean;
}

export interface RollcallShareHandler {
  onQRShare(qrData: string): Promise<void>;
  onNumberShare(rollcallID: number, number: number): Promise<void>;
}

export class CenterWSClient {
  private ws: WebSocket | null = null;
  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 60_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wantOpen = false;

  constructor(
    private env: () => CenterEnv,
    private onConnectionChange: (connected: boolean) => void,
    private handler: RollcallShareHandler,
  ) {}

  connect(): void {
    this.wantOpen = true;

    const env = this.env();
    if (!env.url) return;

    try {
      this.ws = new WebSocket(env.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.send({ type: 'register', client_id: env.clientID, secret: env.secret });
      this.onConnectionChange(true);
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '') as Record<string, unknown>;
        this.handleMessage(msg);
      } catch {
        // ignore malformed
      }
    };

    this.ws.onerror = () => {
      // onclose will follow
    };

    this.ws.onclose = () => {
      this.onConnectionChange(false);
      this.ws = null;
      if (this.wantOpen) this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.wantOpen = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try { this.ws?.close(1000); } catch {}
    this.ws = null;
    this.onConnectionChange(false);
  }

  send(obj: Record<string, unknown>): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== 1 /* OPEN */) return;
    try { ws.send(JSON.stringify(obj)); } catch {}
  }

  /** Broadcast our own success so other clients can mirror it. */
  sendRollcallSuccess(type: string, data: Record<string, unknown>): void {
    this.send({
      type: 'rollcall_success',
      client_id: this.env().clientID,
      rollcall_type: type,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /** Tell Center which kinds of rollcall tasks we currently have absent. */
  sendRollcallTasks(hasQR: boolean, numbers: { rollcall_id: number; course_title: string }[]): void {
    this.send({
      type: 'rollcall_tasks',
      client_id: this.env().clientID,
      rollcall_qr: hasQR,
      rollcall_number: numbers,
      timestamp: new Date().toISOString(),
    });
  }

  // ------------ Internals ------------

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      if (this.wantOpen) this.connect();
    }, delay);
  }

  private async handleMessage(msg: Record<string, unknown>) {
    if (msg.type !== 'rollcall_share') return;
    if (this.env().pauseSharedRollcall) return;

    const rollcallType = msg.rollcall_type as string | undefined;
    if (rollcallType === 'qr') {
      const raw = (msg.rollcall_qr_data as string) ?? '';
      if (raw) await this.handler.onQRShare(raw);
    } else if (rollcallType === 'number') {
      const rid = Number(msg.rollcall_id ?? 0);
      const num = Number(msg.rollcall_number ?? 0);
      if (rid && num) await this.handler.onNumberShare(rid, num);
    }
  }
}
