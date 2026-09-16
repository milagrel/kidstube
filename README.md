# 🎬 KidsTube

App estilo YouTube para as crianças verem os vídeos guardados no teu PC, em qualquer tablet, telemóvel ou computador da rede de casa.

## Como instalar (primeira vez)

1. Instala o [Node.js](https://nodejs.org) (versão 18 ou superior)
2. Abre uma janela de terminal nesta pasta e corre:
   - `npm run install-all` — instala tudo
   - `npm run build` — prepara o app
3. (Opcional, recomendado) Instala o [FFmpeg](https://ffmpeg.org) para miniaturas e durações automáticas

> Dica: também podes fazer duplo clique em `instalar.bat` para instalar tudo automaticamente.

## Como usar

1. Coloca os vídeos na pasta `videos/`
   - **Subpastas criam categorias automaticamente** (ex.: `videos/Desenhos/`, `videos/Música/`, `videos/Escola/`)
   - Pasta `videos/privado/` → vídeos escondidos das crianças
   - Miniaturas: coloca uma imagem com o mesmo nome do vídeo (ex.: `ep1.jpg` para `ep1.mp4`)
2. Corre `npm start` (ou faz duplo clique em `iniciar.bat`)
3. Abre http://localhost:4000 no PC
4. Nos tablets/telemóveis da mesma rede Wi-Fi, abre `http://IP-DESTE-PC:4000`
   - Descobre o IP do PC com o comando `ipconfig` (ex.: `192.168.1.10`)

## PIN dos pais

- PIN inicial: **1234**
- Muda nas Definições (ícone de engrenagem ⚙️)

## Funcionalidades

- **Deteção automática** — o servidor procura novos vídeos a cada 30 segundos; basta colocar ficheiros na pasta `videos/` e eles aparecem sozinhos
- **Categorias e playlists** — subpastas viram categorias; playlists criadas pelos miúdos
- **Pesquisa e favoritos** — barra de pesquisa e coração ❤️ nos vídeos
- **Controlo parental** — PIN dos pais, vídeos privados (pasta `privado/`), limite diário de ecrã
- **Upload de vídeos** — envia vídeos pela interface (Definições)
- **Streaming** — suporte a avançar/recuar (range requests)
- **Continuar a ver** — mostra os últimos vídeos vistos

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run install-all` | Instala todas as dependências |
| `npm run dev` | Servidor + app em modo desenvolvimento |
| `npm run build` | Compila o app |
| `npm start` | Corre o app (produção) |

## Estrutura

```
KidsTube/
├── server/          # Backend (Node + Express)
│   ├── index.js     # API + streaming
│   ├── store.js     # Dados (JSON)
│   └── scanner.js   # Procura vídeos nas pastas
├── client/          # Frontend (React + Vite + Tailwind)
├── videos/          # ← coloca aqui os teus vídeos
└── iniciar.bat      # Atalho para Windows
```
