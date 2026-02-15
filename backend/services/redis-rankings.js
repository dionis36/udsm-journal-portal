const redis = require('redis');

/**
 * Redis-Based Real-Time Rankings Service
 * 
 * Powers sub-second article rankings using Redis sorted sets
 * Updates with every download/view event for true real-time performance
 */
class RedisRankingService {
    constructor() {
        this.client = null;
        this.connected = false;
        this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        // In-memory fallback for demo/development when Redis is missing
        this.fallbackStore = new Map(); // key -> Map(articleId -> score)
        this.fallbackMode = false;
    }

    /**
     * Initialize Redis connection
     */
    async connect() {
        if (this.connected) return;

        try {
            this.client = redis.createClient({
                url: this.redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            console.error('Redis: Max reconnection attempts reached');
                            return new Error('Max retries reached');
                        }
                        return Math.min(retries * 100, 3000);
                    }
                }
            });

            this.client.on('error', (err) => {
                console.error('Redis Client Error:', err);
                this.connected = false;
            });

            this.client.on('connect', () => {
                console.log('✓ Connected to Redis');
                this.connected = true;
            });

            await this.client.connect();
        } catch (error) {
            console.warn('⚠️ Redis connection failed, switching to in-memory fallback mode for demo.');
            console.warn('   (Rankings will be reset on server restart)');
            this.connected = false;
            this.fallbackMode = true;
        }
    }

    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (this.client && this.connected) {
            await this.client.quit();
            this.connected = false;
        }
    }

    /**
     * Increment read count for an article
     * @param {number} articleId 
     * @param {string} scope - 'week', 'month', 'year', 'alltime'
     */
    async incrementRead(articleId, scope = 'week') {
        const key = this.getScopedKey(scope);

        if (this.fallbackMode || !this.connected) {
            if (!this.fallbackMode) await this.connect();
            if (this.fallbackMode) {
                // Fallback implementation
                if (!this.fallbackStore.has(key)) {
                    this.fallbackStore.set(key, new Map());
                }
                const scopeMap = this.fallbackStore.get(key);
                const currentScore = scopeMap.get(articleId.toString()) || 0;
                scopeMap.set(articleId.toString(), currentScore + 1);
                return true;
            }
        }

        try {
            await this.client.zIncrBy(key, 1, articleId.toString());

            // Set expiry based on scope
            const ttl = this.getTTL(scope);
            await this.client.expire(key, ttl);

            return true;
        } catch (error) {
            console.error(`Failed to increment read for article ${articleId}:`, error.message);
            return false;
        }
    }

    /**
     * Get top N articles for a given scope
     * @param {number} n - Number of articles to retrieve
     * @param {string} scope - Time scope
     * @returns {Promise<Array>} Array of {article_id, reads}
     */
    async getTopArticles(n = 5, scope = 'week') {
        const key = this.getScopedKey(scope);

        if (this.fallbackMode || !this.connected) {
            if (!this.fallbackMode) await this.connect();
            if (this.fallbackMode) {
                // Fallback implementation
                const scopeMap = this.fallbackStore.get(key);
                if (!scopeMap) return [];

                return Array.from(scopeMap.entries())
                    .map(([id, score]) => ({
                        article_id: parseInt(id),
                        reads: score
                    }))
                    .sort((a, b) => b.reads - a.reads)
                    .slice(0, n);
            }
        }

        try {
            // Get top N with scores using ZRANGE with WITHSCORES
            const results = await this.client.zRangeWithScores(key, 0, n - 1, {
                REV: true  // Reverse to get highest scores first
            });

            return results.map(item => ({
                article_id: parseInt(item.value),
                reads: item.score
            }));
        } catch (error) {
            console.error(`Failed to get top articles:`, error.message);
            return [];
        }
    }

    /**
     * Get article's current rank
     * @param {number} articleId 
     * @param {string} scope 
     * @returns {Promise<number|null>} Rank (1-indexed) or null
     */
    async getArticleRank(articleId, scope = 'week') {
        if (!this.connected) await this.connect();

        const key = this.getScopedKey(scope);

        try {
            const rank = await this.client.zRevRank(key, articleId.toString());
            return rank !== null ? rank + 1 : null; // Convert to 1-indexed
        } catch (error) {
            console.error(`Failed to get rank for article ${articleId}:`, error.message);
            return null;
        }
    }

    /**
     * Get article's read count
     * @param {number} articleId 
     * @param {string} scope 
     * @returns {Promise<number>}
     */
    async getArticleReads(articleId, scope = 'week') {
        if (!this.connected) await this.connect();

        const key = this.getScopedKey(scope);

        try {
            const score = await this.client.zScore(key, articleId.toString());
            return score !== null ? score : 0;
        } catch (error) {
            console.error(`Failed to get reads for article ${articleId}:`, error.message);
            return 0;
        }
    }

    /**
     * Get total number of articles in ranking
     * @param {string} scope 
     * @returns {Promise<number>}
     */
    async getTotalArticles(scope = 'week') {
        if (!this.connected) await this.connect();

        const key = this.getScopedKey(scope);

        try {
            return await this.client.zCard(key);
        } catch (error) {
            console.error(`Failed to get total articles:`, error.message);
            return 0;
        }
    }

    /**
     * Clear all rankings for a scope
     * @param {string} scope 
     */
    async clearScope(scope) {
        if (!this.connected) await this.connect();

        const key = this.getScopedKey(scope);

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error(`Failed to clear scope ${scope}:`, error.message);
            return false;
        }
    }

    /**
     * Get scoped Redis key with time window
     * @param {string} scope 
     * @returns {string}
     */
    getScopedKey(scope) {
        const now = new Date();
        let suffix = '';

        switch (scope) {
            case 'week':
                // ISO week number
                suffix = this.getISOWeek(now);
                break;
            case 'month':
                suffix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'year':
                suffix = now.getFullYear().toString();
                break;
            case 'alltime':
                suffix = 'all';
                break;
            default:
                suffix = this.getISOWeek(now);
        }

        return `rankings:${scope}:${suffix}`;
    }

    /**
     * Get ISO week number
     * @param {Date} date 
     * @returns {string}
     */
    getISOWeek(date) {
        const target = new Date(date.valueOf());
        const dayNumber = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNumber + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
        return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
    }

    /**
     * Get TTL in seconds for each scope
     * @param {string} scope 
     * @returns {number}
     */
    getTTL(scope) {
        switch (scope) {
            case 'week':
                return 60 * 60 * 24 * 14; // 2 weeks
            case 'month':
                return 60 * 60 * 24 * 60; // 60 days
            case 'year':
                return 60 * 60 * 24 * 400; // 400 days
            case 'alltime':
                return 60 * 60 * 24 * 365 * 10; // 10 years
            default:
                return 60 * 60 * 24 * 14;
        }
    }

    /**
     * Health check
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        if (!this.connected) {
            try {
                await this.connect();
            } catch (error) {
                return false;
            }
        }

        try {
            await this.client.ping();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Singleton instance
let instance = null;

function getRankingService() {
    if (!instance) {
        instance = new RedisRankingService();
    }
    return instance;
}

module.exports = { RedisRankingService, getRankingService };
