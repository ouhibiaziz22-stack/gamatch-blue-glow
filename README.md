## Gamatech Frontend

### AI Chatbot (ChatGPT-style) setup

The home-page bot can now use OpenAI through a local backend endpoint (`/api/chat`).

1. Create a `.env` file in the project root and copy values from `.env.example`.
2. Set a valid `OPENAI_API_KEY`.
3. Run backend API in terminal 1:
   - `npm run chat-api`
4. Run frontend in terminal 2:
   - `npm run dev`

The Vite dev server proxies `/api/*` to `http://localhost:8787`.

If the API is unavailable, the bot automatically switches to fallback replies.
