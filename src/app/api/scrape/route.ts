import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const youtube = google.youtube('v3');

// Helper to extract channel ID or username from URL
function extractChannelResource(url: string) {
  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    
    // e.g. youtube.com/channel/UC...
    if (pathSegments[0] === 'channel' && pathSegments[1]) {
      return { id: pathSegments[1] };
    }
    // e.g. youtube.com/c/username or youtube.com/@username
    if (pathSegments[0] === 'c' && pathSegments[1]) {
      return { forUsername: pathSegments[1] };
    }
    if (pathSegments[0].startsWith('@')) {
      return { forHandle: pathSegments[0] };
    }
    // Handle older user URLs
    if (pathSegments[0] === 'user' && pathSegments[1]) {
      return { forUsername: pathSegments[1] };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      // Return mock data for local development if no key is provided
      console.warn("YOUTUBE_API_KEY not found. Returning mock data.");
      return NextResponse.json({
        id: "MOCK_ID",
        channelTitle: "Mock Channel Name",
        channelDescription: "This is a mock channel description used because the YouTube API key is missing.",
        avatarUrl: "https://placehold.co/400x400/png?text=Avatar",
        bannerUrl: "https://placehold.co/1080x175/png?text=Banner",
        customUrl: "@mockchannel",
        videoThumbnails: [
          "https://placehold.co/1280x720/png?text=Video+1",
          "https://placehold.co/1280x720/png?text=Video+2",
          "https://placehold.co/1280x720/png?text=Video+3"
        ]
      });
    }

    const resource = extractChannelResource(url);
    if (!resource) {
      return NextResponse.json({ error: 'Invalid YouTube Channel URL' }, { status: 400 });
    }

    const params: any = {
      key: apiKey,
      part: ['snippet', 'brandingSettings', 'contentDetails'],
    };

    if (resource.id) params.id = [resource.id];
    else if (resource.forUsername) params.forUsername = resource.forUsername;
    else if (resource.forHandle) params.forHandle = resource.forHandle;

    const channelRes = await youtube.channels.list(params);
    const channel = channelRes.data.items?.[0];

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    let videoThumbnails: string[] = [];

    if (uploadsPlaylistId) {
      const playlistRes = await youtube.playlistItems.list({
        key: apiKey,
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults: 5,
      });

      videoThumbnails = (playlistRes.data.items || [])
        .map(item => item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url)
        .filter((url): url is string => !!url);
    }

    return NextResponse.json({
      id: channel.id,
      channelTitle: channel.snippet?.title,
      channelDescription: channel.snippet?.description,
      avatarUrl: channel.snippet?.thumbnails?.high?.url,
      bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl,
      customUrl: channel.snippet?.customUrl,
      videoThumbnails
    });
  } catch (error: any) {
    console.error('Error fetching YouTube data:', error);
    return NextResponse.json({ error: 'Failed to fetch YouTube data' }, { status: 500 });
  }
}
