# INTERROGAR — Transcrição de Interrogatórios

Ferramenta simples para:

1. Colar um link do YouTube.
2. Obter a transcrição/legenda disponível.
3. Editar a transcrição.
4. Copiar uma versão preparada para o Discord.

## Estrutura

```text
interrogatorio-app/
├── index.html
├── style.css
├── app.js
├── config.js
├── backend/
│   ├── app.py
│   └── requirements.txt
└── README.md
```

## Importante: GitHub Pages

O frontend pode ficar diretamente no GitHub Pages. GitHub Pages publica ficheiros estáticos e não executa Python/PHP no servidor. Por isso, a obtenção automática das legendas do YouTube usa o pequeno backend em `backend/`.

Fonte: documentação oficial do GitHub Pages.

## 1. Publicar o frontend

Coloca estes ficheiros na raiz de um repositório GitHub e ativa:

`Settings → Pages → Deploy from a branch → main → /(root)`

Depois abre o URL do Pages.

## 2. Executar o backend localmente

Instala Python 3.10+.

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Instala as dependências:

```bash
pip install -r requirements.txt
```

Executa:

```bash
python app.py
```

O backend fica em:

`http://127.0.0.1:8000`

## 3. Configurar o frontend

No `config.js` está:

```js
window.APP_CONFIG = {
  API_BASE_URL: "http://127.0.0.1:8000"
};
```

Quando hospedares o backend, substitui pelo URL público.

## 4. Funcionamento sem backend

Mesmo sem backend, a aplicação continua utilizável: cola manualmente a transcrição no campo principal, edita e usa **Copiar para Discord**.

## Nota sobre o YouTube

A biblioteca usada no backend recupera legendas/transcrições disponíveis, incluindo legendas geradas automaticamente. Vídeos sem legendas disponíveis, vídeos privados ou bloqueios do YouTube podem impedir a obtenção automática.
