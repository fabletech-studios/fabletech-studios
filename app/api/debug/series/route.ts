import { NextResponse } from 'next/server';
import { getAllSeriesFirebase } from '@/lib/firebase/content-service';

export async function GET() {
  try {
    const series = await getAllSeriesFirebase();
    
    // Check banner URLs
    const seriesWithBannerInfo = series.map(s => ({
      id: s.id,
      title: s.title,
      bannerUrl: s.bannerUrl,
      bannerImage: s.bannerImage,
      hasBanner: !!s.bannerUrl || !!s.bannerImage,
      bannerType: s.bannerUrl?.startsWith('https://storage.googleapis.com') ? 'firebase' : 'local'
    }));
    
    return NextResponse.json({
      success: true,
      series: seriesWithBannerInfo,
      count: series.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}