import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { componentExplanationService } from '@/lib/component-explanation'

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
    const { node, contextInfo } = body

    if (!node || !contextInfo) {
      return NextResponse.json(
        { error: 'Node and context information are required' },
        { status: 400 }
      )
    }

    console.log(`Generating explanation for component: ${node.label}`)

    // Generate component explanation using AI
    const explanation = await componentExplanationService.explainComponent(
      node,
      contextInfo
    )

    return NextResponse.json({
      success: true,
      data: explanation
    })

  } catch (error) {
    console.error('Component explanation API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Component explanation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'Component Explanation API - Use POST to explain a component' },
    { status: 200 }
  )
}