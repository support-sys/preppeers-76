import { cleanupExpiredReservations } from '@/utils/temporaryBlocking';

/**
 * Service to handle periodic cleanup of expired temporary reservations
 */
class CleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the cleanup service
   * @param intervalMinutes - How often to run cleanup (default: 15 minutes)
   */
  start(intervalMinutes: number = 15): void {
    if (this.isRunning) {
      console.log('🧹 Cleanup service is already running');
      return;
    }

    console.log(`🧹 Starting cleanup service (runs every ${intervalMinutes} minutes)`);
    
    this.isRunning = true;
    
    // Run cleanup immediately
    this.runCleanup();
    
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('🧹 Cleanup service is not running');
      return;
    }

    console.log('🧹 Stopping cleanup service');
    
    this.isRunning = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<void> {
    if (!this.isRunning) {
      console.log('🧹 Cleanup service is not running');
      return;
    }

    try {
      console.log('🧹 Running scheduled cleanup...');
      const cleanedCount = await cleanupExpiredReservations();
      console.log(`🧹 Cleanup completed. Cleaned up ${cleanedCount} expired reservations`);
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Check if the service is running
   */
  get isServiceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the current interval in minutes
   */
  get currentInterval(): number | null {
    if (!this.cleanupInterval) return null;
    // Convert milliseconds to minutes
    return 5; // Default interval
  }
}

// Create singleton instance
export const cleanupService = new CleanupService();

// Auto-start cleanup service when module is imported
if (typeof window !== 'undefined') {
  // Only start in browser environment
  cleanupService.start(15); // Run every 15 minutes (reduced from 5 to reduce DB load)
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cleanupService.stop();
  });
}

export default cleanupService;
