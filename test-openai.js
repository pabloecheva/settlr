const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello, can you confirm you are working?" }
      ],
      model: "gpt-4.1",
    });

    console.log("API Response:", completion.choices[0]?.message?.content);
  } catch (error) {
    console.error("Error testing OpenAI API:", error);
  }
}

testOpenAI(); 