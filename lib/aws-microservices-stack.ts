import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Database} from "./database";
import {Microservice} from "./microservice";
import {ApiGateway} from "./apigateway";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroservicesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const database = new Database(this, 'Database')
        const microservices = new Microservice(this, "Microservice", {productTable: database.productTable})
        const apiGateway = new ApiGateway(this, 'apigateway', {productMicroservice: microservices.productMicroservice})

    }
}
