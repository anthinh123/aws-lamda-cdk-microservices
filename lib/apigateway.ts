import {Construct} from "constructs";
import {LambdaRestApi} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {IFunction} from "aws-cdk-lib/aws-lambda";


interface ApiGatewayProps {
    productMicroservice: NodejsFunction,
    basketMicroservice: NodejsFunction
}

export class ApiGateway extends Construct {
    constructor(scope: Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);
        this.createProductApiGateway(props.productMicroservice)
        this.createBasketApiGateway(props.basketMicroservice)
    }

    private createProductApiGateway(productMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'productApi', {
            restApiName: 'Product Service',
            handler: productMicroservice,
            proxy: false
        })

        const product = apigw.root.addResource('product')
        product.addMethod('GET')
        product.addMethod('POST')

        const singleProduct = product.addResource('{id}')
        singleProduct.addMethod('GET')
        singleProduct.addMethod('PUT')
        singleProduct.addMethod('DELETE')
    }

    private createBasketApiGateway(basketMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'basketApi', {
            restApiName: 'Basket Service',
            handler: basketMicroservice,
            proxy: false
        })

        const basket = apigw.root.addResource('basket')
        basket.addMethod('GET')
        basket.addMethod('POST')

        const userBasket = basket.addResource('{userName}')
        userBasket.addMethod('GET')
        userBasket.addMethod('DELETE')

        const basketCheckout = basket.addResource('checkout')
        basketCheckout.addMethod('POST')

    }
}