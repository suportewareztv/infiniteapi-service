# InfiniteAPI Microservice

Microserviço REST para WhatsApp baseado no [InfiniteAPI](https://github.com/rsalcara/InfiniteAPI) (fork do Baileys).  
Compatível com os endpoints da Evolution API — pode ser usado como substituto direto no ZapAPI.

## ✨ Funcionalidades

| Tipo | Suporte |
|------|---------|
| Texto simples | ✅ |
| Mídia (imagem, vídeo, áudio, documento) | ✅ |
| Localização | ✅ |
| Contatos | ✅ |
| Reações | ✅ |
| **Botões Quick Reply (até 16!)** | ✅ 🆕 |
| **Botões CTA (URL / Copy / Call)** | ✅ 🆕 |
| **Lista Dropdown (10 seções × 3 itens)** | ✅ 🆕 |
| **Enquete / Poll** | ✅ 🆕 |
| **Carrossel com Imagens (até 10 cards)** | ✅ 🆕 |
| Menu de Texto | ✅ |
| Multi-instância | ✅ |
| Auto-reconexão | ✅ |
| Webhook de eventos | ✅ |

## 🚀 Instalação na VPS

```bash
# 1. Clone ou copie os arquivos
git clone <este-repo> infiniteapi-service
cd infiniteapi-service

# 2. Instale dependências
npm install

# 3. Configure
cp .env.example .env
# Edite .env com sua API_KEY e WEBHOOK_URL

# 4. Build
npm run build

# 5. Rode
npm start
```

## 🐳 Docker / EasyPanel

```bash
# Build
docker build -t infiniteapi-service .

# Run
docker run -d \
  --name infiniteapi \
  -p 8080:8080 \
  -e API_KEY=sua-chave \
  -e WEBHOOK_URL=https://seu-webhook.com/webhook \
  -v $(pwd)/sessions:/app/sessions \
  infiniteapi-service
```

No EasyPanel: crie um app, aponte para este Dockerfile, configure as variáveis de ambiente.

## 🔗 Integração com o ZapAPI

No ZapAPI, altere as variáveis de ambiente:

```
EVOLUTION_API_URL=http://seu-servidor:8080
EVOLUTION_API_KEY=sua-chave
```

Os endpoints são compatíveis — o proxy do ZapAPI funcionará sem alterações para:
- Instâncias (create, list, delete, connect)
- Mensagens (texto, mídia, localização, contatos, reações)
- **Novos: botões, listas, carrossel, polls**

## 📡 Endpoints

### Instâncias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/instance/create/:name` | Criar instância |
| GET | `/instance/fetchInstances` | Listar instâncias |
| GET | `/instance/connectionState/:name` | Estado da conexão |
| GET | `/instance/connect/:name` | Conectar (retorna QR) |
| DELETE | `/instance/delete/:name` | Deletar instância |

### Mensagens

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/message/sendText/:name` | Enviar texto |
| POST | `/message/sendMedia/:name` | Enviar mídia |
| POST | `/message/sendLocation/:name` | Enviar localização |
| POST | `/message/sendContact/:name` | Enviar contato |
| POST | `/message/sendReaction/:name` | Enviar reação |
| POST | `/message/sendButtons/:name` | **Botões Quick Reply** 🆕 |
| POST | `/message/sendInteractive/:name` | **Botões CTA** 🆕 |
| POST | `/message/sendList/:name` | **Lista Dropdown** 🆕 |
| POST | `/message/sendPoll/:name` | **Enquete** 🆕 |
| POST | `/message/sendCarousel/:name` | **Carrossel** 🆕 |
| POST | `/message/sendMenu/:name` | Menu de texto |

### Exemplos

#### Botões Quick Reply
```bash
curl -X POST http://localhost:8080/message/sendButtons/minha-instancia \
  -H "apikey: sua-chave" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Escolha uma opção:",
    "buttons": [
      {"id": "opt1", "text": "Opção 1"},
      {"id": "opt2", "text": "Opção 2"},
      {"id": "opt3", "text": "Opção 3"}
    ]
  }'
```

#### Lista Dropdown
```bash
curl -X POST http://localhost:8080/message/sendList/minha-instancia \
  -H "apikey: sua-chave" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Veja nosso cardápio:",
    "buttonText": "Ver opções",
    "sections": [{
      "title": "Lanches",
      "rows": [
        {"id": "1", "title": "Hambúrguer", "description": "R$ 25,00"},
        {"id": "2", "title": "Hot Dog", "description": "R$ 15,00"}
      ]
    }]
  }'
```

#### Carrossel
```bash
curl -X POST http://localhost:8080/message/sendCarousel/minha-instancia \
  -H "apikey: sua-chave" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Nossos produtos:",
    "cards": [
      {
        "body": "Produto A - R$ 99,00",
        "imageUrl": "https://example.com/img1.jpg",
        "buttons": [{"id": "buy_a", "text": "Comprar"}]
      },
      {
        "body": "Produto B - R$ 149,00",
        "imageUrl": "https://example.com/img2.jpg",
        "buttons": [{"id": "buy_b", "text": "Comprar"}]
      }
    ]
  }'
```

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | `8080` |
| `API_KEY` | Chave de autenticação | (obrigatório) |
| `WEBHOOK_URL` | URL para receber eventos | (opcional) |
| `SESSIONS_DIR` | Diretório das sessões | `./sessions` |

## 📋 Notas

- Requer **Node.js 20+**
- Sessões são persistidas no disco e restauradas automaticamente ao reiniciar
- Suporta autenticação via header `apikey` ou `Authorization: Bearer`
- Conta WhatsApp Business não-hosted recomendada para mensagens interativas
