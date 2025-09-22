{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const express = require('express');\
const multer = require('multer');\
const pdfParse = require('pdf-parse');\
const mammoth = require('mammoth');\
const \{ OpenAI \} = require('openai');\
const cors = require('cors');\
require('dotenv').config();\
\
const app = express();\
const upload = multer();\
\
// Permitir requisi\'e7\'f5es do frontend\
app.use(cors());\
\
// Configura\'e7\'e3o da OpenAI\
const openai = new OpenAI(\{\
  apiKey: process.env.OPENAI_API_KEY,\
\});\
\
// Rota principal de tradu\'e7\'e3o\
app.post('/api/translate', upload.single('file'), async (req, res) => \{\
  try \{\
    let text = req.body.text || '';\
    \
    // Se houver arquivo, extrair o texto\
    if (req.file) \{\
      console.log('Processando arquivo:', req.file.originalname);\
      \
      if (req.file.mimetype === 'application/pdf') \{\
        const pdfData = await pdfParse(req.file.buffer);\
        text = pdfData.text;\
      \} else if (req.file.mimetype.includes('word')) \{\
        const docData = await mammoth.extractRawText(\{ buffer: req.file.buffer \});\
        text = docData.value;\
      \} else if (req.file.mimetype === 'text/plain') \{\
        text = req.file.buffer.toString();\
      \}\
    \}\
    \
    if (!text.trim()) \{\
      return res.status(400).json(\{\
        success: false,\
        error: 'Nenhum texto encontrado para traduzir'\
      \});\
    \}\
    \
    console.log('Enviando texto para tradu\'e7\'e3o...');\
    \
    // Enviar para a API de tradu\'e7\'e3o\
    const completion = await openai.chat.completions.create(\{\
      model: "gpt-3.5-turbo",\
      messages: [\
        \{\
          role: "system",\
          content: "Voc\'ea \'e9 um assistente especializado em traduzir textos jur\'eddicos complexos para uma linguagem simples e acess\'edvel para pessoas com n\'edvel de ensino m\'e9dio. Identifique jarg\'f5es jur\'eddicos, explique-os de forma clara e simplifique a estrutura das frases sem perder o sentido original."\
        \},\
        \{\
          role: "user",\
          content: `Traduza o seguinte texto jur\'eddico para uma linguagem simples e acess\'edvel:\\n\\n$\{text\}`\
        \}\
      ],\
      max_tokens: 1000,\
      temperature: 0.3\
    \});\
    \
    const translatedText = completion.choices[0].message.content;\
    \
    res.json(\{\
      success: true,\
      translated_text: translatedText\
    \});\
    \
  \} catch (error) \{\
    console.error('Erro:', error);\
    res.status(500).json(\{\
      success: false,\
      error: 'Erro ao processar sua solicita\'e7\'e3o'\
    \});\
  \}\
\});\
\
const PORT = process.env.PORT || 3000;\
app.listen(PORT, () => \{\
  console.log(`Servidor rodando na porta $\{PORT\}`);\
\});}