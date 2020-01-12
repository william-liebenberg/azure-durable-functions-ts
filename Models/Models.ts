export interface WorkflowRequest {
    name: string;
    batchSize: number
}

export interface ActivityInput {
    name: string;
    id: number;
}

export interface ActivityOutput {
    sillyName: string;
}