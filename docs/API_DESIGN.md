# API Design

## Endpoints

### POST /api/ai/suggest

The only API endpoint. Proxies requests to OpenRouter server-side.

**Request:**
```json
{
  "prompt": "string (required)",
  "type": "suggest | review | goal (default: suggest)"
}
```

**Response:**
```json
{
  "content": "string (response text from AI model)"
}
```

**Error Response:**
```json
{
  "error": "string"
}
```

### Type-Specific Behavior

| Type | System Prompt | Temperature | Max Tokens |
|------|--------------|-------------|------------|
| `suggest` | Task suggestion coach | 0.3 | 500 |
| `review` | Period review analyst | 0.5 | 1000 |
| `goal` | Goal planning expert | 0.4 | 1200 |

**Headers:** Standard JSON, with OpenRouter auth header set server-side.

## Client-Side Services

All in `src/services/openrouter.ts`:

| Function | Calls | Returns |
|----------|-------|---------|
| `getSuggestion(prompt)` | POST /api/ai/suggest (type=suggest) | Raw response string (JSON parsed by caller) |
| `generatePeriodReview(prompt)` | POST /api/ai/suggest (type=review) | `{ summary, highlights, challenges, focusForNext }` |
| `generateGoalPlan(title, description?)` | POST /api/ai/suggest (type=goal) | `GoalSuggestion` object |

## Future Endpoints

- `POST /api/ai/analyze` — Analyze task patterns, suggest scheduling improvements
- `GET /api/health` — Health check for the API route
