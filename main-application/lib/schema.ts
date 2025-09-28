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

medical condition
fitness activity

personal goal
professional goal
challenge

social connection

*/

// Color mapping for concept categories
export const CONCEPT_CATEGORY_COLORS = {
  // Personal Identity (Blue tones)
  'demographic': '#3b82f6', // blue-500
  'personality trait': '#60a5fa', // blue-400
  'core value': '#1d4ed8', // blue-700
  
  // Interests & Preferences (Green tones)
  'interest': '#10b981', // emerald-500
  'hobby': '#34d399', // emerald-400
  'media preference': '#059669', // emerald-600
  'food preference': '#6ee7b7', // emerald-300
  
  // Health & Fitness (Red/Orange tones)
  'medical condition': '#ef4444', // red-500
  'fitness activity': '#f97316', // orange-500
  
  // Goals & Challenges (Purple tones)
  'personal goal': '#8b5cf6', // violet-500
  'professional goal': '#a855f7', // purple-500
  'challenge': '#7c3aed', // violet-600
  
  // Social (Teal tones)
  'social connection': '#14b8a6', // teal-500
} as const;

// Helper function to get category color
export const getCategoryColor = (category: string): string => {
  return CONCEPT_CATEGORY_COLORS[category as keyof typeof CONCEPT_CATEGORY_COLORS] || '#6b7280'; // gray-500 as fallback
};

// Helper function to get all categories with their colors
export const getCategoryColorMapping = () => {
  return Object.entries(CONCEPT_CATEGORY_COLORS).map(([category, color]) => ({
    category,
    color,
    group: getCategoryGroup(category)
  }));
};

// Helper function to group categories
export const getCategoryGroup = (category: string): string => {
  const groups = {
    'Personal Identity': ['demographic', 'personality trait', 'core value'],
    'Interests & Preferences': ['interest', 'hobby', 'media preference', 'food preference'],
    'Health & Fitness': ['medical condition', 'fitness activity'],
    'Goals & Challenges': ['personal goal', 'professional goal', 'challenge'],
    'Social': ['social connection']
  };
  
  for (const [groupName, categories] of Object.entries(groups)) {
    if (categories.includes(category)) {
      return groupName;
    }
  }
  return 'Other';
};