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
        karma: 0
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
    };
    
    await kv.set(profileKey, profile);
    
    return c.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Confession endpoints
// Save a new confession
app.post("/make-server-ed36fee5/confessions", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, messages, karmaChange, summary } = body;

    if (!userId || !messages || messages.length === 0) {
      return c.json({ error: 'userId and messages are required' }, 400);
    }

    // Generate unique confession ID
    const confessionId = `confession:${userId}:${Date.now()}`;
    
    const confession = {
      id: confessionId,
      userId,
      messages,
      karmaChange: karmaChange || 0,
      summary: summary || '',
      createdAt: new Date().toISOString(),
      completed: false,
    };
    
    await kv.set(confessionId, confession);
    
    return c.json(confession);
  } catch (error) {
    console.error('Error saving confession:', error);
    return c.json({ error: 'Failed to save confession' }, 500);
  }
});

// Get all confessions for a user
app.get("/make-server-ed36fee5/confessions/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
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
      .map((msg: any) => `${msg.role === 'user' ? 'Исповедующийся' : 'Бог'}: ${msg.content}`)
      .join('\n');

    // Analyze the confession and determine karma change
    const analysisPrompt = `Ты духовный аналитик. Проанализируй эту исповедь и определи изменение кармы.

Исповедь:
${conversation}

Критерии оценки кармы:
- Искреннее раскаяние: +3 до +10
- Признание греха без раскаяния: -5 до +5
- Тяжесть греха (обман, предательство, насилие): -10 до -3
- Готовность исправиться: +5 до +10
- Отрицание вины: -10 до -5

Верни ответ в формате JSON:
{
  "karmaChange": число от -10 до +10,
  "summary": "краткое описание исповеди (1-2 предложения)",
  "reasoning": "почему такая карма (1-2 предложения)"
}`;

    // Here we would call OpenAI or another AI service
    // For now, using a simple heuristic based on keywords
    const text = conversation.toLowerCase();
    let karmaChange = 0;
    let summary = "Исповедь завершена";
    let reasoning = "Духовная оценка завершена";

    // Detect keywords
    const repentanceWords = ['раскаяние', 'простите', 'сожалею', 'виноват', 'прощения', 'каюсь', 'грех'];
    const sinWords = ['грех', 'обман', 'предательство', 'обидел', 'украл', 'соврал', 'злость', 'гнев'];
    const positiveWords = ['исправлюсь', 'больше не буду', 'постараюсь', 'обещаю', 'молитва'];

    const hasRepentance = repentanceWords.some(word => text.includes(word));
    const hasSin = sinWords.some(word => text.includes(word));
    const hasPositive = positiveWords.some(word => text.includes(word));

    if (hasRepentance && hasPositive) {
      karmaChange = Math.floor(Math.random() * 5) + 5; // +5 to +10
      summary = "Искреннее раскаяние и готовность исправиться";
      reasoning = "Исповедь показывает глубокое осознание греха и твердое намерение измениться";
    } else if (hasRepentance) {
      karmaChange = Math.floor(Math.random() * 5) + 1; // +1 to +5
      summary = "Признание греха с раскаянием";
      reasoning = "Раскаяние присутствует, что является первым шагом к духовному очищению";
    } else if (hasSin && !hasRepentance) {
      karmaChange = Math.floor(Math.random() * 5) - 7; // -7 to -3
      summary = "Признание греха без раскаяния";
      reasoning = "Грех осознан, но истинное раскаяние пока не достигнуто";
    } else if (hasPositive) {
      karmaChange = Math.floor(Math.random() * 3) + 3; // +3 to +5
      summary = "Стремление к лучшему";
      reasoning = "Намерение исправиться заслуживает одобрения";
    } else {
      karmaChange = Math.floor(Math.random() * 3) - 1; // -1 to +1
      summary = "Духовная беседа";
      reasoning = "Продолжайте работу над собой и размышляйте о своих поступках";
    }

    return c.json({
      karmaChange,
      summary,
      reasoning,
    });
  } catch (error) {
    console.error('Error analyzing confession:', error);
    return c.json({ error: 'Failed to analyze confession' }, 500);
  }
});

Deno.serve(app.fetch);