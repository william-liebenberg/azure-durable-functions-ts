/*
 * This function is not intended to be invoked directly. Instead it will be
 * triggered by an orchestrator function.
 * 
 * Before running this sample, please:
 * - create a Durable orchestration function
 * - create a Durable HTTP starter function
 * - run 'npm install durable-functions' from the wwwroot folder of your
 *   function app in Kudu
 */

import axios from "axios";
import { AzureFunction, Context } from "@azure/functions"
import { CatFactsResponse, ActivityOutput } from "../Models/Models";

const activityFunction: AzureFunction = async function (context: Context): Promise<ActivityOutput> {
    // Using axios to call an external HTTP resource
    try {
        const response = await axios.get<CatFactsResponse>("https://cat-fact.herokuapp.com/facts/random");
        return {
            sillyFacts: response.data.text,
        };
    } catch (httpError) {
        context.log("Failure calling public API.", httpError);
        return null;
    }
};

export default activityFunction;
