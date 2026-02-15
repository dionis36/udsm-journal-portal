const axios = require('axios');
const xml2js = require('xml2js');

/**
 * PubMed/NCBI E-utilities Service
 * FREE medical/life sciences citations and metadata
 * 
 * API Docs: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 * Rate Limit: 3 requests/second (no API key), 10 requests/second (with API key)
 * 
 * Best for: Health sciences, medical, biology journals
 */
class PubMedService {
    constructor(apiKey = null) {
        this.baseURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
        this.apiKey = apiKey || process.env.NCBI_API_KEY;
        this.timeout = 10000;
        this.tool = 'UDSM-Analytics';
        this.email = 'tjpsd@udsm.ac.tz';
    }

    /**
     * Search PubMed by DOI
     * @param {string} doi 
     * @returns {Promise<string|null>} PMID if found
     */
    async searchByDOI(doi) {
        try {
            const params = {
                db: 'pubmed',
                term: doi,
                retmode: 'json',
                tool: this.tool,
                email: this.email
            };

            if (this.apiKey) params.api_key = this.apiKey;

            const response = await axios.get(
                `${this.baseURL}/esearch.fcgi`,
                { params, timeout: this.timeout }
            );

            const idList = response.data.esearchresult?.idlist;
            return idList && idList.length > 0 ? idList[0] : null;
        } catch (error) {
            console.error(`PubMed search error for ${doi}:`, error.message);
            return null;
        }
    }

    /**
     * Get article details by PMID
     * @param {string} pmid - PubMed ID
     * @returns {Promise<Object|null>}
     */
    async getArticleDetails(pmid) {
        try {
            const params = {
                db: 'pubmed',
                id: pmid,
                retmode: 'xml',
                tool: this.tool,
                email: this.email
            };

            if (this.apiKey) params.api_key = this.apiKey;

            const response = await axios.get(
                `${this.baseURL}/efetch.fcgi`,
                { params, timeout: this.timeout }
            );

            return await this.parseArticleXML(response.data);
        } catch (error) {
            console.error(`PubMed fetch error for PMID ${pmid}:`, error.message);
            return null;
        }
    }

    /**
     * Get citation count from PubMed Central
     * @param {string} pmid 
     * @returns {Promise<number>}
     */
    async getCitationCount(pmid) {
        try {
            const params = {
                db: 'pubmed',
                linkname: 'pubmed_pubmed_citedin',
                id: pmid,
                retmode: 'json',
                tool: this.tool,
                email: this.email
            };

            if (this.apiKey) params.api_key = this.apiKey;

            const response = await axios.get(
                `${this.baseURL}/elink.fcgi`,
                { params, timeout: this.timeout }
            );

            const linksets = response.data.linksets || [];
            if (linksets.length > 0 && linksets[0].linksetdbs) {
                return linksets[0].linksetdbs[0]?.links?.length || 0;
            }

            return 0;
        } catch (error) {
            console.error(`PubMed citation count error for PMID ${pmid}:`, error.message);
            return 0;
        }
    }

    /**
     * Update article from PubMed data
     * @param {Object} db 
     * @param {number} articleId 
     * @param {string} doi 
     * @returns {Promise<Object|null>}
     */
    async updateArticleCitations(db, articleId, doi) {
        // Find PMID
        const pmid = await this.searchByDOI(doi);

        if (!pmid) {
            console.warn(`Article not indexed in PubMed: ${doi}`);
            return null;
        }

        // Get citation count
        const citations = await this.getCitationCount(pmid);

        // Update database
        await db.query(`
            UPDATE platform_articles 
            SET pubmed_id = $1,
                citations = GREATEST(citations, $2),
                citations_updated_at = NOW()
            WHERE item_id = $3
        `, [pmid, citations, articleId]);

        console.log(`✓ Updated article ${articleId} from PubMed: ${citations} citations (PMID: ${pmid})`);

        return { pmid, citations };
    }

    /**
     * Parse PubMed XML response
     * @param {string} xml 
     * @returns {Promise<Object>}
     */
    async parseArticleXML(xml) {
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xml);

        const article = result.PubmedArticleSet?.PubmedArticle?.MedlineCitation?.Article;

        if (!article) return null;

        return {
            title: article.ArticleTitle,
            abstract: article.Abstract?.AbstractText,
            authors: this.parseAuthors(article.AuthorList?.Author),
            journal: article.Journal?.Title,
            publication_date: this.parseDate(article.Journal?.JournalIssue?.PubDate),
            mesh_terms: this.parseMeSH(result.PubmedArticleSet?.PubmedArticle?.MedlineCitation?.MeshHeadingList)
        };
    }

    parseAuthors(authors) {
        if (!authors) return [];
        const authorList = Array.isArray(authors) ? authors : [authors];
        return authorList.map(a => ({
            last_name: a.LastName,
            first_name: a.ForeName,
            initials: a.Initials
        }));
    }

    parseDate(pubDate) {
        if (!pubDate) return null;
        return `${pubDate.Year}-${pubDate.Month || '01'}-${pubDate.Day || '01'}`;
    }

    parseMeSH(meshList) {
        if (!meshList?.MeshHeading) return [];
        const headings = Array.isArray(meshList.MeshHeading) ?
            meshList.MeshHeading : [meshList.MeshHeading];
        return headings.map(h => h.DescriptorName?._);
    }

    /**
     * Rate limit helper
     */
    async wait() {
        const delay = this.apiKey ? 100 : 350; // 10/sec vs 3/sec
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

module.exports = PubMedService;
