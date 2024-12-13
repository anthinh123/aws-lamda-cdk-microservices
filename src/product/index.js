import {marshall, unmarshall} from "@aws-sdk/util-dynamodb" ;
import {dbClient} from "./dbClient";
import {
    DeleteItemCommand,
    GetItemCommand,
    PutItemCommand, QueryCommand,
    ScanCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb"
import {v4 as uuidv4} from 'uuid'

exports.handler = async function (event) {
    console.log("request:", JSON.stringify(event, undefined, 2))
    let body
    try {
        switch (event.httpMethod) {
            case "GET":
                if (event.queryStringParameters != null) {
                    body = await getProductByCategory(event)
                } else if (event.pathParameters != null) {
                    body = await getProduct(event.pathParameters.id)
                } else {
                    body = await getAllProduct()
                }
                break
            case "POST":
                body = await createProduct(event)
                break
            case "DELETE":
                body = await deleteProduct(event.pathParameters.id)
                break
            case "PUT":
                body = await updateProduct(event)
                break
            default:
                throw new Error(`Unsupported route : "${event.httpMethod}`)
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Successfully finished operation: "${event.httpMethod}`,
                body: body
            })
        };
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

const getProduct = async (productId) => {
    console.log("getProduct")
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({id: productId})
        }
        const {Item} = await dbClient.send(new GetItemCommand(params))
        console.log(Item)
        return (Item) ? unmarshall(Item) : {}
    } catch (e) {
        console.error(e)
        throw e
    }
}

const getAllProduct = async () => {
    console.log("getAllProduct")
    try {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME,
        }
        const {Items} = await dbClient.send(new ScanCommand(params))
        console.log(Items)
        return (Items) ? Items.map((item) => unmarshall(item)) : {}
    } catch (e) {
        console.error(e)
        throw e
    }
}

const createProduct = async (event) => {
    console.log("createProduct")
    try {
        const productRequest = JSON.parse(event.body)
        productRequest.id = uuidv4()
        const command = new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall(productRequest || {}),
        });

        const response = await dbClient.send(command);
        console.log(response);
        return response;
    } catch (e) {
        console.error(e)
        throw e
    }
}

const deleteProduct = async (productId) => {
    console.log(`deleteProduct with ${productId}`)
    try {
        const command = new DeleteItemCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: marshall({id: productId}),
        });

        const response = await dbClient.send(command);
        console.log(response);
        return response;
    } catch (e) {
        console.error(e)
        throw e
    }
}

const updateProduct = async (event) => {
    console.log(`updateProduct with ${event}`)
    try {
        const requestBody = JSON.parse(event.body)
        const objKeys = Object.keys(requestBody)
        const command = new UpdateItemCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: marshall({id: event.pathParameters.id}),
            UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`#key${index}`]: key,
            }), {}),
            ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
                ...acc,
                [`:value${index}`]: requestBody[key],
            }), {})),
        });

        const response = await dbClient.send(command);
        console.log(response);
        return response;
    } catch (e) {
        console.error(e)
        throw e
    }
}

const getProductByCategory = async (event) => {
    console.log(`getProductByCategory with ${event}`)
    try {
        // GET product/1234?category=Phone
        const productId = event.pathParameters.id
        const category = event.queryStringParameters

        const command = new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: "id = :productId",
            FilterExpression: "contains (category, :category)",
            ExpressionAttributeValues: {
                ":productId": {S: productId},
                ":category": {S: category}
            }
        })

        const {Items} = await dbClient.send(command);
        console.log(Items);
        return Items.map((item) => unmarshall(item));
    } catch (e) {
        console.error(e)
        throw e
    }
}