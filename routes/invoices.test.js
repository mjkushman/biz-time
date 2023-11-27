process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testSamsung
let testSamsungInvoice

beforeEach(async ()=> {
    //delete everything
    await db.query("DELETE FROM invoices")
    await db.query("DELETE FROM companies")

    // create Samsung
    const samsungResult = await db.query("INSERT INTO companies (code, name, description) VALUES ('samsung','Samsung','Korean electronics monstrosity') RETURNING code, name, description");
    testSamsung = samsungResult.rows[0];
    
    // create Samsung Invoice
    const samsungInvoiceResult = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ('samsung', 9999) RETURNING id,comp_code,amt,paid,add_date,paid_date");
    testSamsungInvoice = samsungInvoiceResult.rows[0]


    const samsungInvoices = await db.query("SELECT * FROM invoices WHERE comp_code =$1", [testSamsung.code])
    testSamsung.invoices = samsungInvoices.rows
})

afterEach(async () => {
    await db.query("DELETE FROM invoices")
    await db.query("DELETE FROM companies")
})

afterAll(async () => {
    // await db.query("DELETE FROM companies")
    await db.end()
  })


describe("GET /invoices", ()=> {
    test("Get at least one company", async ()=> {
        const res = await request(app).get('/invoices')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({invoices: expect.any(Array)})
    })
})


describe("GET /invoices/:id", ()=> {
    test("Get a single invoice by id", async ()=> {

        const res = await request(app).get(`/invoices/${testSamsungInvoice.id}`)
        expect(res.statusCode).toBe(200)
        expect.objectContaining({invoice: testSamsungInvoice})
    })
})

describe("POST /invoices", ()=> {
    test("Create a new invoice", async () => {
        const res = await request(app).post('/invoices').send({comp_code:'samsung',amt:69420})

        expect(res.statusCode).toBe(201)
        expect.objectContaining({
            invoice:{
            id:expect.any(Number),
            amount:69420,
            paid:false}
        })
    })
})

describe("DELETE /invoices/:id", ()=>{
    test("Delete a company", async () => {
        const res = await request(app).delete(`/invoices/${testSamsungInvoice.id}`);

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({status: `Deleted`})
    })
})