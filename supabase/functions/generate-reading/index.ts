import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log("Hello from generate-reading!")

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { level, words } = await req.json()
    
    if (!words || !Array.isArray(words) || words.length === 0) {
      throw new Error("Missing words array")
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error("OPENAI_API_KEY is not set in Supabase Secrets")
    }

    const wordList = words.join(', ')
    const prompt = `You are an expert English teacher. Write a coherent, engaging short paragraph (about 100-150 words) at the CEFR ${level} level.
You MUST naturally include ALL of the following words: ${wordList}.
Format the exact target words by wrapping them in [w] and [/w] tags in the text.
Do not change the base form of the target words if possible, but you can change tense/plurality if grammar requires it (in that case, wrap the modified word).

Respond ONLY with a JSON object in this exact format, with no markdown code blocks around it:
{
  "paragraph": "The generated text with [w]target[/w] words wrapped.",
  "blanks": ["target", "words", "in", "the", "order", "they", "appeared"]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // or gpt-4o or gpt-4o-mini depending on what the user wants, gpt-3.5-turbo is fast and cheap
        messages: [
          { role: 'system', content: 'You are a helpful assistant designed to output custom JSON formats.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    if (data.error) {
        throw new Error(data.error.message);
    }
    const content = data.choices[0].message.content
    
    // Parse the JSON. Sometimes ChatGPT surrounds it with ```json
    let parsed
    try {
      if (content.startsWith('```json')) {
        parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim())
      } else {
        parsed = JSON.parse(content.trim())
      }
    } catch(e) {
      console.log("Failed to parse JSON", content)
      throw new Error("ChatGPT returned invalid JSON")
    }

    // Return the response
    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  }
})
