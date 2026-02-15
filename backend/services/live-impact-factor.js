const db = require('../db');

/**
 * Live Impact Factor Service
 * Calculate real-time, rolling 2-year impact factor
 * 
 * Formula: Citations this year to articles from previous 2 years / Article count from previous 2 years
 * Updates continuously unlike traditional JIF (calculated annually)
 */
class LiveImpactFactorService {
    /**
     * Calculate current Live Impact Factor for a journal
     * @param {number} journalId 
     * @returns {Promise<Object>}
     */
    async calculate(journalId = 1) {
        const result = await db.query(`
            WITH recent_articles AS (
                -- Articles published in previous 2 complete years
                SELECT item_id, publication_date
                FROM platform_articles
                WHERE journal_id = $1
                AND EXTRACT(YEAR FROM publication_date) >= EXTRACT(YEAR FROM NOW()) - 2
                AND EXTRACT(YEAR FROM publication_date) < EXTRACT(YEAR FROM NOW())
            ),
            current_citations AS (
                -- Citations this year to those articles
                SELECT COUNT(*) as citation_count
                FROM article_citations ac
                JOIN recent_articles ra ON ac.cited_article_id = ra.item_id
                WHERE EXTRACT(YEAR FROM ac.citation_date) = EXTRACT(YEAR FROM NOW())
            ),
            article_count AS (
                SELECT COUNT(*) as total_articles
                FROM recent_articles
            )
            SELECT 
                COALESCE(cc.citation_count, 0)::float / 
                NULLIF(ac.total_articles, 0)::float as lif,
                cc.citation_count,
                ac.total_articles,
                EXTRACT(YEAR FROM NOW()) - 2 as year_start,
                EXTRACT(YEAR FROM NOW()) - 1 as year_end,
                EXTRACT(YEAR FROM NOW()) as citation_year
            FROM current_citations cc, article_count ac
        `, [journalId]);

        const data = result.rows[0];

        return {
            current_lif: data.lif || 0,
            citation_count: parseInt(data.citation_count) || 0,
            article_count: parseInt(data.total_articles) || 0,
            period: `${data.year_start}-${data.year_end}`,
            citation_year: parseInt(data.citation_year),
            last_updated: new Date().toISOString()
        };
    }

    /**
     * Calculate LIF for a specific year
     * @param {number} journalId 
     * @param {number} targetYear - Year to calculate LIF for
     * @returns {Promise<Object>}
     */
    async calculateForYear(journalId, targetYear) {
        const result = await db.query(`
            WITH target_articles AS (
                -- Articles from 2 years before target year
                SELECT item_id
                FROM platform_articles
                WHERE journal_id = $1
                AND EXTRACT(YEAR FROM publication_date) >= $2 - 2
                AND EXTRACT(YEAR FROM publication_date) < $2
            ),
            target_citations AS (
                -- Citations in target year to those articles
                SELECT COUNT(*) as citation_count
                FROM article_citations ac
                JOIN target_articles ta ON ac.cited_article_id = ta.item_id
                WHERE EXTRACT(YEAR FROM ac.citation_date) = $2
            ),
            article_count AS (
                SELECT COUNT(*) as total_articles
                FROM target_articles
            )
            SELECT 
                COALESCE(tc.citation_count, 0)::float / 
                NULLIF(ac.total_articles, 0)::float as lif,
                tc.citation_count,
                ac.total_articles
            FROM target_citations tc, article_count ac
        `, [journalId, targetYear]);

        const data = result.rows[0];

        return {
            year: targetYear,
            lif: data.lif || 0,
            citations: parseInt(data.citation_count) || 0,
            articles: parseInt(data.total_articles) || 0
        };
    }

    /**
     * Calculate historical LIF trend
     * @param {number} journalId 
     * @param {number} years - Number of years to look back
     * @returns {Promise<Array>}
     */
    async calculateHistoricalTrend(journalId, years = 5) {
        const currentYear = new Date().getFullYear();
        const trends = [];

        for (let i = 0; i < years; i++) {
            const year = currentYear - i;
            const yearData = await this.calculateForYear(journalId, year);
            trends.push(yearData);
        }

        return trends.reverse(); // Oldest first
    }

