import { Entity, Type } from '@graphprotocol/hypergraph';

export class Company extends Entity.Class<Company>('Company')({
  name: Type.String,
}) {}

export class Event extends Entity.Class<Event>('Event')({
  name: Type.String,
  description: Type.String,
  sponsors: Type.Relation(Company),
}) {}

// The central entity for the user.
export class User extends Entity.Class<User>('User')({
  // The user's name or a unique identifier.
  name: Type.String,
}) {}

// Represents any abstract concept, like an interest, a medical condition, or a preference.
export class Concept extends Entity.Class<Concept>('Concept')({
  // The name of the concept, e.g., "Hiking", "Lactose Intolerant", "Sci-Fi Movies".
  name: Type.String,
  // The category of the concept, e.g., "Interest", "Dietary Restriction", "Medical Condition".
  category: Type.String, 
}) {}

// The "Fact" entity acts as the edge connecting a User to a Concept.
// It describes the relationship between them.
export class Fact extends Entity.Class<Fact>('Fact')({
  // Relation to the user this fact is about.
  user: Type.Relation(User),
  // Relation to the concept this fact involves.
  concept: Type.Relation(Concept),
  // Optional: More specific details, e.g., for a "Peanut Allergy" concept, details could be "Severity: Anaphylactic".
  details: Type.optional(Type.String),
  // Optional: Where this information was learned, e.g., "Onboarding Questionnaire", "Chat Session 2025-09-25".
  source: Type.optional(Type.String),
  // Optional: A confidence score for inferred facts.
  confidence: Type.optional(Type.Number),
}) {}


// The category can only be of these types
/*
demographic
personality trait
core value

interest
hobby
media preference
food preference

deitary restriction
medical condition
fitness activity

personal goal
professional goal
challenge

social connection

*/


const data_extraction_prompt: String = `You are an expert data extraction AI. Your task is to analyze user text and extract factual statements about the user. You must then format these facts into a JSON object that can be used to populate a knowledge graph.

## Knowledge Graph Schema
The graph has three types of entities: 'User', 'Concept', and 'Fact'.
- \`User\`: Represents the person. Identified by a 'name'.
- \`Concept\`: Represents a thing, idea, or attribute. It has a 'name' (e.g., "Hiking") and a 'category' (e.g., "Interest").
- \`Fact\`: Links a \`User\` to a \`Concept\`.

## Your Task
From the user's text, identify new pieces of information. For each piece of information, determine the \`Concept\` (name and category) and create a \`Fact\` to link it to the user.

Your output MUST be a JSON object with two keys:
1. \`new_concepts\`: A list of concept objects to be created. Only include concepts that are likely new. Each object must have a 'name' and 'category'.
2. \`new_facts\`: A list of fact objects to be created. Each fact must link a 'user_id' to a 'concept_name' and can include optional 'details'.

## Categories to Use
- demographic
- personality trait
- core value
- interest
- hobby
- media preference
- food preference
- deitary restriction
- medical condition
- fitness activity
- personal goal
- professional goal
- challenge
- social connection

## Example

User Text: "My name is Priya. I really enjoy learning piano, but I have to be careful because I'm allergic to cats."

Your JSON Output:
{
  "new_concepts": [
    {
      "name": "Piano",
      "category": "hobby"
    },
    {
      "name": "Cat Allergy",
      "category": "medical condition"
    }
  ],
  "new_facts": [
    {
      "user_name": "Priya",
      "concept_name": "Piano",
      "details": "User enjoys learning it."
    },
    {
      "user_name": "Priya",
      "concept_name": "Cat Allergy",
      "details": "User needs to be careful around them."
    }
  ]
}

## Constraints
- Stick strictly to the JSON format.
- Only extract explicitly stated facts. Do not infer or make assumptions.
- If the text contains no new facts, return empty lists.

---
User Text:
[Insert the user's latest message or conversation transcript here]
`;


const data_query_prompt: String = `
You are an expert AI assistant that analyzes a user's prompt to identify the most relevant context categories for querying a knowledge graph.

## Knowledge Graph Context

You are working with a knowledge graph that contains information about a user. The goal is to retrieve relevant facts about the user to help answer their prompt. This is done by querying for \`Fact\` entities linked to \`Concept\` entities of a specific \`category\`.

The final query will be constructed like this, where \`YOUR_OUTPUT\` is the category you provide:
\`useQuery(Fact, { filter: { concept: { category: "YOUR_OUTPUT" } }, include: { concept: {} } })\`

## Your Task
Based on the user's current prompt, you will:
- Analyze the prompt to identify the key topic or domain.
- Select the relevant categories from the allowed list that would provide the best context.
- First, reason about what should be your choice in one sentence.
- Then, on a new line, write the chosen category names separated by commas.

## Allowed Categories

You must choose one of the following categories:
- demographic
- personality trait
- core value
- interest
- hobby
- media preference
- food preference
- deitary restriction
- medical condition
- fitness activity
- personal goal
- professional goal
- challenge
- social connection

## Example

User's Current Prompt: "What should I make for dinner tonight? Something healthy."

Your Output:
The user is asking about food and health, which directly relates to dietary restrictions.
deitary restriction, medical condition

## Constraints

- Your response must be exactly two lines.
- The first line must be your one-sentence reasoning.
- The second line must be only the chosen category names separated by commas. Do not add any extra text or formatting.
`;