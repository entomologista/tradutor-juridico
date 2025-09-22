const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { OpenAI } = require('openai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer();

// Permitir requisições do frontend
app.use(cors());

// Configuração da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rota principal de tradução
app.post('/api/translate', upload.single('file'), async (req, res) => {
  try {
    let text = req.body.text || '';
    
    // Se houver arquivo, extrair o texto
    if (req.file) {
      console.log('Processando arquivo:', req.file.originalname);
      
      if (req.file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer);
        text = pdfData.text;
      } else if (req.file.mimetype.includes('word')) {
        const docData = await mammoth.extractRawText({ buffer: req.file.buffer });
        text = docData.value;
      } else if (req.file.mimetype === 'text/plain') {
        text = req.file.buffer.toString();
      }
    }
    
    if (!text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum texto encontrado para traduzir'
      });
    }
    
    console.log('Enviando texto para tradução...');
    
    // Enviar para a API de tradução
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em traduzir textos jurídicos complexos para uma linguagem simples e acessível para pessoas com nível de ensino médio. Identifique jargões jurídicos, explique-os de forma clara e simplifique a estrutura das frases sem perder o sentido original."
        },
        {
          role: "user",
          content: `Traduza o seguinte texto jurídico para uma linguagem simples e acessível:\n\n${text}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });
    
    const translatedText = completion.choices[0].message.content;
    
    res.json({
      success: true,
      translated_text: translatedText
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar sua solicitação'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
