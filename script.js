// LINK DA SUA PLANILHA (Mantido estritamente igual)
const SHEET_JSON_URL = 'https://script.google.com/macros/s/AKfycbxFb7IeJf1JCvqdAZX6FZhmYM-RLBoCIo_tviKMhtkTYAfLZ22YAhpUMWVa3Wa43M5J/exec';

let allProducts = []; // Memória local para guardar todos os produtos carregados

// Função para buscar os produtos da planilha
async function loadProducts() {
    try {
        const response = await fetch(SHEET_JSON_URL);
        const data = await response.json();
        
        // Mapeia as 10 colunas da planilha (A até J)
        allProducts = data.values.slice(1).map(row => ({
            id: row[0],
            nome: row[1],
            preco: row[2],
            precoPix: row[3],
            desconto: row[4],
            linkImagem: row[5],
            linkAfiliado: row[6],
            tags: row[7] ? row[7].toLowerCase() : '',
            descricao: row[8] ? row[8] : '',
            cliques: row[9] ? parseInt(row[9]) || 0 : 0 // Coluna J (Cliques)
        }));

        // ALGORITMO: Ordena de forma decrescente para empurrar os mais clicados para o topo
        allProducts.sort((a, b) => b.cliques - a.cliques);

        renderProducts(allProducts);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('product-grid').innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Erro ao carregar produtos.</p>';
    }
}

// Função de clique com contorno seguro para restrições de CORS
function realizarClique(id, linkAfiliado) {
    // Abre o link imediatamente em aba externa para experiência fluida do usuário
    window.open(linkAfiliado, '_blank');

    // Envia requisição em segundo plano utilizando no-cors para evitar bloqueios de segurança
    fetch(`${SHEET_JSON_URL}?id=${id}`, { method: 'POST', mode: 'no-cors' })
        .catch(err => console.error('Erro ao registrar clique na planilha:', err));

    // SUPER RESPONSIVIDADE: Incrementa e reordena a tela na mesma hora sem depender do delay do servidor
    const produtoClicado = allProducts.find(p => p.id == id);
    if (produtoClicado) {
        produtoClicado.cliques++;
        allProducts.sort((a, b) => b.cliques - a.cliques);
        renderProducts(allProducts);
    }
}

// Função de renderização estruturada do Grid de cards
function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    const noResults = document.getElementById('no-results');
    grid.innerHTML = '';

    if (productsToRender.length === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        productsToRender.forEach(product => {
            
            let oldPriceHTML = '';
            let currentPriceValue = '';

            // Lógica estruturada de exibição condicional de descontos e preços
            if (product.desconto && product.preco) {
                oldPriceHTML = `<span class="old-price">R$ ${product.preco}</span><br>`;
                currentPriceValue = product.precoPix;
            } else {
                oldPriceHTML = '';
                currentPriceValue = product.precoPix ? product.precoPix : product.preco;
            }

            const pixHTML = product.precoPix ? `<p class="pix-price">no Pix</p>` : '';
            const clicksHTML = product.cliques > 0 ? `<p class="product-clicks">🔥 ${product.cliques} acessos</p>` : '';

            const cardHTML = `
                <div class="product-card" onclick="realizarClique('${product.id}', '${product.linkAfiliado}')">
                    ${product.desconto ? `<span class="discount-badge">-${product.desconto}%</span>` : ''}
                    <img src="${product.linkImagem}" alt="${product.nome}" class="product-image" loading="lazy">
                    <div class="product-info">
                        <h3 class="product-title">${product.nome}</h3>
                        ${product.descricao ? `<p class="product-description">${product.descricao}</p>` : ''}
                        ${clicksHTML}
                        <div class="price-row">
                            ${oldPriceHTML}
                            <span class="current-price">R$ ${currentPriceValue}</span>
                        </div>
                        ${pixHTML}
                    </div>
                </div>
            `;
            grid.innerHTML += cardHTML;
        });
    }
}

// Mecanismo interno de busca otimizado
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    const filteredProducts = allProducts.filter(product => 
        product.nome.toLowerCase().includes(searchTerm) || 
        product.tags.includes(searchTerm) ||
        product.descricao.toLowerCase().includes(searchTerm)
    );

    renderProducts(filteredProducts);
}

// Assinatura dos Eventos de Interface
document.getElementById('search-input').addEventListener('input', handleSearch);
document.getElementById('search-button').addEventListener('click', handleSearch);

// Inicialização da aplicação
loadProducts();