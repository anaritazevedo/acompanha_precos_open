# 🤖 Bot de Alertas de Preços para Discord (Feito em JS)

![Avatar do Bot](https://i.postimg.cc/fbL8SpTS/Gemini-Generated-Image-m9vgepm9vgepm9vg.png)

Um bot para Discord amigável e eficiente, **desenvolvido em JavaScript**, projetado para monitorar preços de produtos em diversas lojas online e te avisar quando a promoção perfeita aparecer. Nunca mais perca uma oferta!

## ✨ Funcionalidades Principais

- **Monitoramento Multi-Loja:** Acompanhe preços de produtos da **Amazon**, **Shopee** e **Mercado Livre**.
- **Comandos Intuitivos:** Utilize comandos de barra (`/`) modernos e fáceis de usar.
- **Alertas no Canal:** Adicione produtos em canais específicos e receba as notificações de preço no lugar certo.
- **Armazenamento Persistente:** O bot se lembra dos produtos monitorados mesmo que seja reiniciado.
- **Personalizável:** Código aberto e pronto para ser expandido para novas lojas e funcionalidades.

## 🚀 Como Usar

Interagir com o bot é simples. Todos os comandos usam a interface de *slash commands* (`/`) do Discord.

### `/adicionar`
Adiciona um novo produto à lista de monitoramento do canal.

- **`url`**: O link completo do produto que você quer acompanhar.
- **`preco_alvo`**: O preço que, se atingido ou ficar abaixo, acionará o alerta.
> **Exemplo:** `/adicionar url:https://link.do.produto preco_alvo:150.00`

### `/listar`
Mostra uma lista organizada de todos os produtos que estão sendo monitorados no canal atual. Cada item é numerado, facilitando a remoção.
> **Exemplo:** `/listar`

### `/remover`
Remove um produto da lista de monitoramento do canal.

- **`numero`**: O número do produto que aparece na lista gerada pelo comando `/listar`.
> **Exemplo:** `/remover numero:2`

---

## 🔧 Como Instalar e Hospedar o Bot

Você pode hospedar sua própria instância deste bot seguindo os passos abaixo.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v16.9.0 ou superior) instalado.
- Conhecimento básico de como usar o terminal ou prompt de comando.

### 1. Clonar ou Baixar o Projeto
Baixe ou clone os arquivos do projeto para o seu computador.
```bash
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
cd seu-repositorio
