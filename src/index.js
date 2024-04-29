require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const url = require('url');
const { register, collectDefaultMetrics } = require('prom-client');

const env = process.env.ENVIRONMENT || "dev";

// DATABASE CODE ---------------------------------------------------------

let pool = undefined;
if (env === "prod") {
    const dbUrl = url.parse(process.env.CLEARDB_DATABASE_URL);
    pool = mysql.createPool({
        host: dbUrl.hostname,
        user: dbUrl.auth.split(':')[0],
        password: dbUrl.auth.split(':')[1],
        database: dbUrl.pathname.substring(1)
    });

    // collect prometheus default metrics
    collectDefaultMetrics();
} else if (env !== "test") {
    pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: `${process.env.DB_PASSWORD}`,
        database: 'project_database'
    });
}

async function insertProcessedData(job) {
    const query = `
        INSERT INTO processed_jobs (id, jobTitle, companyName, location, description, url, date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [job.id, job.jobTitle, job.companyName, job.location, job.description, job.url, job.date];
    await pool.query(query, values);
}

// ENDPOINT ONE ---------------------------------------------------------

async function getUnprocessedDataOne() {
    const query = 'SELECT * FROM job_listings WHERE is_processed = 0';
    const [rows] = await pool.query(query);
    return rows;
}

async function markAsProcessedOne(id) {
    const query = 'UPDATE job_listings SET is_processed = 1 WHERE id = ?';
    await pool.query(query, [id]);
}

const processEndpointOne = async () => {
    const unprocessedJobs = await getUnprocessedDataOne();

    for (const job of unprocessedJobs) {
        const convertedJobObject = {
            id: `${1}-${job.id}`,
            jobTitle: job.jobTitle,
            companyName: job.companyName,
            location: job.jobGeo,
            description: job.jobDescription,
            url: job.url,
            date: job.pubDate,
        };

        await insertProcessedData(convertedJobObject);
        await markAsProcessedOne(job.id);
    }
}

// ENDPOINT TWO ---------------------------------------------------------

async function getUnprocessedDataTwo() {
    const query = 'SELECT * FROM job_listings_two WHERE is_processed = 0';
    const [rows] = await pool.query(query);
    return rows;
}

async function markAsProcessedTwo(id) {
    const query = 'UPDATE job_listings_two SET is_processed = 1 WHERE id = ?';
    await pool.query(query, [id]);
}

const filterJobs = (jobs) => {
    return jobs.filter(job => {
        const titleLower = job.title.toLowerCase();
        const descriptionLower = job.description.toLowerCase();

        // check if the title or description contains the keywords
        return titleLower.includes('remote') || 
            titleLower.includes('work from home') ||
            descriptionLower.includes('remote') ||
            descriptionLower.includes('work from home');
    })
}

const processEndpointTwo = async () => {
    const unprocessedJobs = await getUnprocessedDataTwo();
    const filteredJobs = filterJobs(unprocessedJobs);

    for (const job of filteredJobs) {
        const convertedJobObject = {
            id: `${2}-${job.id}`,
            jobTitle: job.title,
            companyName: job.company_name,
            location: job.location_display_name,
            description: job.description,
            url: job.redirect_url,
            date: job.created,
        };

        await insertProcessedData(convertedJobObject);
        await markAsProcessedTwo(job.id);
    }
}

// SERVER CODE ---------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Set up Prometheus endpoint
app.get('/metrics', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
});

// Route to start processing data
app.get('/process-data', async (req, res) => {
    try {
        await processEndpointOne();
        await processEndpointTwo();

        res.status(200).json({ message: 'Data processing completed successfully.' });
    } catch (error) {
        console.error('Failed to process data:', error);
        res.status(500).json({ message: 'Failed to process data', error: error.message });
    }
});

app.get('/health-check', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Start the server

if (env !== "test") {
    app.listen(PORT, () => {
        console.log(`Data-Analyzer-Server running on http://localhost:${PORT}`);
    });
}

module.exports = {
    app,
    filterJobs
};