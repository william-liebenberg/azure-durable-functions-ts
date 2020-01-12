# Azure Durable Functions with TypeScript

Example [Azure Durable Functions v2](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview) with TypeScript.

The Durable Functions extensions lets us write stateful serverless workflows ontop of [Azure Functions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-overview). We can focus on our code and let the Durable extensions framrwork take care of managing the state, checkpoints and replays.

There are a number of functions involved to create our stateful serverless workflows such as the Starter functions, Orchestration/Sub-Orchestration functions, and Activity Functions.

## Starter function

Typically a starter function would be a `HttpTrigger`, `BlobTrigger` or any of the other function `Trigger` types that provides an input that we want to process.

The request object is usually obtained from the Request Body or Request Header (depending if it is a Post/Get).

```typescript
const workflowRequest : WorkflowRequest = req.body;
```

### Starting an Orchestration

Starting an orchestration from the Starter function requires at least the name of the function and the input request for the workflow.

```typescript
const client = df.getClient(context);
const instanceId = await client.startNew(req.params.functionName, undefined, workflowRequest);
```

### Returning from a Starter function

Returning from a Starter function can be done in a couple of interesting ways.

We can return a result if the orchestration completed within a specified timeout. If the orchestration is running for longer than an acceptable timeout period, we can return a CheckStatusResponse that includes 5 URLs to interact with the serverless workflow that is executing.

The CheckStatusResponse output looks something like this:
```JSON
{
    "id": "<orchestration id>",
    "statusQueryGetUri": "http://localhost:7071/runtime/webhooks/durabletask/instances/<orchestration id>?taskHub=DurableFunctionsHub&connection=Storage&code=<orchestration function secret>",
    "sendEventPostUri": "http://localhost:7071/runtime/webhooks/durabletask/instances/<orchestration id>/raiseEvent/{eventName}?taskHub=DurableFunctionsHub&connection=Storage&code=<orchestration function secret>",
    "terminatePostUri": "http://localhost:7071/runtime/webhooks/durabletask/instances/<orchestration id>/terminate?reason={text}&taskHub=DurableFunctionsHub&connection=Storage&code=<orchestration function secret>",
    "rewindPostUri": "http://localhost:7071/runtime/webhooks/durabletask/instances/<orchestration id>/rewind?reason={text}&taskHub=DurableFunctionsHub&connection=Storage&code=<orchestration function secret>",
    "purgeHistoryDeleteUri": "http://localhost:7071/runtime/webhooks/durabletask/instances/<orchestration id>?taskHub=DurableFunctionsHub&connection=Storage&code=<orchestration function secret>"
}
```

The `statusQueryGetUri` can be used to query the status of the specified Workflow instance Id. The result actually shows the inputs, outputs, and custom status for the workflow.

```JSON
{
    "name": "WorkOrcestrator",
    "instanceId": "656e49dcd0aa472dbae501c25f8db81e",
    "runtimeStatus": "Completed",
    "input": {
        "name": "william",
        "batchSize": 2
    },
    "customStatus": "Fan in",
    "output": [
        {
            "sillyName": "williamJack"
        },
        {
            "sillyName": "williamPotatoe"
        }
    ],
    "createdTime": "2020-01-12T05:54:56Z",
    "lastUpdatedTime": "2020-01-12T05:55:02Z"
}
```

```typescript
return client.createCheckStatusResponse(context.bindingData.req, instanceId);

// if the workflow completes within the timeout then the starter function returns a 200 OK plus the resulting payload. Otherwise, a 202 Accepted is returned along with the Check Status payload that you can use to inspect and interact with the workflow. See  
return client.waitForCompletionOrCreateCheckStatusResponse(context.bindingData.req, instanceId, 1000);
```

## Orchestration function

[Orchestration Functions](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-types-features-overview#activity-functions) allow you to implement one of many [application patterns](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview?tabs=csharp#application-patterns) such as Chaining and Fan-Out/Fan-In. You are in control of the orchestration of the activity inputs and outputs. 


```typescript
// get the input for this Durable Orchestration
var input = context.df.getInput() as WorkflowRequest;
```

```typescript
// call an activity and pass in the required input
context.df.callActivity("WorkActivity1", activityInput)
```

## Deterministic Code Contstraints

There are a few [Code Restrictions](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-code-constraints) to keep in mind when developing your orchestration functions. You should aim to write deterministic functions so that on each replay of the function the values generated/retrieved do not change. 

### Logging

There is a `isReplaying` API available on the durable context API that indicates if your orchestration code is running for the first time, or if it is replaying the function after returning from a sleep state.

This is useful for logging directly in orchestrator functions and avoiding duplicated log messages. Only log when your code is being run for the first time.

```typescript
if(context.df.isReplaying) {
    context.log("Hi mum!");
}
```
See the [Logging](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-diagnostics#logging) section in MS Docs for more information about the `isReplaying` API.

### Dealing with Dates

Instantiating dates in an orchestration function is *non-deterministic* because on each replay the value will be different. A replay safe workaround is to use the `currentUtcDateTime` API from the durable functions context.

```typescript
var current : Date = context.df.currentUtcDateTime;
```

### Generating GUIDs

Generating GUIDs in an orchestration function is *non-deterministic* because on each replay the value will be different. A replay safe workaround is to use the `newGuid()` method from the durable functions context.

```typescript
var guid : string = context.df.newGuid();
```

## Activity Functions

[Activity functions](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-types-features-overview#activity-functions) are where your unit of logic is executed over your input data to produce an output.

The activity functions are just like normal azure functions that we are used to. There is no deterministic restrictions like we have with the Orchestration functions.

The output of your activity functions are returned to the Orchestration function that invoked the activity.

## Obtaining results

Even if an orchestration ran a week ago, we are still able to retrieve the output data. All we need is the Instance Id.

For instance, we can quiery the ` ` url, or create another `HttpTrigger` function that can return the final result payload for us.

```typescript
// from within a starer/trigger function, we can obtain the current statis and output payload for a particular workflow instance.
const status : DurableOrchestrationStatus = await client.getStatus(instanceId, false, true, true);

if(status.runtimeStatus == df.OrchestrationRuntimeStatus.Completed) {
    return status.output;
}
```