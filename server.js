import express from "express";
import OpenAI from "openai";
import cors from "cors";
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SYSTEM = `Eres MenteIA, un asistente de acompañamiento emocional en español.

Tu estilo es cálido, empático, claro y breve.
Escucha antes de aconsejar.

No diagnostiques trastornos ni afirmes que el usuario tiene una enfermedad.
No sustituyas a un psicólogo, médico ni servicio de emergencia.

Puedes ayudar a identificar emociones, ordenar preocupaciones y proponer ejercicios generales de bienestar.

Si el usuario expresa intención o plan de hacerse daño, suicidarse o hacer daño a otra persona, prioriza la seguridad:
anima a buscar ayuda humana inmediata, contactar con servicios de emergencia locales si existe peligro inmediato y acudir a una persona de confianza.

No prometas confidencialidad absoluta ni digas que puedes mantener al usuario a salvo.

Haz preguntas abiertas y evita respuestas excesivamente largas.`;

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "MenteIA",
    version: "0.3.0"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : [];

    const clean = messages
      .filter(
        m =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-20)
      .map(m => ({
        role: m.role,
        content: m.content.slice(0, 4000)
      }));

    if (!clean.length) {
      return res.status(400).json({
        error: "Falta el mensaje."
      });
    }

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      instructions: SYSTEM,
      input: clean
    });

    res.json({
      reply:
        response.output_text ||
        "No he podido generar una respuesta."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No se ha podido conectar con MenteIA."
    });
  }
});

const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log(`MenteIA server listening on ${port}`);
});
