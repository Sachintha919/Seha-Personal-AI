const clean = (value) => String(value || '').trim().replace(/[\n\r]+/g, ' ').replace(/[.!?]+$/g, '').slice(0, 60);

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return clean(match[1]);
  }
  return null;
}

export function createProfile({ id, displayName }) {
  const name = clean(displayName) || 'Friend';
  return {
    whatsappId: id,
    whatsappName: name,
    name,
    age: null,
    location: null,
    welcomeSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function extractProfileUpdates(message, currentProfile) {
  const text = String(message || '').trim();
  if (!text) return {};
  const updates = {};

  const name = firstMatch(text, [
    /(?:මගේ නම|මගෙ නම|මට කියන්නේ)\s*[:：]?\s*([\p{L}][\p{L}\s.'-]{1,45})/u,
    /\bmy name is\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,3})(?=[.!?,]|\s+(?:and|i am|i'm|im|i live|from)\b|$)/i,
    /\bcall me\s+([a-z][a-z'-]*(?:\s+[a-z][a-z'-]*){0,3})(?=[.!?,]|$)/i
  ]);
  if (name && name.length >= 2 && name !== currentProfile.name) updates.name = name;

  let ageMatch = text.match(/(?:මට වයස|මගේ වයස|මගෙ වයස)\s*(\d{1,3})/u);
  if (!ageMatch) ageMatch = text.match(/\b(?:i am|i'm|im)\s*(\d{1,3})\s*(?:years? old|yrs? old)?\b/i);
  if (ageMatch) {
    const age = Number(ageMatch[1]);
    if (age >= 1 && age <= 110 && age !== currentProfile.age) updates.age = age;
  }

  const location = firstMatch(text, [
    /(?:මම ඉන්නේ|මම ඉන්නෙ|මම ජීවත් වෙන්නේ|මම ජීවත් වෙන්නෙ)\s*([\p{L}][\p{L}\s,.'-]{1,55})/u,
    /\bi live in\s+([a-z][a-z ,.'-]{1,55})/i,
    /\bi am from\s+([a-z][a-z ,.'-]{1,55})/i,
    /\bi'm from\s+([a-z][a-z ,.'-]{1,55})/i
  ]);
  if (location && location !== currentProfile.location) updates.location = location;
  return updates;
}

export function profilePrompt(profile) {
  const parts = [];
  if (profile?.name) parts.push(`User's name: ${profile.name}`);
  if (profile?.age) parts.push(`User's age: ${profile.age}`);
  if (profile?.location) parts.push(`User's location/from: ${profile.location}`);
  return parts.length ? `Relevant user profile (use only when useful): ${parts.join('; ')}.` : '';
}
