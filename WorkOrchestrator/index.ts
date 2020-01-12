import * as df from "durable-functions"
import { WorkflowRequest, ActivityInput, ActivityOutput } from "../Models/Models";
import { Task } from "durable-functions/lib/src/classes";

const orchestrator = df.orchestrator(function* (context) {
    context.df.setCustomStatus('Firing up the workflow');

    const tasks: Task[] = [];
    
    // obtain workload settings
    var input = context.df.getInput() as WorkflowRequest;
    var guid : string = context.df.newGuid();


    // run the workload
    context.df.setCustomStatus('Fanning OUT');
    for(let b = 0; b < input.batchSize; b++) {
        const activityInput: ActivityInput = {
            name: input.name,
            id: b
        };

        tasks.push(
            context.df.callActivity("WorkActivity1", activityInput)
        );
    }

    // aggregate the data
    try {
        context.df.setCustomStatus('Fanning IN');
        const outputs: ActivityOutput[] = yield context.df.Task.all(tasks);        
        context.df.setCustomStatus('Done!');
        return outputs;
    } catch (error) {
        context.df.setCustomStatus('OMG!');
        context.log("oh no! it broked!", error);
        throw error;
    }
});

export default orchestrator;