(() => {
    // =============================================
    // CONSTANTES E CONFIGURAÇÕES
    // =============================================
    const STORAGE_KEY = 'horror_movie_app_data'; // Originalmente a ideia era ser apenas para filmes de terror
    const MAX_POSTER_SIZE = 2 * 1024 * 1024; // 2MB
    const DEFAULT_MOVIE_DETAILS = {
        cast: [],
        director: '',
        description: '',
        Link: ''
    };

    // =============================================
    // ESTADO DA APLICAÇÃO
    // =============================================
    let data = {
        profiles: [],
        currentProfileId: null
    };

    // =============================================
    // ELEMENTOS DO DOM
    // =============================================
    const elements = {
        // Elementos principais
        sectionsContainer: document.getElementById('sections-container'),
        btnAddSection: document.getElementById('btn-add-section'),
        modal: document.getElementById('modal'),
        modalContent: document.getElementById('modal-content'),
        modalClose: document.getElementById('modal-close'),

        // Elementos de perfil
        profilesListEl: document.getElementById('profiles-list'),
        btnAddProfile: document.getElementById('btn-add-profile'),
        btnEditProfile: document.getElementById('btn-edit-profile'),
        btnDeleteProfile: document.getElementById('btn-delete-profile'),
        btnCancelAction: document.getElementById('btn-cancel-action'),

        // Navegação
        navProfiles: document.getElementById('nav-profiles'),
        navMovies: document.getElementById('nav-movies'),

        // Gerenciamento
        manageBtn: document.getElementById('btn-manage-profile'),
        manageMenu: document.querySelector('.dropdown-menu')
    };

    // =============================================
    // FUNÇÕES UTILITÁRIAS
    // =============================================
    const generateId = () => 'id_' + Math.random().toString(36).substr(2, 9);

    const saveData = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    };

    const loadData = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        data = stored ? JSON.parse(stored) : { profiles: [], currentProfileId: null };
        saveData();
    };

    const getCurrentProfile = () => {
        return data.profiles.find(p => p.id === data.currentProfileId);
    };

    const closeModal = () => {
        elements.modal.style.display = 'none';
        elements.modalContent.innerHTML = '';
    };

    const closeAllForms = () => {
        elements.modal.style.display = 'none';
        elements.modalContent.innerHTML = '';
    };

    // =============================================
    // GERENCIAMENTO DE TELAS/NAVEGAÇÃO
    // =============================================
    const switchToScreen = (screenName) => {
        // Esconde todas as telas
        ['profile-selection', 'movies-screen'].forEach(id => {
            const section = document.getElementById(id);
            if (section) section.style.display = 'none';
        });

        // Mostra a tela desejada
        const target = document.getElementById(screenName);
        if (target) target.style.display = 'block';
    };

    const setActiveNav = (activeId) => {
        [elements.navProfiles, elements.navMovies].forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = elements[activeId];
        if (activeBtn) activeBtn.classList.add('active');
    };

    const setupNavigation = () => {
        // Navegação para perfis
        elements.navProfiles.addEventListener('click', (e) => {
            e.preventDefault();
            switchToScreen('profile-selection');
            setActiveNav('navProfiles');
        });

        // Navegação para filmes
        elements.navMovies.addEventListener('click', (e) => {
            e.preventDefault();
            if (!data.currentProfileId) {
                alert('Por favor, selecione um perfil antes de acessar os filmes.');
                switchToScreen('profile-selection');
                setActiveNav('navProfiles');
            } else {
                switchToScreen('movies-screen');
                setActiveNav('navMovies');
                renderSections();
            }
        });
    };

    // =============================================
    // GERENCIAMENTO DE PERFIS
    // =============================================
    const renderProfiles = () => {
        elements.profilesListEl.innerHTML = data.profiles.length
            ? data.profiles.map(profile => `
                <div class="profile-card" data-profile-id="${profile.id}">
                    ${profile.image ? `<img src="${profile.image}" alt="${profile.name}">` : ''}
                    <div class="profile-name">${profile.name}</div>
                </div>
            `).join('')
            : '<p style="color:#bbb;font-style:italic;">Nenhum perfil. Por favor, adicione um perfil para começar.</p>';

        addProfileClickListener();
    };

    const addProfileClickListener = () => {
        const profileCards = document.querySelectorAll('.profile-card');

        profileCards.forEach(card => {
            const id = card.getAttribute('data-profile-id');

            // Clique simples: apenas selecionar
            card.addEventListener('click', () => {
                document.querySelectorAll('.profile-card').forEach(c => {
                    c.classList.remove('selected');
                });

                card.classList.add('selected');
                setCurrentProfile(id);
                elements.navMovies.disabled = false;
            });

            // Duplo clique: abrir direto os filmes
            card.addEventListener('dblclick', () => {
                setCurrentProfile(id);
                switchToScreen('movies-screen');
                setActiveNav('navMovies');
                renderSections();
            });
        });
    };

    const setCurrentProfile = (id) => {
        data.currentProfileId = id;
        saveData();
    };

    // =============================================
    // FORMULÁRIOS DE PERFIL (ADICIONAR)
    // =============================================
    const showAddProfileForm = () => {
        elements.modalContent.innerHTML = `
            <h2>Adicionar Novo Perfil</h2>
            <form id="add-profile-form" class="profile-form">
                <label><h3>Nome do Perfil</h3></label>
                <input type="text" required maxlength="50" placeholder="Nome do Perfil">
                
                <label><h3>Imagem de Perfil (opcional, até 2MB)</h3></label>
                <input type="file" accept="image/*" id="profile-image" hidden>
                <label for="profile-image" class="file-btn">Escolher Imagem</label>
                <span id="file-name" class="file-name">Nenhuma imagem selecionada</span>
                
                <button type="submit" class="btn">Adicionar Perfil</button>
                <button class="cancel-edit-btn ">Cancelar</button>
            </form>`;

        // Configura o input de arquivo
        const fileInput = document.getElementById('profile-image');
        const fileNameDisplay = document.getElementById('file-name');
        fileInput.addEventListener('change', () => {
            fileNameDisplay.textContent = fileInput.files[0]?.name || 'Nenhuma imagem selecionada';
        });
        elements.modalContent.querySelector('.cancel-edit-btn ').addEventListener('click', closeAllForms);
        elements.modal.style.display = 'flex';
        document.getElementById('add-profile-form').onsubmit = addProfile;
    };

    const addProfile = (event) => {
        event.preventDefault();
        const form = event.target;
        const nameVal = form.querySelector('input[type="text"]').value.trim();
        const file = form.querySelector('input[type="file"]').files[0];

        // Valida tamanho da imagem
        if (file && file.size > MAX_POSTER_SIZE) {
            alert('O arquivo da imagem do perfil é muito grande. O tamanho máximo é 2MB.');
            return;
        }

        // Processa com imagem
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                data.profiles.push({
                    id: generateId(),
                    name: nameVal,
                    image: reader.result,
                    sections: []
                });
                saveData();
                renderProfiles();
                closeModal();
            };
            reader.readAsDataURL(file);
        }
        // Processa sem imagem
        else {
            data.profiles.push({
                id: generateId(),
                name: nameVal,
                image: null,
                sections: []
            });
            saveData();
            renderProfiles();
            closeModal();
        }
    };

    // FORMULÁRIOS DE PERFIL (EDITAR)
    const showEditProfileForm = (profileId) => {
        const profile = data.profiles.find(p => p.id === profileId);
        if (!profile) return;

        elements.modalContent.innerHTML = `
            <h2>Editar Perfil</h2>
            <form id="edit-profile-form" class="profile-form">
                <label><h3>Nome do Perfil</h3></label>
                <input type="text" value="${profile.name}" required maxlength="50" placeholder="Nome do Perfil">
                
                <label><h3>Imagem de Perfil (opcional, até 2MB)</h3></label>
                <input type="file" accept="image/*" id="edit-profile-image" hidden>
                <label for="edit-profile-image" class="file-btn">Escolher Imagem</label>
                <span id="edit-file-name" class="file-name">Nenhuma imagem selecionada</span>
                
                <button type="submit" class="btn">Salvar Alterações</button>
                <button class="cancel-edit-btn ">Cancelar</button>
            </form>`;

        // Configura o input de arquivo
        const fileInput = document.getElementById('edit-profile-image');
        const fileNameDisplay = document.getElementById('edit-file-name');
        fileInput.addEventListener('change', () => {
            fileNameDisplay.textContent = fileInput.files[0]?.name || 'Nenhuma imagem selecionada';
        });


        elements.modal.style.display = 'flex';
        document.getElementById('edit-profile-form').onsubmit = (e) => {
            e.preventDefault();
            editProfile(profileId);
        };
    };

    const editProfile = (profileId) => {
        const form = document.getElementById('edit-profile-form');
        const nameVal = form.querySelector('input[type="text"]').value.trim();
        const file = form.querySelector('input[type="file"]').files[0];
        const profile = data.profiles.find(p => p.id === profileId);

        if (!profile) return;

        // Valida tamanho da imagem
        if (file && file.size > MAX_POSTER_SIZE) {
            alert('O arquivo da imagem do perfil é muito grande. O tamanho máximo é 2MB.');
            return;
        }

        // Processa com imagem
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                profile.name = nameVal;
                profile.image = reader.result;
                saveData();
                renderProfiles();
                closeModal();
            };
            reader.readAsDataURL(file);
        }
        // Processa sem imagem
        else {
            profile.name = nameVal;
            saveData();
            renderProfiles();
            closeModal();
        }
    };
    
    // =============================================
    // DELETAR PERFIL
    // =============================================
    const deleteProfile = (profileId) => {
        if (confirm('Tem certeza que deseja excluir este perfil? Todos os dados associados serão perdidos.')) {
            data.profiles = data.profiles.filter(p => p.id !== profileId);

            // Se estava selecionado, deseleciona
            if (data.currentProfileId === profileId) {
                data.currentProfileId = null;
            }

            saveData();
            renderProfiles();
        }
    };

    // =============================================
    // GERENCIAMENTO DE SEÇÕES
    // =============================================
    const renderSections = () => {
        const profile = getCurrentProfile();
        elements.sectionsContainer.innerHTML = '';
        profile.sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'movie-section';
            sectionDiv.innerHTML = `
                <div class="section-header" style="display:flex; align-items:center; gap:0.5rem;">
                    <h2 style="flex-grow:1;">${section.name}</h2>
                    <button class="btn subtle-btn" data-section-id="${section.id}" style="padding:0 0.5rem;">✎</button>
                    <button class="btn subtle-btn" data-section-id="${section.id}" style="padding:0 0.5rem;">🗑</button>
                    <button class="btn subtle-btn" data-section-id="${section.id}">+ Filme</button>
                </div>
                <div class="movies-list" id="movies-${section.id}" style="display:flex; gap:1rem; overflow-x:auto; padding-bottom:0.5rem;"></div>
            `;
            elements.sectionsContainer.appendChild(sectionDiv);
            renderMovies(section);
            const buttons = sectionDiv.querySelectorAll('.btn.subtle-btn');
            buttons[0].onclick = () => showEditSectionForm(section.id);      
            buttons[1].onclick = () => {                                       
                if (confirm('Excluir seção e todos os filmes nela?')) deleteSection(section.id);
            };
            buttons[2].onclick = () => showAddMovieForm(section.id);          
        });
    };

    // =============================================
    // FORMULÁRIOS DE SEÇÃO (ADICIONAR)
    // =============================================
    const showAddSectionForm = () => {
        elements.modalContent.innerHTML = `
            <h2>Nova Seção</h2>
            <form id="add-section-form">
                <input type="text" placeholder="Nome da Seção" required>
                <button type="submit" class="btn">Adicionar Seção</button>
                <button class="cancel-edit-btn ">Cancelar</button>
            </form>`;

        elements.modal.style.display = 'flex';
        document.getElementById('add-section-form').onsubmit = addSection;
        // Fechar ao clicar no X
        elements.modalContent.querySelector('.cancel-edit-btn ').addEventListener('click', closeAllForms);
    };

    const addSection = (e) => {
        e.preventDefault();
        const name = e.target.querySelector('input[type="text"]').value.trim();
        if (!name) return;

        const profile = getCurrentProfile();
        if (!profile) return;

        profile.sections = profile.sections || [];
        profile.sections.push({
            id: generateId(),
            name,
            movies: []
        });

        saveData();
        renderSections();
        closeModal();
    };

    // =============================================
    // FORMULÁRIOS DE SEÇÃO (EDITAR)
    // =============================================
    const showEditSectionForm = (sectionId) => {
        const profile = getCurrentProfile();
        const section = profile?.sections?.find(s => s.id === sectionId);
        if (!section) return;

        elements.modalContent.innerHTML = `
            <h2>Editar Seção</h2>
            <form id="edit-section-form">
                <input type="text" value="${section.name}" required>
                <button type="submit" class="btn">Salvar</button>
                <button class="cancel-edit-btn ">Cancelar</button>
            </form>`;

        elements.modal.style.display = 'flex';
        document.getElementById('edit-section-form').onsubmit = (e) => {
            e.preventDefault();
            section.name = e.target.querySelector('input').value.trim();
            saveData();
            renderSections();
            closeModal();
        };
    };

    const deleteSection = (sectionId) => {
        const profile = getCurrentProfile();
        if (!profile) return;

        profile.sections = profile.sections.filter(s => s.id !== sectionId);
        saveData();
        renderSections();
    };

    // =============================================
    // GERENCIAMENTO DE FILMES
    // =============================================
    let currentExpandedMovie = null;
    const renderMovies = (section) => {
        const container = document.getElementById(`movies-${section.id}`);
        if (!container) return;

        container.innerHTML = '';

        if (!section.movies || section.movies.length === 0) {
            container.innerHTML = '<p>Nenhum filme nesta seção.</p>';
            return;
        }

        section.movies.forEach(movie => {
            // Garante que os detalhes existam
            movie.details = movie.details || {
                cast: [],
                director: '',
                description: '',
                Link: ''
            };

            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            movieCard.innerHTML = `
            <div class="movie-poster-container">
                <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
                <div class="movie-hover-actions">
                </div>
            </div>
            <h3 class="movie-title">${movie.title}</h3>
        `;

            container.appendChild(movieCard);

            // Evento para mostrar detalhes estilo Netflix
            movieCard.addEventListener('click', (e) => {
                // Não abre os detalhes se clicar nos botões diretamente
                if (!e.target.classList.contains('play-btn') && !e.target.classList.contains('details-btn')) {
                    showNetflixStyleDetails(section.id, movie.id);
                }
            });

            // Botão de assistir
            movieCard.querySelector('.play-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (movie.details.Link) {
                    window.open(movie.details.Link, '_blank');
                } else {
                    alert('Link do filme não disponível');
                }
            });

            // Botão de detalhes
            movieCard.querySelector('.details-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                showNetflixStyleDetails(section.id, movie.id);
            });
        });
    };


    // =============================================
    // EXIBIÇÃO INTERNA ESTILO NETFLIX
    // =============================================
    const showNetflixStyleDetails = (sectionId, movieId) => {
        const profile = getCurrentProfile();
        const section = profile?.sections?.find(s => s.id === sectionId);
        const movie = section?.movies?.find(m => m.id === movieId);
        if (!movie) return;

        // Fecha o filme expandido anterior
        if (currentExpandedMovie) {
            document.getElementById(`expanded-${currentExpandedMovie}`)?.remove();
        }

        // Cria o container de detalhes
        const expandedDetails = document.createElement('div');
        expandedDetails.id = `expanded-${movie.id}`;
        expandedDetails.className = 'netflix-expanded-details';
        expandedDetails.innerHTML = `
        <div class="expanded-backdrop" style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.1), #0d0d0d), url('${movie.poster}')"></div>
        <div class="expanded-content">
            <button class="close-expanded">✕</button>
            <h2>${movie.title} <span>(${movie.year})</span></h2>
            <div class="movie-meta">
                <span class="year">${movie.year}</span>
                <span class="time">${movie.details.duration}</span>
                <span class="genre">${movie.genre}</span>
                <span class="quality">HD</span>
            </div>
            
            <div class="movie-actions-row">
                <button class="btn play-btn">
                    <span>▶</span> Assistir
                </button>
                <button class="btn edit-details-btn">
                    <span>✎</span> Editar
                </button>
                <button class="btn delete-movie-btn">
                    <span>🗑</span> Excluir
                </button>
            </div>
            
            <div class="synopsis">
                <h3>Sinopse</h3>
                <p>${movie.details.description || 'Descrição não disponível'}</p>
            </div>
            
            <div class="additional-info">
                <div class="info-column">
                    <p><strong>Elenco:</strong> ${movie.details.cast?.join(', ') || 'Não informado'}</p>
                    <p><strong>Gêneros:</strong> ${movie.genre}</p>
                </div>
                <div class="info-column">
                    <p><strong>Diretor:</strong> ${movie.details.director || 'Não informado'}</p>
                    <p><strong>Classificação:</strong> ${movie.details.rating || '16+'}</p>
                </div>
            </div>
            
            <form class="edit-movie-form" id="edit-movie-${movie.id}">
                <div class="edit-form-group">
                    <label>Título</label>
                    <input type="text" value="${movie.title}" required>
                </div>
                
                <div class="edit-form-group">
                    <label>Gênero</label>
                    <input type="text" value="${movie.genre}" required>
                </div>
                
                <div class="edit-form-group">
                    <label>Ano</label>
                    <input type="number" value="${movie.year}" required>
                </div>
                
                <div class="edit-form-group">
                    <label>Diretor</label>
                    <input type="text" value="${movie.details.director || ''}">
                </div>
                
                <div class="edit-form-group">
                    <label>Elenco (separado por vírgulas)</label>
                    <input type="text" value="${movie.details.cast?.join(', ') || ''}">
                </div>
                
                <div class="edit-form-group">
                    <label>Descrição</label>
                    <textarea>${movie.details.description || ''}</textarea>
                </div>
                
                <div class="edit-form-group">
                    <label>Link do Filme/Série</label>
                    <input type="url" value="${movie.details.Link || ''}">
                </div>
                
                <div class="edit-form-group">
                    <label>Duração (ex: 1h 30min/10 episódios)</label>
                    <input type="text" value="${movie.details.duration || ''}">
                </div>
                
    <div class="edit-form-group">
    <label>Classificação</label>
    <select class="rating-select">
      <option value="L" ${movie.details.rating === 'L' ? 'selected' : ''}>L - Livre</option>
      <option value="10+" ${movie.details.rating === '10+' ? 'selected' : ''}>10+</option>
      <option value="12+" ${movie.details.rating === '12+' ? 'selected' : ''}>12+</option>
      <option value="14+" ${movie.details.rating === '14+' ? 'selected' : ''}>14+</option>
      <option value="16+" ${movie.details.rating === '16+' ? 'selected' : ''}>16+</option>
      <option value="18+" ${movie.details.rating === '18+' ? 'selected' : ''}>18+</option>
    </select>
  </div>

                 <div class="form-group">
      <label>Alterar Poster</label>
      <input type="file" accept="image/*" id="update-poster-${movie.id}" style="display: none;">
      <label for="update-poster-${movie.id}" class="update-poster-btn">
        Selecionar Nova Imagem
      </label>
      <small>Tamanho máximo: 2MB</small>
    </div>

                <div class="form-actions">
                    <button type="submit" class="btn">Salvar Alterações</button>
                    <button type="button" class="btn cancel-edit-btn">Cancelar</button>
                </div>
            </form>
        </div>
    `;

        document.body.appendChild(expandedDetails);
        document.body.classList.add('modal-open');
        currentExpandedMovie = movie.id;

        // Fecha ao clicar no X
        expandedDetails.querySelector('.close-expanded').addEventListener('click', closeExpandedDetails);

        // Botão de play
        expandedDetails.querySelector('.play-btn').addEventListener('click', () => {
            if (movie.details.Link) {
                window.open(movie.details.Link, '_blank');
            } else {
                alert('Link do filme não disponível');
            }
        });

        // Botão de editar - mostra o formulário
        expandedDetails.querySelector('.edit-details-btn').addEventListener('click', () => {
            const form = expandedDetails.querySelector('.edit-movie-form');
            form.classList.add('active');
        });

        // Botão de cancelar edição
        expandedDetails.querySelector('.cancel-edit-btn')?.addEventListener('click', () => {
            const form = expandedDetails.querySelector('.edit-movie-form');
            form.classList.remove('active');
        });

        // Botão de deletar filme
        expandedDetails.querySelector('.delete-movie-btn').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir este filme?')) {
                deleteMovie(sectionId, movie.id);
                closeExpandedDetails();
            }
        });

        // Formulário de edição
        const editForm = expandedDetails.querySelector(`#edit-movie-${movie.id}`);
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateMovieDetails(sectionId, movie.id, editForm);
        });

        const posterInput = expandedDetails.querySelector(`#update-poster-${movie.id}`);
        posterInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.size > MAX_POSTER_SIZE) {
                alert('A imagem é muito grande. Tamanho máximo: 2MB.');
                return;
            }

            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    movie.poster = reader.result;
                    saveData();
                    // Atualiza a imagem de fundo imediatamente
                    expandedDetails.querySelector('.expanded-backdrop').style.backgroundImage =
                        `linear-gradient(to bottom, rgba(0,0,0,0.1), #0d0d0d), url('${reader.result}')`;
                };
                reader.readAsDataURL(file);
            };
        });

    };

    // =============================================
    // FUNÇÃO PARA FECHAR ATRÁVES DO X
    // =============================================
    const closeExpandedDetails = () => {
        if (currentExpandedMovie) {
            document.getElementById(`expanded-${currentExpandedMovie}`)?.remove();
            document.body.classList.remove('modal-open');
            currentExpandedMovie = null;
        }
    };

    // =============================================
    // ATUALIZAÇÃO APÓS EDITAR O FILME
    // =============================================
    const updateMovieDetails = (sectionId, movieId, form) => {
        const profile = getCurrentProfile();
        const section = profile?.sections?.find(s => s.id === sectionId);
        const movie = section?.movies?.find(m => m.id === movieId);
        if (!movie) return;

        // Atualiza os dados básicos
        movie.title = form.querySelector('input[type="text"]').value.trim();
        movie.genre = form.querySelectorAll('input[type="text"]')[1].value.trim();
        movie.year = form.querySelector('input[type="number"]').value.trim();

        // Atualiza os detalhes
        movie.details = {
            director: form.querySelectorAll('input[type="text"]')[2].value.trim(),
            cast: form.querySelectorAll('input[type="text"]')[3].value.trim().split(',').map(s => s.trim()).filter(s => s),
            description: form.querySelector('textarea').value.trim(),
            Link: form.querySelector('input[type="url"]').value.trim(),
            duration: form.querySelectorAll('input[type="text"]')[4].value.trim(),
            rating: form.querySelector('select').value
        };

        saveData();
        renderSections();
        closeExpandedDetails();
    };

    // =============================================
    // DELETAR FILME
    // =============================================
    const deleteMovie = (sectionId, movieId) => {
        const profile = getCurrentProfile();
        const section = profile?.sections?.find(s => s.id === sectionId);
        if (!section) return;

        section.movies = section.movies.filter(m => m.id !== movieId);
        saveData();
        renderSections();
    };

    // =============================================
    // FORM PARA ADICIONAR FILME
    // =============================================
    const showAddMovieForm = (sectionId) => {
        elements.modalContent.innerHTML = `
    <div class="form-header">
      <h2>Adicionar Filme</h2>
    </div>
    <form id="add-movie-form">
      <div class="form-group">
        <label>Título*</label>
        <input type="text" required>
      </div>
      
      <div class="form-group">
        <label>Gênero*</label>
        <input type="text" required>
      </div>
      
      <div class="form-group">
        <label>Ano*</label>
        <input type="number" required>
      </div>
      
     <div class="form-group poster-upload">
  <label for="poster-input">Poster (opcional)</label>
  <div class="file-input-wrapper">
    <input type="file" id="poster-input" accept="image/*">
    <label for="poster-input" class="file-btn">Selecionar Imagem</label>
  </div>
  <small class="poster-note">Tamanho máximo: 2MB</small>
</div>
      
      <div class="form-actions">
        <button type="submit" class="btn">Adicionar Filme</button>
        <button type="button" class="btn cancel-edit-btn">Cancelar</button>
      </div>
    </form>
  `;

        elements.modal.style.display = 'flex';

        const form = document.getElementById('add-movie-form');
        form.onsubmit = (e) => addMovie(e, sectionId);

        // Fechar ao clicar no botão de cancelar
        form.querySelector('.cancel-edit-btn').addEventListener('click', closeAllForms);
    };

    // =============================================
    // PROCESSO PARA ADICIONAR
    // =============================================
    const addMovie = (e, sectionId) => {
        e.preventDefault();
        const form = e.target;
        const title = form.querySelector('input[type="text"]').value.trim();
        const genre = form.querySelectorAll('input[type="text"]')[1].value.trim();
        const year = form.querySelector('input[type="number"]').value.trim();
        const file = form.querySelector('input[type="file"]').files[0];

        // Se houver arquivo, valida o tamanho
        if (file && file.size > MAX_POSTER_SIZE) {
            alert('A imagem é muito grande. Tamanho máximo: 2MB.');
            return;
        }

        const profile = getCurrentProfile();
        const section = profile.sections.find(s => s.id === sectionId);

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                addMovieToSection(section, title, genre, year, reader.result);
                closeAllForms();
            };
            reader.readAsDataURL(file);
        } else {
            addMovieToSection(section, title, genre, year, null);
            closeAllForms();
        }
    };

    // Função auxiliar para adicionar filme
    const addMovieToSection = (section, title, genre, year, poster) => {
        section.movies.push({
            id: generateId(),
            title,
            genre,
            year,
            poster: poster || 'assets/posterPlaceHolder.jpg', // Imagem padrão
            details: {
                cast: [],
                director: '',
                description: '',
                Link: '',
                rating: '16+',
                duration: '1h 30min'
            }
        });
        saveData();
        renderSections();
    };

    // =============================================
    // CONFIGURAÇÃO INICIAL
    // =============================================
    const initialize = () => {
        // Carrega dados
        loadData();

        // Configura navegação
        setupNavigation();

        // Configura botões principais
        elements.btnAddProfile.addEventListener('click', showAddProfileForm);
        elements.modalClose.addEventListener('click', closeAllForms);
        elements.btnAddSection.addEventListener('click', showAddSectionForm);

        // Configura botões de perfil
        elements.btnEditProfile.addEventListener('click', () => {
            const selected = document.querySelector('.profile-card.selected');
            if (selected) {
                showEditProfileForm(selected.getAttribute('data-profile-id'));
            } else {
                alert('Selecione um perfil para editar.');
            }
        });

        elements.btnDeleteProfile.addEventListener('click', () => {
            const selected = document.querySelector('.profile-card.selected');
            if (selected) {
                deleteProfile(selected.getAttribute('data-profile-id'));
            } else {
                alert('Selecione um perfil para excluir.');
            }
        });

        // Configura dropdown de gerenciamento
        if (elements.manageBtn && elements.manageMenu) {
            elements.manageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                elements.manageMenu.classList.toggle('hidden');
            });

            window.addEventListener('click', () => {
                elements.manageMenu.classList.add('hidden');
            });
        }

        // Renderiza interface inicial
        renderProfiles();
        switchToScreen('profile-selection');
        setActiveNav('navProfiles');
    };

    // Inicializa a aplicação
    initialize();
})();