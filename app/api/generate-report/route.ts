import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reportGenerator } from '@/lib/report-generator'

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
    const { analysisResult, format = 'json' } = body

    if (!analysisResult) {
      return NextResponse.json(
        { error: 'Analysis result is required' },
        { status: 400 }
      )
    }

    console.log(`Generating report in ${format} format for: ${analysisResult.repository.name}`)

    // Generate the comprehensive report
    const report = await reportGenerator.generateReport(analysisResult)

    let responseData: any
    let contentType: string
    let filename: string

    switch (format.toLowerCase()) {
      case 'markdown':
      case 'md':
        const markdown = await reportGenerator.exportToMarkdown(report)
        responseData = { content: markdown, report }
        contentType = 'text/markdown'
        filename = `${analysisResult.repository.name}-architecture-report.md`
        break

      case 'pdf':
        const pdfBlob = await reportGenerator.exportToPDF(report)
        // For demo purposes, we'll return the markdown content
        // In production, you'd return the actual PDF blob
        const pdfContent = await reportGenerator.exportToMarkdown(report)
        responseData = { content: pdfContent, report, format: 'pdf' }
        contentType = 'application/pdf'
        filename = `${analysisResult.repository.name}-architecture-report.pdf`
        break

      case 'json':
      default:
        const json = await reportGenerator.exportToJSON(report)
        responseData = { content: json, report }
        contentType = 'application/json'
        filename = `${analysisResult.repository.name}-architecture-report.json`
        break
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      metadata: {
        format,
        contentType,
        filename,
        generatedAt: new Date().toISOString(),
        reportSize: responseData.content.length
      }
    })

  } catch (error) {
    console.error('Report generation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Report generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Architecture Report Generation API',
    formats: ['json', 'markdown', 'pdf'],
    usage: 'POST with analysisResult and optional format parameter'
  })
}