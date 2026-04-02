import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(req: NextRequest) {
  try {
    const { image_prompt } = await req.json();

    if (!image_prompt) {
      return NextResponse.json({ error: 'image_prompt is required' }, { status: 400 });
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      console.warn("REPLICATE_API_TOKEN not found. Returning mock image.");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate generation time
      return NextResponse.json({
        imageUrl: "https://placehold.co/832x1216/202124/ea4335.png?text=Mock+Poster"
      });
    }

    const replicate = new Replicate({
      auth: apiToken,
    });

    console.log("Generating image with prompt:", image_prompt);

    // Using SDXL on Replicate
    const output: any = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: image_prompt,
          width: 832,   // SDXL supported width suitable for portrait
          height: 1216, // SDXL supported height suitable for ~2:3 portrait aspect ratio
          refine: "expert_ensemble_refiner",
          apply_watermark: false,
          num_outputs: 1
        }
      }
    );

    if (output && Array.isArray(output) && output.length > 0) {
      return NextResponse.json({ imageUrl: output[0] });
    } else {
      throw new Error("Invalid output from Replicate API");
    }
  } catch (error: any) {
    console.error('Error generating image via Replicate:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
