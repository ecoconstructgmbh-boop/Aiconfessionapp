import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2.90.1";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Auto-create admin account on server start
async function ensureAdminExists() {
  try {
    const adminEmail = 'admin2143@admin.com';
    const adminPassword = 'Genius2143@';
    
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const adminExists = existingUsers.users.find(u => u.email === adminEmail);
    
    if (!adminExists) {
      console.log('Creating admin account...');
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin2143',
        },
      });
      
      if (error) {
        console.error('Failed to create admin account:', error);
      } else {
        console.log('Admin account created successfully:', adminEmail);
      }
    } else {
      console.log('Admin account already exists');
    }
  } catch (error) {
    console.error('Error ensuring admin exists:', error);
  }
}

// Ensure admin exists on startup
ensureAdminExists();

// Health check endpoint
app.get("/make-server-ed36fee5/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign in endpoint - auto-confirms email if not confirmed
app.post("/make-server-ed36fee5/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Special handling for admin account - auto-create if doesn't exist
    if (email === 'admin2143@admin.com') {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const adminExists = existingUsers.users.find(u => u.email === email);
      
      if (!adminExists) {
        console.log('Admin account not found, creating it now...');
        const { data, error } = await supabase.auth.admin.createUser({
          email: 'admin2143@admin.com',
          password: 'Genius2143@',
          email_confirm: true,
          user_metadata: {
            full_name: 'Admin2143',
          },
        });
        
        if (error) {
          console.error('Failed to create admin account:', error);
        } else {
          console.log('Admin account created successfully!');
        }
      } else if (!adminExists.email_confirmed_at) {
        // Auto-confirm email for admin
        await supabase.auth.admin.updateUserById(adminExists.id, {
          email_confirm: true,
        });
        console.log('Admin email auto-confirmed');
      }
      
      return c.json({ success: true });
    }

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);

    if (existingUser && !existingUser.email_confirmed_at) {
      // Auto-confirm email for existing user
      await supabase.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
      });
      console.log(`Auto-confirmed email for user: ${email}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error in signin endpoint:', error);
    return c.json({ error: 'Failed to process signin' }, 500);
  }
});

// Sign up endpoint with service role (bypasses rate limiting)
app.post("/make-server-ed36fee5/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email);

    if (existingUser) {
      // User exists, check if email is confirmed
      if (!existingUser.email_confirmed_at) {
        // Confirm the email for existing user
        await supabase.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
        });
        return c.json({ 
          success: true,
          message: 'Email confirmed. You can now sign in.',
          user: {
            id: existingUser.id,
            email: existingUser.email,
          }
        });
      }
      return c.json({ error: 'User with this email already exists. Please sign in.' }, 400);
    }

    // Create user with service role key (bypasses rate limiting)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since we don't have email server configured
      user_metadata: {
        full_name: fullName || email,
      },
    });

    if (error) {
      console.error('Error creating user:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    });
  } catch (error) {
    console.error('Error in signup endpoint:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Profile endpoints
// Get user profile
app.get("/make-server-ed36fee5/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const profileKey = `profile:${userId}`;
    
    const profile = await kv.get(profileKey);
    
    if (!profile) {
      return c.json({ 
        firstName: '',
        lastName: '',
        city: '',
        language: 'Русский',
        karma: 0,
        hasSubscription: false
      }, 404);
    }
    
    return c.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put("/make-server-ed36fee5/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const profileKey = `profile:${userId}`;
    const body = await c.req.json();
    
    // Ensure karma is preserved if not provided
    const existingProfile = await kv.get(profileKey);
    const karma = body.karma !== undefined ? body.karma : (existingProfile?.karma || 0);
    
    const profile = {
      firstName: body.firstName || '',
      lastName: body.lastName || '',
      city: body.city || '',
      language: body.language || 'Русский',
      karma: karma,
      hasSubscription: body.hasSubscription !== undefined ? body.hasSubscription : (existingProfile?.hasSubscription || false),
    };
    
    await kv.set(profileKey, profile);
    
    return c.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Confession endpoints
// Get user's active (incomplete) confession
app.get("/make-server-ed36fee5/confessions/active", async (c) => {
  try {
    const userId = c.req.query("userId");
    
    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    const confession = await kv.get(`confession_active_${userId}`);
    
    if (!confession) {
      return c.json({ confession: null });
    }

    return c.json({ confession });
  } catch (error) {
    console.error("Error getting active confession:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Save/update active confession (auto-save during conversation)
app.post("/make-server-ed36fee5/confessions/active", async (c) => {
  try {
    const { userId, messages } = await c.req.json();
    
    if (!userId || !messages) {
      return c.json({ error: "User ID and messages are required" }, 400);
    }

    const confession = {
      userId,
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`confession_active_${userId}`, confession);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving active confession:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete active confession (when completed or cancelled)
app.delete("/make-server-ed36fee5/confessions/active", async (c) => {
  try {
    const userId = c.req.query("userId");
    
    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    await kv.del(`confession_active_${userId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting active confession:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all confessions for a user
app.get("/make-server-ed36fee5/confessions", async (c) => {
  try {
    const userId = c.req.query("userId");
    const prefix = `confession:${userId}:`;
    
    const confessions = await kv.getByPrefix(prefix);
    
    // Sort by creation date (newest first)
    const sortedConfessions = confessions.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return c.json(sortedConfessions);
  } catch (error) {
    console.error('Error fetching confessions:', error);
    return c.json({ error: 'Failed to fetch confessions' }, 500);
  }
});

// Check confession limit for user (2 per day for free users)
app.get("/make-server-ed36fee5/confessions/check-limit", async (c) => {
  try {
    const userId = c.req.query("userId");
    
    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    // Get user profile to check subscription
    const profileKey = `profile:${userId}`;
    const profile = await kv.get(profileKey);
    
    // If user has subscription, no limit
    if (profile?.hasSubscription) {
      return c.json({ 
        canConfess: true, 
        confessionsToday: 0,
        limit: -1,
        hasSubscription: true 
      });
    }

    // Get all confessions for user
    const prefix = `confession:${userId}:`;
    const confessions = await kv.getByPrefix(prefix);
    
    // Filter confessions completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const confessionsToday = confessions.filter((confession: any) => {
      if (!confession.completedAt) return false;
      const confessionDate = new Date(confession.completedAt);
      confessionDate.setHours(0, 0, 0, 0);
      return confessionDate.getTime() === today.getTime();
    });

    const limit = 2;
    const canConfess = confessionsToday.length < limit;

    return c.json({
      canConfess,
      confessionsToday: confessionsToday.length,
      limit,
      hasSubscription: false
    });
  } catch (error) {
    console.error('Error checking confession limit:', error);
    return c.json({ error: 'Failed to check limit' }, 500);
  }
});