    /**
     * Get monthly progress towards this year's LIF
     * Shows how LIF evolves throughout the current year
     * @param {number} journalId 
     * @returns {Promise<Array>}
     */
    async getMonthlyProgress(journalId) {
        const result = await db.query(`
            WITH recent_articles AS (
                SELECT item_id
                FROM platform_articles
                WHERE journal_id = $1
                AND EXTRACT(YEAR FROM publication_date) >= EXTRACT(YEAR FROM NOW()) - 2
                AND EXTRACT(YEAR FROM publication_date) < EXTRACT(YEAR FROM NOW())
            ),
            article_count AS (
                SELECT COUNT(*) as total FROM recent_articles
            ),
            monthly_citations AS (
                SELECT 
                    DATE_TRUNC('month', ac.citation_date) as month,
                    COUNT(*) as citations
                FROM article_citations ac
                JOIN recent_articles ra ON ac.cited_article_id = ra.item_id
                WHERE EXTRACT(YEAR FROM ac.citation_date) = EXTRACT(YEAR FROM NOW())
                GROUP BY month
                ORDER BY month
            )
            SELECT 
                TO_CHAR(mc.month, 'Mon') as month_name,
                mc.citations,
                SUM(mc.citations) OVER (ORDER BY mc.month) as cumulative_citations,
                (SUM(mc.citations) OVER (ORDER BY mc.month)::float / NULLIF(ac.total, 0)) as cumulative_lif
            FROM monthly_citations mc, article_count ac
        `, [journalId]);

        return result.rows.map(row => ({
            month: row.month_name,
            citations: parseInt(row.citations),
            cumulative_citations: parseInt(row.cumulative_citations),
            cumulative_lif: parseFloat(row.cumulative_lif).toFixed(3)
        }));
    }

    /**
     * Compare LIF to traditional JIF
     * @param {number} journalId 
     * @returns {Promise<Object>}
     */
    async compareWithJIF(journalId) {
        const lif = await this.calculate(journalId);

        // Get JIF from journal metadata (if available)
        const jifResult = await db.query(`
            SELECT metadata->'impact_metrics'->>'jif' as jif
            FROM platform_journals
            WHERE journal_id = $1
        `, [journalId]);

        const jif = jifResult.rows[0]?.jif ? parseFloat(jifResult.rows[0].jif) : null;

        return {
            live_impact_factor: lif.current_lif,
            traditional_jif: jif,
            difference: jif ? (lif.current_lif - jif).toFixed(3) : null,
            percentage_change: jif ? (((lif.current_lif - jif) / jif) * 100).toFixed(1) : null,
            explanation: jif
                ? lif.current_lif > jif
                    ? 'LIF is higher - journal impact is growing'
                    : 'LIF is lower - recent citations have decreased'
                : 'No JIF data available for comparison'
        };
    }

    /**
     * Get top contributing articles to current LIF
     * @param {number} journalId 
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    async getTopContributors(journalId, limit = 10) {
        const result = await db.query(`
            WITH recent_articles AS (
                SELECT item_id, title, authors, publication_date
                FROM platform_articles
                WHERE journal_id = $1
                AND EXTRACT(YEAR FROM publication_date) >= EXTRACT(YEAR FROM NOW()) - 2
                AND EXTRACT(YEAR FROM publication_date) < EXTRACT(YEAR FROM NOW())
            ),
            article_citations_this_year AS (
                SELECT 
                    ac.cited_article_id,
                    COUNT(*) as citations_this_year
                FROM article_citations ac
                JOIN recent_articles ra ON ac.cited_article_id = ra.item_id
                WHERE EXTRACT(YEAR FROM ac.citation_date) = EXTRACT(YEAR FROM NOW())
                GROUP BY ac.cited_article_id
            )
            SELECT 
                ra.item_id,
                ra.title,
                ra.authors,
                EXTRACT(YEAR FROM ra.publication_date)::int as publication_year,
                COALESCE(acy.citations_this_year, 0)::int as citations_this_year
            FROM recent_articles ra
            LEFT JOIN article_citations_this_year acy ON ra.item_id = acy.cited_article_id
            ORDER BY citations_this_year DESC
            LIMIT $2
        `, [journalId, limit]);

        return result.rows;
    }
}

module.exports = LiveImpactFactorService;
