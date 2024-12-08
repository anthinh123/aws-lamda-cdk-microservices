import {Construct} from "constructs";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import {EventBus, Rule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";


interface EventBusProp {
    publisher: IFunction,
    target: IFunction
}

export class Eventbus extends Construct {
    constructor(scope: Construct, id: string, props: EventBusProp) {
        super(scope, id);

        const eventBus = new EventBus(this, 'eCommerceEventBus', {
            eventBusName: 'eCommerceEventBus'
        })

        const checkOutBasketRule = new Rule(this, 'CheckOutBasketRule', {
            eventBus: eventBus,
            enabled: true,
            description: 'when checkout basket',
            eventPattern: {
                source: ['com.basket.checkoutbasket'],
                detailType: ['CheckoutBasket']
            },
            ruleName: 'CheckOutBasketRule'
        })
        checkOutBasketRule.addTarget(new LambdaFunction(props.target))

        eventBus.grantPutEventsTo(props.publisher)
    }
}