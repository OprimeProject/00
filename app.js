// ORSI - Assistente Pessoal v1.0.0
// Sistema completo de assistente virtual

class ORSI {
    constructor() {
        this.config = this.loadConfig();
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupVoice();
        this.setupChat();
        this.setupConfig();
        this.setupPWA();
        this.greet();
    }

    // === CONFIGURAÇÃO ===
    loadConfig() {
        const defaultConfig = {
            darkMode: true,
            animations: true,
            voiceResponse: true,
            volume: 80,
            weatherApiKey: '',
            newsApiKey: '',
            customApis: {}
        };
        const saved = localStorage.getItem('orsi_config');
        return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    }

    saveConfig() {
        const config = {
            darkMode: document.getElementById('darkMode').checked,
            animations: document.getElementById('animations').checked,
            voiceResponse: document.getElementById('voiceResponse').checked,
            volume: document.getElementById('volume').value,
            weatherApiKey: document.getElementById('weatherApiKey').value,
            newsApiKey: document.getElementById('newsApiKey').value,
            customApis: document.getElementById('customApis').value
        };
        localStorage.setItem('orsi_config', JSON.stringify(config));
        this.config = config;
        this.addMessage('assistant', '✅ Configurações salvas com sucesso!');
    }

    // === NAVEGAÇÃO ===
    setupTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Remove active de todas as tabs
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Ativa a tab clicada
                tab.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }

    // === VOZ ===
    setupVoice() {
        // Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'pt-BR';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('messageInput').value = transcript;
                this.sendMessage(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Erro no reconhecimento de voz:', event.error);
                this.stopListening();
            };

            this.recognition.onend = () => {
                this.stopListening();
            };
        }

        const voiceBtn = document.getElementById('voiceBtn');
        voiceBtn.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });
    }

    startListening() {
        if (!this.recognition) {
            this.addMessage('assistant', '❌ Reconhecimento de voz não suportado neste navegador.');
            return;
        }
        this.isListening = true;
        document.getElementById('voiceBtn').classList.add('active');
        this.recognition.start();
        this.addMessage('assistant', '🎤 Estou ouvindo...');
    }

    stopListening() {
        this.isListening = false;
        document.getElementById('voiceBtn').classList.remove('active');
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    speak(text) {
        if (!this.config.voiceResponse) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.volume = this.config.volume / 100;
        utterance.rate = 1;
        utterance.pitch = 1;
        
        this.synthesis.speak(utterance);
    }

    // === CHAT ===
    setupChat() {
        const sendBtn = document.getElementById('sendBtn');
        const input = document.getElementById('messageInput');

        sendBtn.addEventListener('click', () => {
            const message = input.value.trim();
            if (message) {
                this.sendMessage(message);
                input.value = '';
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = input.value.trim();
                if (message) {
                    this.sendMessage(message);
                    input.value = '';
                }
            }
        });
    }

    addMessage(type, content) {
        const messagesDiv = document.getElementById('messages');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        
        const avatar = type === 'user' ? '👤' : '🤖';
        
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
        
        messagesDiv.appendChild(messageEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async sendMessage(message) {
        this.addMessage('user', message);
        
        // Processa o comando
        const response = await this.processCommand(message);
        this.addMessage('assistant', response);
        
        // Responde por voz
        this.speak(response);
    }

    async processCommand(command) {
        const cmd = command.toLowerCase();

        // Comandos de clima
        if (cmd.includes('clima') || cmd.includes('tempo')) {
            return await this.getWeather();
        }

        // Comandos de notícias
        if (cmd.includes('notícia') || cmd.includes('noticia')) {
            return await this.getNews();
        }

        // Comandos de moeda
        if (cmd.includes('moeda') || cmd.includes('dólar') || cmd.includes('euro')) {
            return await this.convertCurrency();
        }

        // Comandos de hora
        if (cmd.includes('hora') || cmd.includes('fuso')) {
            return await this.getWorldTime();
        }

        // Comandos de tradução
        if (cmd.includes('traduz') || cmd.includes('tradução')) {
            return 'Por favor, use a ferramenta de tradução na aba Ferramentas! 🌐';
        }

        // Comandos de piada
        if (cmd.includes('piada') || cmd.includes('engraçado')) {
            return await this.getJoke();
        }

        // Comandos de citação
        if (cmd.includes('citação') || cmd.includes('frase') || cmd.includes('inspiração')) {
            return await this.getQuote();
        }

        // Comandos de busca
        if (cmd.includes('busca') || cmd.includes('pesquisa') || cmd.includes('procura')) {
            return await this.searchWeb(command);
        }

        // Saudações
        if (cmd.includes('olá') || cmd.includes('oi') || cmd.includes('hey')) {
            return this.greet();
        }

        // Ajuda
        if (cmd.includes('ajuda') || cmd.includes('help')) {
            return this.getHelp();
        }

        // Resposta padrão
        return `Entendi sua mensagem: "${command}". Como posso ajudar? Use "ajuda" para ver os comandos disponíveis.`;
    }

    greet() {
        const hour = new Date().getHours();
        let greeting = 'Olá';
        
        if (hour >= 5 && hour < 12) greeting = 'Bom dia';
        else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
        else greeting = 'Boa noite';

        return `${greeting}! 👋 Eu sou o ORSI, seu assistente pessoal. Como posso ajudá-lo hoje?`;
    }

    getHelp() {
        return `
            📚 <strong>Comandos Disponíveis:</strong><br><br>
            🌤️ <strong>Clima:</strong> "qual o clima?" ou "previsão do tempo"<br>
            📰 <strong>Notícias:</strong> "últimas notícias"<br>
            💱 <strong>Moedas:</strong> "converter moeda" ou "cotação dólar"<br>
            🌍 <strong>Hora:</strong> "que horas são" ou "fuso horário"<br>
            😄 <strong>Piada:</strong> "conte uma piada"<br>
            💭 <strong>Citação:</strong> "frase inspiradora"<br>
            🔍 <strong>Busca:</strong> "buscar [termo]"<br><br>
            Você também pode usar as ferramentas na aba 🛠️!
        `;
    }

    // === FERRAMENTAS ===

    async getWeather() {
        try {
            // Tenta obter localização
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            // API gratuita do Open-Meteo (sem necessidade de key)
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
            );
            const data = await response.json();

            const temp = data.current_weather.temperature;
            const windSpeed = data.current_weather.windspeed;
            const weatherCode = data.current_weather.weathercode;

            const weatherEmoji = this.getWeatherEmoji(weatherCode);

            return `
                ${weatherEmoji} <strong>Clima Atual</strong><br>
                🌡️ Temperatura: ${temp}°C<br>
                💨 Vento: ${windSpeed} km/h<br>
                📍 Sua localização
            `;
        } catch (error) {
            return '❌ Não foi possível obter o clima. Verifique se a localização está ativada.';
        }
    }

    getWeatherEmoji(code) {
        if (code === 0) return '☀️';
        if (code <= 3) return '⛅';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        if (code <= 82) return '🌦️';
        return '⛈️';
    }

    async getNews() {
        try {
            // API de notícias RSS gratuita
            const response = await fetch(
                'https://g1.globo.com/rss/g1/'
            );
            const text = await response.text();
            
            // Parse básico do RSS
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            const items = xml.querySelectorAll('item');
            
            let news = '<strong>📰 Últimas Notícias:</strong><br><br>';
            
            for (let i = 0; i < Math.min(5, items.length); i++) {
                const title = items[i].querySelector('title').textContent;
                const link = items[i].querySelector('link').textContent;
                news += `${i + 1}. <a href="${link}" target="_blank" style="color: var(--primary)">${title}</a><br><br>`;
            }
            
            return news;
        } catch (error) {
            return '❌ Não foi possível carregar as notícias no momento.';
        }
    }

    async convertCurrency() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            
            const brl = data.rates.BRL.toFixed(2);
            const eur = data.rates.EUR.toFixed(2);
            const gbp = data.rates.GBP.toFixed(2);

            return `
                💱 <strong>Cotações (USD):</strong><br><br>
                🇧🇷 Real: R$ ${brl}<br>
                🇪🇺 Euro: € ${(1/eur).toFixed(2)}<br>
                🇬🇧 Libra: £ ${(1/gbp).toFixed(2)}<br>
                <small>Atualizado agora</small>
            `;
        } catch (error) {
            return '❌ Não foi possível obter as cotações no momento.';
        }
    }

    async getWorldTime() {
        try {
            const response = await fetch('https://worldtimeapi.org/api/timezone/America/Sao_Paulo');
            const data = await response.json();
            
            const datetime = new Date(data.datetime);
            const time = datetime.toLocaleTimeString('pt-BR');
            const date = datetime.toLocaleDateString('pt-BR');

            return `
                🌍 <strong>Hora Mundial:</strong><br><br>
                🇧🇷 São Paulo: ${time}<br>
                📅 ${date}<br>
                🕐 Timezone: ${data.timezone}
            `;
        } catch (error) {
            const now = new Date();
            return `
                🕐 <strong>Hora Local:</strong><br>
                ${now.toLocaleTimeString('pt-BR')}<br>
                📅 ${now.toLocaleDateString('pt-BR')}
            `;
        }
    }

    async getQuote() {
        try {
            const response = await fetch('https://api.quotable.io/random');
            const data = await response.json();
            
            return `
                💭 <strong>Citação Inspiradora:</strong><br><br>
                "${data.content}"<br><br>
                <em>— ${data.author}</em>
            `;
        } catch (error) {
            const quotes = [
                { text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier' },
                { text: 'A única forma de fazer um excelente trabalho é amar o que você faz.', author: 'Steve Jobs' },
                { text: 'O futuro pertence àqueles que acreditam na beleza de seus sonhos.', author: 'Eleanor Roosevelt' }
            ];
            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            return `
                💭 <strong>Citação Inspiradora:</strong><br><br>
                "${quote.text}"<br><br>
                <em>— ${quote.author}</em>
            `;
        }
    }

    async getJoke() {
        try {
            const response = await fetch('https://v2.jokeapi.dev/joke/Any?lang=pt&type=single');
            const data = await response.json();
            
            if (data.joke) {
                return `😄 ${data.joke}`;
            } else {
                return this.getFallbackJoke();
            }
        } catch (error) {
            return this.getFallbackJoke();
        }
    }

    getFallbackJoke() {
        const jokes = [
            'Por que o computador foi ao médico? Porque estava com vírus! 😄',
            'O que o processador disse para a memória RAM? Você me completa! 💾',
            'Por que a IA foi ao psicólogo? Para processar seus sentimentos! 🤖'
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
    }

    async searchWeb(query) {
        const searchTerm = query.replace(/busca|pesquisa|procura/gi, '').trim();
        if (!searchTerm) {
            return 'O que você gostaria de buscar? 🔍';
        }
        
        const url = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
        window.open(url, '_blank');
        return `🔍 Abrindo busca por: "${searchTerm}"`;
    }

    translate() {
        return 'Use o Google Tradutor: https://translate.google.com 🌐';
    }

    // === CONFIGURAÇÃO ===
    setupConfig() {
        // Carrega configurações salvas
        document.getElementById('darkMode').checked = this.config.darkMode;
        document.getElementById('animations').checked = this.config.animations;
        document.getElementById('voiceResponse').checked = this.config.voiceResponse;
        document.getElementById('volume').value = this.config.volume;
        document.getElementById('weatherApiKey').value = this.config.weatherApiKey;
        document.getElementById('newsApiKey').value = this.config.newsApiKey;
    }

    // === PWA ===
    setupPWA() {
        let deferredPrompt;
        const installBtn = document.getElementById('installBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                this.addMessage('assistant', 'ℹ️ O app já está instalado ou não pode ser instalado neste dispositivo.');
                return;
            }

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.addMessage('assistant', '✅ ORSI instalado com sucesso!');
            }
            
            deferredPrompt = null;
        });

        window.addEventListener('appinstalled', () => {
            this.addMessage('assistant', '🎉 ORSI foi adicionado à tela inicial!');
        });
    }
}

// Inicializa o ORSI quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    window.orsi = new ORSI();
});

// Registra Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registrado:', reg))
        .catch(err => console.log('Erro ao registrar Service Worker:', err));
}