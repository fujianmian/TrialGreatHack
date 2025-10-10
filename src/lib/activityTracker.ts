/**
 * Activity Tracker Utility
 * Handles recording user activities to PostgreSQL for history tracking
 */

export interface ActivityData {
  userEmail: string;
  activityType: 'summary' | 'quiz' | 'flashcard' | 'mindmap' | 'video' | 'picture' | 'chat';
  title: string;
  inputText?: string;
  result?: any;
  status?: 'completed' | 'failed' | 'processing';
  duration?: number;
  metadata?: {
    wordCount?: number;
    score?: number;
    topic?: string;
    model?: string;
    [key: string]: any;
  };
}

export class ActivityTracker {
  private static async recordActivity(activityData: ActivityData): Promise<void> {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        console.warn('Failed to record activity:', await response.text());
      }
    } catch (error) {
      console.warn('Activity tracking error:', error);
      // Don't throw - activity tracking should not break main functionality
    }
  }

  /**
   * Record a completed activity
   */
  static async recordCompletedActivity(activityData: ActivityData): Promise<void> {
    await this.recordActivity({
      ...activityData,
      status: 'completed',
    });
  }

  /**
   * Record a failed activity
   */
  static async recordFailedActivity(activityData: ActivityData, error?: string): Promise<void> {
    await this.recordActivity({
      ...activityData,
      status: 'failed',
      metadata: {
        ...activityData.metadata,
        error: error,
      },
    });
  }

  /**
   * Record a processing activity (when starting generation)
   */
  static async recordProcessingActivity(activityData: ActivityData): Promise<void> {
    await this.recordActivity({
      ...activityData,
      status: 'processing',
    });
  }

  /**
   * Helper method to get user email from request headers or session
   */
  static getUserEmailFromRequest(request: Request): string | null {
    // Try to get from headers first
    const emailFromHeader = request.headers.get('x-user-email');
    if (emailFromHeader) return emailFromHeader;

    // Try to get from Authorization header (if it contains user info)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // This would need to be implemented based on your auth strategy
      // For now, return null and let the caller handle it
    }

    return null;
  }

  /**
   * Helper method to extract user email from JWT token or session
   * This should be implemented based on your authentication strategy
   */
  static async getUserEmailFromSession(request: Request): Promise<string | null> {
    // Implementation depends on your auth strategy
    // For Cognito, you might decode the JWT token
    // For now, return null and let the caller handle it
    return null;
  }

  /**
   * Generate a descriptive title for different activity types
   */
  static generateTitle(activityType: string, inputText?: string, topic?: string): string {
    const maxLength = 50;
    
    switch (activityType) {
      case 'summary':
        return this.truncateText(inputText || 'Text Summary', maxLength);
      case 'quiz':
        return topic ? `${topic} Quiz` : 'Generated Quiz';
      case 'flashcard':
        return topic ? `${topic} Study Cards` : 'Flashcards';
      case 'mindmap':
        return topic ? `${topic} Mind Map` : 'Mind Map';
      case 'video':
        return this.truncateText(inputText || 'Video Generation', maxLength);
      case 'picture':
        return this.truncateText(inputText || 'Image Generation', maxLength);
      case 'chat':
        return 'Chat Session';
      default:
        return 'Activity';
    }
  }

  /**
   * Truncate text to specified length
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Calculate duration in seconds
   */
  static calculateDuration(startTime: number): number {
    return Math.round((Date.now() - startTime) / 1000);
  }

  /**
   * Extract word count from text
   */
  static getWordCount(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Extract topic from text (simple keyword extraction)
   */
  static extractTopic(text: string): string | undefined {
    if (!text) return undefined;
    
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
    
    // Find the most common meaningful word
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      if (word.length > 3 && !commonWords.includes(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .map(([word]) => word);
    
    return sortedWords[0];
  }
}