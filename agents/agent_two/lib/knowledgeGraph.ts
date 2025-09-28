import { useCreateEntity } from '@graphprotocol/hypergraph-react';
import { Concept, Fact, User } from './schema';
import { getOrCreateUser } from './userManager';

// Simple HTTP client for Groq API - browser compatible
async function callGroqAPI(prompt: string): Promise<string> {
const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  
  if (!apiKey || apiKey === 'your-groq-api-key-here') {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'openai/gpt-oss-20b', // Using the model from your curl example
      temperature: 0.1, // Lower temperature for consistent JSON output
      max_completion_tokens: 4096,
      top_p: 1,
      stream: false, // Non-streaming for easier parsing
      reasoning_effort: 'medium',
      stop: null
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error details:', errorText);
    throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Full Groq API response:', data);
  
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from Groq API');
  }

  return content;
}

export interface ExtractedConcept {
  name: string;
  category: string;
}

export interface ExtractedFact {
  user_name: string;
  concept_name: string;
  details?: string;
}

export interface ExtractionResult {
  new_concepts: ExtractedConcept[];
  new_facts: ExtractedFact[];
}

export async function queryData(
  userPrompt: string,
) {
  const dataQueryPrompt = `You are an expert AI assistant that analyzes a user's prompt to identify the most relevant context categories for querying a knowledge graph.

## Knowledge Graph Context
You are working with a knowledge graph that contains information about a user. The goal is to retrieve relevant facts about the user to help answer their prompt. This is done by querying for \`Fact\` entities linked to \`Concept\` entities of a specific \`category\`.

The final query will be constructed like this, where \`YOUR_OUTPUT\` is the category (or categories) you provide:
\`useQuery(Fact, { filter: { concept: { category: "YOUR_OUTPUT" } }, include: { concept: {} } })\`

## Your Task
Based on the user's current prompt, you will:
- Analyze the prompt to identify the key topic or domain.
- Select one or more relevant categories from the allowed list that would provide the best context.
- First, reason about what should be your choice in one sentence.
- Then, on a new line, write the chosen category names separated by commas (if more than one is relevant).

## Allowed Categories
- demographic
- personality trait
- core value
- interest
- hobby
- media preference
- food preference
- medical condition
- fitness activity
- personal goal
- professional goal
- challenge
- social connection

## Examples

User's Current Prompt: "What should I make for dinner tonight? Something healthy."
Your Output:
The user is asking about food and health, which directly relates to dietary restrictions.
food preference, medical condition

User's Current Prompt: "I want to improve my coding skills to get a better job."
Your Output:
The user is talking about career growth, which combines a professional goal with a personal challenge of skill improvement.
professional goal, challenge

User's Current Prompt: "Do you know if I have any close friends mentioned in my profile?"
Your Output:
The user is asking about friendships, which relates to social connections.
social connection

User's Current Prompt: "I'm trying to run a marathon next year."
Your Output:
The user is discussing both an athletic activity and a personal goal.
fitness activity, personal goal

User's Current Prompt: "Can you recommend a movie I'll like?"
Your Output:
The user is asking for entertainment recommendations, which matches media preference.
media preference

## Constraints
- Your response must be exactly two lines.
- The first line must be your one-sentence reasoning.
- The second line must be only the chosen category names separated by commas. Do not add any extra text or formatting.

---
User's Current Prompt: ${userPrompt}
`;



  try {
    const llmResponse = await callGroqAPI(dataQueryPrompt);

    console.log('LLM Category Response:', llmResponse);

    const lines = llmResponse.trim().split('\n');
    const categoriesString = lines[1].trim();
    const categories = categoriesString.split(',').map(cat => cat.trim());

    console.log(categories);
    return categories;
  } catch(error) {
    console.error('Error querying LLM for categories:', error);

    return ['interest', 'hobby'];
  }
  
}

export interface KnowledgeGraphResult {
  success: boolean;
  message: string;
  facts: Array<{
    id: string;
    details?: string;
    source?: string;
    confidence?: number;
    concept: {
      id: string;
      name: string;
      category: string;
    };
  }>;
  categories: string[];
}


async function callLLM(text: string, prompt: string): Promise<string> {
  try {
    console.log('Calling Groq API with text:', text);
    
    // Use the HTTP client approach
    const response = await callGroqAPI(prompt);
    console.log(response);
    return response;

    
    
  } catch (error) {
    console.error('Error calling Groq API:', error);
    
    // Fallback to mock response in case of API error
    console.log('Falling back to mock response due to API error');
    const mockResponse = {
      new_concepts: [
        {
          name: "Sample Concept",
          category: "interest"
        }
      ],
      new_facts: [
        {
          user_name: "User",
          concept_name: "Sample Concept",
          details: "This is a fallback response due to API error"
        }
      ]
    };
    
    return JSON.stringify(mockResponse);
  }
}

