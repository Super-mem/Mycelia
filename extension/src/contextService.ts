// Context service for retrieving context related to input strings
// This module handles the logic for getting contextual information
import { queryData } from "./dataExtraction";


export async function getContext(inputString: string): Promise<string> {
    // TODO: This function should make an API call or retrieve context based on the input
    // return new Promise((resolve) => {
    //     setTimeout(() => {
    //         resolve(`\n Context for: "${inputString}"`);
    //     }, 1000);
    // });

    //TODO: This function currently only makes API call to llm and returns the categories
    const categories = await queryData(inputString);

    return `\n Context for: "${categories}"`
}

export function updateKnowledgeGraph(query: string): void {
    // Run asynchronously without blocking
    setTimeout(() => {
        console.log(`Knowledge graph updated for query: "${query}"`);
        //Incentivize after updating the graph
        incentivize();
        // TODO: Implement actual knowledge graph update logic
    }, 5000);
    
}

export function incentivize() {
    //TODO: Implement a scoring function based on how much context given and how much used
    console.log("incentivization done");
}