// Create a new confession
app.post("/make-server-ed36fee5/confessions", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, messages, karmaChange, summary } = body;

    if (!userId || !messages) {
      return c.json({ error: 'User ID and messages are required' }, 400);
    }

    // Create confession ID
    const confessionId = `confession:${userId}:${Date.now()}`;

    // Create confession object
    const confession = {
      id: confessionId,
      userId,
      messages,
      karmaChange: karmaChange || 0,
      summary: summary || '',
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Save confession
    await kv.set(confessionId, confession);

    return c.json(confession);
  } catch (error) {
    console.error('Error creating confession:', error);
    return c.json({ error: 'Failed to create confession' }, 500);
  }
});

// Complete a confession and update karma
app.put("/make-server-ed36fee5/confessions/:confessionId/complete", async (c) => {
  try {
    const confessionId = c.req.param("confessionId");
    const body = await c.req.json();
    const { karmaChange } = body;

    // Get confession
    const confession = await kv.get(confessionId);
    if (!confession) {
      return c.json({ error: 'Confession not found' }, 404);
    }

    // Update confession
    confession.completed = true;
    confession.karmaChange = karmaChange || 0;
    confession.completedAt = new Date().toISOString();
    await kv.set(confessionId, confession);

    // Update user profile karma
    const profileKey = `profile:${confession.userId}`;
    const profile = await kv.get(profileKey);
    if (profile) {
      profile.karma = (profile.karma || 0) + karmaChange;
      await kv.set(profileKey, profile);
    }

    return c.json({ confession, newKarma: profile?.karma || 0 });
  } catch (error) {
    console.error('Error completing confession:', error);
    return c.json({ error: 'Failed to complete confession' }, 500);
  }
});

