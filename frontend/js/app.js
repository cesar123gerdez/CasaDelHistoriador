<script src="js/config.js"></script>p\\Nueva carpeta (2)\\backend\"
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
let categories = [];
# Initialize git if it does not exist

// API base helper: if you want to point to an external backend, create/edit
// el archivo `frontend/js/config.js` con `const API_BASE = 'https://mi-backend.onrender.com';` o
echo node_modules/ > .gitignoremi-backend.onrender.com';`.
echo .env >> .gitignorealquiera de las dos formas sin redeclarar variables.
let _apiBaseCandidate = '';
# Add and commit= 'undefined' && window.API_BASE) {
git add *aseCandidate = window.API_BASE;
} else if (typeof API_BASE !== 'undefined') {
    _apiBaseCandidate = API_BASE;
# Create repo on GitHub (here you have to manually create the repo on GitHub and then connect)
const API_BASE_NORMALIZED = (_apiBaseCandidate && _apiBaseCandidate.toString().trim()) ? _apiBaseCandidate.toString().replace(/\/$/, '') : '';
function apiUrl(path) {
    if (!path.startsWith('/')) path = '/' + path;
    if (API_BASE_NORMALIZED) return API_BASE_NORMALIZED + path;
    return window.location.origin + path;
}

// Resalta ocurrencias de query dentro de un texto (devuelve HTML con <mark>)
function highlightText(text, query) {
    if (!text) return '';
    if (!query) return escapeHtml(text);
    try {
        const safe = escapeRegExp(query);
        const regex = new RegExp(`(${safe})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark>$1</mark>');
    } catch (e) {
        return escapeHtml(text);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
}
// Record showPreviewModal in the global scope before any render
function showPreviewModal(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    const modal = document.getElementById('previewModal');
    const title = document.getElementById('previewTitle');
    const container = document.getElementById('previewContainer');
    if (!modal || !title || !container) return;

    title.textContent = `Vista Previa: ${file.name}`;
    let content = '';
    const url = apiUrl(`/api/files/${file.id}/preview`);
    if (['pdf'].includes(file.file_type)) {
        content = `<iframe src="${url}#toolbar=1&navpanes=0&scrollbar=1" width="100%" height="600px" style="border:none;"></iframe>`;
    } else if (['jpg','jpeg','png','gif'].includes(file.file_type)) {
        content = `<img src="${url}" alt="${file.name}" style="max-width:100%;max-height:600px;display:block;margin:auto;" />`;
    } else if (['doc','docx'].includes(file.file_type)) {
        content = `<div style="text-align:center;padding:2em;">
            <p>No es posible previsualizar archivos Word en el navegador.</p>
            <a href="${url}" class="btn btn-primary" target="_blank">Descargar Documento</a>
        </div>`;
    } else {
        content = `<div style="text-align:center;padding:2em;">
            <p>Tipo de archivo no soportado para vista previa.</p>
            <a href="${url}" class="btn btn-primary" target="_blank">Descargar Archivo</a>
        </div>`;
    }
    container.innerHTML = content;
    modal.style.display = 'flex';
    // Si es PDF, inicializar el visor PDF.js en el modal (carga sin query)
    if (file.file_type === 'pdf' && typeof searchInPreview === 'function') {
        // llamar sin await; searchInPreview es async y se encargará de renderizar
        searchInPreview('');
    }

    // Botón cerrar
    const closeBtn = document.getElementById('closePreview');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            container.innerHTML = '';
        };
    }
    // Botón descargar
    const downloadBtn = document.getElementById('downloadPreviewBtn');
    if (downloadBtn) {
        downloadBtn.onclick = function() {
            window.open(url, '_blank');
        };
    }
    // Botón compartir (copia enlace)
    const shareBtn = document.getElementById('sharePreviewBtn');
    if (shareBtn) {
        shareBtn.onclick = function() {
            navigator.clipboard.writeText(url);
            showToast('Enlace copiado al portapapeles');
        };
    }

    // Búsqueda dentro del documento (solo UI; comportamiento según tipo)
    const previewSearchInput = document.getElementById('previewSearchInput');
    const previewSearchBtn = document.getElementById('previewSearchBtn');
    // Variables y helpers para PDF.js
    let pdfDocInstance = null;
    let pdfCurrentPage = 1;
    let pdfScale = 1.2;
    const previewContainerDiv = container; // alias
    const pdfMatchesDiv = document.getElementById('pdfMatches');
    async function searchInPreview(query) {
        if (!query || !query.trim()) {
            showToast('Ingrese un término de búsqueda', true);
            return;
        }
        query = query.trim();
        // Para PDF: abrir en nueva pestaña y sugerir usar Ctrl+F (no se puede controlar el visor PDF del navegador)
        if (['pdf'].includes(file.file_type)) {
            // Usar PDF.js para cargar y buscar dentro del PDF en el modal
            try {
                // Inicializar worker (CDN)
                if (window.pdfjsLib) {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                }
                // Cargar arrayBuffer del PDF
                const res = await fetch(url);
                const arrayBuffer = await res.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                pdfDocInstance = await loadingTask.promise;
                pdfCurrentPage = 1;
                // Preparar canvas
                previewContainerDiv.innerHTML = '<canvas id="pdfCanvas" class="pdf-canvas"></canvas>';
                const canvas = document.getElementById('pdfCanvas');
                const ctx = canvas.getContext('2d');

                async function renderPdfPage(pageNum) {
                    const page = await pdfDocInstance.getPage(pageNum);
                    const viewport = page.getViewport({ scale: pdfScale });
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    // Ajustar CSS width para que sea responsivo
                    canvas.style.maxWidth = '100%';
                    const renderContext = { canvasContext: ctx, viewport };
                    await page.render(renderContext).promise;
                    // También obtener texto para posibles snippets
                    const textContent = await page.getTextContent();
                    return { page, textContent, viewport };
                }

                // Render primera página
                const first = await renderPdfPage(1);
                // Mostrar matches si ya había una búsqueda
                if (query) {
                    await searchPdf(query);
                }

                // Mostrar controles de navegación
                const controlsHtml = `
                    <div class="pdf-controls">
                        <button id="pdfPrev">Anterior</button>
                        <span class="pdf-page-info" id="pdfPageInfo">Página <span id="pdfPageNum">1</span> / <span id="pdfPageCount">${pdfDocInstance.numPages}</span></span>
                        <button id="pdfNext">Siguiente</button>
                        <button id="pdfOpenNew">Abrir en pestaña</button>
                    </div>
                `;
                previewMatchesInsert(controlsHtml);
                document.getElementById('pdfPrev').onclick = async () => {
                    if (pdfCurrentPage <= 1) return;
                    pdfCurrentPage--;
                    await renderPdfPage(pdfCurrentPage);
                    document.getElementById('pdfPageNum').textContent = pdfCurrentPage;
                };
                document.getElementById('pdfNext').onclick = async () => {
                    if (pdfCurrentPage >= pdfDocInstance.numPages) return;
                    pdfCurrentPage++;
                    await renderPdfPage(pdfCurrentPage);
                    document.getElementById('pdfPageNum').textContent = pdfCurrentPage;
                };
                document.getElementById('pdfOpenNew').onclick = () => {
                    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                };

                // Función para buscar en todas las páginas del PDF
                async function searchPdf(q) {
                    if (!pdfDocInstance) return [];
                    const matches = [];
                    const lowerQ = q.toLowerCase();
                    for (let p = 1; p <= pdfDocInstance.numPages; p++) {
                        const pg = await pdfDocInstance.getPage(p);
                        const tc = await pg.getTextContent();
                        const pageText = tc.items.map(i => i.str).join(' ');
                        const idx = pageText.toLowerCase().indexOf(lowerQ);
                        if (idx !== -1) {
                            // crear snippet alrededor
                            const start = Math.max(0, idx - 60);
                            const snippet = pageText.substring(start, start + 220);
                            matches.push({ page: p, snippet });
                        }
                    }
                    // Mostrar resultados en el panel
                    if (matches.length > 0) {
                        pdfMatchesDiv.style.display = 'block';
                        pdfMatchesDiv.innerHTML = matches.map((m, i) => `
                                    <div class="pdf-match-item" data-page="${m.page}">
                                        <strong>Página ${m.page}</strong>: ${escapeHtml(m.snippet).replace(new RegExp(escapeRegExp(q), 'gi'), '<mark>$&</mark>')}
                                    </div>
                        `).join('');
                        // click en snippet navega a la página
                        pdfMatchesDiv.querySelectorAll('.pdf-match-item').forEach(el => {
                            el.addEventListener('click', async () => {
                                const pg = parseInt(el.getAttribute('data-page'));
                                pdfCurrentPage = pg;
                                await renderPdfPage(pg);
                                document.getElementById('pdfPageNum').textContent = pg;
                            });
                        });
                    } else {
                        pdfMatchesDiv.style.display = 'none';
                        pdfMatchesDiv.innerHTML = '';
                        showToast('No se encontraron coincidencias en el PDF', true);
                    }
                    return matches;
                }

                // Helper para insertar controles/resultado debajo del canvas sin borrar pdfMatchesDiv
                function previewMatchesInsert(html) {
                    // insert after previewContainer
                    const wrap = document.createElement('div');
                    wrap.innerHTML = html;
                    previewContainerDiv.appendChild(wrap);
                }

                // Exponer searchPdf para el handler
                previewContainerDiv.searchPdf = searchPdf;
            } catch (e) {
                console.error('Error cargando PDF con PDF.js', e);
                window.open(url, '_blank');
                showToast('No se pudo cargar el PDF en el visor. Se abrió en nueva pestaña.', true);
            }
            return;
        }
        // Para imágenes: no es posible buscar texto
        if (['jpg','jpeg','png','gif'].includes(file.file_type)) {
            showToast('No es posible buscar texto dentro de imágenes', true);
            return;
        }
        // Si el contenedor tiene texto (por ejemplo pre-renderizado), resaltar coincidencias
        const containerText = container.innerText || container.textContent || '';
        if (containerText && containerText.trim()) {
            container.innerHTML = highlightText(containerText, query);
            showToast('Resultados destacados en la vista previa');
            return;
        }
        // En otros casos (por ejemplo archivos Word), ofrecer abrir/descargar
        showToast('No es posible buscar dentro de este tipo de archivo desde el visor. Abra el archivo y use la búsqueda del navegador.', true);
    }
    if (previewSearchBtn) {
        previewSearchBtn.onclick = function(e) {
            e.stopPropagation();
            const q = previewSearchInput ? previewSearchInput.value : '';
            searchInPreview(q);
        };
    }
    if (previewSearchInput) {
        previewSearchInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = previewSearchInput.value;
                searchInPreview(q);
            }
        };
    }
}
window.showPreviewModal = showPreviewModal;
let selectedDescriptions = [];
function showToast(message, isError = false) {
    console.log('🔔 Toast:', message);
    const toast = document.getElementById('toast');
    if (toast) {
        // Normalize payload so that req.user.id exists (token uses userId)
        toast.className = 'toast' + (isError ? ' error' : '') + ' show';
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Función de login
async function login(username, password) {
    console.log('🔐 Intentando login con:', username);
    
    try {
    const response = await fetch(apiUrl('/api/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ El servidor devolvió HTML en lugar de JSON:', text.substring(0, 200));
            showToast('Error del servidor: respuesta inválida', true);
            return false;
        }
        
        const result = await response.json();
        console.log('📨 Respuesta del servidor:', result);
        
        if (result.success) {
            currentUser = result.data.user;
            localStorage.setItem('authToken', result.data.token);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast(`¡Bienvenido ${currentUser.name}!`);
            document.getElementById('loginModal').style.display = 'none';
            
            updateUI();
            await loadCategories();
            await loadFiles();
            
            return true;
        } else {
            showToast(result.message || 'Error en login', true);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        showToast('Error de conexión con el servidor', true);
        return false;
    }
}

// Función de logout
function logout() {
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateUI();
    loadFiles();
    showToast('Sesión cerrada correctamente');
}

// Actualizar interfaz según el usuario
function updateUI() {
    const userActions = document.getElementById('userActions');
    const uploadSection = document.getElementById('uploadSection');
    const categoryManagerBtn = document.getElementById('categoryManagerBtn');
    const publicAccessInfo = document.getElementById('publicAccessInfo');
    const dataManagement = document.getElementById('dataManagement');
    // Buscador de archivos
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                renderFiles();
                document.getElementById('searchResultsInfo').style.display = 'none';
                return;
            }
            // Filtrar archivos por nombre, descripción o categoría
            const filtered = files.filter(file => {
                const category = categories.find(c => c.id === file.category_id);
                return (
                    (file.name && file.name.toLowerCase().includes(query)) ||
                    (file.description && file.description.toLowerCase().includes(query)) ||
                    (category && category.name && category.name.toLowerCase().includes(query))
                );
            });
            renderFiles(filtered);
            // Mostrar info de resultados
            const info = document.getElementById('searchResultsInfo');
            const text = document.getElementById('searchResultsText');
            if (info && text) {
                info.style.display = 'block';
                text.textContent = `Resultados para "${query}": ${filtered.length} documento(s)`;
            }
        });
        // Botón limpiar búsqueda
        const clearBtn = document.getElementById('clearSearch');
        if (clearBtn) {
            clearBtn.onclick = function() {
                searchInput.value = '';
                renderFiles();
                document.getElementById('searchResultsInfo').style.display = 'none';
            };
        }
    }

    if (!userActions) {
        console.error('❌ Elemento userActions no encontrado');
        return;
    }

    if (currentUser && currentUser.role === 'admin') {
        console.log('🛠️ Configurando interfaz para administrador');
        
        userActions.innerHTML = `
            <div class="user-info">
                <span>${currentUser.name}</span>
                <span class="user-role admin">Administrador</span>
                <button class="logout-btn" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
            </div>
        `;
        
        if (uploadSection) uploadSection.style.display = 'block';
        if (categoryManagerBtn) categoryManagerBtn.style.display = 'block';
        if (publicAccessInfo) publicAccessInfo.style.display = 'none';
        if (dataManagement) dataManagement.style.display = 'block';

        // Agregar event listener para logout
        document.getElementById('logoutBtn').addEventListener('click', logout);
        
    } else {
        console.log('👤 Configurando interfaz para usuario público');
        
        userActions.innerHTML = `
            <button class="btn btn-secondary" id="adminLoginBtn">
                <i class="fas fa-user-shield"></i> Acceso Admin
            </button>
        `;
        
        if (uploadSection) uploadSection.style.display = 'none';
        if (categoryManagerBtn) categoryManagerBtn.style.display = 'none';
        if (publicAccessInfo) publicAccessInfo.style.display = 'block';
        if (dataManagement) dataManagement.style.display = 'none';

        // Agregar event listener para login
        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            document.getElementById('loginModal').style.display = 'flex';
        });
    }
}

// Cargar categorías
async function loadCategories() {
    try {
        console.log('📂 Cargando categorías...');
    const response = await fetch(apiUrl('/api/categories'));
        const result = await response.json();
        
        if (result.success) {
            categories = result.data.categories;
            console.log(`✅ ${categories.length} categorías cargadas`);
            renderCategories();
        } else {
            console.error('Error cargando categorías:', result.message);
            showToast('Error cargando categorías', true);
        }
    } catch (error) {
        console.error('❌ Error cargando categorías:', error);
        showToast('Error cargando categorías', true);
    }
}

// Cargar archivos
async function loadFiles() {
    try {
        console.log('📁 Cargando archivos...');
    const response = await fetch(apiUrl('/api/files'));
        const result = await response.json();
        
        if (result.success) {
            files = result.data.files;
            console.log(`✅ ${files.length} archivos cargados`);
            renderFiles();
        } else {
            console.error('Error cargando archivos:', result.message);
            showToast('Error cargando archivos', true);
        }
    } catch (error) {
        console.error('❌ Error cargando archivos:', error);
        showToast('Error cargando archivos', true);
    }
}

// Renderizar categorías
function renderCategories() {
    const categoriesFilters = document.getElementById('categoriesFilters');
    const fileCategory = document.getElementById('fileCategory');
    
    if (categoriesFilters) {
        const totalFiles = files.length;
        
        categoriesFilters.innerHTML = `
            <div class="category-filter active" data-category="all">
                <i class="fas fa-layer-group"></i>
                <span>Todos los Documentos</span>
                <span class="count">${totalFiles}</span>
            </div>
            ${categories.map(cat => {
                const count = files.filter(f => f.category_id === cat.id).length;
                return `
                    <div class="category-filter" data-category="${cat.id}">
                        <i class="fas fa-folder" style="color: ${cat.color}"></i>
                        <span>${cat.name}</span>
                        <span class="count">${count}</span>
                    </div>
                `;
            }).join('')}
        `;

        // Event listeners para filtros
        categoriesFilters.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('click', () => {
                categoriesFilters.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                loadFiles();
            });
        });
    }
    
    // Llenar selector de categorías en upload
    if (fileCategory) {
        fileCategory.innerHTML = categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
    }
}

// Renderizar archivos
function renderFiles(fileListArg) {
    const fileList = document.getElementById('fileList');
    const noResults = document.getElementById('noResults');
    
    if (!fileList || !noResults) {
        console.error('❌ Elementos fileList o noResults no encontrados');
        return;
    }
    
    if (files.length === 0) {
        fileList.innerHTML = '';
        noResults.style.display = 'block';
        console.log('ℹ️ No hay archivos para mostrar');
        return;
    }
    
    noResults.style.display = 'none';
    
    const list = Array.isArray(fileListArg) ? fileListArg : files;
    // Obtener query de búsqueda si existe
    let query = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
        query = searchInput.value.trim();
    }
    // Usar la función global de resaltado con la query actual
    function highlight(text) {
        return highlightText(text, query);
    }
    fileList.innerHTML = list.map(file => {
        const category = categories.find(c => c.id === file.category_id) || { 
            name: 'Sin categoría', 
            color: '#95a5a6' 
        };
        return `
        <div class="file-card">
            <div class="file-preview">
                <div class="cover-preview ${getCoverClass(file.file_type)}">
                    <i class="cover-icon ${getCoverIcon(file.file_type)}"></i>
                    <div class="cover-title">${highlight(file.name.substring(0, 25))}${file.name.length > 25 ? '...' : ''}</div>
                    <div class="cover-subtitle">${file.file_type.toUpperCase()}</div>
                </div>
            </div>
            <div class="file-info">
                <div class="file-category-badge" style="background: ${category.color}">
                    ${highlight(category.name)}
                </div>
                <div class="file-name">${highlight(file.name)}</div>
                <div class="file-meta">
                    <span>${file.file_type.toUpperCase()}</span>
                    <span>${formatFileSize(file.file_size)}</span>
                </div>
                <!-- descripción sólo visible en modal; si la query coincide en la descripción marcamos el icono -->
                
                <div class="file-actions">
                    <button class="preview" title="Vista Previa" onclick="showPreviewModal(${file.id});event.stopPropagation();">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="download" title="Descargar" onclick="downloadFile(${file.id});event.stopPropagation();">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-toggle-desc ${file.description && query && file.description.toLowerCase().includes(query.toLowerCase()) ? 'match-desc' : ''}" title="Ver descripción" data-fileid="${file.id}" onclick="showDescriptionModal(${file.id}, '${query.replace(/'/g, "\\'")}');event.stopPropagation();">
                        <i class="fas fa-align-left"></i>
                    </button>
                    ${currentUser && currentUser.role === 'admin' ? `
                        <button class="delete" title="Eliminar" onclick="deleteFile(${file.id});event.stopPropagation();">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    }).join('');
    return;
}

// Funciones auxiliares
function getCoverClass(fileType) {
    const types = {
        pdf: "pdf-cover",
        doc: "doc-cover", 
        docx: "doc-cover",
        jpg: "image-cover",
        jpeg: "image-cover",
        png: "image-cover",
        gif: "image-cover"
    };
    return types[fileType] || "doc-cover";
}

function getCoverIcon(fileType) {
    const icons = {
        pdf: "fas fa-file-pdf",
        doc: "fas fa-file-word",
        docx: "fas fa-file-word",
        jpg: "fas fa-file-image",
        jpeg: "fas fa-file-image", 
        png: "fas fa-file-image",
        gif: "fas fa-file-image"
    };
    return icons[fileType] || "fas fa-file";
}

// Get file type (short extension) from a File or a name/ MIME
function getFileType(input) {
    // input puede ser un objeto File, un string con nombre de archivo, o un tipo MIME
    if (!input) return 'file';

    // Si es un objeto File
    if (typeof input === 'object' && input.name) {
        const name = input.name;
        const parts = name.split('.');
        if (parts.length > 1) return parts.pop().toLowerCase();
        // si no tiene extensión, pero tiene type (MIME)
        if (input.type) {
            const mimeMap = {
                'application/pdf': 'pdf',
                'application/msword': 'doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif'
            };
            return mimeMap[input.type] || input.type.split('/').pop();
        }
        return 'file';
    }

    // Si es un string: puede ser un nombre de archivo o un tipo MIME
    if (typeof input === 'string') {
        // si parece un MIME
        if (input.includes('/')) {
            const mimeMap = {
                'application/pdf': 'pdf'
            };
            return mimeMap[input] || input.split('/').pop();
        }

        const parts = input.split('.');
        if (parts.length > 1) return parts.pop().toLowerCase();
        return input.toLowerCase();
    }

    return 'file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Descargar archivo
function downloadFile(fileId) {
    console.log('📥 Descargando archivo:', fileId);
    window.open(apiUrl(`/api/files/${fileId}/download`), '_blank');
    showToast('Iniciando descarga...');
}

// Eliminar archivo
async function deleteFile(fileId) {
    const file = files.find(f => f.id == fileId);
    if (!file) return;

    if (!confirm(`¿Está seguro de que desea eliminar "${file.name}"?`)) {
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(apiUrl(`/api/files/${fileId}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Archivo "${file.name}" eliminado correctamente`);
            await loadFiles();
        } else {
            showToast(result.message || 'Error eliminando archivo', true);
        }
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        showToast('Error eliminando archivo', true);
    }
}

// ===== FUNCIONES DE SUBIDA DE ARCHIVOS =====

// Manejar selección de archivos
function handleFileSelection(fileList) {
    selectedFiles = Array.from(fileList);
    console.log('📎 Archivos seleccionados:', selectedFiles.length);
    renderSelectedFiles();
}

// Mostrar archivos seleccionados
function renderSelectedFiles() {
    const selectedFilesContainer = document.getElementById('selectedFiles');
    const fileListPreview = document.getElementById('fileListPreview');

    if (!selectedFilesContainer || !fileListPreview) {
        console.error('❌ Elementos de archivos seleccionados no encontrados');
        return;
    }

    if (selectedFiles.length === 0) {
        selectedFilesContainer.classList.remove('active');
        fileListPreview.innerHTML = '';
        return;
    }
    
    selectedFilesContainer.classList.add('active');
    fileListPreview.innerHTML = selectedFiles.map((file, idx) => `
        <div class="file-item">
            <div class="file-item-name">${file.name}</div>
            <div class="file-item-size">${formatFileSize(file.size)}</div>
            <textarea class="file-item-description" placeholder="Descripción (opcional)" data-idx="${idx}">${selectedDescriptions[idx] || ''}</textarea>
        </div>
    `).join('');
    // Guardar descripciones al escribir
    fileListPreview.querySelectorAll('.file-item-description').forEach(textarea => {
        textarea.addEventListener('input', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            selectedDescriptions[idx] = e.target.value;
        });
    });
}

// Subir archivos
async function uploadFiles() {
    console.log('📤 Intentando subir archivos...');
    
    if (selectedFiles.length === 0) {
        showToast('Por favor seleccione al menos un archivo', true);
        return;
    }

    const fileCategorySelect = document.getElementById('fileCategory');
    const selectedCategoryId = fileCategorySelect ? parseInt(fileCategorySelect.value) : null;
    
    console.log(`📁 Subiendo ${selectedFiles.length} archivo(s) con categoría:`, selectedCategoryId);
    
    try {
        const formData = new FormData();
        // Adjuntar todos los archivos con el mismo nombre de campo 'files'
        selectedFiles.forEach((file, idx) => {
            formData.append('files', file);
            // Adjuntar descripción individual si existe
            if (selectedDescriptions[idx]) {
                formData.append('descriptions', selectedDescriptions[idx]);
            } else {
                formData.append('descriptions', '');
            }
        });
        if (selectedCategoryId) {
            formData.append('category_id', selectedCategoryId);
        }

        const token = localStorage.getItem('authToken');
        console.log('🔐 Token disponible:', !!token);

        const response = await fetch(apiUrl('/api/files/upload'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();
        console.log('📨 Respuesta de subida:', result);

        if (!result.success) {
            throw new Error(result.message);
        }

        // Éxito
        console.log('✅ Archivos subidos:', result.data && result.data.files ? result.data.files.map(f => f.name) : selectedFiles.map(f => f.name));

    await loadFiles();
    await loadCategories();

        // Limpiar selección
        selectedFiles = [];
        selectedDescriptions = [];
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
        renderSelectedFiles();

    const cantidad = result.data && result.data.files ? result.data.files.length : selectedFiles.length;
    showToast(`Se han subido ${cantidad} archivo(s) correctamente`);

    } catch (error) {
        console.error('❌ Error subiendo archivos:', error);
        showToast('Error subiendo archivos: ' + error.message, true);
    }
}

// ===== FUNCIONES DE GESTIÓN DE CATEGORÍAS =====

// Mostrar modal de gestión de categorías
function showCategoryManager() {
    console.log('📂 Abriendo gestor de categorías');
    renderCategoryManager();
    document.getElementById('categoryModal').style.display = 'flex';
}

// Renderizar gestor de categorías
function renderCategoryManager() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) {
        console.error('❌ Elemento categoryList no encontrado');
        return;
    }

    categoryList.innerHTML = categories.map(category => {
        const count = files.filter(file => file.category_id === category.id).length;
        return `
            <div class="category-item">
                <div class="category-item-info">
                    <div class="category-color" style="background: ${category.color}"></div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${count} documentos</div>
                </div>
                <div class="category-actions">
                    <button class="category-action-btn edit-category" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="category-action-btn delete-category" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Agregar categoría
async function addCategory() {
    const newCategoryName = document.getElementById('newCategoryName');
    const newCategoryColor = document.getElementById('newCategoryColor');
    
    const name = newCategoryName ? newCategoryName.value.trim() : '';
    const color = newCategoryColor ? newCategoryColor.value : '#3498db';

    console.log('➕ Agregando categoría:', name, color);

    if (!name) {
        showToast('Por favor ingrese un nombre para la categoría', true);
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(apiUrl('/api/categories'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, color })
        });
        
        const result = await response.json();
        console.log('📨 Respuesta de creación:', result);
        
        if (result.success) {
            await loadCategories();
            if (newCategoryName) newCategoryName.value = '';
            if (newCategoryColor) newCategoryColor.value = '#3498db';
            showToast(`Categoría "${name}" agregada correctamente`);
        } else {
            showToast(result.message || 'Error creando categoría', true);
        }
    } catch (error) {
        console.error('Error creando categoría:', error);
        showToast('Error creando categoría', true);
    }
}

/* PDF viewer styles */
async function editCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const newName = prompt('Ingrese el nuevo nombre para la categoría:', category.name);
    if (newName && newName.trim() !== '') {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(apiUrl(`/api/categories/${categoryId}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name: newName.trim(), 
                    color: category.color 
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                await loadCategories();
                showToast('Categoría actualizada correctamente');
            } else {
                showToast(result.message || 'Error actualizando categoría', true);
            }
        } catch (error) {
            console.error('Error actualizando categoría:', error);
            showToast('Error actualizando categoría', true);
        }
    }
}

// Eliminar categoría
async function deleteCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const filesInCategory = files.filter(file => file.category_id === categoryId);
    
    if (filesInCategory.length > 0) {
        if (!confirm(`La categoría "${category.name}" tiene ${filesInCategory.length} documento(s). ¿Está seguro de que desea eliminarla?`)) {
            return;
        }
    } else {
        if (!confirm(`¿Está seguro de que desea eliminar la categoría "${category.name}"?`)) {
            return;
        }
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(apiUrl(`/api/categories/${categoryId}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadCategories();
            showToast(`Categoría "${category.name}" eliminada correctamente`);
        } else {
            showToast(result.message || 'Error eliminando categoría', true);
        }
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        showToast('Error eliminando categoría', true);
    }
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====

function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Upload area
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');

    if (uploadArea && fileInput) {
        console.log('✅ Configurando área de upload');
        
        uploadArea.addEventListener('click', () => {
            console.log('🎯 Click en área de upload');
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#bdc3c7';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#bdc3c7';
            if (e.dataTransfer.files.length) {
                console.log('📎 Archivos arrastrados:', e.dataTransfer.files.length);
                handleFileSelection(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                console.log('📎 Archivos seleccionados:', e.target.files.length);
                handleFileSelection(e.target.files);
            }
        });
    } else {
        console.log('Upload❌ items not found');
    }

    if (uploadBtn) {
        console.log('✅ Configurando botón de upload');
        uploadBtn.addEventListener('click', uploadFiles);
    } else {
        console.log('❌ Botón de upload no encontrado');
    }

    // Category manager
    const categoryManagerBtn = document.getElementById('categoryManagerBtn');
    if (categoryManagerBtn) {
        console.log('✅ Configurando botón de gestión de categorías');
        categoryManagerBtn.addEventListener('click', showCategoryManager);
    } else {
        console.log('❌ Botón de gestión de categorías no encontrado');
    }
// Mostrar y editar descripción de archivo
window.showDescriptionModal = function(fileId, query) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    const modal = document.getElementById('descriptionModal');
    const title = document.getElementById('descriptionTitle');
    const text = document.getElementById('descriptionText');
    const editor = document.getElementById('descriptionEditor');
    const actions = document.getElementById('descriptionActions');
    const editActions = document.getElementById('editActions');
    if (!modal || !title || !text || !editor || !actions || !editActions) return;

    title.textContent = `Descripción del Documento`;
    // Si no se pasó query, obtenerla del input actual
    query = query || (document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '');
    text.innerHTML = file.description ? highlightText(file.description, query) : '<em>Sin descripción</em>';
    editor.value = file.description || '';
    editor.style.display = 'none';
    text.style.display = 'block';
    actions.style.display = (currentUser && currentUser.role === 'admin') ? 'block' : 'none';
    editActions.style.display = 'none';
    modal.style.display = 'flex';

    // Editar descripción
    const editBtn = document.getElementById('editDescriptionBtn');
    if (editBtn) {
        editBtn.onclick = function() {
            if (!(currentUser && currentUser.role === 'admin')) return;
            editor.style.display = 'block';
            text.style.display = 'none';
            actions.style.display = 'none';
            editActions.style.display = 'block';
        };
    }
    // Guardar cambios
    const saveBtn = document.getElementById('saveDescription');
    if (saveBtn) {
        saveBtn.onclick = async function() {
            const newDesc = editor.value.trim();
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch(apiUrl(`/api/files/${fileId}/description`), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ description: newDesc })
                });
                const result = await res.json();
                if (result.success) {
                    showToast('Descripción actualizada');
                    await loadFiles();
                    modal.style.display = 'none';
                } else {
                    showToast(result.message || 'Error actualizando descripción', true);
                }
            } catch (err) {
                showToast('Error actualizando descripción', true);
            }
        };
    }
    // Cancelar edición
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            editor.style.display = 'none';
            text.style.display = 'block';
            actions.style.display = 'block';
            editActions.style.display = 'none';
        };
    }
    // Cerrar modal
    const closeBtn = document.getElementById('closeDescription');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
};

    // Add category
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        console.log('✅ Configurando botón de agregar categoría');
        addCategoryBtn.addEventListener('click', addCategory);
    } else {
        console.log('❌ Botón de agregar categoría no encontrado');
    }

    // Modal close buttons
    const closeCategoryModal = document.getElementById('closeCategoryModal');
    if (closeCategoryModal) {
        closeCategoryModal.addEventListener('click', () => {
            document.getElementById('categoryModal').style.display = 'none';
        });
    }

    console.log('✅ Event listeners configurados');
}

