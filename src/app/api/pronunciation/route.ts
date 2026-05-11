import { NextRequest, NextResponse } from 'next/server';

const AZURE_KEY = process.env.AZURE_SPEECH_API_KEY!;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File | null;
    const referenceText = formData.get('referenceText') as string | null;

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: 'Missing audio or referenceText' }, { status: 400 });
    }

    if (!AZURE_KEY || !AZURE_REGION) {
      return NextResponse.json({ error: 'Azure credentials not configured' }, { status: 500 });
    }

    const audioBuffer = await audioFile.arrayBuffer();
    console.log('[Pronunciation] Audio size (bytes):', audioBuffer.byteLength);
    console.log('[Pronunciation] Reference text:', referenceText);

    // Build Pronunciation Assessment config with Phoneme granularity & IPA standard
    const pronunciationConfig = JSON.stringify({
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      PhonemeAlphabet: 'IPA', // Crucial: Transforms output to clean IPA symbols!
      Dimension: 'Comprehensive',
      EnableMiscue: true,
    });
    const base64Config = Buffer.from(pronunciationConfig).toString('base64');
    console.log('[Pronunciation] Config base64:', base64Config);

    const endpoint = `https://${AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`;
    console.log('[Pronunciation] Calling endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': base64Config,
        'Accept': 'application/json',
      },
      body: audioBuffer,
    });

    const responseText = await response.text();
    console.log('[Pronunciation] Azure HTTP status:', response.status);
    console.log('[Pronunciation] Azure raw response:', responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Azure API error (${response.status}): ${responseText}` },
        { status: response.status }
      );
    }

    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON from Azure: ' + responseText }, { status: 502 });
    }

    // Check recognition status
    if (result.RecognitionStatus && result.RecognitionStatus !== 'Success') {
      console.warn('[Pronunciation] Non-success status:', result.RecognitionStatus);
      return NextResponse.json(
        { error: `Azure Recognition failed: ${result.RecognitionStatus}`, raw: result },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Pronunciation] Route error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