// Get a single confession
app.get("/make-server-ed36fee5/confession/:confessionId", async (c) => {
  try {
    const confessionId = c.req.param("confessionId");
    const confession = await kv.get(confessionId);
    
    if (!confession) {
      return c.json({ error: 'Confession not found' }, 404);
    }
    
    return c.json(confession);
  } catch (error) {
    console.error('Error fetching confession:', error);
    return c.json({ error: 'Failed to fetch confession' }, 500);
  }
});

// Analyze confession and calculate karma change
app.post("/make-server-ed36fee5/confessions/analyze", async (c) => {
  try {
    const body = await c.req.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return c.json({ error: 'messages are required' }, 400);
    }

    // Extract conversation for analysis
    const conversation = messages
      .map((msg: any) => `${msg.role === 'user' ? 'Исповедующийся' : 'Духовный Наставник'}: ${msg.content}`)
      .join('\n');

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.log('OpenAI API key not found, using fallback analysis');
      // Fallback to simple keyword-based analysis
      return simpleKarmaAnalysis(conversation);
    }

    try {
      // Call OpenAI API for intelligent analysis
      const analysisPrompt = `Ты духовный аналитик, изучающий христианское учение и Священное Писание. Проанализируй эту исповедь и определи изменение кармы человека.

Исповедь:
${conversation}

ВАЖНЫЕ ПРАВИЛА РАСЧЕТА КАРМЫ:

ПОЛОЖИТЕЛЬНАЯ КАРМА (+1 до +10):
- Только за РЕАЛЬНЫЕ благие дела и поступки: помощь людям, благотворительность, прощение обидчиков
- За активное искупление вины конкретными действиями: +3 до +7
- За совершенные добрые поступки: +2 до +10 (чем значительнее, тем больше)
- Если человек СДЕЛАЛ что-то хорошее - оцени масштаб и дай соответствующую карму

НУЛЕВАЯ КАРМА (0):
- Простое раскаяние и признание греха БЕЗ реальных действий: 0
- Исповедь с вопросами, духовные размышления: 0
- Обычная беседа о жизни без конкретных поступков: 0
- Человек кается, но еще не искупил вину делами: 0

ОТРИЦАТЕЛЬНАЯ КАРМА (-1 до -10):
- Только если человек признался в плохих поступках: предательство, обман, насилие, воровство
- Чем серьезнее грех, тем больше минус: -2 до -10
- Отрицание вины или оправдание греха: -3 до -5
- Злонамеренные действия, которые человек совершил: оцени тяжесть

ПРИМЕРЫ:
"Я украл деньги у друга" → -5 до -8 (совершен плохой поступок)
"Я раскаиваюсь в том, что обманул жену" → 0 (только раскаяние, нет действий)
"Я помог бездомному и накормил его" → +5 до +7 (реальное доброе дело)
"Я попросил прощения у человека, которого обидел, и искупил вину" → +4 до +6 (искупление делом)
"Как мне справиться с гневом?" → 0 (просто вопрос, нет поступков)
"Я пожертвовал деньги в приют" → +6 до +8 (благое дело)

ВАЖНО: Будь строг и честен. Карма меняется только за РЕАЛЬНЫЕ поступки, а не за слова и намерения. Не давай много кармы без веской причины.

Верни ответ СТРОГО в формате JSON (без дополнительного текста):
{
  "karmaChange": число от -10 до +10,
  "summary": "краткое духовное резюме исповеди (1-2 предложения на русском)",
  "reasoning": "объяснение оценки кармы на основе христианских принципов (2-3 предложения на русском)"
}`;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Ты духовный аналитик, специализирующийся на христианском учении. Отвечай только в формате JSON.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!openaiResponse.ok) {
        console.error('OpenAI API error:', await openaiResponse.text());
        return simpleKarmaAnalysis(conversation);
      }

      const openaiData = await openaiResponse.json();
      const analysisText = openaiData.choices[0]?.message?.content || '';
      
      // Parse JSON from the response
      const analysis = JSON.parse(analysisText);

      return c.json({
        karmaChange: Math.max(-10, Math.min(10, analysis.karmaChange)),
        summary: analysis.summary,
        reasoning: analysis.reasoning,
      });
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return simpleKarmaAnalysis(conversation);
    }
  } catch (error) {
    console.error('Error analyzing confession:', error);
    return c.json({ error: 'Failed to analyze confession' }, 500);
  }
});

