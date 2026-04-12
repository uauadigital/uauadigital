document.addEventListener('DOMContentLoaded', () => {

    // --- Player de Rádio Integrado ---
    const radioAudio = document.getElementById('hlsAudio');
    const radioPlayBtn = document.getElementById('radioPlayBtn');
    // Usando stream AAC direto (livre de restrições de CORS e HLS) que funciona nativamente
    const radioStreamUrl = 'https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC.aac';

    if (radioPlayBtn && radioAudio) {
        radioPlayBtn.addEventListener('click', () => {
            if (radioAudio.paused) {
                radioPlayBtn.innerHTML = '<i data-lucide="loader"></i> <span>Carregando...</span>';
                radioPlayBtn.classList.add('loading');
                lucide.createIcons();

                const updateRadioUI = (isPlaying) => {
                    radioPlayBtn.classList.remove('loading');
                    if (isPlaying) {
                        radioPlayBtn.innerHTML = '<i data-lucide="pause-circle"></i> <span>Pausar Rádio</span>';
                        radioPlayBtn.classList.add('playing');
                    } else {
                        radioPlayBtn.innerHTML = '<i data-lucide="play-circle"></i> <span>Rádio CBN</span>';
                        radioPlayBtn.classList.remove('playing');
                    }
                    lucide.createIcons();
                };

                // Configura a URL nativa no elemento
                if (radioAudio.src !== radioStreamUrl) {
                    radioAudio.src = radioStreamUrl;
                }
                
                // Força o play nativo (promise lida com bloqueios de navegador)
                radioAudio.play().then(() => {
                    updateRadioUI(true);
                }).catch(e => {
                    console.error("Erro ao tocar rádio (Pode ser bloqueio de autoplay):", e);
                    radioPlayBtn.innerHTML = '<i data-lucide="alert-circle"></i> <span>Erro ao Tocar</span>';
                    radioPlayBtn.classList.remove('loading');
                    lucide.createIcons();
                    setTimeout(() => updateRadioUI(false), 3000);
                });

            } else {
                radioAudio.pause();
                radioPlayBtn.classList.remove('playing');
                radioPlayBtn.innerHTML = '<i data-lucide="play-circle"></i> <span>Rádio CBN</span>';
                lucide.createIcons();
            }
        });
    }

    // --- Fallback de Imagem (Segurança e Originalidade) ---
    // Se uma imagem original falhar, exibe o logo da marca e o nome em um placeholder profissional
    window.handleImageError = function(img, title) {
        if (img.dataset.triedFallback === 'true') return;
        img.dataset.triedFallback = 'true';
        
        const wrapper = img.closest('.generative-fill-wrapper') || img.parentElement;
        
        if (wrapper) {
            wrapper.innerHTML = `
                <div class="branded-placeholder">
                    <img src="topo_site.png" alt="Uauá Digital">
                </div>
            `;
            wrapper.style.position = 'relative'; 
            if (wrapper.offsetHeight < 100) wrapper.style.minHeight = '180px';
        }
        console.log(`Fallback aplicado para: ${title}`);
    };



    // --- Gerador Dinâmico de Notícias (Adequado ao novo formato News) ---
    // Elementos do Carousel Principal
    const heroTrack = document.getElementById('heroTrack');
    const heroIndicators = document.getElementById('heroIndicators');
    const heroPrev = document.getElementById('heroPrev');
    const heroNext = document.getElementById('heroNext');

    async function initHeroCarousel() {
        if (!heroTrack || !heroIndicators) return;

        heroTrack.innerHTML = '<div style="padding: 40px; text-align: center; width: 100%; color: #666; font-size: 14px;">[ Parceiro Uauá em Foco ] Carregando destaques principais...</div>';
        
        // Categorias para o Carrossel
        const categories = [
            { name: "Uauá", slug: "uaua" },
            { name: "Bahia", slug: "bahia" },
            { name: "Brasil", slug: "brasil" },
            { name: "Polícia", slug: "policia" },
            { name: "Mundo", slug: "mundo" }
        ];

        let slidesData = [];
        // Busca do Blogger (Oficial), G1 Bahia, Carlos Britto e do feed geral simultaneamente
        const [bloggerNews, g1News, cbNews, generalNews] = await Promise.all([
            fetchBloggerNews(),
            fetchG1Bahia(),
            fetchCarlosBritto(false), 
            fetchUauaEmFoco('feed', false)
        ]);
        
        // Prioridade: Notícias do Blogger vêm primeiro, depois intercala as outras fontes
        slidesData = [...bloggerNews, ...interleaveNews([g1News, cbNews, generalNews])];
        
        // Ordenação por data (Mais recente primeiro) para os slides também
        slidesData.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });

        slidesData = slidesData.slice(0, 13);

        // Caso algo falhe, preenche com um backup padrão
        if (slidesData.length === 0) {
            heroTrack.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">Nenhum destaque encontrado no momento. Tentando novamente...</div>';
            return;
        }

        const totalSlides = slidesData.length;
        let slidesHtml = '';
        let indicatorsHtml = '';
        
        slidesData.forEach((item, i) => {
            const activeClass = i === 0 ? 'active' : '';
            let imgUrl = item.thumbnail || `topo_site.png`;
            
            // Extract excerpt safely
            let excerptText = item.fullContent ? item.fullContent.replace(/<[^>]+>/g, '').trim() : '';
            if (excerptText.length > 140) excerptText = excerptText.substring(0, 140) + '...';
            
            slidesHtml += `
            <div class="carousel-slide ${activeClass}" data-index="${i}" onclick="window.openArticle('${item.link}')" style="cursor: pointer;">
                <div class="generative-fill-wrapper">
                    <img src="${imgUrl}" class="fill-blur" aria-hidden="true">
                    <img src="${imgUrl}" alt="${item.title}" class="fill-main" onerror="handleImageError(this, '${item.title.replace(/'/g, "\\'")}')">
                </div>
                <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <span class="category-tag">${item.tag}</span>
                        <h2>${item.title}</h2>
                        <p class="hero-excerpt">${excerptText}</p>
                        <div class="meta">
                            <i data-lucide="clock" style="width: 14px; height: 14px;"></i> Há ${Math.floor(Math.random() * 5) + 1} horas
                        </div>
                    </div>
            </div>`;
            indicatorsHtml += `<div class="indicator ${activeClass}" data-slide="${i}"></div>`;
        });
        
        heroTrack.innerHTML = slidesHtml;
        heroIndicators.innerHTML = indicatorsHtml;

        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.indicator');
        let currentSlide = 0;
        let slideInterval;

        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            
            currentSlide = (index + totalSlides) % totalSlides;
            
            heroTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        function nextSlide() { goToSlide(currentSlide + 1); }
        function prevSlide() { goToSlide(currentSlide - 1); }

        if (heroPrev) {
            heroPrev.replaceWith(heroPrev.cloneNode(true));
            document.getElementById('heroPrev').addEventListener('click', () => { prevSlide(); resetInterval(); });
        }
        if (heroNext) {
            heroNext.replaceWith(heroNext.cloneNode(true));
            document.getElementById('heroNext').addEventListener('click', () => { nextSlide(); resetInterval(); });
        }
        
        document.querySelectorAll('.indicator').forEach(dot => {
            dot.addEventListener('click', (e) => {
                goToSlide(parseInt(e.target.dataset.slide));
                resetInterval();
            });
        });

        function resetInterval() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 7000); // 7s auto-slide
        }
        resetInterval();
    }

    const rssCache = {};
    window.allNewsItems = {};

    // Função utilitária para intercalar notícias de múltiplas fontes
    function interleaveNews(sources) {
        const result = [];
        const maxLen = Math.max(...sources.map(s => s.length));
        for (let i = 0; i < maxLen; i++) {
            sources.forEach(source => {
                if (source[i]) result.push(source[i]);
            });
        }
        return result;
    }

    // Integração com o Servidor Oficial (Blogger / Blogspot)
    async function fetchBloggerNews() {
        // Blog ID fornecido: 5868213504649634211
        const blogId = '5868213504649634211';
        const url = `https://www.blogger.com/feeds/${blogId}/posts/default?alt=json&max-results=5`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.feed || !data.feed.entry) return [];
            
            return data.feed.entry.map(item => {
                const title = item.title.$t;
                const link = item.link.find(l => l.rel === 'alternate').href;
                const content = item.content.$t;
                
                // Extração de Imagem Robusta: Tenta thumbnail oficial, depois regex no conteúdo
                let imgUrl = item.media$thumbnail ? item.media$thumbnail.url : null;
                
                // Se for URL do Blogger/Googleusercontent, tenta forçar alta resolução
                if (imgUrl && imgUrl.includes('googleusercontent.com')) {
                    // Substitui parâmetros de redimensionamento (ex: s72-w640 ou s72-c) por s1600 (original/alta)
                    imgUrl = imgUrl.replace(/\/s[0-9]+.*?\//, '/s1600/');
                } else if (imgUrl && imgUrl.includes('bp.blogspot.com')) {
                    imgUrl = imgUrl.replace('s72-c', 's1600');
                }

                if (!imgUrl) {
                    const match = content.match(/<img[^>]+src="([^">]+)"/i);
                    if (match) imgUrl = match[1];
                }

                const newsPiece = {
                    title: title,
                    link: link,
                    thumbnail: imgUrl,
                    fullContent: content,
                    tag: 'Redação Uauá Digital.', // Selo oficial de conteúdo original
                    isBlogger: true,
                    date: item.published.$t || item.updated.$t
                };
                
                window.allNewsItems[link] = newsPiece;
                return newsPiece;
            });
        } catch (err) {
            console.error("Erro ao buscar notícias do Blogger:", err);
            return [];
        }
    }

    // Integração com Carlos Britto
    async function fetchCarlosBritto(isBahia = false) {
        const feedUrl = isBahia ? 'https://www.carlosbritto.com/secao/bahia/feed/' : 'https://www.carlosbritto.com/feed/';
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.status !== 'ok' || !data.items) return [];
            
            return data.items.map(item => {
                let imgUrl = item.thumbnail || (item.enclosure ? item.enclosure.link : null);
                if (!imgUrl && (item.content || item.description)) {
                    const contentStr = item.content || item.description;
                    const match = contentStr.match(/<img[^>]+src="([^">]+)"/i);
                    if (match) imgUrl = match[1];
                }

                const newsPiece = {
                    title: item.title,
                    link: item.link || '#',
                    thumbnail: imgUrl,
                    fullContent: item.content || item.description || 'Conteúdo não disponível.',
                    tag: 'CARLOS BRITTO',
                    date: item.pubDate
                };
                return newsPiece;
            })
            .filter(item => item.thumbnail) // Apenas com imagens
            .slice(0, 5) // Pega até 5 destaques
            .map(item => { window.allNewsItems[item.link] = item; return item; });
        } catch (err) {
            console.error("Erro ao buscar Carlos Britto:", err);
            return [];
        }
    }

    // Integração com o G1 Bahia
    async function fetchG1Bahia() {
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://g1.globo.com/dynamo/ba/bahia/rss2.xml')}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.status !== 'ok' || !data.items) return [];
            
            return data.items.map(item => {
                // Tenta extrair imagem do enclosure ou thumbnail
                let imgUrl = item.thumbnail || (item.enclosure ? item.enclosure.link : null);
                
                // Fallback para extração de imagem no conteúdo se não houver thumbnail corrigido
                if (!imgUrl && item.description) {
                    const match = item.description.match(/<img[^>]+src="([^">]+)"/i);
                    if (match) imgUrl = match[1];
                }

                const newsPiece = {
                    title: item.title,
                    link: item.link || '#',
                    thumbnail: imgUrl,
                    fullContent: item.content || item.description || 'Conteúdo não disponível.',
                    tag: 'G1 BAHIA',
                    date: item.pubDate
                };
                return newsPiece;
            })
            .filter(item => item.thumbnail) // Apenas com imagens
            .slice(0, 5) // Pega até 5 destaques
            .map(item => { window.allNewsItems[item.link] = item; return item; });
        } catch (err) {
            console.error("Erro ao buscar G1 Bahia:", err);
            return [];
        }
    }
    

    // Integração com a CNN Brasil (Principal)
    async function fetchCNNBrasil() {
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://www.cnnbrasil.com.br/feed/')}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.status !== 'ok' || !data.items) return [];
            
            return data.items.map(item => {
                let imgUrl = item.thumbnail || (item.enclosure ? item.enclosure.link : null);
                if (!imgUrl && (item.content || item.description)) {
                    const match = (item.content || item.description).match(/<img[^>]+src="([^">]+)"/i);
                    if (match) imgUrl = match[1];
                }

                const newsPiece = {
                    title: item.title,
                    link: item.link || '#',
                    thumbnail: imgUrl,
                    fullContent: item.content || item.description || 'Conteúdo não disponível.',
                    tag: 'CNN BRASIL',
                    date: item.pubDate
                };
                return newsPiece;
            })
            .filter(item => item.thumbnail)
            .slice(0, 6)
            .map(item => { window.allNewsItems[item.link] = item; return item; });
        } catch (err) {
            console.error("Erro ao buscar CNN Brasil:", err);
            return [];
        }
    }

    // Integração com o G1 Mundo
    async function fetchG1Mundo() {
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://g1.globo.com/dynamo/mundo/rss2.xml')}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.status !== 'ok' || !data.items) return [];
            
            return data.items.map(item => {
                let imgUrl = item.thumbnail || (item.enclosure ? item.enclosure.link : null);
                if (!imgUrl && (item.content || item.description)) {
                    const match = (item.content || item.description).match(/<img[^>]+src="([^">]+)"/i);
                    if (match) imgUrl = match[1];
                }

                const newsPiece = {
                    title: item.title,
                    link: item.link || '#',
                    thumbnail: imgUrl,
                    fullContent: item.content || item.description || 'Conteúdo não disponível.',
                    tag: 'G1 MUNDO',
                    date: item.pubDate
                };
                return newsPiece;
            })
            .filter(item => item.thumbnail)
            .slice(0, 6)
            .map(item => { window.allNewsItems[item.link] = item; return item; });
        } catch (err) {
            console.error("Erro ao buscar G1 Mundo:", err);
            return [];
        }
    }

    // Integração manual com as notícias mais recentes do SINDPOC (Snapshot Coletado)
    async function fetchSindpocNews() {
        const stories = [
            {
                title: "Servidor celebra a conquista da substituição para investigadores e escrivães no interior baiano",
                link: "https://www.sindpoc.org.br/noticias/detalhe/11091",
                thumbnail: "https://sindpoc.org.br/images/noticias/thumbnail/1775831483.jpg",
                fullContent: "A substituição para investigadores e escrivães no interior baiano tem sido motivo de celebração entre os servidores da Polícia Civil. Na Delegacia de Pindobaçu, o Escrivão de Polícia (EPC) Marcos Sérgio, lotado na Delegacia Territorial de Senhor do Bonfim, destacou a importância da medida, conquistada pela atual gestão do sindicato. O escrivão ressalta que a possibilidade de atuar em regime de substituição tem contribuído para o fortalecimento das unidades no interior, garantindo maior presença e continuidade dos serviços policiais. “Estou substituindo aqui desde junho do ano passado, graças ao sindicato, que proporcionou essa oportunidade de atuar também em outras delegacias. Isso fortalece o nosso trabalho e contribui diretamente para a segurança da população”, comemora o servidor. A iniciativa representa um avanço para a categoria ao ampliar a valorização dos investigadores e escrivães e melhorar a cobertura das delegacias em regiões estratégicas do estado.",
                tag: "SINDPOC",
                date: "2026-04-11 10:00:00"
            },
            {
                title: "Investigador Tiago Freitas anuncia apoio à campanha salarial durante visita ao DEIC",
                link: "https://www.sindpoc.org.br/noticias/detalhe/11089",
                thumbnail: "https://sindpoc.org.br/images/noticias/thumbnail/1775759315.jpg",
                fullContent: "Durante visita realizada nesta quinta-feira (9), à sede do DEIC, o presidente do Sindpoc, Eustácio Lopes, acompanhado do diretor Érico Araújo, participou de um encontro com policiais civis da unidade para dialogar sobre a campanha salarial da categoria. A reunião foi articulada a convite do investigador Tiago Freitas que reuniu os colegas para discutir sobre a importância da mobilização da categoria. Na ocasião, Tiago Freitas ressaltou a necessidade de mudanças estruturais para melhorar a qualidade de vida da categoria. O investigador também reforçou o compromisso em apoiar a campanha e contribuir na mobilização dos servidores da unidade, incentivando a participação de todos, sindicalizados ou não, em prol de melhores condições para os policiais civis e suas famílias.",
                tag: "SINDPOC",
                date: "2026-04-10 16:30:00"
            },
            {
                title: "SINDPOC acompanha investigador em oitiva no Fórum de Buerarema e reafirma compromisso com a categoria",
                link: "https://www.sindpoc.org.br/noticias/detalhe/11088",
                thumbnail: "https://sindpoc.org.br/images/noticias/thumbnail/1775758781.jpg",
                fullContent: "Na manhã desta quinta-feira (9), o SINDPOC reforçou sua atuação no interior do estado ao acompanhar um investigador da Polícia Civil (IPC) durante procedimento investigativo conduzido pelo Ministério Público, no Fórum Genaro José de Oliveira, na Comarca de Buerarema. A comitiva foi composta pelo diretor jurídico do sindicato, Roberto Cerqueira, e pelo advogado Ricardo da Silva, representante do escritório parceiro de Valdimiro Eutímio. A presença da entidade teve como objetivo assegurar o respeito às prerrogativas legais do servidor ao longo de todo o processo. A assessoria jurídica do SINDPOC demonstrou confiança no desfecho do caso e destacou que a consistência das provas e a condução técnica da apuração tendem a resultar em um resultado favorável. “Nossa prioridade é a busca pela justiça e o suporte integral ao nosso associado”, ressaltou a diretoria.",
                tag: "SINDPOC",
                date: "2026-04-10 14:15:00"
            },
            {
                title: "CONVOCAÇÃO GERAL!",
                link: "https://www.sindpoc.org.br/noticias/detalhe/11087",
                thumbnail: "https://sindpoc.org.br/images/noticias/thumbnail/1775669410.jpg",
                fullContent: "O Sindicato dos Policiais Civis do Estado da Bahia convoca toda a categoria para um momento decisivo na luta por valorização e melhores condições de trabalho. Julgamento dos Embargos de Declaração do nosso Mandado de Injunção. Local: Tribunal de Justiça do Estado da Bahia. Data: 22 de abril de 2026. Horário: 08h30. Sala de Sessões do Órgão Especial. Sem investigação, não há segurança pública!",
                tag: "SINDPOC",
                date: "2026-04-09 11:00:00"
            },
            {
                title: "Diretor do Sindpoc destaca avanços e desafios à frente da Secretaria de Segurança e Ordem Pública de Itabuna",
                link: "https://www.sindpoc.org.br/noticias/detalhe/11086",
                thumbnail: "https://sindpoc.org.br/images/noticias/thumbnail/1775502105.jpg",
                fullContent: "O escrivão aposentado, diretor do Sindpoc e atual secretário de Ordem Pública e Segurança de Itabuna, Roberto José, tem conduzido um trabalho estratégico à frente da pasta, que reúne áreas essenciais como segurança, ordenamento urbano e defesa civil. Há cerca de dois meses no cargo, o dirigente ressalta a importância da secretaria para o município e destaca a atuação integrada com as forças de segurança e o papel da Guarda Civil Municipal, que desenvolve ações de proteção ao patrimônio e patrulhamento comunitário. A cidade, cortada pelo rio Colônia e com características que exigem atenção especial da Defesa Civil, impõe desafios que, segundo o gestor, vêm sendo enfrentados com planejamento e dedicação. Roberto José ressalta que a gestão tem buscado responder às demandas da população, com ações práticas e constantes. “O trabalho está caminhando bem. É uma secretaria muito importante, que atua em três pilares: segurança, ordem pública e defesa civil. Temos a confiança do prefeito Augusto Castro e estamos avançando with ações que a sociedade tem aprovado.”",
                tag: "SINDPOC",
                date: "2026-04-08 15:45:00"
            },
            {
                title: "Ato de desagravo em apoio à investigadora Júlia mobiliza policiais civis de Itabuna",
                link: "https://www.sindpoc.org.br/noticias/detalhe/11085",
                thumbnail: "https://sindpoc.org.br/images/noticias/thumbnail/1775495491.jpg",
                fullContent: "Um ato de desagravo em apoio à investigadora Júlia Débora reuniu policiais civis na manhã desta segunda-feira (5), em Itabuna, no Sul da Bahia. A mobilização foi promovida pelo Sindicato dos Policiais Civis do Estado da Bahia (SINDPOC) e contou com a presença do presidente da entidade, Eustácio Lopes, dos diretores Roberto Cerqueira, Jackson Freitas e Rui Alves, e do segundo vice-presidente, Mário Filho. A iniciativa teve como objetivo manifestar solidariedade à servidora diante de episódios considerados desrespeitosos no ambiente de trabalho. Durante o ato, representantes da categoria destacaram a importância do respeito institucional e da valorização dos profissionais da Polícia Civil e reforçaram que situações de exposição indevida e conflitos internos devem ser tratadas with responsabilidade e dentro dos princípios que regem a administração pública. A mobilização também serviu como um chamado à união da categoria, com a mensagem #SomosTodosJúlia entre os presentes. A investigadora Júlia Débora relembrou sua trajetória de mais de duas décadas no serviço público estadual, iniciada em abril de 2004, sempre pautada pelo respeito mútuo, responsabilidade e compromisso com os princípios da legalidade, impessoalidade, moralidade e eficiência. A servidora relatou que foi surpreendida por um episódio de tratamento desrespeitoso por parte de um delegado plantonista, com quem mantinha relação profissional harmoniosa, situação que se repetiu posteriormente. \"Esse delegado, inclusive, já teve problemas com vários colegas. Não sou a primeira!\", salientou a servidora. Júlia também denunciu ter sido alvo de exposição indevida em grupos de WhatsApp, por meio de informações inverídicas e ofensivas à sua honra e à categoria. “Hoje, me sinto envergonhada e injustiçada, mas também amparada e grata aos colegas que me conhecem e que estão me apoiando neste momento”, afirmou. Durante o ato, o SINDPOC reafirmou seu compromisso com a defesa dos direitos e da dignidade dos policiais civis baianos e destacou que não tolera qualquer forma de desrespeito ou ataque à honra de seus filiados.",
                tag: "SINDPOC",
                date: "2026-04-06 10:20:00"
            }
        ];
        
        // Registra notícias no pool global e retorna
        stories.forEach(item => { window.allNewsItems[item.link] = item; });
        return stories;
    }

    // Função auxiliar para embaralhar arrays (Fisher-Yates)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Integração com portal parceiro: Uauá em Foco via rss2json (Bypass de CORS e Parser Automático)
    async function fetchUauaEmFoco(category, isRegion = false) {
        const cacheKey = category + (isRegion ? "_region" : "");
        if (rssCache[cacheKey]) return rssCache[cacheKey]; // Retorna rápido via memória

        // Se for filtro regional, buscar no feed geral do site e depois filtrar pelas cidades
        const feedPath = (category === 'feed' || !category) ? 'feed' : `category/${category}/feed`;
        const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://uauaemfoco.com/${feedPath}`)}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status !== 'ok' || !data.items) return []; // Validação de retorno
            
            const result = [];
            
            const regionKeywords = ['juazeiro', 'monte santo', 'petrolina', 'canudos', 'euclides da cunha', 'irecê', 'região norte', 'curaçá', 'sobradinho', 'senhor do bonfim'];
            
            for(let i = 0; i < data.items.length; i++) {
                const item = data.items[i];
                const titleText = item.title ? item.title.replace("<![CDATA[", "").replace("]]>", "") : 'Portal Parceiro';
                
                // Filtro de Curadoria: Remove notícias indesejadas ou irrelevantes
                if (titleText.toLowerCase().includes("calor extremo na índia")) continue;
                
                // Aplica filtro de palavras-chave caso seja a prateleira Região
                if (isRegion) {
                    const textContent = (titleText + " " + (item.description || item.content || "")).toLowerCase();
                    const isMatch = regionKeywords.some(kw => textContent.includes(kw));
                    if (!isMatch) continue; // Pula a notícia se não citar nenhuma das cidades
                }
                
                // Pega imagem extraída pelo RSS2JSON (thumbnail) ou faz fallback via regex
                let imgUrl = item.thumbnail;
                if (!imgUrl && (item.content || item.description)) {
                    const contentStr = item.content || item.description;
                    const match = contentStr.match(/<img[^>]+src="([^">]+)"/i);
                    if (match) imgUrl = match[1];
                }

                // REMOVE E SUBSTITUI: Se não encontrou imagem, ignora esta notícia e tenta a próxima
                if (!imgUrl) continue; 
                
                const newsPiece = {
                    title: titleText,
                    link: item.link || '#',
                    thumbnail: imgUrl,
                    fullContent: item.content || item.description || 'Desculpe, o texto completo da notícia não pôde ser carregado.',
                    tag: category === 'feed' ? 'Últimas' : category.toUpperCase(),
                    date: item.pubDate
                };
                result.push(newsPiece);
                window.allNewsItems[newsPiece.link] = newsPiece;
                
                if (result.length >= 12) break; // Aumentado para garantir pool maior de diversidade
            }
            rssCache[cacheKey] = result;
            return result;
        } catch (err) { console.error(`Falha ao buscar feed de ${category}:`, err); }
        return [];
    }

    async function populateShelf(catElementId, wpCategory, isRegion = false) {
        const track = document.getElementById(`shelf-${catElementId}`);
        if(!track) return;
        
        track.innerHTML = '<div style="padding: 20px; font-weight: bold; font-size: 14px;">[ Parceiro Uauá em Foco ] Carregando as últimas notícias...</div>';
        let noticias = await fetchUauaEmFoco(wpCategory, isRegion);
        
        // Busca notícias do Blogger e fontes externas
        const bloggerNews = await fetchBloggerNews();
        
        // Se for a prateleira da Bahia, inclui as notícias do G1, Carlos Britto e SINDPOC
        if (wpCategory === 'bahia') {
            const [g1News, cbNews, sindpocNews] = await Promise.all([
                fetchG1Bahia(),
                fetchCarlosBritto(true),
                fetchSindpocNews()
            ]);
            // Combina todas as fontes para "Giro pela Bahia"
            noticias = [...g1News, ...cbNews, ...noticias, ...sindpocNews];
        } else if (wpCategory === 'uaua') {
            // Em Uauá, as notícias do Blogger (Redação) vêm sempre no topo
            noticias = [...bloggerNews, ...noticias];
        }
        
        if (noticias.length > 0) {
            // Ordenação por data (Mais recente primeiro)
            noticias.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
            });
            
            let html = '';
            noticias.forEach((item, index) => {
                let imgUrl = item.thumbnail || `topo_site.png`;
                if (!item.thumbnail && item.content) {
                    const match = item.content.match(/<img[^>]+src="([^">]+)"/);
                    if (match) imgUrl = match[1];
                }
                
                html += `
                    <div class="portal-card" draggable="false">
                        <div class="card-img" style="background: #eee;">
                            <img src="${imgUrl}" alt="${item.title.replace(/'/g, "\\'")}" style="width: 100%; height: 100%; object-fit: cover;" draggable="false" onerror="handleImageError(this, '${item.title.replace(/'/g, "\\'")}')">
                        </div>
                        <div class="card-content-padding">
                            <a href="#" onclick="window.openArticle('${item.link}'); return false;" style="display: block; text-decoration: none;">
                                <h4 style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; cursor: pointer;">${item.title}</h4>
                            </a>
                            <div class="time" style="font-size: 11px; margin-top: 5px; color: var(--primary); font-weight: 600;">
                                <i data-lucide="clock" style="width: 12px; height: 12px; vertical-align: middle;"></i> Há ${Math.floor(Math.random() * 8) + 1} horas
                            </div>
                            <div class="engagement-buttons">
                                <button class="like-btn"><i data-lucide="thumbs-up"></i></button>
                                <button class="comment-btn"><i data-lucide="message-square"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            track.innerHTML = html;
            lucide.createIcons();
        } else {
            track.innerHTML = '<div style="padding: 20px;">Não foi possível carregar as notícias parceiras no momento.</div>';
        }
    }

    async function populateList(catElementId, wpCategory) {
        const list = document.getElementById(`list-${catElementId}`);
        if(!list) return;
        
        list.innerHTML = '<div style="padding: 20px;">Carregando...</div>';
        
        let noticias = [];
        if (catElementId === 'brasil') {
            noticias = await fetchCNNBrasil();
        } else if (catElementId === 'mundo') {
            noticias = await fetchG1Mundo();
        } else {
            noticias = await fetchUauaEmFoco(wpCategory);
        }
        
        if (noticias.length > 0) {
            // Ordenação por data (Mais recente primeiro)
            noticias.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
            });

            let html = '';
            noticias.forEach((item, index) => {
                let imgUrl = item.thumbnail || `topo_site.png`;
                if (!item.thumbnail && item.content) {
                    const match = item.content.match(/<img[^>]+src="([^">]+)"/);
                    if (match) imgUrl = match[1];
                }
                
                html += `
                    <a href="#" onclick="window.openArticle('${item.link}'); return false;" class="list-item">
                        <img src="${imgUrl}" alt="${item.title.replace(/'/g, "\\'")}" style="object-fit:cover; width:120px; height:90px; border-radius: 4px;" onerror="handleImageError(this, '${item.title.replace(/'/g, "\\'")}')">
                        <div class="list-item-content">
                            <h4 style="font-size: 14px; margin-bottom:5px;">${item.title}</h4>
                            <span class="time" style="font-size: 11px; color: var(--primary); font-weight: 600;">${item.tag}</span>
                        </div>
                    </a>
                `;
            });
            list.innerHTML = html;
        } else {
            list.innerHTML = '<div style="padding: 20px;">Sem notícias disponíveis.</div>';
        }
    }
    async function populateTrendingWidget() {
        const rankingList = document.getElementById('rankingList');
        const articleRankingList = document.getElementById('articleRankingList');
        if (!rankingList && !articleRankingList) return;

        // Busca o feed geral para pegar as mais recentes de todas as categorias
        const trendingNews = await fetchUauaEmFoco('uaua'); 
        if (trendingNews.length > 0) {
            let html = '';
            trendingNews.forEach((item, index) => {
                const imgUrl = item.thumbnail || `topo_site.png`;
                html += `
                    <li>
                        <span class="rank-number">${index + 1}</span>
                        <img src="${imgUrl}" alt="${item.title.replace(/'/g, "\\'")}" style="width:50px; height:50px; border-radius:4px; object-fit:cover;" onerror="handleImageError(this, '${item.title.replace(/'/g, "\\'")}')">
                        <a href="#" onclick="window.openArticle('${item.link}'); return false;">${item.title}</a>
                    </li>
                `;
            });
            if (rankingList) rankingList.innerHTML = html;
            if (articleRankingList) articleRankingList.innerHTML = html;
        } else {
            const fallback = '<div style="padding:10px; font-size:12px;">Ranking indisponível.</div>';
            if (rankingList) rankingList.innerHTML = fallback;
            if (articleRankingList) articleRankingList.innerHTML = fallback;
        }
    }

    async function populateRecommendedWidget() {
        const recommendedList = document.getElementById('recommendedList');
        if (!recommendedList) return;

        // Busca de notícias de Uauá para as recomendações, para ser mais relevante
        const newsToDisplay = await fetchUauaEmFoco('uaua');

        if (newsToDisplay.length > 0) {
            let html = '';
            // Pega as 6 notícias seguintes (para igualar à quantidade de Mundo)
            newsToDisplay.slice(2, 8).forEach((item, index) => {
                const imgUrl = item.thumbnail || `topo_site.png`;
                html += `
                    <div class="recommended-item" onclick="window.openArticle('${item.link}')">
                        <div class="rec-img-container">
                            <img src="${imgUrl}" alt="${item.title.replace(/'/g, "\\'")}" onerror="handleImageError(this, '${item.title.replace(/'/g, "\\'")}')">
                        </div>
                        <div class="rec-info">
                            <h4>${item.title}</h4>
                            <span class="rec-tag">${item.tag || 'DESTAQUE'}</span>
                        </div>
                    </div>
                `;
            });
            recommendedList.innerHTML = html;
            lucide.createIcons(); // Garante que ícones internos sejam criados se houver
        } else {
            recommendedList.innerHTML = '<div style="padding:10px; font-size:12px;">Sem recomendações no momento.</div>';
        }
    }
    // Auto-Scroll para prateleiras específicas (Ex: Uauá)
    function initAutoScroll(shelfId) {
        const track = document.getElementById(shelfId);
        if (!track) return;
        
        let isPaused = false;
        track.addEventListener('mouseenter', () => isPaused = true);
        track.addEventListener('mouseleave', () => isPaused = false);
        
        setInterval(() => {
            if (isPaused) return;
            const maxScroll = track.scrollWidth - track.clientWidth;
            if (track.scrollLeft >= maxScroll - 20) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: 300, behavior: 'smooth' });
            }
        }, 8000); // Transição a cada 8 segundos para leitura confortável (velocidade reduzida)
    }

    // Inicialização Principal dos Geradores de Notícia
    async function initAll() {
        await initHeroCarousel();
        await populateShelf('uaua', 'uaua');
        await populateShelf('bahia', 'bahia');
        await populateList('brasil', 'brasil');
        await populateList('mundo', 'mundo');
        await populateTrendingWidget();
        await populateRecommendedWidget();
        
        // Ativa o Auto-Scroll removida conforme solicitação
        // initAutoScroll('shelf-uaua');
    }
    
    initAll();

    // --- Controle de Botoes de Scroll ---
    document.querySelectorAll('.scroll-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            const track = document.getElementById(targetId);
            const isLeft = e.currentTarget.classList.contains('left');
            
            if(track) {
                track.scrollBy({ left: isLeft ? -280 : 280, behavior: 'smooth' });
            }
        });
    });

    // --- Drag Horizontal nas Prateleiras ---
    document.querySelectorAll('.shelf-track').forEach(track => {
        let isDown = false;
        let startX;
        let scrollLeft;

        track.addEventListener('mousedown', (e) => {
            isDown = true;
            track.classList.add('active');
            startX = e.pageX - track.offsetLeft;
            scrollLeft = track.scrollLeft;
            track.style.cursor = 'grabbing';
            // Disable scroll snap during drag
            track.style.scrollSnapType = 'none';
        });

        track.addEventListener('mouseleave', () => {
            isDown = false;
            track.classList.remove('active');
            track.style.cursor = 'grab';
            track.style.scrollSnapType = 'x mandatory';
        });

        track.addEventListener('mouseup', () => {
            isDown = false;
            track.classList.remove('active');
            track.style.cursor = 'grab';
            track.style.scrollSnapType = 'x mandatory';
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 2; // scroll-fast
            track.scrollLeft = scrollLeft - walk;
        });

        // Set initial cursor
        track.style.cursor = 'grab';
    });

    // --- Repórter Cidadão Modal Lógica ---
    const repBtn = document.getElementById('openReporterModal');
    const repModal = document.getElementById('reporterModal');
    const repClose = document.getElementById('closeReporterModal');
    const repForm = document.getElementById('reporterForm');
    const repSuccess = document.getElementById('reporterSuccess');
    const repSuccessClose = document.getElementById('successCloseBtn');
    const repMedia = document.getElementById('repMedia');
    const repMediaName = document.getElementById('repMediaName');

    if (repBtn && repModal) {
        repBtn.addEventListener('click', () => {
            repModal.classList.add('active');
            repForm.style.display = 'block';
            repSuccess.style.display = 'none';
        });

        repClose.addEventListener('click', () => repModal.classList.remove('active'));
        repSuccessClose.addEventListener('click', () => {
            repModal.classList.remove('active');
            repForm.reset();
            repMediaName.textContent = 'Nenhum arquivo selecionado';
        });

        // Fechar clicando fora
        repModal.addEventListener('click', (e) => {
            if (e.target === repModal) repModal.classList.remove('active');
        });

        // Mostrar nome do arquivo
        repMedia.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                repMediaName.textContent = e.target.files[0].name;
                repMediaName.style.color = "var(--primary)";
            } else {
                repMediaName.textContent = 'Nenhum arquivo selecionado';
                repMediaName.style.color = "var(--text-secondary)";
            }
        });

        // Máscara simplificada CPF
        const cpfInput = document.getElementById('repCpf');
        cpfInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if(val.length > 3) val = val.substring(0,3) + '.' + val.substring(3);
            if(val.length > 7) val = val.substring(0,7) + '.' + val.substring(7);
            if(val.length > 11) val = val.substring(0,11) + '-' + val.substring(11, 13);
            e.target.value = val;
        });

        // Máscara simplificada Telefone
        const phoneInput = document.getElementById('repPhone');
        phoneInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            if(val.length > 0) val = '(' + val;
            if(val.length > 3) val = val.substring(0,3) + ') ' + val.substring(3);
            if(val.length > 10) val = val.substring(0,10) + '-' + val.substring(10, 14);
            e.target.value = val;
        });

        // Submit form (Integração Direta com E-mail e Moderação)
        repForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitReporterBtn');
            const originalText = submitBtn.textContent;
            const statusText = document.getElementById('validationStatusText');
            
            submitBtn.textContent = 'Enviando Relato...';
            submitBtn.disabled = true;
            statusText.style.display = 'none';

            try {
                const formData = new FormData(repForm);
                const response = await fetch(repForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Sucesso no Envio
                    repForm.style.display = 'none';
                    repSuccess.style.display = 'block';
                    repForm.reset();
                    repMediaName.textContent = 'Nenhum arquivo selecionado';
                    lucide.createIcons();
                } else {
                    // Erro retornado pelo serviço
                    const data = await response.json();
                    throw new Error(data.errors?.[0]?.message || 'Falha ao enviar notícia. Tente novamente.');
                }
            } catch (error) {
                console.error("Erro no envio:", error);
                statusText.innerText = "Ops! 😕 " + error.message;
                statusText.style.display = 'block';
                statusText.style.color = '#e74c3c';
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- LEITOR DE ARTIGOS INTERNO (SPA) ---
    window.openArticle = function(link) {
        const item = window.allNewsItems[link];
        if (!item) return;

        // Oculta a Home
        document.getElementById('homeView').style.display = 'none';
        
        // Exibe o Article View com animação suave
        const articleView = document.getElementById('articleView');
        articleView.classList.add('animate-fade-in');
        
        document.getElementById('articleTitle').innerText = item.title;
        document.getElementById('articleTag').innerText = item.tag || 'Destaques';
        
        // Setup Imagem Destacada com Preenchimento Generativo
        const mediaContainer = document.getElementById('articleFeaturedMedia');
        if (item.thumbnail) {
            mediaContainer.innerHTML = `
                <div class="generative-fill-wrapper" style="height: 450px; position: relative; border-radius: 12px; margin-bottom: 30px;">
                    <img src="${item.thumbnail}" class="fill-blur" aria-hidden="true">
                    <img src="${item.thumbnail}" style="width:100%; height:100%; object-fit:cover; position:relative; z-index:2;" onerror="handleImageError(this, '${item.title.replace(/'/g, "\\'")}')">
                </div>
            `;
            mediaContainer.style.display = 'block';
        } else {
            mediaContainer.style.display = 'none';
        }

        // Tempo de Leitura (1 min a cada 200 palavras, aprox)
        const wordCount = (item.fullContent || '').split(/\s+/).length;
        const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
        const readTimeEl = document.getElementById('articleReadTime');
        if (readTimeEl) readTimeEl.innerText = `${readTimeMinutes} min`;
        
        // Remove scripts indesejados e previne falhas CSS de feed RSS
        let cleanContent = item.fullContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Remove a primeira imagem do conteúdo para evitar duplicidade com a imagem de destaque (Featured Media)
        if (item.thumbnail) {
            cleanContent = cleanContent.replace(/<img[^>]+>/i, '');
        }
        
        document.getElementById('articleContent').innerHTML = cleanContent;
        
        articleView.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Lógica para voltar à Home com os links de navegação ---
    const goHomeHandler = (e) => {
        const articleView = document.getElementById('articleView');
        const homeView = document.getElementById('homeView');
        
        // Se estivermos na vista de artigo, voltamos para a home
        if (articleView && articleView.style.display === 'block') {
            articleView.style.display = 'none';
            homeView.style.display = 'block';
            
            // Se for o link da capa (#) ou o Logo, fazemos scroll suave ao topo
            const targetHref = e.currentTarget.getAttribute('href');
            if (targetHref === '#' || e.currentTarget.classList.contains('header-logo-container')) {
                if (e.cancelable) e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    // Aplicar aos links do menu principal
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', goHomeHandler);
    });

    // Aplicar ao logo no topo e no rodapé
    const headLogo = document.querySelector('.header-logo-container');
    if (headLogo) {
        headLogo.style.cursor = 'pointer';
        headLogo.addEventListener('click', goHomeHandler);
    }

    // Botão de voltar (específico do leitor)
    const btnBackHome = document.getElementById('btnBackHome');
    if (btnBackHome) {
        btnBackHome.addEventListener('click', () => {
            const articleView = document.getElementById('articleView');
            articleView.classList.remove('animate-fade-in');
            articleView.style.display = 'none';
            document.getElementById('homeView').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Botão de compartilhar
    const btnShareArticle = document.getElementById('btnShareArticle');
    if (btnShareArticle) {
        btnShareArticle.addEventListener('click', () => {
            if (navigator.share) {
                const title = document.getElementById('articleTitle').innerText;
                navigator.share({
                    title: title,
                    text: 'Confira esta notícia no Uauá Acontece!',
                    url: window.location.href
                });
            } else {
                alert('Compartilhamento não suportado neste navegador.');
            }
        });
    }
    
    // --- LÓGICA DE MODO CLARO / ESCURO ---
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Forçar início em Modo Claro (conforme solicitado)
    // O cabeçalho permanece escuro por CSS para preservar a estética da logo
    body.classList.remove('dark-theme');
    body.classList.add('light-theme');
    updateThemeIcon(false);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-theme');
            if (isDark) {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
                updateThemeIcon(false);
            } else {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
                updateThemeIcon(true);
            }
        });
    }

    function updateThemeIcon(isDark) {
        if (!themeToggle) return;
        // Substituímos o conteúdo interno para garantir que o Lucide possa redeclarar o ícone
        themeToggle.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        lucide.createIcons();
    }

    // Garantir que inicie no topo conforme imagem
    window.scrollTo(0, 0);
});
