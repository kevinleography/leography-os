import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { DispatchNotePayload, AIExtractedAction } from '@/types/database';

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Tu es un assistant IA pour une agence web. On te donne le contenu textuel d'une note de travail.

Extrais toutes les actions concrètes sous forme d'un tableau JSON. Chaque action doit avoir :
- "type": "task" | "rdv" | "deadline" | "friction" | "reminder"
- "title": titre court de l'action
- "details": description plus détaillée
- "target_entity": l'ID d'un contact ou projet si mentionné, sinon null
- "due_date": date ISO si mentionnée, sinon null

Types d'actions :
- task : tâche à réaliser (dev, design, SEO, admin...)
- rdv : rendez-vous ou appel à planifier
- deadline : échéance importante à noter
- friction : point de friction client (insatisfaction, problème, blocage)
- reminder : rappel à programmer

Réponds UNIQUEMENT avec le tableau JSON, sans markdown, sans explication.
Si aucune action n'est trouvée, réponds [].`;

export async function POST(request: NextRequest) {
  try {
    const body: DispatchNotePayload = await request.json();
    const { note_id } = body;

    if (!note_id) {
      return NextResponse.json({ error: 'note_id is required' }, { status: 400 });
    }

    // Fetch the note
    const { data: note, error: noteError } = await supabaseAdmin
      .from('notes')
      .select('*')
      .eq('id', note_id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (!note.content_text || note.content_text.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is empty' }, { status: 400 });
    }

    // Call Claude to extract actions
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: note.content_text,
        },
      ],
    });

    // Parse response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    let actions: AIExtractedAction[] = [];
    try {
      actions = JSON.parse(responseText);
      if (!Array.isArray(actions)) {
        actions = [];
      }
    } catch {
      actions = [];
    }

    // Mark actions as dispatched
    actions = actions.map((a) => ({ ...a, dispatched: true }));

    // Update the note
    await supabaseAdmin
      .from('notes')
      .update({
        ai_extracted_actions: actions,
        is_dispatched: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', note_id);

    // Create corresponding entities for each action
    for (const action of actions) {
      switch (action.type) {
        case 'task': {
          await supabaseAdmin.from('tasks').insert({
            title: action.title,
            description: action.details || null,
            project_id: note.project_id || (action.target_entity ?? null),
            status: 'todo',
            priority: 'medium',
            position: 0,
            source: 'ai_dispatch',
            due_date: action.due_date || null,
          });
          break;
        }

        case 'friction': {
          // Add friction point to the contact if one is linked
          const targetContactId = note.contact_id || action.target_entity;
          if (targetContactId) {
            const { data: contact } = await supabaseAdmin
              .from('contacts')
              .select('friction_points')
              .eq('id', targetContactId)
              .single();

            if (contact) {
              const frictionPoints = contact.friction_points ?? [];
              frictionPoints.push({
                description: `${action.title}: ${action.details}`,
                severity: 'medium',
                source_note_id: note_id,
                extracted_at: new Date().toISOString(),
              });

              await supabaseAdmin
                .from('contacts')
                .update({ friction_points: frictionPoints })
                .eq('id', targetContactId);
            }
          }
          break;
        }

        case 'reminder': {
          await supabaseAdmin.from('reminders').insert({
            user_id: note.user_id,
            entity_type: 'note',
            entity_id: note_id,
            title: action.title,
            remind_at: action.due_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            is_sent: false,
            recurrence: 'none',
          });
          break;
        }

        case 'rdv': {
          // Create a reminder for the RDV
          await supabaseAdmin.from('reminders').insert({
            user_id: note.user_id,
            entity_type: 'note',
            entity_id: note_id,
            title: `RDV: ${action.title}`,
            remind_at: action.due_date || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            is_sent: false,
            recurrence: 'none',
          });
          break;
        }

        case 'deadline': {
          // Create a reminder for the deadline
          await supabaseAdmin.from('reminders').insert({
            user_id: note.user_id,
            entity_type: 'note',
            entity_id: note_id,
            title: `Échéance: ${action.title}`,
            remind_at: action.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_sent: false,
            recurrence: 'none',
          });
          break;
        }
      }
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: note.user_id,
      action: 'note_dispatched',
      entity_type: 'note',
      entity_id: note_id,
      metadata: { actions_count: actions.length },
    });

    return NextResponse.json({ actions });
  } catch (err) {
    console.error('Dispatch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
