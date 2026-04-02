import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { image_prompt } = await req.json();

    if (!image_prompt) {
      return NextResponse.json({ error: 'image_prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Returning mock image.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        imageUrl: "https://placehold.co/832x1216/202124/ea4335.png?text=Mock+Poster"
      });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    console.log("Generating image natively with Nano Banana Pro prompt:", image_prompt);

    // Using Google Imagen 4
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: image_prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '3:4', // Best portrait match currently
        outputMimeType: 'image/jpeg',
      }
    });

    const base64Data = response.generatedImages?.[0]?.image?.imageBytes;

    if (base64Data) {
      // Reconstruct as a functional URL for the NextImage component
      const imageUrl = `data:image/jpeg;base64,${base64Data}`;
      return NextResponse.json({ imageUrl });
    } else {
      throw new Error("Invalid output from Google Image API");
    }
  } catch (error: any) {
    console.error('Error generating image via Google:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
