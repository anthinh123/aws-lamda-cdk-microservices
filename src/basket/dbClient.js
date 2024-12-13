import {DynamoDBClient} from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient();
export {dbClient}