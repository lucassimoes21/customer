'use strict'

import * as serverless from "serverless-http"
import * as express from "express"
import * as bodyParser from 'body-parser';

import { Converter } from 'aws-sdk/clients/dynamodb'
import { Customer } from './models/customer.model'
import { CustomerRepositoryImpl } from './repository/customer.repository'
import { CustomerRepository } from './repository/customer.interface'
import { OpenSearchServiceImpl } from './services/elasticsearch.service'
import { OpenSearchService } from './services/elasticsearch.interface'
import { PaginatedSearch } from './models/search.model'


const customerRepository: CustomerRepository = new CustomerRepositoryImpl()
const openSearchService: OpenSearchService = new OpenSearchServiceImpl()

const app = express()
app.use(bodyParser.json({ strict: false }));

app.post('/customer', async function (req, res) {
  const customer = Customer.fromJson(req.body)

  if (customer.isAnyFieldEmpty()) {
    res.status(400).json({ message: "Validation failed" })
  }

  await customerRepository.create(customer)
  res.status(201).send()
})


app.get('/customer', async function (req, res) {
  const result = await customerRepository.get(req.query.email)
  result ? res.status(200).json(result.toResponse()) : res.status(404)
})

app.put('/customer', async function (req, res) {
  const customer = Customer.fromJson(req.body)
  if (customer.isAnyFieldEmpty()) {
    res.status(400).json({ message: "Validation failed" })
  }

  await customerRepository.update(customer)
  res.status(200).send()
})

app.get('/customer/list', async function (req, res) {
  const result = await openSearchService.list()
  console.log("Returning get result", result)

  res.status(200).json(result.map(customer => customer.toResponse()))
})

app.post('/customer/search', async function (req, res) {
  const result = await openSearchService.search(PaginatedSearch.fromJson(req.body))
  console.log("Returning search result", result)

  res.status(200).json(result.map(customer => customer.toResponse()))
})

app.delete('/customer', async function (req, res) {
  const result = await customerRepository.delete(req.query.email)
  console.log("Returning delete result", result)

  res.status(200).send()
})

// Default Error Handler
app.use(function (err, req, res, next) {
  console.error(err.stack, req, res)
  res.status(500).json({
    message: err.errorMessage
  })
})

module.exports.handler = serverless(app)

module.exports.stream = async (event) => Promise.all(
  await event.Records.map(async record => {
    if (['INSERT', 'MODIFY'].includes(record.eventName)) {
      const keys = Converter.unmarshall(record.dynamodb.Keys)
      if (keys.pk.startsWith("CUSTOMER#")) {
        console.log("Processing record", record)
        const { email, age, password } = Converter.unmarshall(record.dynamodb.NewImage)
        const customer = new Customer(email, password, age)

        if (customer.isAnyFieldEmpty()) {
          throw Error("Something wen't wrong parsing the customer, some field got empty")
        }

        await openSearchService.processRecord(customer, record.eventName)
        return
      }
    }
    
    console.log("Discarding record", record)

  })
)