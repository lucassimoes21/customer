import { DynamoDB } from 'aws-sdk'
import { AttributeMap, DocumentClient } from 'aws-sdk/clients/dynamodb'
import { Customer } from '../models/customer.model'
import { CustomerRepository } from './customer.interface'

export class CustomerRepositoryImpl implements CustomerRepository {


  private dynamoDb: DocumentClient

  constructor() {
    this.dynamoDb = new DocumentClient()
  }

  public async get(email: any): Promise<Customer> {
    const { Item } = await this.dynamoDb.get(this.buildDefaultKeyParams(email)).promise()
    console.log("Return from get", JSON.stringify(Item))

    if (Item) {
      return new Customer(Item.email, Item.password, Item.age)
    }
    return null
  }

  public async delete(email: string): Promise<void> {
    await this.dynamoDb.delete(this.buildDefaultKeyParams(email)).promise()
  }

  public async update(customer: Customer): Promise<void> {
    await this.putCustomer(customer, "attribute_exists(pk)")
  }

  public async create(customer: Customer): Promise<void> {
    await this.putCustomer(customer, "attribute_not_exists(pk)")
  }

  private async putCustomer(customer: Customer, conditionExpression: string) {
    const putItem = {
      TableName: process.env.DYNAMODB_TABLE,
      ConditionExpression: conditionExpression,
      Item: {
        pk: `${Customer.prefix}#${customer.email}`,
        sk: `${Customer.prefix}#${customer.email}`,
        email: customer.email,
        password: customer.password,
        age: customer.age
      }
    }

    await this.dynamoDb.put(putItem).promise();
  }

  private buildDefaultKeyParams(email: string) {
    return {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        "pk": `${Customer.prefix}#${email}`,
        "sk": `${Customer.prefix}#${email}`
      }
    }
  }
}