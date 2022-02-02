import { Customer } from '../models/customer.model'
import { OpenSearchService } from "./elasticsearch.interface"
import { HttpRequest } from "@aws-sdk/protocol-http"
import { defaultProvider } from "@aws-sdk/credential-provider-node"
import { prepareRequest, SignatureV4 } from "@aws-sdk/signature-v4"
import { NodeHttpHandler } from "@aws-sdk/node-http-handler"
import { Sha256 } from "@aws-crypto/sha256-browser"
import { PaginatedSearch } from '../models/search.model'
import { resolveHostHeaderConfig } from '@aws-sdk/middleware-host-header'


export class OpenSearchServiceImpl implements OpenSearchService {

  private domain
  private signer
  private defaultHeaders

  constructor() {
    this.domain = `${process.env.ELASTICSEARCH_URL}`

    this.signer = new SignatureV4({
      credentials: defaultProvider(),
      region: 'us-east-1',
      service: 'es',
      sha256: Sha256
    });

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'host': this.domain
    }
  }



  async processRecord(customer: Customer, action: string): Promise<void> {
    // Implement strategy pattern
    if (['INSERT', 'MODIFY'].includes(action)) {
      var authRequest = new HttpRequest({
        body: JSON.stringify(customer),
        headers: this.defaultHeaders,
        hostname: this.domain,
        method: 'PUT',
        path: `customers/_doc/${customer.email}`
      });

      const request = await this.authorizeRequest(authRequest)
      await new NodeHttpHandler().handle(request)
    }
  }

  async list(): Promise<Array<Customer>> {
    var authRequest = new HttpRequest({
      body: JSON.stringify({
        query: {
          match_all: {}
        }
      }),
      headers: this.defaultHeaders,
      hostname: this.domain,
      method: 'POST',
      path: `_search`
    });

    return this.requestForCustomer(authRequest)
  }

  async search(paginatedSearch: PaginatedSearch): Promise<Customer[]> {
    var authRequest = new HttpRequest({
      body: JSON.stringify({
        from: paginatedSearch.from,
        size: paginatedSearch.size,
        query: {
          multi_match: {
            query: paginatedSearch.text,
            fields: ["email^3", "password"]
          }
        }
      }),
      headers: this.defaultHeaders,
      hostname: this.domain,
      method: 'POST',
      path: `_search`
    });

    return this.requestForCustomer(authRequest)
  }

  private async requestForCustomer(authRequest: HttpRequest): Promise<Array<Customer>> {

    const request = await this.authorizeRequest(authRequest)
    const { response } = await new NodeHttpHandler().handle(request)
    console.log(response.statusCode + ' ' + response.body.statusMessage);


    const teste: string = await new Promise((resolve, reject) => {
      var responseBody = '';
      response.body.on('data', (chunk) => {
        responseBody += chunk;
      });
      response.body.on('end', () => {
        console.log('Response body: ' + responseBody);
        resolve(responseBody)
      });
      response.body.on("error", (err) => {
        reject(err);
      });
    })

    return JSON.parse(teste).hits.hits
      .map(hit => new Customer(hit._source.email, hit._source.password, hit._source.age))
  }
  update(customer: Customer): Promise<void> {
    throw new Error('Method not implemented.')
  }

  private async authorizeRequest(prepareRequest: HttpRequest): Promise<HttpRequest> {
    var signedRequest = await this.signer.sign(prepareRequest);

    return new HttpRequest({
      headers: signedRequest.headers,
      hostname: signedRequest.hostname,
      method: signedRequest.method,
      path: signedRequest.path,
      query: signedRequest.query,
      protocol: signedRequest.protocol,
      body: signedRequest.body,
      port: signedRequest.port
    })
  }
}