import type Anthropic from '@anthropic-ai/sdk'
import {
  getAllAmenities,
  getAmenityById,
  updateAmenity,
  createAmenity,
  getAllStaff,
  createStaff,
  getBlackoutDates,
  addBlackoutDate,
  removeBlackoutDate,
  addAuditLog,
} from '@/lib/firebase/db'

let _anthropic: Anthropic | null = null
async function getAnthropicClient(): Promise<Anthropic> {
  if (!_anthropic) {
    const { default: AnthropicSDK } = await import('@anthropic-ai/sdk')
    _anthropic = new AnthropicSDK()
  }
  return _anthropic
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are the Configuration Agent for the Sanctuary HOA Amenity Booking System.
You help the property manager configure amenities, staff, and booking policies.

You have access to the following tools to make changes to the system:

When the user asks to change something, use the appropriate tool. Always confirm what you changed after making a change.

Current capabilities:
- List, create, update amenities (name, description, capacity, fees, deposits, calendar ID)
- Set cancellation policies per amenity (fullRefundHours, partialRefundHours, partialRefundPercent)
- Set approval rules per amenity (requiresApproval, autoApproveThreshold, approverStaffId, escalationHours)
- Set janitorial assignment mode per amenity ("rotation" or "manual")
- Set max advance booking window per amenity (maxAdvanceBookingDays)
- Manage blackout dates per amenity (add/remove, one-time or recurring)
- List, create, update staff records

Be concise and helpful. After making changes, summarize what was done.`

const tools: Anthropic.Tool[] = [
  {
    name: 'list_amenities',
    description: 'List all amenities with their current configuration',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'update_amenity',
    description: 'Update an amenity configuration. Only include fields you want to change.',
    input_schema: {
      type: 'object' as const,
      properties: {
        amenityId: { type: 'string', description: 'The amenity ID to update' },
        name: { type: 'string' },
        description: { type: 'string' },
        capacity: { type: 'number' },
        rentalFee: { type: 'number' },
        depositAmount: { type: 'number' },
        requiresApproval: { type: 'boolean' },
        autoApproveThreshold: { type: 'number', description: 'Auto-approve if guest count <= this. Set to null to always require approval.' },
        escalationHours: { type: 'number' },
        fullRefundHours: { type: 'number' },
        partialRefundHours: { type: 'number' },
        partialRefundPercent: { type: 'number' },
        maxAdvanceBookingDays: { type: 'number' },
        janitorialAssignment: { type: 'string', enum: ['rotation', 'manual'] },
      },
      required: ['amenityId'],
    },
  },
  {
    name: 'create_amenity',
    description: 'Create a new amenity',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        capacity: { type: 'number' },
        rentalFee: { type: 'number' },
        depositAmount: { type: 'number' },
      },
      required: ['name', 'capacity', 'rentalFee', 'depositAmount'],
    },
  },
  {
    name: 'list_staff',
    description: 'List all staff members',
    input_schema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'create_staff',
    description: 'Create a new staff member',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        role: { type: 'string', enum: ['PROPERTY_MANAGER', 'JANITORIAL'] },
      },
      required: ['name', 'email', 'role'],
    },
  },
  {
    name: 'add_blackout_date',
    description: 'Add a blackout date for an amenity',
    input_schema: {
      type: 'object' as const,
      properties: {
        amenityId: { type: 'string' },
        startDate: { type: 'string', description: 'ISO date string' },
        endDate: { type: 'string', description: 'ISO date string' },
        reason: { type: 'string' },
        recurring: { type: 'boolean', description: 'If true, recurs annually' },
      },
      required: ['amenityId', 'startDate', 'endDate'],
    },
  },
  {
    name: 'list_blackout_dates',
    description: 'List blackout dates for an amenity',
    input_schema: {
      type: 'object' as const,
      properties: {
        amenityId: { type: 'string' },
      },
      required: ['amenityId'],
    },
  },
  {
    name: 'remove_blackout_date',
    description: 'Remove a blackout date by ID',
    input_schema: {
      type: 'object' as const,
      properties: {
        amenityId: { type: 'string' },
        blackoutDateId: { type: 'string' },
      },
      required: ['amenityId', 'blackoutDateId'],
    },
  },
]

async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case 'list_amenities': {
      const amenities = await getAllAmenities()
      return JSON.stringify(
        amenities.map((a) => ({
          id: a.id,
          name: a.name,
          capacity: a.capacity,
          rentalFee: a.rentalFee,
          depositAmount: a.depositAmount,
          requiresApproval: a.requiresApproval,
          autoApproveThreshold: a.autoApproveThreshold,
          escalationHours: a.escalationHours,
          fullRefundHours: a.fullRefundHours,
          partialRefundHours: a.partialRefundHours,
          partialRefundPercent: a.partialRefundPercent,
          maxAdvanceBookingDays: a.maxAdvanceBookingDays,
          janitorialAssignment: a.janitorialAssignment,
        })),
        null,
        2,
      )
    }

    case 'update_amenity': {
      const { amenityId, ...updates } = input
      const data: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) data[key] = value
      }
      await updateAmenity(amenityId as string, data)
      const updated = await getAmenityById(amenityId as string)
      await addAuditLog(null, 'config-agent', 'AMENITY_UPDATED', {
        amenityId,
        updates: data,
      })
      return `Updated amenity "${updated?.name ?? amenityId}" successfully.`
    }

    case 'create_amenity': {
      const amenity = await createAmenity({
        name: input.name as string,
        description: (input.description as string) ?? null,
        capacity: input.capacity as number,
        rentalFee: input.rentalFee as number,
        depositAmount: input.depositAmount as number,
      })
      await addAuditLog(null, 'config-agent', 'AMENITY_CREATED', {
        amenityId: amenity.id,
        name: amenity.name,
      })
      return `Created amenity "${amenity.name}" (ID: ${amenity.id}).`
    }

    case 'list_staff': {
      const staff = await getAllStaff()
      return JSON.stringify(
        staff.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          role: s.role,
        })),
        null,
        2,
      )
    }

    case 'create_staff': {
      const staff = await createStaff({
        name: input.name as string,
        email: input.email as string,
        phone: (input.phone as string) ?? null,
        role: input.role as 'PROPERTY_MANAGER' | 'JANITORIAL',
      })
      await addAuditLog(null, 'config-agent', 'STAFF_CREATED', {
        staffId: staff.id,
        name: staff.name,
        role: staff.role,
      })
      return `Created staff member "${staff.name}" (${staff.role}).`
    }

    case 'add_blackout_date': {
      const blackout = await addBlackoutDate(input.amenityId as string, {
        startDate: new Date(input.startDate as string),
        endDate: new Date(input.endDate as string),
        reason: (input.reason as string) ?? null,
        recurring: (input.recurring as boolean) ?? false,
      })
      await addAuditLog(null, 'config-agent', 'BLACKOUT_DATE_ADDED', {
        amenityId: input.amenityId,
        blackoutDateId: blackout.id,
        startDate: input.startDate,
        endDate: input.endDate,
      })
      return `Added blackout date (${input.startDate} to ${input.endDate})${input.recurring ? ' (recurring annually)' : ''}.`
    }

    case 'list_blackout_dates': {
      const dates = await getBlackoutDates(input.amenityId as string)
      if (dates.length === 0) return 'No blackout dates configured for this amenity.'
      return JSON.stringify(
        dates.map((d) => ({
          id: d.id,
          startDate: d.startDate instanceof Date ? d.startDate.toISOString().split('T')[0] : String(d.startDate).split('T')[0],
          endDate: d.endDate instanceof Date ? d.endDate.toISOString().split('T')[0] : String(d.endDate).split('T')[0],
          reason: d.reason,
          recurring: d.recurring,
        })),
        null,
        2,
      )
    }

    case 'remove_blackout_date': {
      await removeBlackoutDate(
        input.amenityId as string,
        input.blackoutDateId as string,
      )
      await addAuditLog(null, 'config-agent', 'BLACKOUT_DATE_REMOVED', {
        blackoutDateId: input.blackoutDateId,
      })
      return 'Blackout date removed.'
    }

    default:
      return `Unknown tool: ${name}`
  }
}

export async function handleConfigMessage(
  message: string,
  conversationHistory: ConversationMessage[] = [],
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ]

  const anthropic = await getAnthropicClient()

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  })

  // Process tool calls in a loop until we get a final text response
  while (response.stop_reason === 'tool_use') {
    const assistantContent = response.content
    const toolUseBlocks = assistantContent.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const toolUse of toolUseBlocks) {
      try {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        )
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        })
      } catch (error) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          is_error: true,
        })
      }
    }

    messages.push({ role: 'assistant', content: assistantContent })
    messages.push({ role: 'user', content: toolResults })

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    })
  }

  // Extract the final text response
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  )

  return textBlock?.text ?? 'Configuration updated.'
}
