process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany
let testUber

beforeEach(async ()=> {
    //delete everything
    await db.query("DELETE FROM companies")

    // create Samsung
    const samsungResult = await db.query("INSERT INTO companies (code, name, description) VALUES ('samsung','Samsung','Korean electronics monstrosity') RETURNING code, name, description");

    const uberResult = await db.query("INSERT INTO companies (code, name, description) VALUES ('uber','Uber','The Uber of Uber') RETURNING code, name, description");

    
    testUber = uberResult.rows[0];
    const uberInvoices = await db.query("SELECT * FROM invoices WHERE comp_code =$1", [testUber.code])
    testUber.invoices = uberInvoices.rows

    testSamsung = samsungResult.rows[0];
    const samsungInvoices = await db.query("SELECT * FROM invoices WHERE comp_code =$1", [testSamsung.code])
    testSamsung.invoices = samsungInvoices.rows
})

afterEach(async () => {
    await db.query("DELETE FROM companies")
})


afterAll(async () => {
    // await db.query("DELETE FROM companies")
    await db.end()
  })


describe("GET /companies tests", ()=> {
    test("Get at least one company", async ()=> {
        const res = await request(app).get('/companies')

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({companies: expect.any(Array)})
    })
})


describe("GET /companies/:code", ()=> {
    test("Get a single company by code", async ()=> {

        const res = await request(app).get(`/companies/${testUber.code}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company: testUber})
    })
})

describe("POST /companies", ()=> {
    test("Create a new company", async () => {
        const res = await request(app).post('/companies').send({name:'NBA', description:'The national basketball association'})

        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({
            company:{
            code:'nba',
            name:'NBA',
            description:'The national basketball association'}
        })
    })
})

describe("DELETE /companies/:id", ()=>{
    test("Delete a company", async () => {
        const res = await request(app).delete(`/companies/${testUber}`);

        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({status: `Deleted`})
    })
})