'use server'

import { cookies } from 'next/headers'
import {
  verifyAdminPassword,
  verifyAdminTotp,
  createSessionToken,
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
} from '@anipotts/lib/admin'
import { createServerClient } from '@anipotts/lib'
import { adminLoginSchema, formatZodError } from '@anipotts/lib/validation'
import type { SeriesType, ContentStatus } from '@anipotts/types'

export async function login(formData: FormData) {
  const raw = {
    password: formData.get('password') as string,
    totp: (formData.get('totp') as string) || '',
  }

  const parsed = adminLoginSchema.safeParse(raw)
  if (!parsed.success) {
    return formatZodError(parsed.error)
  }

  const { password, totp } = parsed.data

  const pwResult = verifyAdminPassword(password, process.env.ADMIN_PASSWORD)
  if (!pwResult.success) {
    return { error: pwResult.error || 'Invalid password' }
  }

  if (process.env.ADMIN_TOTP_SECRET && totp) {
    const totpResult = verifyAdminTotp(totp, process.env.ADMIN_TOTP_SECRET)
    if (!totpResult.success) {
      return { error: totpResult.error || 'Invalid TOTP' }
    }
  }

  const secret = process.env.ADMIN_PASSWORD!
  const token = createSessionToken(secret)
  const jar = await cookies()
  jar.set(ADMIN_COOKIE, token, ADMIN_COOKIE_OPTIONS)

  return { success: true }
}

export async function logout() {
  const jar = await cookies()
  jar.delete(ADMIN_COOKIE)
  return { success: true }
}

export async function approveContent(id: string) {
  const supabase = createServerClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { error } = await supabase
    .from('thoughts')
    .update({ status: 'ready', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateContentStatus(id: string, status: ContentStatus) {
  const supabase = createServerClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const update: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'published') {
    update.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('thoughts')
    .update(update)
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function createThought(formData: FormData) {
  const supabase = createServerClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const title = (formData.get('title') as string)?.trim()
  const content = (formData.get('content') as string)?.trim()
  const seriesType = formData.get('series_type') as SeriesType
  const contentType = formData.get('content_type') as string || 'article'

  if (!title) return { error: 'Title is required' }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('thoughts')
    .insert({
      title,
      slug,
      content: content || '',
      summary: '',
      series_type: seriesType,
      content_type: contentType,
      status: 'draft',
      published: false,
      tags: [],
      views: 0,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, id: data.id }
}
