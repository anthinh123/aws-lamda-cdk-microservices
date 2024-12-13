import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
// Create an Amazon EventBridge service client object.
const ebClient = new EventBridgeClient({
    region: 'us-east-1'
});
export {ebClient}