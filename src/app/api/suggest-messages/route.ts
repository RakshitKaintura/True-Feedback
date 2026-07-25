import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    let promptContext = "";
    let mode = "suggest"; // "suggest", "polish", "templates"
    let rawMessage = "";
    
    try {
      const body = await req.json();
      promptContext = body.promptContext || "";
      if (body.mode) mode = body.mode;
      if (body.rawMessage) rawMessage = body.rawMessage;
    } catch (e) {
      // Ignored: backwards compatibility for requests without body
    }

    let prompt = "";

    if (mode === "polish") {
      prompt = `You are an AI assistant helping users refine anonymous feedback. The user's feedback project context is: "${promptContext}". The user has drafted the following rough feedback: "${rawMessage}". Rewrite this feedback so that it is constructive, polite, well-articulated, and helpful. Keep it concise. Return ONLY the polished feedback text.`;
    } else if (mode === "templates") {
      prompt = `You are an AI assisting users in sending anonymous feedback. The user's prompt is: "${promptContext}". Create a list of three sentence starters or fill-in-the-blank templates a person might use to give structured, high-quality feedback to this prompt. The responses should be formatted as a single string separated by '||'. For example: 'One thing that stood out to me was ___, but you could improve ___||I really liked the way you ___||If I were to suggest one major change, it would be ___'. Ensure the templates are relevant to the prompt and guide the sender to give constructive feedback.`;
    } else {
      prompt = promptContext 
        ? `You are an AI assisting users in sending anonymous feedback. The user's prompt is: "${promptContext}". Create a list of three engaging responses or questions a person might anonymously send in reply to this prompt. The responses should be formatted as a single string separated by '||'. For example: 'Response 1||Response 2||Response 3'. Ensure the suggestions are relevant to the prompt, constructive, and foster good conversation.`
        : "Create a list of three open-ended and engaging questions formatted as a single string. Each question should be separated by '||'. These questions are for an anonymous social messaging platform, like Qooh.me, and should be suitable for a diverse audience. Avoid personal or sensitive topics, focusing instead on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'What's a hobby you've recently started?||If you could have dinner with any historical figure, who would it be?||What's a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and contribute to a positive and welcoming conversational environment.";
    }

    const result = streamText({
      model: google('gemini-3.1-flash-lite'),
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json(
      { message: 'Failed to generate suggestions', success: false },
      { status: 500 }
    );
  }
}