// Fallback simple karma analysis
function simpleKarmaAnalysis(conversation: string) {
  const text = conversation.toLowerCase();
  let karmaChange = 0;
  let summary = "Духовная беседа завершена";
  let reasoning = "Продолжайте духовный путь с Богом";

  // Keywords for good deeds
  const goodDeedsWords = ['помог', 'помогу', 'пожертвовал', 'отдал', 'накормил', 'приютил', 'спас', 'простил обидчика', 'искупил'];
  const repentanceWords = ['раскаяние', 'простите', 'сожалею', 'виноват', 'прощения', 'каюсь'];
  const sinWords = ['украл', 'обманул', 'предал', 'ударил', 'изил', 'изменил', 'соврал', 'обидел сильно'];
  const redemptionWords = ['исправил', 'попросил прощения', 'вернул', 'загладил вину'];

  const hasGoodDeeds = goodDeedsWords.some(word => text.includes(word));
  const hasRepentance = repentanceWords.some(word => text.includes(word));
  const hasSin = sinWords.some(word => text.includes(word));
  const hasRedemption = redemptionWords.some(word => text.includes(word));

  // Good deeds - positive karma
  if (hasGoodDeeds || hasRedemption) {
    karmaChange = Math.floor(Math.random() * 4) + 3; // +3 to +6
    summary = "Благие дела и добрые поступки";
    reasoning = "Ваши добрые дела приносят свет в мир. Господь видит вашу искренность и щедрость сердца.";
  }
  // Sin without repentance - negative karma
  else if (hasSin && !hasRepentance) {
    karmaChange = Math.floor(Math.random() * 5) - 8; // -3 to -8
    summary = "Грех требует осознания";
    reasoning = "Содеянное требует искреннего раскаяния и стремления к исправлению. Обратитесь к Богу с чистым сердцем.";
  }
  // Sin with repentance - no karma change
  else if (hasSin && hasRepentance) {
    karmaChange = 0;
    summary = "Раскаяние принято";
    reasoning = "Ваше раскаяние искренне. Теперь искупите вину добрыми делами, и Господь простит вас.";
  }
  // Just repentance - no karma change
  else if (hasRepentance) {
    karmaChange = 0;
    summary = "Исповедь с раскаянием";
    reasoning = "Раскаяние - первый шаг. Теперь идите и творите добро, чтобы искупить содеянное.";
  }
  // Spiritual conversation - no karma change
  else {
    karmaChange = 0;
    summary = "Духовная беседа";
    reasoning = "Размышления и вопросы о жизни - важная часть духовного пути. Продолжайте искать истину.";
  }

  return new Response(JSON.stringify({
    karmaChange,
    summary,
    reasoning,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Delete a single confession
app.delete("/make-server-ed36fee5/confessions/:confessionId", async (c) => {
  try {
    const confessionId = c.req.param("confessionId");
    
    // Get confession to verify it exists and get karma change
    const confession = await kv.get(confessionId);
    if (!confession) {
      return c.json({ error: 'Confession not found' }, 404);
    }

    // If confession was completed, revert karma change
    if (confession.completed && confession.karmaChange) {
      const profileKey = `profile:${confession.userId}`;
      const profile = await kv.get(profileKey);
      if (profile) {
        profile.karma = (profile.karma || 0) - confession.karmaChange;
        await kv.set(profileKey, profile);
      }
    }

    // Delete confession
    await kv.del(confessionId);

    return c.json({ success: true, message: 'Confession deleted' });
  } catch (error) {
    console.error('Error deleting confession:', error);
    return c.json({ error: 'Failed to delete confession' }, 500);
  }
});

// Delete all confessions for a user
app.delete("/make-server-ed36fee5/confessions/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const prefix = `confession:${userId}:`;
    
    // Get all confessions
    const confessions = await kv.getByPrefix(prefix);
    
    // Calculate total karma to revert
    let totalKarmaToRevert = 0;
    for (const confession of confessions) {
      if (confession.completed && confession.karmaChange) {
        totalKarmaToRevert += confession.karmaChange;
      }
    }

    // Revert karma
    if (totalKarmaToRevert !== 0) {
      const profileKey = `profile:${userId}`;
      const profile = await kv.get(profileKey);
      if (profile) {
        profile.karma = (profile.karma || 0) - totalKarmaToRevert;
        await kv.set(profileKey, profile);
      }
    }

    // Delete all confessions
    const confessionIds = confessions.map((c: any) => c.id);
    if (confessionIds.length > 0) {
      await kv.mdel(confessionIds);
    }

    return c.json({ 
      success: true, 
      message: 'All confessions deleted',
      deletedCount: confessionIds.length 
    });
  } catch (error) {
    console.error('Error deleting all confessions:', error);
    return c.json({ error: 'Failed to delete confessions' }, 500);
  }
});

// Chat endpoint - AI-powered responses
app.post("/make-server-ed36fee5/chat/response", async (c) => {
  try {
    const { userMessage, messages } = await c.req.json();
    
    // Get OpenAI API key from environment
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.log("OpenAI API key not found, using fallback response");
      return c.json({ response: generateSimpleResponse(userMessage) });
    }

    // Prepare conversation history for OpenAI
    const conversationHistory = messages.slice(0, -1); // Exclude the last message (current user message)

    try {
      // Call OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Ты мудрый и любящий духовный наставник, ведущий исповедь на основе христианского учения и Священного Писания. Веди живую, естественную беседу, как настоящий священник с прихожанином.

ПРИНЦИПЫ БЕСЕДЫ:

1. ЖИВОЙ ДИАЛОГ:
   - Говори естественно, не как робот с анкетой
   - Чередуй вопросы с комментариями, размышлениями и цитатами
   - Реагируй на эмоции человека с состраданием
   - Иногда просто выслушивай и поддерживай

2. ЦИТИРУЙ ПИСАНИЕ:
   - Вплетай библейские стихи органично в беседу
   - Используй цитаты, которые утешают, наставляют, вдохновляют
   - Объясняй, как Слово Божие относится к ситуации человека
   - Примеры: Псалом 51, 1 Иоанна 1:9, Матфея 6:14-15, Луки 15:11-32

3. ДАВАЙ РЕКОМЕНДАЦИИ:
   - Предлагай конкретные шаги к исправлению
   - Советуй молитвы и духовные практики
   - Говори о прощении себя и других
   - Вдохновляй на изменение жизни

4. РАСПОЗНАВАЙ РАСКАЯНИЕ:
   Следи за признаками истинного раскаяния:
   ✓ Человек называет свой поступок грехом
   ✓ Признает боль, причиненную другим
   ✓ Выражает сожаление и стыд
   ✓ Говорит о желании исправиться
   ✓ Готов попросить прощение
   ✓ Понимает тяжесть содеянного

5. ЗАВЕРШЕНИЕ ИСПОВЕДИ:
   Когда видишь искреннее раскаяние и осознание:
   - Скажи утешающие слова о милосердии Божьем
   - Дай финальное духовное напутствие
   - Предложи путь искупления (молитва, добрые дела, просьба о прощении)
   - Благослови человека
   - Можешь сказать фразу типа: "Идите с миром, дитя Божие" или "Господь простил вас, простите и себя"

СТИЛЬ РЕЧИ:
- Теплый, понимающий, но духовно авторитетный
- Используй церковнославянские обороты умеренно
- Обращайся "дитя Божие", "чадо", "друг мой"
- Говори от сердца, как отец духовный

ВАЖНО:
- НЕ задавай вопрос за вопросом подряд
- Реагируй на то, что человек сказал
- Если человек раскрылся, не дави - поддержи
- Веди к осознанию мягко, но твердо
- Когда увидишь готовность к изменению - начинай завершать беседу

Библейские темы для цитирования:
- Покаяние: Псалом 51:1-12, 1 Иоанна 1:9, Луки 15:7
- Прощение: Матфея 6:14-15, Ефесянам 4:32, Луки 6:37
- Милосердие: Псалом 103:8-14, Михей 7:18-19, Исайя 1:18
- Искупление: 2 Коринфянам 7:10, Притчи 28:13, Иакова 5:16
- Новая жизнь: 2 Коринфянам 5:17, Римлянам 6:4, Колоссянам 3:1-10

Всегда отвечай на русском языке.`
            },
            ...conversationHistory,
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.85,
          max_tokens: 600,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
        return c.json({ response: generateSimpleResponse(userMessage) });
      }

      const data = await openaiResponse.json();
      const aiResponse = data.choices[0].message.content;

      return c.json({ response: aiResponse });
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return c.json({ response: generateSimpleResponse(userMessage) });
    }
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Text-to-Speech endpoint using OpenAI TTS
app.post("/make-server-ed36fee5/chat/speak", async (c) => {
  try {
    const { text } = await c.req.json();
    
    if (!text) {
      console.error("TTS error: Text is required");
      return c.json({ error: "Text is required" }, 400);
    }

    // Get OpenAI API key from environment
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.error("TTS error: OpenAI API key not configured");
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    console.log(`TTS request: Generating speech for text of length ${text.length}`);

    try {
      // Call OpenAI TTS API
      const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'onyx', // Deep, warm voice suitable for a spiritual guide
          input: text,
          speed: 0.95,
        }),
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error(`OpenAI TTS API error: ${ttsResponse.status} - ${errorText}`);
        return c.json({ error: `OpenAI TTS API error: ${ttsResponse.status}`, details: errorText }, 500);
      }

      console.log("TTS response received, converting to base64...");

      // Get audio data as array buffer
      const audioBuffer = await ttsResponse.arrayBuffer();
      
      console.log(`Audio buffer size: ${audioBuffer.byteLength} bytes`);

      // Convert to base64 for sending to frontend
      const uint8Array = new Uint8Array(audioBuffer);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binaryString);

      console.log(`Base64 audio generated, length: ${base64Audio.length}`);

      return c.json({ audio: base64Audio });
    } catch (error) {
      console.error("Error in TTS processing:", error);
      return c.json({ error: "TTS processing error", details: String(error) }, 500);
    }
  } catch (error) {
    console.error("Error in TTS endpoint:", error);
    return c.json({ error: "Internal server error", details: String(error) }, 500);
  }
});

// Simple fallback response generator
function generateSimpleResponse(userInput: string): string {
  const lowerInput = userInput.toLowerCase();

  // Responses about sin and guilt
  if (
    lowerInput.includes("грех") ||
    lowerInput.includes("согрешил") ||
    lowerInput.includes("виновен") ||
    lowerInput.includes("плохо поступил")
  ) {
    const responses = [
      "Дитя Божие, слышу вашу боль. В 1 Иоанна 1:9 сказано: 'Если исповедуем грехи наши, то Он, будучи верен и праведен, простит нам грехи наши и очистит нас от всякой неправды.' Расскажите мне подробнее, что лежит на вашем сердце?",
      "Ваше признание уже говорит о работе совести. Помните слова Христа: 'Приидите ко Мне все труждающиеся и обремененные, и Я успокою вас' (Матфея 11:28). Что произошло, чадо?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Responses about repentance
  if (
    lowerInput.includes("прост") ||
    lowerInput.includes("раскаи") ||
    lowerInput.includes("сожале") ||
    lowerInput.includes("каюсь")
  ) {
    const responses = [
      "Вижу искренность в ваших словах. Псалом 51 учит нас: 'Жертва Богу — дух сокрушенный; сердца сокрушенного и смиренного Ты не презришь, Боже.' Ваше сердце открыто перед Господом, и это прекрасно. Что вы сделали, чтобы исправить содеянное?",
      "Раскаяние - это дар от Бога, чадо. Во 2 Коринфянам 7:10 сказано: 'Печаль ради Бога производит неизменное покаяние ко спасению.' Чувствую, что вы готовы к переменам. Что вы хотите изменить в своей жизни?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Responses about fear and anxiety
  if (
    lowerInput.includes("страх") ||
    lowerInput.includes("боюсь") ||
    lowerInput.includes("тревож") ||
    lowerInput.includes("переживаю")
  ) {
    const responses = [
      "Понимаю ваш страх, друг мой. Иисус говорил: 'Мир оставляю вам, мир Мой даю вам... да не смущается сердце ваше' (Иоанна 14:27). Господь знает о вашей тревоге. Скажите, что именно вас пугает больше всего?",
      "Страх - естественное чувство, но помните: 'В любви нет страха, но совершення любовь изгоняет страх' (1 Иоанна 4:18). Бог любит вас. Поделитесь со мной, от чего тяжело на душе?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Responses about loneliness
  if (
    lowerInput.includes("одинок") ||
    lowerInput.includes("один") ||
    lowerInput.includes("покину") ||
    lowerInput.includes("никому не нужен")
  ) {
    const responses = [
      "Чувствую вашу боль, дитя Божие. Но знайте: 'Господь не оставит и не покинет тебя' (Второзаконие 31:6). Вы не одиноки, даже если так кажется. Я здесь и слушаю вас. Расскажите, что тяготит ашу душу?",
      "В Псалме 23 написано: 'Господь - Пастырь мой, не буду нуждаться.' Он всегда с вами. Я тоже здесь, чтобы выслушать. Что заставило вас почувствовать себя одиноким?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Responses about anger
  if (
    lowerInput.includes("злость") ||
    lowerInput.includes("гнев") ||
    lowerInput.includes("ненавижу") ||
    lowerInput.includes("бесит")
  ) {
    const responses = [
      "Гнев - сильное чувство, и важно его не подавлять, а понять. В Ефесянам 4:26 сказано: 'Гневаясь, не согрешайте; солнце да не зайдет во гневе вашем.' Ваш гнев обоснован? Расскажите, что произошло.",
      "Слышу гнев в ваших словах. Иакова 1:19-20 учит: 'Всякий человек да будет ско на слышание, медлен на слова, медлен на гнев, ибо гнев человека не творит правды Божией.' Что вызвало эти чувства?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // General welcoming responses
  const generalResponses = [
    "Благодарю, что пришли сюда, чадо. Притчи 3:5-6 напоминают нам: 'Надейся на Господа всем сердцем твоим... и Он направит стези твои.' Я здесь, чтобы выслушать вас. Что привело вас ко мне сегодня?",
    "Приветствую вас, дитя Божие. Это место, где можно говорить открыто и без страха. 'Исповедуйте друг другу грехи и молитесь друг за друга' (Иаков 5:16). Расскажите, то у вас на сердце?",
    "Мир вам, друг мой. Рад, что вы здесь. Помните слова Христа: 'Где двое или трое собраны во имя Мое, там Я посредин них' (Матфея 18:20). Бог слушает нас. Поделитесь тем, что вас тревожит.",
  ];
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

// ============================================
// ADMIN PANEL ENDPOINTS
// ============================================

// Get all users with statistics (admin only)
app.get("/make-server-ed36fee5/admin/users", async (c) => {
  try {
    // Get all users from Supabase Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    
    if (!authUsers || !authUsers.users) {
      return c.json({ users: [] });
    }

    // Get statistics for each user
    const usersWithStats = await Promise.all(
      authUsers.users.map(async (authUser) => {
        const userId = authUser.id;
        
        // Get user profile
        const profile = await kv.get(`profile:${userId}`) || {
          karma: 0,
          hasSubscription: false,
          totalDonations: 0
        };

        // Get all confessions for this user
        const confessions = await kv.getByPrefix(`confession:${userId}:`);
        const completedConfessions = confessions.filter((c: any) => c.completed);

        // Get donations for this user
        const donations = await kv.getByPrefix(`donation:${userId}:`);
        const totalDonations = donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

        return {
          id: userId,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.email,
          createdAt: authUser.created_at,
          karma: profile.karma || 0,
          confessionsCount: completedConfessions.length,
          hasSubscription: profile.hasSubscription || false,
          totalDonations: totalDonations,
        };
      })
    );

    // Sort by registration date (newest first)
    usersWithStats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ users: usersWithStats });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// ============================================
// FEEDBACK/COMPLAINTS ENDPOINTS
// ============================================

// Submit feedback/complaint
app.post("/make-server-ed36fee5/feedback", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, userName, userEmail, type, message, imageBase64 } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Create feedback ID
    const feedbackId = `feedback:${Date.now()}:${userId || 'anonymous'}`;

    // Create feedback object
    const feedback = {
      id: feedbackId,
      userId: userId || null,
      userName: userName || 'Аноним',
      userEmail: userEmail || null,
      type: type || 'feedback', // 'complaint' or 'feedback'
      message,
      imageBase64: imageBase64 || null,
      status: 'new', // 'new', 'reviewed', 'resolved'
      createdAt: new Date().toISOString(),
    };

    // Save feedback
    await kv.set(feedbackId, feedback);

    return c.json({ success: true, feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return c.json({ error: 'Failed to submit feedback' }, 500);
  }
});

// Get all feedback (admin only)
app.get("/make-server-ed36fee5/admin/feedback", async (c) => {
  try {
    // Get all feedback
    const feedbackList = await kv.getByPrefix('feedback:');

    // Sort by date (newest first)
    feedbackList.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ feedback: feedbackList });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return c.json({ error: 'Failed to fetch feedback' }, 500);
  }
});

// Update feedback status (admin only)
app.put("/make-server-ed36fee5/admin/feedback/:feedbackId", async (c) => {
  try {
    const feedbackId = c.req.param("feedbackId");
    const body = await c.req.json();
    const { status } = body;

    if (!['new', 'reviewed', 'resolved'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    const feedback = await kv.get(feedbackId);
    if (!feedback) {
      return c.json({ error: 'Feedback not found' }, 404);
    }

    feedback.status = status;
    feedback.updatedAt = new Date().toISOString();
    await kv.set(feedbackId, feedback);

    return c.json({ success: true, feedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return c.json({ error: 'Failed to update feedback' }, 500);
  }
});

// Delete feedback (admin only)
app.delete("/make-server-ed36fee5/admin/feedback/:feedbackId", async (c) => {
  try {
    const feedbackId = c.req.param("feedbackId");
    
    const feedback = await kv.get(feedbackId);
    if (!feedback) {
      return c.json({ error: 'Feedback not found' }, 404);
    }

    await kv.del(feedbackId);

    return c.json({ success: true, message: 'Feedback deleted' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return c.json({ error: 'Failed to delete feedback' }, 500);
  }
});

// ============================================
// DONATION TRACKING
// ============================================

// Save donation
app.post("/make-server-ed36fee5/donations", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, amount } = body;

    if (!userId || !amount) {
      return c.json({ error: 'User ID and amount are required' }, 400);
    }

    // Create donation ID
    const donationId = `donation:${userId}:${Date.now()}`;

    // Create donation object
    const donation = {
      id: donationId,
      userId,
      amount,
      createdAt: new Date().toISOString(),
    };

    // Save donation
    await kv.set(donationId, donation);

    // Update user profile total donations
    const profileKey = `profile:${userId}`;
    const profile = await kv.get(profileKey) || {};
    profile.totalDonations = (profile.totalDonations || 0) + amount;
    await kv.set(profileKey, profile);

    return c.json({ success: true, donation });
  } catch (error) {
    console.error('Error saving donation:', error);
    return c.json({ error: 'Failed to save donation' }, 500);
  }
});

Deno.serve(app.fetch);