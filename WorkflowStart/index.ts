import * as df from "durable-functions"
import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { WorkflowRequest } from "../Models/Models";
import { DurableOrchestrationStatus } from "durable-functions/lib/src/durableorchestrationstatus";

const httpStart: AzureFunction = async function (context: Context, req: HttpRequest): Promise<any> {
    
    const workflowRequest : WorkflowRequest = req.body;
    const client = df.getClient(context);
    const instanceId = await client.startNew(req.params.functionName, undefined, workflowRequest);

    const status : DurableOrchestrationStatus = await client.getStatus(instanceId, false, true, true)    
    if(status.runtimeStatus == df.OrchestrationRuntimeStatus.Completed) {
        return status.output;
    }

    return client.waitForCompletionOrCreateCheckStatusResponse(context.bindingData.req, instanceId, 1000);
};

export default httpStart;
