import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Database} from "./database";
import {Microservice} from "./microservice";
import {ApiGateway} from "./apigateway";
import {Eventbus} from "./eventbus";

export class AwsMicroservicesStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const database = new Database(this, 'Database')

        const microservices = new Microservice(this, "Microservice", {
            productTable: database.productTable,
            basketTable: database.basketTable,
            orderTable: database.orderTable
        })

        const apiGateway = new ApiGateway(this, 'apigateway', {
            productMicroservice: microservices.productMicroservice,
            basketMicroservice: microservices.basketMicroservice,
            orderMicroservice: microservices.orderMicroservice,
        })

        // event bus
        const eventBus = new Eventbus(this, 'EventBus', {
            publisher: microservices.basketMicroservice,
            target: microservices.orderMicroservice
        })

    }
}
