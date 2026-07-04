/**
 * Safe JSON parser with auto-repair capability for AI-generated payloads.
 * Fixes common formatting issues like unescaped newlines inside JSON string properties.
 */
export function safeParseJson<T = any>(str: string): T | null {
  if (!str) return null;

  // Remove markdown formatting block markers
  let cleaned = str.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (firstError) {
    console.warn('[JSON Parser] Standard parse failed, attempting auto-repair...', firstError);

    try {
      // Repair unescaped newlines inside string values
      let repaired = '';
      let inString = false;
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        const prevChar = i > 0 ? cleaned[i - 1] : '';

        // Check if this is an unescaped double quote
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
        }

        // Replace literal newlines with escaped newline tokens if we are inside a string
        if (inString && (char === '\n' || char === '\r')) {
          repaired += '\\n';
        } else {
          repaired += char;
        }
      }

      return JSON.parse(repaired) as T;
    } catch (repairError) {
      console.error('[JSON Parser] Repair failed, returning null.', repairError);
      return null;
    }
  }
}
