const express = require('express');
const ExpressError = require('../expressError')
const router = express.Router();
const db = require('../db')
const slugify = require('slugify')

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
        // const {code} = ;

        // OLD
        // const companyResults = await db.query("SELECT companies.code, companies.name, companies.description FROM companies WHERE code = $1", [code]);

        const invoiceResults = await db.query("SELECT * FROM invoices WHERE comp_code = $1", [req.params.code])

        //NEW
        const companyResults = await db.query(`
            SELECT c.code, c.name, c.description, i.industry as industries
            FROM companies c
            JOIN industries_companies ic
            ON c.code = ic.company_code
            JOIN industries i
            ON ic.industry_code = i.code
            WHERE c.code = $1`,[req.params.code])
        //returns multiple rows
        const {code, name, description} = companyResults.rows[0]
        console.log('companyResults',companyResults)
        const industries = companyResults.rows.map(r=> r.industries)


        // Throw 404 error if no company found
        if(companyResults.rows.length == 0){ throw new ExpressError(`No company with code "${code}"`, 404)}

        const company = {code, name, description}
        company.invoices = invoiceResults.rows
        company.industries = industries

        return res.status(200).send({company: company})
    } catch(e){
        return next(e)
    }
})






// POST a new copmany, return the new company
router.post("/", async (req,res,next) => {
    try {
        const {name, description} = req.body;
        let code = slugify(name, {lower:true})
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