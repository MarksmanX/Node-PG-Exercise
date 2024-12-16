const express = require('express');
const router = new express.Router();
const db = require("../db");
const { next } = require("process");
const ExpressError = require("../expressError")

router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT i.industry, i.code, c.code AS company_code 
            FROM industries i
            LEFT JOIN companies_industries ci ON i.code = ci.industry_code
            LEFT JOIN companies c ON ci.company_code = c.code`);
        if (results.rows.length === 0) {
            throw new ExpressError("Could not find any industries", 404);
        }
        return res.json({ industries: results.rows });
    } catch(e) {
        return next(e);
    } 
});

router.post("/", async (req, res, next) => {
    try {
        const { code, industry } = req.body;
        const result = await db.query(`INSERT INTO industries (code, industry) 
            VALUES ($1, $2) RETURNING *`, [code, industry]);
        return res.json({ industry: result.rows[0] })
    } catch(e) {
        return next(e);
    }
});

router.post("/companies/:companyCode/industries/:industryCode", async (req, res, next) => {
    try {
        const { companyCode, industryCode } = req.params;
        
        // Check if the company and industry exist (optional but good practice)
        const companyResult = await db.query(
            "SELECT code FROM companies WHERE code = $1", [companyCode]
        );
        const industryResult = await db.query(
            "SELECT code FROM industries WHERE code = $1", [industryCode]
        );

        if (companyResult.rows.length === 0) {
            return res.status(404).json({ error: `Company with code ${companyCode} not found` });
        }

        if (industryResult.rows.length === 0) {
            return res.status(404).json({ error: `Industry with code ${industryCode} not found` });
        }

        // Insert into the companies_industries table to associate the company with the industry
        const result = await db.query(
            `INSERT INTO companies_industries (company_code, industry_code)
             VALUES ($1, $2) RETURNING *`, 
            [companyCode, industryCode]
        );

        return res.status(201).json({ association: result.rows[0] });
    } catch (e) {
        return next(e);
    }
});


module.exports = router;