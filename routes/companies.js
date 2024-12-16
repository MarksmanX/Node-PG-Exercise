const express = require('express');
const router = new express.Router();
const db = require("../db");
const slugify = require('slugify');
const { next } = require("process");
const ExpressError = require("../expressError")

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({companies: results.rows});
    } catch(e) {
        return next(e);
    }
});

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query(`SELECT c.code, c.name, c.description, i.industry AS industry
            From companies c
            LEFT JOIN companies_industries ci ON c.code = ci.company_code
            LEFT JOIN industries i ON ci.industry_code = i.code
            WHERE c.code = $1`, [code]);
        if (result.rows.length === 0) {
            return res.status(404).json({error: `No company with code ${code} could be found.`});
        }
        return res.json({
            company: {
                code: result.rows[0].code,
                name: result.rows[0].name,
                description: result.rows[0].description,
                industries: result.rows.map(row => row.industry).filter(industry => industry !== null),
            }
        });
    } catch(e) {
        return next(e);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = slugify(name, {lower: true, strict: true });
        const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`, [code, name, description]);
        return res.status(201).json({company: result.rows[0]});
    } catch(e) {
        return next(e);
    }
})

router.patch('/:code', async (req, res, next) => {
    try {
        const { name, description} = req.body;
        const { code } = req.params;
        const result = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`, [name, description, code]);
        if(result.rows.length === 0){
            throw new ExpressError(`Can't update company with code of ${code}`, 404);
        }
        return res.json({company: result.rows[0]});
    } catch(e) {
        return next(e);
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await db.query(`DELETE FROM companies WHERE code=$1`, [code]);
        if (result.rowCount === 0) {
            throw new ExpressError(`Can't delete company with code of ${code}`, 404);
        }
        return res.send({status: "deleted"});
    } catch(e) {
        return next(e);
    }
})

module.exports = router;