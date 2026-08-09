import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { prisma } from "./prisma";

/**
 * Background task to triage a ticket using Groq.
 * Fails gracefully and silently if the AI call fails or times out.
 */
export async function triageTicket(ticketId: string, subject: string, description: string) {
  try {
    console.log(`[AI Triage] Starting background triage for ticket ${ticketId}...`);

    const aiCall = generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: `You are an expert AI support triage assistant. Analyze the following support ticket and generate the triage data in valid JSON format.
      
      You MUST respond ONLY with a JSON object exactly matching this schema, with no markdown formatting, no backticks, and no extra text.
      
      {
        "summary": "A concise 1-sentence summary of the ticket.",
        "category": "Billing" | "Technical Support" | "Feature Request" | "Account Management" | "Other",
        "priority": "LOW" | "NORMAL" | "HIGH" | "URGENT",
        "suggestedReply": "A professional, empathetic draft reply to the user from the support team."
      }

      Ticket Subject: ${subject}
      Ticket Description: ${description}`,
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI Triage timed out")), 8000)
    );

    // Will throw if it takes longer than 8 seconds
    const { text } = await Promise.race([aiCall, timeout]);
    
    // Parse the JSON manually
    const object = JSON.parse(text);

    console.log(`[AI Triage] Successfully generated triage data for ticket ${ticketId}`, object);

    // Update the ticket in the database
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        aiSummary: object.summary,
        aiCategory: object.category,
        aiSuggestedReply: object.suggestedReply,
        priority: object.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT", // Cast if necessary depending on Prisma enum
      },
    });

    console.log(`[AI Triage] Ticket ${ticketId} successfully updated with AI data.`);
  } catch (error) {
    // If the API key is missing, invalid, or the model hallucinates/times out,
    // we catch the error here. The ticket has already been saved to the DB normally,
    // so we just log the failure and let the ticket exist without AI enrichment.
    console.error(`[AI Triage] Failed to triage ticket ${ticketId}:`, error);
  }
}
