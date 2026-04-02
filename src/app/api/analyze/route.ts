import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

async function fetchImageAsBase64(url: string) {
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
  } catch (e) {
    console.error(`Failed to fetch image ${url}`, e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { channelTitle, channelDescription, avatarUrl, bannerUrl, videoThumbnails } = data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Returning mock analysis.");
      return NextResponse.json({
        primary_colors: ["#ea4335", "#ffffff", "#202124"],
        aesthetic: "Modern Clean Tech",
        image_prompt: "Cinematic portrait poster of a modern tech creator, high quality, neon highlights, depth of field, 8k resolution, photorealistic"
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Prepare contents
    const imagePromises = [];
    if (avatarUrl) imagePromises.push(fetchImageAsBase64(avatarUrl));
    if (bannerUrl) imagePromises.push(fetchImageAsBase64(bannerUrl));
    if (videoThumbnails && Array.isArray(videoThumbnails)) {
      videoThumbnails.slice(0, 3).forEach(url => imagePromises.push(fetchImageAsBase64(url)));
    }

    const resolvedImages = await Promise.all(imagePromises);
    const validImages = resolvedImages.filter(Boolean) as { inlineData: { data: string; mimeType: string; }; }[];

    const promptText = `
      You are a branding expert and prompt engineer. Analyze the provided images (avatar, banner, video thumbnails) and text for this YouTube channel.
      Channel Title: ${channelTitle || 'N/A'}
      Channel Description: ${channelDescription || 'N/A'}
      
      Extract the following information:
      1. 'primary_colors': A list of up to 3 hex color codes representing the channel's main brand colors.
      2. 'aesthetic': A short 2-3 word phrase describing the visual style (e.g., "Neon Retro Gaming", "Clean Tech Minimalist").
      3. 'image_prompt': A highly detailed, well-crafted Stable Diffusion text prompt for generating a 2:3 aspect ratio cinematic poster combining the channel's topic and aesthetic. DO NOT include any references to aspect ratio or resolution within the prompt text itself, just describe the visual composition in detail.
    `;

    const contents = [
      promptText,
      ...validImages
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: contents,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || '';
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      // Falback if it didn't return valid JSON
      console.error("Gemini did not return valid JSON:", resultText);
      return NextResponse.json({ error: 'Failed to parse Gemini output' }, { status: 500 });
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error('Error analyzing data with Gemini:', error);
    return NextResponse.json({ error: 'Failed to analyze channel data' }, { status: 500 });
  }
}
