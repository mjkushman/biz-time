const express = require('express');
const ExpressError = require('../expressError')
const router = express.Router();
const db = require('../db')

// GET all companies
router.get("/", async (req,res, next) => {
    try {
        const results = await db.query("SELECT * FROM companies;")

        return res.json({companies: results.rows})
    } catch(e) {
        return next(e)
    }
})


// GET a single company by :code
router.get("/:code", async (req,res,next) => {
    try {
        const {code } = req.params;
        const results = await db.query("SELECT companies.code, companies.name, companies.description, JSON_BUILD_OBJECT('id',invoices.id, 'amt',invoices.amt,'paid',invoices.paid,'add_date',invoices.add_date, 'paid_date',invoices.paid_date) as invoices FROM companies JOIN invoices ON companies.code = invoices.comp_code WHERE code = $1", [code]);

        // Throw 404 error if no company found
        if(results.rows.length == 0){ throw new ExpressError(`No company with code "${code}"`, 404)}

        return res.status(200).send({company: results.rows[0]})
    } catch(e){
        return next(e)
    }
})

// POST a new copmany, return the new company
router.post("/", async (req,res,next) => {
    try {
        const {code, name, description} = req.body;
        const results = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *", [code,name,description]);

        return res.status(201).json({company: results.rows[0]})
    } catch(e){
        return next(e)
    }
})


// PUT edit an existing company, or 404 if none found
router.put("/:code", async (req,res,next) => {
    try {
        const {code} = req.params;
        const { name, description } = req.body;

        const results = await db.query("UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *", [name, description, code]);

        if(results.rows.length ===0) {
            throw new ExpressError(`Unable to update company with code ${code}`, 404)
        }
        return res.status(200).json({company: results.rows[0]})

    } catch(e) {
        return next(e)
    }
})


// DELETE a company. 404 if no company
router.delete("/:code", async (req,res,next) => {
    
    try {
        const {code } = req.params;
        const results = await db.query("DELETE FROM companies WHERE code=$1", [code]);
    
        return res.send({status: `Deleted`})

    } catch(e) {
        return next(e)
    }
})

module.exports = router