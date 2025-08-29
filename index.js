const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs'); 
const { URL } = require('url'); 


require('dotenv').config();
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; 
const ARQUIVO_PRODUTOS = 'produtos.json';
const INTERVALO_MINUTOS = 30;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

async function obterPreco(url) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    try {
        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data); // O '$' é o equivalente ao 'soup' do BeautifulSoup
        const domain = new URL(url).hostname;

        let precoStr = null;

        if (domain.includes('amazon')) {
            const precoInteiro = $('.a-price-whole').first().text().replace('.', '').trim();
            const precoFracao = $('.a-price-fraction').first().text().trim();
            if (precoInteiro && precoFracao) {
                precoStr = `${precoInteiro},${precoFracao}`;
            } else {
                precoStr = $('.a-offscreen').first().text();
            }
        } else if (domain.includes('mercadolivre')) {
            precoStr = $('.andes-money-amount__fraction').first().text();
        } else if (domain.includes('shopee')) {
            precoStr = $('._3_FVSo').first().text();
        }

        if (precoStr) {
            const precoLimpo = precoStr.replace(/[^\d,.]/g, '');
            const precoFormatado = precoLimpo.replace('.', '').replace(',', '.');
            return parseFloat(precoFormatado);
        }

    } catch (error) {
        console.error(`Erro ao extrair o preço para ${url}:`, error.message);
        return null;
    }
    console.log(`Não foi possível encontrar o preço ou o site não é suportado: ${url}`);
    return null;
}

function carregarDados() {
    if (!fs.existsSync(ARQUIVO_PRODUTOS)) {
        return {};
    }
    const dados = fs.readFileSync(ARQUIVO_PRODUTOS, 'utf-8');
    return JSON.parse(dados);
}

function salvarDados(dados) {
    fs.writeFileSync(ARQUIVO_PRODUTOS, JSON.stringify(dados, null, 4), 'utf-8');
}

const commands = [
    {
        name: 'adicionar',
        description: 'Adiciona um produto para monitoramento de preço.',
        options: [
            { name: 'url', type: 3, description: 'O link do produto.', required: true },
            { name: 'preco_alvo', type: 10, description: 'O preço para o alerta.', required: true },
        ],
    },
    {
        name: 'listar',
        description: 'Mostra todos os produtos monitorados neste canal.',
    },
    {
        name: 'remover',
        description: 'Remove um produto da lista de monitoramento.',
        options: [
            { name: 'numero', type: 4, description: 'O número do produto na lista.', required: true },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Iniciando o registro dos comandos (/)');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        console.log('Comandos (/) registrados com sucesso.');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;
    const dados = carregarDados();
    const idCanal = interaction.channel.id;

    if (commandName === 'adicionar') {
        await interaction.deferReply();
        const url = interaction.options.getString('url');
        const precoAlvo = interaction.options.getNumber('preco_alvo');

        if (!dados[idCanal]) dados[idCanal] = [];
        if (dados[idCanal].some(p => p.url === url)) {
            return interaction.editReply('Este produto já está sendo monitorado neste canal.');
        }

        const precoInicial = await obterPreco(url);
        if (precoInicial === null) {
            return interaction.editReply('Desculpe, não consegui encontrar o preço. O site pode não ser suportado.');
        }

        dados[idCanal].push({ url, preco_alvo: precoAlvo, preco_inicial: precoInicial });
        salvarDados(dados);
        await interaction.editReply(`Produto adicionado! Preço atual: R$${precoInicial.toFixed(2)}. Alerta para R$${precoAlvo.toFixed(2)} ou menos.`);
    }

    if (commandName === 'listar') {
        if (!dados[idCanal] || dados[idCanal].length === 0) {
            return interaction.reply('Nenhum produto sendo monitorado. Use `/adicionar`.');
        }
        const embed = new EmbedBuilder()
            .setTitle("Produtos Monitorados")
            .setColor(0x0099FF);
        
        dados[idCanal].forEach((produto, idx) => {
            embed.addFields({ name: `${idx + 1}. Produto`, value: `**Preço Alvo:** R$${produto.preco_alvo.toFixed(2)}\n**URL:** [Link](${produto.url})` });
        });
        await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'remover') {
        const numero = interaction.options.getInteger('numero');
        if (!dados[idCanal] || dados[idCanal].length === 0) {
            return interaction.reply('Nenhum produto para remover.');
        }
        if (numero > 0 && numero <= dados[idCanal].length) {
            const removido = dados[idCanal].splice(numero - 1, 1);
            salvarDados(dados);
            await interaction.reply(`Produto removido com sucesso: ${removido[0].url}`);
        } else {
            await interaction.reply('Número inválido. Use `/listar` para ver o número de cada produto.');
        }
    }
});

async function verificarPrecos() {
    console.log("Verificando preços...");
    const dados = carregarDados();
    for (const idCanal in dados) {
        try {
            const canal = await client.channels.fetch(idCanal);
            if (!canal) continue;
            
            const produtosParaRemover = [];

            for (const produto of dados[idCanal]) {
                const precoAtual = await obterPreco(produto.url);
                if (precoAtual !== null && precoAtual <= produto.preco_alvo) {
                    const desconto = (produto.preco_inicial || precoAtual) - precoAtual;
                    const embed = new EmbedBuilder()
                        .setTitle("🎉 Alerta de Preço! 🎉")
                        .setDescription("O produto que você monitora atingiu o preço desejado!")
                        .setColor(0x00FF00)
                        .addFields(
                            { name: "Produto", value: `[Clique para ver](${produto.url})` },
                            { name: "Preço Alvo", value: `R$ ${produto.preco_alvo.toFixed(2)}`, inline: true },
                            { name: "Preço Atual", value: `**R$ ${precoAtual.toFixed(2)}**`, inline: true }
                        );
                    if (desconto > 0) {
                        embed.addFields({ name: "Valor do Desconto", value: `R$ ${desconto.toFixed(2)}`, inline: true });
                    }
                    await canal.send({ embeds: [embed] });
                    produtosParaRemover.push(produto);
                }
            }

            if (produtosParaRemover.length > 0) {
                dados[idCanal] = dados[idCanal].filter(p => !produtosParaRemover.includes(p));
                salvarDados(dados);
            }
        } catch (error) {
            console.error(`Erro ao processar canal ${idCanal}:`, error.message);
        }
    }
    console.log("Verificação de preços concluída.");
}

client.once('ready', () => {
    console.log(`${client.user.tag} está online e pronto para monitorar preços!`);

    setInterval(verificarPrecos, INTERVALO_MINUTOS * 60 * 1000);
});

client.login(TOKEN);