export async function extractDataFromText(
  text: string,
  createConcept: ReturnType<typeof useCreateEntity<typeof Concept>>,
  createFact: ReturnType<typeof useCreateEntity<typeof Fact>>,
  createUser: ReturnType<typeof useCreateEntity<typeof User>>
): Promise<{ success: boolean; message: string; data?: ExtractionResult }> {
  try {
    // Get the data extraction prompt from schema
    const dataExtractionPrompt = `
You are an expert data extraction AI. Your task is to analyze user text and extract factual statements about the user. You must then format these facts into a JSON object that can be used to populate a knowledge graph.

## Knowledge Graph Schema
The graph has three types of entities: 'User', 'Concept', and 'Fact'.
- \`User\`: Represents the person. Identified by a 'name' (optional if not provided).
- \`Concept\`: Represents a thing, idea, or attribute. It has a 'name' (e.g., "Hiking") and a 'category' (e.g., "Interest").
- \`Fact\`: Links a user to a concept. Facts may include:
  - \`concept_name\` (required)
  - \`details\` (optional, describing the relationship)

## Your Task
From the user's text, identify new pieces of information. For each piece of information:
- Determine the \`Concept\` (name and category).
- Create a \`Fact\` linked to that concept.
- Only add concepts and facts if the statement is explicit and factual.
- Do NOT infer, generalize, or create vague concepts.
- If the text contains no new factual information, return empty lists.

## Output Format
Your output MUST be a JSON object with two keys:
1. \`new_concepts\`: A list of concept objects to be created. Each object must have a 'name' and 'category'.
2. \`new_facts\`: A list of fact objects to be created. Each fact must have at least \`concept_name\`, and may include \`details\` or \`user_name\`.

## Categories to Use
- demographic
- personality trait
- core value
- interest
- hobby
- media preference
- food preference
- medical condition
- fitness activity
- personal goal
- professional goal
- challenge
- social connection

## Examples

### Example 1
User Text: "My name is Priya. I really enjoy learning piano, but I have to be careful because I'm allergic to cats."
Output:
{
  "new_concepts": [
    { "name": "Piano", "category": "hobby" },
    { "name": "Cat Allergy", "category": "medical condition" }
  ],
  "new_facts": [
    { "concept_name": "Piano", "details": "User enjoys learning it." },
    { "concept_name": "Cat Allergy", "details": "User needs to be careful around them." }
  ]
}

### Example 2
User Text: "I want to become a data scientist."
Output:
{
  "new_concepts": [
    { "name": "Data Scientist", "category": "professional goal" }
  ],
  "new_facts": [
    { "concept_name": "Data Scientist", "details": "User wants to pursue this role." }
  ]
}

### Example 3
User Text: "I like hiking and painting."
Output:
{
  "new_concepts": [
    { "name": "Hiking", "category": "hobby" },
    { "name": "Painting", "category": "hobby" }
  ],
  "new_facts": [
    { "concept_name": "Hiking", "details": "User enjoys this activity." },
    { "concept_name": "Painting", "details": "User enjoys this activity." }
  ]
}

### Example 4
User Text: "Hello"
Output:
{
  "new_concepts": [],
  "new_facts": []
}

### Example 5
User Text: "I often feel anxious in social situations."
Output:
{
  "new_concepts": [
    { "name": "Anxiety", "category": "medical condition" }
  ],
  "new_facts": [
    { "concept_name": "Anxiety", "details": "User experiences it in social situations." }
  ]
}

## Constraints
- Stick strictly to the JSON format.
- Only include explicitly stated facts.
- Do not create vague or duplicate concepts.
- If nothing new is found, return empty lists.

---
User Text: ${text}
`;

    // Call LLM
    const llmResponse = await callLLM(text, dataExtractionPrompt);
    
    // Parse the JSON response
    let extractionResult: ExtractionResult;
    try {
      extractionResult = JSON.parse(llmResponse);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError);
      return {
        success: false,
        message: 'Failed to parse LLM response as JSON'
      };
    }

    // Validate the response structure
    if (!extractionResult.new_concepts || !extractionResult.new_facts) {
      return {
        success: false,
        message: 'Invalid response structure from LLM'
      };
    }

    // First, ensure we have a user (create if needed)
    let userId: string;
    const userName = extractionResult.new_facts.length > 0 ? extractionResult.new_facts[0].user_name : 'User';
    
    try {
      const { userId: foundUserId, isNewUser } = await getOrCreateUser(createUser, userName);
      userId = foundUserId;
      
      if (isNewUser) {
        console.log('Created new user on first login:', userId);
      } else {
        console.log('Using existing user from localStorage:', userId);
      }
    } catch (error) {
      console.error('Error getting/creating user:', error);
      return {
        success: false,
        message: 'Failed to get or create user'
      };
    }

    // Create concepts and store their IDs
    const conceptIds: Record<string, string> = {};
    
    for (const concept of extractionResult.new_concepts) {
      try {
        const createdConcept = await createConcept({
          name: concept.name,
          category: concept.category
        });
        conceptIds[concept.name] = createdConcept.id;
        console.log('Created concept:', concept.name, 'with ID:', createdConcept.id);
      } catch (error) {
        console.error('Error creating concept:', concept.name, error);
      }
    }

    // Create facts
    for (const fact of extractionResult.new_facts) {
      const conceptId = conceptIds[fact.concept_name];
      if (!conceptId) {
        console.warn('No concept ID found for:', fact.concept_name);
        continue;
      }

      try {
        const createdFact = await createFact({
          user: [userId],
          concept: [conceptId],
          details: fact.details,
          source: 'Text Input Extraction',
          confidence: 1.0
        });
        console.log('Created fact:', createdFact.id);
      } catch (error) {
        console.error('Error creating fact for concept:', fact.concept_name, error);
      }
    }

    return {
      success: true,
      message: `Successfully extracted and added ${extractionResult.new_concepts.length} concepts and ${extractionResult.new_facts.length} facts to your knowledge graph.`,
      data: extractionResult
    };

  } catch (error) {
    console.error('Error in data extraction:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
