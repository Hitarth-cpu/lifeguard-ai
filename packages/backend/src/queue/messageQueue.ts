import { PayloadNormalizer, StandardEventPayload } from "./payloadNormalizer.js";
import { StructuredAiProcessor, StructuredAiOutput } from "../ai/structuredAiProcessor.js";
import { getDb } from "../db.js";

export interface QueueEnqueueResult {
  success: boolean;
  jobId: string;
  hash: string;
  duplicate: boolean;
  source: string;
  timestamp: string;
}

export class MessageQueue {
  private queue: StandardEventPayload[] = [];
  private isProcessing: boolean = false;
  private aiProcessor: StructuredAiProcessor;
  private broadcastEventCallback?: (type: string, data: any) => void;

  constructor(broadcastCallback?: (type: string, data: any) => void) {
    this.aiProcessor = new StructuredAiProcessor();
    this.broadcastEventCallback = broadcastCallback;
  }

  public setBroadcastCallback(callback: (type: string, data: any) => void) {
    this.broadcastEventCallback = callback;
  }

  /**
   * Enqueues a raw incoming payload (WhatsApp, Gmail, Slack, Calendar) after idempotency check.
   */
  public async enqueue(rawPayload: any): Promise<QueueEnqueueResult> {
    const payload = PayloadNormalizer.normalize(rawPayload);

    // 1. Check Idempotency via SQLite message_hashes table
    const db = await getDb();
    const existingHash = await db.get("SELECT hash FROM message_hashes WHERE hash = ?", [payload.hash]);

    if (existingHash) {
      console.log(`[QUEUE IDEMPOTENCY] Duplicate payload ignored! Hash: ${payload.hash} (Source: ${payload.source})`);
      return {
        success: true,
        jobId: payload.id,
        hash: payload.hash,
        duplicate: true,
        source: payload.source,
        timestamp: payload.timestamp
      };
    }

    // 2. Record new hash in DB
    await db.run(
      "INSERT INTO message_hashes (hash, source, created_at) VALUES (?, ?, ?)",
      [payload.hash, payload.source, new Date().toISOString()]
    );

    // 3. Add to processing queue
    this.queue.push(payload);
    console.log(`[QUEUE ENQUEUED] Job ${payload.id} enqueued (Source: ${payload.source}, Queue depth: ${this.queue.length})`);

    // 4. Trigger queue worker asynchronously
    this.processQueue();

    return {
      success: true,
      jobId: payload.id,
      hash: payload.hash,
      duplicate: false,
      source: payload.source,
      timestamp: payload.timestamp
    };
  }

  /**
   * Sequential rate-limited queue worker.
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        try {
          await this.aiProcessor.processEvent(item, this.broadcastEventCallback);
        } catch (err: any) {
          console.error(`[QUEUE WORKER ERROR] Failed to process job ${item.id}:`, err.message);
        }
        // Small rate-limiting delay between LLM calls
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    this.isProcessing = false;
  }
}
