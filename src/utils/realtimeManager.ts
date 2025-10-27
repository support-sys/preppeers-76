import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Utility class to manage Supabase realtime subscriptions
 * Helps prevent memory leaks and excessive subscriptions
 */
class RealtimeManager {
  private activeChannels = new Map<string, RealtimeChannel>();
  private channelCleanupTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Create or reuse a realtime channel
   * @param channelName - Unique name for the channel
   * @param config - Channel configuration
   * @param autoCleanupMs - Auto cleanup after this many milliseconds (default: 5 minutes)
   */
  createChannel(
    channelName: string,
    config: {
      table: string;
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema?: string;
      filter?: string;
    },
    callback: (payload: any) => void,
    autoCleanupMs: number = 300000 // 5 minutes
  ): RealtimeChannel {
    // Clean up existing channel if it exists
    this.removeChannel(channelName);

    console.log(`🔄 Creating realtime channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: config.event,
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        callback
      )
      .subscribe();

    // Store the channel
    this.activeChannels.set(channelName, channel);

    // Set up auto cleanup
    if (autoCleanupMs > 0) {
      const timeoutId = setTimeout(() => {
        console.log(`⏰ Auto-cleaning up channel: ${channelName}`);
        this.removeChannel(channelName);
      }, autoCleanupMs);

      this.channelCleanupTimeouts.set(channelName, timeoutId);
    }

    return channel;
  }

  /**
   * Remove a specific channel
   */
  removeChannel(channelName: string): void {
    const channel = this.activeChannels.get(channelName);
    if (channel) {
      console.log(`🧹 Removing realtime channel: ${channelName}`);
      supabase.removeChannel(channel);
      this.activeChannels.delete(channelName);
    }

    // Clear timeout if exists
    const timeoutId = this.channelCleanupTimeouts.get(channelName);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.channelCleanupTimeouts.delete(channelName);
    }
  }

  /**
   * Remove all active channels
   */
  removeAllChannels(): void {
    console.log(`🧹 Removing all ${this.activeChannels.size} active channels`);
    
    for (const [channelName] of this.activeChannels) {
      this.removeChannel(channelName);
    }
  }

  /**
   * Get list of active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.activeChannels.keys());
  }

  /**
   * Check if a channel is active
   */
  isChannelActive(channelName: string): boolean {
    return this.activeChannels.has(channelName);
  }

  /**
   * Get channel count
   */
  getChannelCount(): number {
    return this.activeChannels.size;
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeManager();

// Auto cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeManager.removeAllChannels();
  });

  // Periodic cleanup of stale channels (every 10 minutes)
  setInterval(() => {
    const activeCount = realtimeManager.getChannelCount();
    if (activeCount > 0) {
      console.log(`📊 Realtime Manager Status: ${activeCount} active channels`);
    }
  }, 600000); // 10 minutes
}

export default realtimeManager;
