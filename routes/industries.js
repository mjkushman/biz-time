const express = require('express');
const ExpressError = require('../expressError')
const router = express.Router();
const db = require('../db')
const slugify = require('slugify')

// GET all industries
router.get("/", async (req,res, next) => {
    try {
        const results = await db.query(`
        SELECT i.code, i.industry, c.code
        FROM industries AS i
        LEFT JOIN industries_companies AS ic
        ON i.code = ic.industry_code
        LEFT JOIN companies AS c
        ON ic.company_code = c.code`)

        return res.json({industries: results.rows})
    } catch(e) {
        return next(e)
    }
})


// POST a new industry, return the new industry
router.post("/", async (req,res,next) => {
    // if(req.body.company_code){
    //     next()
    // }
    try {
        const {industry} = req.body;
        let code = slugify(industry, {lower:true})
        const results = await db.query("INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *", [code,industry]);

        return res.status(201).json({industry: results.rows[0]})
    } catch(e){
        return next(e)
    }
})

// PUT associate an industry with a company, or 404 if none found
router.post("/", async (req,res,next) => {
    try {
        const companyCode = req.body.company_code;
        const industryCode = req.body.industry_code;

        const results = await db.query("INSERT INTO industries_companies (industry_code, company_code) VALUES (industry_code=$1, company_code=$2) RETURNING *", [industryCode, companyCode]);

        if(results.rows.length ===0) {
            throw new ExpressError(`Something bad happened`, 404)
        }
        return res.status(200).json({industry_company: results.rows[0]})

    } catch(e) {
        return next(e)
    }
})

module.exports = router