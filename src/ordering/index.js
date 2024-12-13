import {GetItemCommand, PutItemCommand, ScanCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {dbClient} from "./dbClient";

exports.handler = async function (event) {
    console.log("request:", JSON.stringify(event, undefined, 2));

    const eventType = event['detail-type'];
    if (eventType !== undefined) {
        await invokeBridge(event)
    } else {
        return await invokeGateway(event)
    }
}

const invokeBridge = async (event) => {
    console.log(`eventBridgeInvocation function. event : "${event}"`);
    await createOrder(event.detail)
}

const createOrder = async (basketCheckout) => {
    try {
        console.log(`createOrder function. event : "${basketCheckout}"`);
        const orderDate = new Date().toISOString()
        basketCheckout.orderDate = orderDate
        console.log(basketCheckout);

        const command = new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(basketCheckout || {})
        })

        const createResult = await dbClient.send(command);
        console.log(createResult);
        return createResult;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

const invokeGateway = async (event) => {
    try {
        let body
        switch (event.httpMethod) {
            case 'GET':
                if (event.pathParameters != null) {
                    body = await getOrderByUser(event.pathParameters.userName)
                } else {
                    body = await getAllOrders()
                }
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

const getOrderByUser = async (userName) => {
    console.log("getOrderByUser userName = " + userName)
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

const getAllOrders = async () => {
    console.log("getAllOrders ")
    try {
        const command = new ScanCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME
        })
        const {Items} = await dbClient.send(command)
        console.log(Items)
        return (Items) ? Items.map((item) => unmarshall(item)) : {}
    } catch (e) {
        console.error(e)
        throw e
    }
};

