import os

files = [
    'src/routes/ai.ts',
    'src/routes/logs.ts',
    'src/routes/scanner.ts',
    'src/middlewares/liveThreatInterceptor.ts'
]

helper = '''
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function fetchGroq(messages: any[], jsonFormat = false): Promise<any> {
  const body: any = { model: AI_MODEL, messages, stream: false };
  if (jsonFormat) body.response_format = { type: "json_object" };
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    let errText = "";
    try { errText = await response.text(); } catch(e) {}
    throw new Error(`Groq API Error ${response.status}: ${errText}`);
  }
  return response.json();
}

async function fetchGroqStream(messages: any[]): Promise<any> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({ model: AI_MODEL, messages, stream: true })
  });
  if (!response.ok) {
    let errText = "";
    try { errText = await response.text(); } catch(e) {}
    throw new Error(`Groq API Error ${response.status}: ${errText}`);
  }
  return response.body;
}
'''

for filepath in files:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'groq-sdk' not in content:
        continue

    content = content.replace('import Groq from "groq-sdk";\n', '')
    content = content.replace('const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });\n', '')
    content = content.replace('const AI_MODEL = "llama3-8b-8192";', 'const AI_MODEL = "llama3-8b-8192";' + helper)

    if filepath.endswith('ai.ts'):
        content = content.replace('const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [', 'const messages = [')
        content = content.replace('''    const stream = await groq.chat.completions.create({
      model: AI_MODEL,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\\n\\n`);
      }
    }''', '''    const streamBody = await fetchGroqStream(messages);
    const reader = streamBody.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split('\\n');
      for (const line of lines) {
        if (!line.trim().startsWith("data: ")) continue;
        const dataStr = line.replace("data: ", "").trim();
        if (dataStr === "[DONE]") break;
        try {
          const chunk = JSON.parse(dataStr);
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\\n\\n`);
          }
        } catch (e) {}
      }
    }''')
        content = content.replace('''    const stream = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizeForLlm(String(input).trim()) },
      ],
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        fullResponse += text;
        sendEvent({ type: "chunk", content: text });
      }
    }''', '''    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizeForLlm(String(input).trim()) },
    ];
    const streamBody = await fetchGroqStream(messages);
    const reader = streamBody.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split('\\n');
      for (const line of lines) {
        if (!line.trim().startsWith("data: ")) continue;
        const dataStr = line.replace("data: ", "").trim();
        if (dataStr === "[DONE]") break;
        try {
          const chunk = JSON.parse(dataStr);
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            fullResponse += text;
            sendEvent({ type: "chunk", content: text });
          }
        } catch (e) {}
      }
    }''')
        content = content.replace('''    const response = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizeForLlm(String(email).trim()) },
      ],
      response_format: { type: "json_object" },
      stream: false,
    });''', '''    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizeForLlm(String(email).trim()) },
    ];
    const response = await fetchGroq(messages, true);''')


    if filepath.endswith('logs.ts'):
        content = content.replace('const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [', 'const messages = [')
        content = content.replace('''    const response = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: logContent },
      ],
      response_format: { type: "json_object" },
      stream: false,
    });''', '''    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: logContent },
    ];
    const response = await fetchGroq(messages, true);''')
        content = content.replace('''      const stream = await groq.chat.completions.create({
        model: AI_MODEL,
        messages,
        stream: true,
      });

      let buffer = "";

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        buffer += text;''', '''      const streamBody = await fetchGroqStream(messages);
      const reader = streamBody.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decoded = decoder.decode(value, { stream: true });
        
        const lines = decoded.split('\\n');
        for (const line of lines) {
          if (!line.trim().startsWith("data: ")) continue;
          const dataStr = line.replace("data: ", "").trim();
          if (dataStr === "[DONE]") break;
          try {
            const chunk = JSON.parse(dataStr);
            const text = chunk.choices[0]?.delta?.content || "";
            buffer += text;
          } catch (e) {}
        }''')
        
    if filepath.endswith('scanner.ts'):
        content = content.replace('''        const response = await groq.chat.completions.create({
          model: AI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `File: ${file.path}\n\nContent:\n${file.content}` }
          ],
          response_format: { type: "json_object" },
          stream: false,
        });''', '''        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: `File: ${file.path}\n\nContent:\n${file.content}` }
        ];
        const response = await fetchGroq(messages, true);''')
        
    if filepath.endswith('liveThreatInterceptor.ts'):
        content = content.replace('''      const response = await groq.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: requestString },
        ],
        response_format: { type: "json_object" },
        stream: false,
      });''', '''      const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: requestString },
      ];
      const response = await fetchGroq(messages, true);''')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
