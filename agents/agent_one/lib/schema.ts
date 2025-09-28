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