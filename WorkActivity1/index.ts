import { AzureFunction, Context } from "@azure/functions"
import { ActivityOutput, ActivityInput } from "../Models/Models";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const activityFunction: AzureFunction = async function (context: Context, input: ActivityInput): Promise<ActivityOutput> {

    const sillyNames: string[] = [
        'Horse',
        'Jack',
        'Pumpkin',
        'Potatoe'
    ];

    const index = Math.round(Math.random() * sillyNames.length);

    context.log(`Generating a silly name for: ${input.name}`);

    await sleep(5000);

    // return workflow output
    return {
        sillyName:  input.name + sillyNames[index]
    };
};

export default activityFunction;
