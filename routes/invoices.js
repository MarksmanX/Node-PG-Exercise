const express = require('express');
const router = new express.Router();
const db = require('../db');
const { next } = require('process');
const ExpressError = require("../expressError")

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({invoices: results.rows});
    } catch(e) {
        return next(e);
    }
})

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Could not find invoice with id of ${id}`, 404);
        }
        return res.json({invoice: result.rows[0]});
    } catch(e) {
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt]);
        return res.status(201).json({invoice: result.rows[0]});
    } catch(e) {
        return next(e);
    }
})

router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt, paid } = req.body;
        const currentInvoiceResult = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
        if(currentInvoiceResult.rows.length === 0){
            throw new ExpressError(`Can't update invoice with id of ${id}`, 404);
        }

        const currentInvoice = currentInvoiceResult.rows[0];

        let paid_date = currentInvoice.paid_date;

        if (paid === true && currentInvoice.paid === false) {
            paid_date = new Date().toISOString().split('T')[0];  // Set to today's date (YYYY-MM-DD)
        } else if (paid === false && currentInvoice.paid === true) {
            paid_date = null;  // Set paid_date to null when un-paying
        }

        const updateResult = await db.query(
            `UPDATE invoices 
             SET amt=$1, paid=$2, paid_date=$3 
             WHERE id=$4 
             RETURNING *`,
            [amt, paid, paid_date, id]
        );

        return res.json({invoice: updateResult.rows[0]});
    } catch(e) {
        return next(e);
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query(`DELETE FROM invoices WHERE id=$1`, [id]);
        return res.send({status: "deleted"});
    } catch(e) {
        return next(e);
    }
})

module.exports = router;