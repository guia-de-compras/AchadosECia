// LINK DA SUA PLANILHA (Mantido estritamente igual)
const SHEET_JSON_URL = 'https://script.google.com/macros/s/AKfycbxFb7IeJf1JCvqdAZX6FZhmYM-RLBoCIo_tviKMhtkTYAfLZ22YAhpUMWVa3Wa43M5J/exec';

let allProducts = []; // Memória local para guardar todos os produtos carregados

// Chave para armazenar os produtos já clicados pelo usuário
const STORAGE_KEY = 'achados_clicados';

// Função para obter a lista de IDs já clicados (do localStorage)
function getProdutosClicados() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch(e) {
        return [];
    }
}

// Função para adicionar um ID à lista de clicados
function adicionarProdutoClicado(id) {
    const clicados = getProdutosClicados();
    if (!clicados.includes(id)) {
        clicados.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clicados));
    }
}

// Função para verificar se o produto já foi clicado
function produtoJaClicado(id) {
    return getProdutosClicados().includes(id);
}

// Função para buscar os produtos da planilha
async function loadProducts() {
    try {
        const response = await fetch(SHEET_JSON_URL);
        const data = await response.json();
        
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
            cliques: row[9] ? parseInt(row[9]) || 0 : 0
        }));

        allProducts.sort((a, b) => b.cliques - a.cliques);
        renderProducts(allProducts);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('product-grid').innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Erro ao carregar produtos.</p>';
    }
}

// Função de clique com contagem única por usuário
function realizarClique(id, linkAfiliado) {
    // Abre o link imediatamente (sempre)
    window.open(linkAfiliado, '_blank');

    // Verifica se o usuário já clicou neste produto antes
    if (produtoJaClicado(id)) {
        // Já clicou: apenas abre o link, sem contar novo clique
        console.log(`Produto ${id} já foi clicado por este usuário. Clique não contabilizado.`);
        return;
    }

    // Primeiro clique: contabiliza no front-end e no back-end
    // Marca como clicado no localStorage
    adicionarProdutoClicado(id);

    // Envia requisição em segundo plano para o Apps Script (incrementa na planilha)
    fetch(`${SHEET_JSON_URL}?id=${id}`, { method: 'POST', mode: 'no-cors' })
        .catch(err => console.error('Erro ao registrar clique na planilha:', err));

    // Atualiza o contador local e reordena os produtos
    const produtoClicado = allProducts.find(p => p.id == id);
    if (produtoClicado) {
        produtoClicado.cliques++;
        allProducts.sort((a, b) => b.cliques - a.cliques);
        renderProducts(allProducts);
    }
}

// Função de renderização (inalterada)
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

function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    const filteredProducts = allProducts.filter(product => 
        product.nome.toLowerCase().includes(searchTerm) || 
        product.tags.includes(searchTerm) ||
        product.descricao.toLowerCase().includes(searchTerm)
    );

    renderProducts(filteredProducts);
}

document.getElementById('search-input').addEventListener('input', handleSearch);
document.getElementById('search-button').addEventListener('click', handleSearch);

loadProducts();
