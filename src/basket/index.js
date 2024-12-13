import {DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {dbClient} from "./dbClient";
import { ebClient } from "./eventBridgeClient";
import {PutEventsCommand} from "@aws-sdk/client-eventbridge";

exports.handler = async function (event) {

    try {
        let body
        switch (event.httpMethod) {
            case 'GET':
                if (event.pathParameters != null) {
                    body = await getBasketByUser(event.pathParameters.userName)
                } else {
                    body = await getAllBaskets()
                }
                break
            case 'POST':
                if (event.path == '/basket/checkout') {
                    body = await checkoutBasket(event)
                } else {
                    body = await addToBasket(event)
                }
                break
            case 'DELETE':
                body = await deleteBasket(event.pathParameters.userName)
                break
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.path}`,
                body: body
            })
        }
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to perform operation.",
                errorMsg: e.message,
                errorStack: e.stack,
            })
        };
    }
}

const getBasketByUser = async (userName) => {
    console.log("getBasketByUser userName = " + userName)
    try {
        const command = new GetItemCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({userName: userName})
        })
        const {Item} = await dbClient.send(command)
        console.log(Item)
        return (Item) ? unmarshall(Item) : {};
    } catch (e) {
        console.error(e)
        throw e
    }
};

const getAllBaskets = async () => {
    try {
        const command = new ScanCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
        })
        const {Items} = await dbClient.send(command)
        return (Items) ? Items.map((item) => unmarshall(item)) : {}
    } catch (e) {
        console.error(e)
        throw e
    }
};

const addToBasket = async (event) => {
    try {
        const requestBody = JSON.parse(event.body)
        const command = new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(requestBody || {})
        })
        return await dbClient.send(command)
    } catch (e) {
        console.error(e)
        throw e
    }
};

const deleteBasket = async (userName) => {
    try {
        const command = new DeleteItemCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({userName: userName})
        })
        const deleteResult = await dbClient.send(command)
        return deleteResult
    } catch (e) {
        console.error(e)
        throw e
    }
};

const checkoutBasket = async (event) => {
    console.log("checkoutBasket")
    const checkoutRequest = JSON.parse(event.body)
    if (checkoutRequest == null || checkoutRequest.userName == null) {
        throw Error('Invalid request. Check userName again')
    }

    const basket = await getBasketByUser(checkoutRequest.userName)

    preparePayload(checkoutRequest, basket)

    await publishCheckoutBasketEvent(checkoutRequest)

    await deleteBasket(checkoutRequest.userName)
}

const preparePayload = async (checkoutRequest, basket) => {
    console.log("preparePayload")
    // prepare order payload -> calculate total price and combine checkoutRequest and basket items
    // aggregate and enrich request and basket data in order to create order payload
    try {
        if (basket == null || basket.items == null) {
            throw new Error(`basket should exist in items: "${basket}"`);
        }

        let totalPrice = 0
        basket.items.forEach(item => totalPrice += item.price)
        checkoutRequest.totalPrice = totalPrice
        console.log(checkoutRequest);

        // copies all properties from basket into checkoutRequest
        Object.assign(checkoutRequest, basket)
        console.log("Success prepareOrderPayload, orderPayload:", checkoutRequest);
        return checkoutRequest;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

const publishCheckoutBasketEvent = async (checkoutPayload) => {
    console.log("publishCheckoutBasketEvent with payload :", JSON.stringify(checkoutPayload));
    try {
        const params = {
            Entries: [
                {
                    Source: process.env.EVENT_BUS_SOURCE,
                    Detail: JSON.stringify(checkoutPayload),
                    DetailType: process.env.EVENT_BUS_DETAIL_TYPE,
                    Resource: [ ],
                    EventBusName: process.env.EVENT_BUS_NAME
                }
            ]
        }

        const data = await ebClient.send(new PutEventsCommand(params));
        console.log("Success, event sent; requestID:", data);
        return data;
    } catch (e) {
        console.log(e)
        throw e
    }
}