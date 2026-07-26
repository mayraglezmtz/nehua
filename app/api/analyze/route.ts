import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analysisService } from '@/lib/analysis/analysis-service'
import { detectFramework } from '@/lib/github'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { repository } = body

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository data is required' },
        { status: 400 }
      )
    }

    console.log(`Starting analysis for repository: ${repository.full_name}`)

    // First, detect frameworks
    const languages = await fetch(repository.languages_url, {
      headers: {
        'Authorization': `token ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }).then(res => res.json()).catch(() => ({}))

    const framework = await detectFramework(
      languages,
      session.accessToken,
      repository.full_name.split('/')[0],
      repository.name
    )

    if (!framework) {
      return NextResponse.json(
        { error: 'No supported framework detected in this repository' },
        { status: 400 }
      )
    }

    const frameworks = [framework]

    // Perform analysis
    const analysisResult = await analysisService.analyzeRepository(
      repository,
      frameworks,
      session.accessToken
    )

    return NextResponse.json({
      success: true,
      data: analysisResult
    })

  } catch (error) {
    console.error('Analysis API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'Analysis API - Use POST to analyze a repository' },
    { status: 200 }
  )
}