// ===== VERIFICACIÓN DE FUNCIONALIDADES =====

function testFunctions() {
    console.log('🧪 Probando funciones disponibles:');
    console.log('📤 uploadFiles:', typeof uploadFiles);
    console.log('📂 showCategoryManager:', typeof showCategoryManager);
    console.log('➕ addCategory:', typeof addCategory);
    console.log('✏️ editCategory:', typeof editCategory);
    console.log('🗑️ deleteCategory:', typeof deleteCategory);
    console.log('📎 handleFileSelection:', typeof handleFileSelection);
    
    // Verificar elementos del DOM
    const elements = [
        'uploadArea', 'fileInput', 'uploadBtn', 
        'categoryManagerBtn', 'addCategoryBtn',
        'selectedFiles', 'fileListPreview', 'fileCategory'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`🎯 ${id}:`, element ? '✅ Encontrado' : '❌ No encontrado');
    });
}

// ===== INICIALIZACIÓN =====

function init() {
    console.log('🚀 Inicializando aplicación...');
    
    // Verificar sesión existente
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('✅ Sesión restaurada:', currentUser);
        } catch (error) {
            console.error('Error restaurando sesión:', error);
        }
    }
    
    updateUI();
    loadCategories();
    loadFiles();
    
    // Configurar event listeners básicos
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            login(username, password);
        });
    }
    
    // Configurar event listeners avanzados
    setupEventListeners();
    
    // PROBAR FUNCIONES
    testFunctions();
    
    console.log('✅ Aplicación inicializada');
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);