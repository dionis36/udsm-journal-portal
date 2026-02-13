const fs = require('fs');
const readline = require('readline');
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SQL_FILE_PATH = path.join(__dirname, '..', '..', 'sql', 'oldSchema+Data.sql');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function runETL() {
    try {
        await client.connect();
        console.log('Connected to PostgreSQL');

        const fileStream = fs.createReadStream(SQL_FILE_PATH);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
            terminal: false
        });

        // Data Maps
        const journals = new Map();
        const submissions = new Map();
        const publications = new Map();
        const authors = new Map(); // author_id -> { publicationId, name }
        const galleys = new Map(); // publication_id -> [submission_file_id]
        const fileNames = new Map(); // submission_file_id -> filename

        let currentBlock = '';

        console.log(`ETL: Extracting Journals + Articles + Authors...`);

        for await (const line of rl) {

            // Block Detection
            if (line.includes('INSERT INTO `journals`')) currentBlock = 'journals';
            else if (line.includes('INSERT INTO `journal_settings`')) currentBlock = 'journal_settings';
            else if (line.includes('INSERT INTO `submissions`')) currentBlock = 'submissions';
            else if (line.includes('INSERT INTO `publications`')) currentBlock = 'publications';
            else if (line.includes('INSERT INTO `publication_settings`')) currentBlock = 'publication_settings';
            else if (line.includes('INSERT INTO `publication_galleys`')) currentBlock = 'publication_galleys';
            else if (line.includes('INSERT INTO `submission_files`')) currentBlock = 'submission_files';
            else if (line.includes('INSERT INTO `submission_file_settings`')) currentBlock = 'submission_file_settings';
            else if (line.includes('INSERT INTO `authors`')) currentBlock = 'authors';
            else if (line.includes('INSERT INTO `author_settings`')) currentBlock = 'author_settings';
            else if (line.includes('INSERT INTO `issues`')) currentBlock = 'issues'; // For future use
            else if (line.trim().startsWith('--') || (line.includes('INSERT INTO `') && !line.includes('VALUES'))) {
                currentBlock = '';
            }

            // JOURNALS
            if (currentBlock === 'journals') {
                const matches = line.matchAll(/\(\s*(\d+)\s*,\s*'([^']+)'/g);
                for (const match of matches) {
                    journals.set(parseInt(match[1]), { path: match[2], name: match[2] });
                }
            }

            // JOURNAL SETTINGS
            if (currentBlock === 'journal_settings') {
                const matches = line.matchAll(/\(\s*(\d+)\s*,\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'/g);
                for (const match of matches) {
                    const jid = parseInt(match[1]);
                    const key = match[2];
                    const val = match[3];

                    if (journals.has(jid)) {
                        const j = journals.get(jid);
                        if (!j.metadata) j.metadata = {};

                        if (key === 'name') j.name = val;
                        if (key === 'description') j.metadata.description = val;
                        if (key === 'printIssn') j.metadata.printIssn = val;
                        if (key === 'onlineIssn') j.metadata.onlineIssn = val;
                        if (key === 'publisherInstitution') j.metadata.publisher = val;
                        if (key === 'contactEmail') j.metadata.contactEmail = val;
                        const cleanVal = val.replace(/\\'/g, "'")
                            .replace(/\\n/g, "\n")
                            .replace(/\\r/g, "")
                            .replace(/\n\s*\n/g, "\n") // Collapse multiple newlines
                            .trim();

                        if (key === 'editorialTeam') j.metadata.editorialTeam = cleanVal;
                        if (key === 'authorInformation') j.metadata.authorInformation = cleanVal;
                        if (key === 'librarianInformation') j.metadata.librarianInformation = cleanVal;
                        if (key === 'readerInformation') j.metadata.readerInformation = cleanVal;
                        if (key === 'focusScopeDesc') j.metadata.focusScopeDesc = cleanVal;

                        if (key === 'pageHeaderLogoImage' || key === 'pageHeaderTitleImage') {
                            try {
                                const rawJson = val.replace(/\\'/g, "'").replace(/\\"/g, '"');
                                if (rawJson.startsWith('{')) {
                                    const parsed = JSON.parse(val.replace(/\\"/g, '"'));
                                    if (parsed.name) j.metadata.coverImage = parsed.name;
                                } else {
                                    j.metadata.coverImage = val;
                                }
                            } catch (e) { }
                        }
                    }
                }
            }

            // SUBMISSIONS (journal linkage)
            if (currentBlock === 'submissions') {
                const matches = line.matchAll(/\(\s*(\d+)\s*,\s*(\d+)/g);
                for (const match of matches) {
                    const sid = parseInt(match[1]);
                    const jid = parseInt(match[2]);
                    submissions.set(sid, { journalId: jid });
                }
            }

            // PUBLICATIONS
            // Columns: 0:publication_id, 1:access_status, 2:date_published, 3:last_modified, 4:primary_contact_id, 5:section_id, 6:seq, 7:submission_id, 8:status, 9:url_path, 10:version
            // We need columns 0, 7, and optionally 2 for date_published
            if (currentBlock === 'publications') {
                // Match full row: (col0, col1, col2, col3, col4, col5, col6, col7, ...)
                // We'll use a more comprehensive regex or just count commas
                const matches = line.matchAll(/\(([^)]+)\)/g);
                for (const match of matches) {
                    const vals = match[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
                    if (vals.length >= 8) {
                        const pid = parseInt(vals[0]);
                        const sid = parseInt(vals[7]); // submission_id is at index 7
                        const datePub = vals[2] && vals[2] !== 'NULL' ? vals[2].replace(/'/g, '') : null;
                        const lastMod = vals[3] && vals[3] !== 'NULL' ? vals[3].replace(/'/g, '') : null;

                        if (!publications.has(pid)) {
                            publications.set(pid, {
                                submissionId: sid,
                                title: `Article ${pid}`,
                                datePublished: datePub,
                                lastModified: lastMod
                            });
                        }
                    }
                }
            }

            // PUBLICATION GALLEYS (PDF Links)
            if (currentBlock === 'publication_galleys') {
                const matches = line.matchAll(/\(([^)]+)\)/g);
                for (const match of matches) {
                    const vals = match[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
                    if (vals.length >= 5) {
                        const pid = parseInt(vals[2]);
                        const fid = parseInt(vals[4]);
                        const label = vals[3];
                        if (label.toLowerCase().includes('pdf')) {
                            if (!galleys.has(pid)) galleys.set(pid, []);
                            galleys.get(pid).push(fid);
                        }
                    }
                }
            }

            // SUBMISSION FILE SETTINGS (Filenames)
            if (currentBlock === 'submission_file_settings') {
                const matches = line.matchAll(/\(\s*(\d+)\s*,\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'/g);
                for (const match of matches) {
                    const fid = parseInt(match[1]);
                    const key = match[2];
                    const val = match[3];
                    if (key === 'name') {
                        fileNames.set(fid, val);
                    }
                }
            }

            // PUBLICATION SETTINGS (Titles, Abstracts)
            if (currentBlock === 'publication_settings') {
                const matches = line.matchAll(/\(\s*(\d+)\s*,\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'/g);
                for (const match of matches) {
                    const pid = parseInt(match[1]);
                    const key = match[2];
                    const val = match[3];

                    if (publications.has(pid)) {
                        const p = publications.get(pid);
                        if (key === 'title') p.title = val;
                        if (key === 'abstract') p.abstract = val;
                    }
                }
            }

            // AUTHORS
            // (author_id, email, include_in_browse, user_group_id, submission_id, ...)
            if (currentBlock === 'authors') {
                // Capture: (author_id, ..., ..., ..., submission_id)
                // Usually: (id, email, include_in_browse, user_group_id, submission_id, ...)
                const matches = line.matchAll(/\(([^)]+)\)/g);
                for (const match of matches) {
                    const vals = match[1].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
                    if (vals.length >= 5) {
                        const aid = parseInt(vals[0]);
                        const email = vals[1] || '';
                        const pid = parseInt(vals[3]); // publication_id is at index 3 in this OJS 3.x authors table
                        authors.set(aid, {
                            publicationId: pid,
                            email: email,
                            givenName: '',
                            familyName: '',
                            affiliation: ''
                        });
                    }
                }
            }

            // AUTHOR SETTINGS (Names and Affiliations)
            // (author_id, locale, setting_name, setting_value)
            if (currentBlock === 'author_settings') {
                const matches = line.matchAll(/\(\s*(\d+)\s*,\s*'[^']*'\s*,\s*'([^']+)'\s*,\s*'((?:[^']|'')*)'/g);
                for (const match of matches) {
                    const aid = parseInt(match[1]);
                    const key = match[2];
                    const val = match[3];

                    if (authors.has(aid)) {
                        const author = authors.get(aid);
                        if (key === 'givenName') author.givenName = val;
                        if (key === 'familyName') author.familyName = val;
                        if (key === 'affiliation') author.affiliation = val;
                    }
                }
            }
        }

        console.log(`Extracted: ${journals.size} Journals, ${submissions.size} Submissions, ${publications.size} Publications, ${authors.size} Authors`);

        // ===== DATABASE INSERTION =====

        // 1. Insert Journals
        for (const [id, j] of journals) {
            const branding = { primary_color: '#003366' };
            const cleanName = j.name.replace(/\\'/g, "'");
            const metadata = j.metadata || {};

            await client.query(`
                INSERT INTO platform_journals (journal_id, path, name, branding, metadata)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (journal_id) DO UPDATE SET 
                    name = EXCLUDED.name,
                    path = EXCLUDED.path,
                    metadata = EXCLUDED.metadata;
             `, [id, j.path, cleanName, JSON.stringify(branding), JSON.stringify(metadata)]);
        }
        console.log(`✓ Journals imported`);

        // 2. Create Articles Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS platform_articles (
                item_id BIGINT PRIMARY KEY,
                journal_id BIGINT REFERENCES platform_journals(journal_id),
                title TEXT,
                authors TEXT[],
                publication_date TIMESTAMP,
                doi TEXT,
                abstract TEXT,
                pages TEXT,
                metadata JSONB
            );
        `);

        // 3. Insert Articles
        let insertedArticles = 0;
        for (const [pid, pub] of publications) {
            const sub = submissions.get(pub.submissionId);
            if (sub && journals.has(sub.journalId)) {
                const cleanTitle = pub.title.replace(/\\'/g, "'");
                const cleanAbstract = pub.abstract ? pub.abstract.substring(0, 2000).replace(/\\'/g, "'") : '';

                // Find all authors for this publication
                const articleAuthors = [];
                for (const [aid, author] of authors) {
                    if (author.publicationId === pid) {
                        const fullName = `${author.givenName} ${author.familyName}`.trim() || author.email || 'Unknown Author';
                        articleAuthors.push(fullName);
                    }
                }

                // Find PDF File info
                const articleMetadata = {};
                const pidGalleys = galleys.get(pid) || [];
                if (pidGalleys.length > 0) {
                    const fid = pidGalleys[0]; // Take first PDF galley
                    articleMetadata.ojsFileId = fid;
                    articleMetadata.originalFilename = fileNames.get(fid) || `article_${pid}.pdf`;
                }

                const bestDate = pub.datePublished ? new Date(pub.datePublished) : (pub.lastModified ? new Date(pub.lastModified) : new Date());

                await client.query(`
                    INSERT INTO platform_articles (item_id, journal_id, title, authors, publication_date, abstract, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (item_id) DO UPDATE SET
                        authors = EXCLUDED.authors,
                        title = EXCLUDED.title,
                        abstract = EXCLUDED.abstract,
                        publication_date = EXCLUDED.publication_date,
                        metadata = EXCLUDED.metadata;
                `, [
                    pid,
                    sub.journalId,
                    cleanTitle,
                    articleAuthors.length > 0 ? articleAuthors : ['Unknown Author'],
                    bestDate,
                    cleanAbstract,
                    JSON.stringify(articleMetadata)
                ]);
                insertedArticles++;
            }
        }
        console.log(`✓ ${insertedArticles} Articles imported with author names`);

    } catch (err) {
        console.error('ETL Failed:', err);
    } finally {
        await client.end();
    }
}

runETL();
