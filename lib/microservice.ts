import {Construct} from "constructs";
import {NodejsFunction, NodejsFunctionProps} from "aws-cdk-lib/aws-lambda-nodejs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {join} from "path";
import {ITable} from "aws-cdk-lib/aws-dynamodb";

interface MicroserviceProps {
    productTable: ITable
}

export class Microservice extends Construct {

    public readonly productMicroservice: NodejsFunction
    public readonly basketMicroservice: NodejsFunction

    constructor(scope: Construct, id: string, props: MicroserviceProps) {
        super(scope, id);

        this.productMicroservice = this.createProductFunction(props)
        this.basketMicroservice = this.createBasketFunction(props)
    }

    private createProductFunction(props: MicroserviceProps): NodejsFunction {
        const nodeJsFunctionProps: NodejsFunctionProps = {
            bundling: {
                externalModules: [
                    'aws-sdk'
                ]
            },
            environment: {
                PRIMARY_KEY: 'id',
                DYNAMODB_TABLE_NAME: props.productTable.tableName
            },
            runtime: Runtime.NODEJS_LATEST
        }

        const productMicroservice = new NodejsFunction(this, 'productLamdaFunction', {
            entry: join(__dirname, `/../src/product/index.js`),
            ...nodeJsFunctionProps,
        })

        props.productTable.grantReadWriteData(this.productMicroservice)
        return productMicroservice
    }

    private createBasketFunction(props: MicroserviceProps): NodejsFunction {
        const nodeJsFunctionProps: NodejsFunctionProps = {
            bundling: {
                externalModules: [
                    'aws-sdk'
                ]
            },
            environment: {
                PRIMARY_KEY: 'id',
                DYNAMODB_TABLE_NAME: props.productTable.tableName
            },
            runtime: Runtime.NODEJS_LATEST
        }

        const basketFunction = new NodejsFunction(this, 'basketLamdaFunction', {
            entry: join(__dirname, `/../src/product/index.js`),
            ...nodeJsFunctionProps,
        })

        props.productTable.grantReadWriteData(this.basketMicroservice)
        return basketFunction
    }
}