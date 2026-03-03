document.addEventListener('DOMContentLoaded', () => {
  // 1. Navbar height calculation
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    document.documentElement.style.setProperty('--nav-height', navbar.offsetHeight + 'px');
  }

  // 1b. Navbar Scroll Listener
  const navWrapper = document.querySelector('.navbar-wrapper');
  window.addEventListener('scroll', () => {
    if (navWrapper) {
      if (window.scrollY > 20) {
        navWrapper.classList.add('scrolled');
      } else {
        navWrapper.classList.remove('scrolled');
      }
    }
  });

  // 2. Product Visibility Logic (Filter, Search, and View More)
  const filterButtons = document.querySelectorAll('.filter-btn');
  const productSearch = document.getElementById('productSearch');
  const viewMoreBtn = document.getElementById('viewMoreBtn');
  const viewMoreContainer = document.getElementById('viewMoreContainer');
  let isShowingAll = false;

  function updateProductVisibility() {
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'all';
    const searchTerm = productSearch ? productSearch.value.toLowerCase() : '';
    const allCardWrappers = Array.from(document.querySelectorAll('#productsGrid > div'));

    let visibleCount = 0;
    let totalMatches = 0;

    allCardWrappers.forEach(wrapper => {
      const card = wrapper.querySelector('.recipe-card');
      if (!card) return;

      const category = card.dataset.category;
      const title = wrapper.querySelector('h6').textContent.toLowerCase();
      const desc = wrapper.querySelector('.recipe-meta').textContent.toLowerCase();

      const matchesFilter = activeFilter === 'all' || category === activeFilter;
      const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);

      if (matchesFilter && matchesSearch) {
        totalMatches++;
        if (isShowingAll || visibleCount < 8) {
          wrapper.classList.remove('d-none');
          visibleCount++;
        } else {
          wrapper.classList.add('d-none');
        }
      } else {
        wrapper.classList.add('d-none');
      }
    });

    // Toggle View More button visibility
    if (viewMoreContainer) {
      if (isShowingAll || totalMatches <= 8) {
        viewMoreContainer.classList.add('d-none');
      } else {
        viewMoreContainer.classList.remove('d-none');
      }
    }
  }

  // Filter Button Listeners
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      isShowingAll = false; // Reset pagination when filter changes
      updateProductVisibility();
    });
  });

  // Search Input Listener
  if (productSearch) {
    productSearch.addEventListener('input', () => {
      isShowingAll = false; // Reset pagination when searching
      updateProductVisibility();
    });
  }

  // View More Button Listener
  if (viewMoreBtn) {
    viewMoreBtn.addEventListener('click', () => {
      isShowingAll = true;
      updateProductVisibility();
    });
  }

  // Initial visibility update
  updateProductVisibility();

  // 3. Sort by rate (price) low–high / high–low
  const sortMenuItems = document.querySelectorAll('.dropdown-menu [data-sort]');
  const productsGrid = document.getElementById('productsGrid');
  const sortDropdownButton = document.getElementById('sortDropdownButton');

  if (productsGrid && sortMenuItems.length && sortDropdownButton) {
    sortMenuItems.forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        const sortType = item.dataset.sort;
        sortMenuItems.forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        sortDropdownButton.textContent = item.textContent.trim();

        if (sortType === 'price-asc' || sortType === 'price-desc') {
          const columns = Array.from(productsGrid.children);
          columns.sort((a, b) => {
            const cardA = a.querySelector('.recipe-card');
            const cardB = b.querySelector('.recipe-card');
            const priceA = parseFloat(cardA ? cardA.dataset.price : '0');
            const priceB = parseFloat(cardB ? cardB.dataset.price : '0');
            return sortType === 'price-asc' ? priceA - priceB : priceB - priceA;
          });
          columns.forEach((col) => productsGrid.appendChild(col));
          // Update visibility after sorting to preserve pagination/filtering
          updateProductVisibility();
        }
      });
    });
  }

  // 4. Restore heart states and render sidebar
  const favs = JSON.parse(localStorage.getItem('royalFavourites') || '[]');
  const ids = favs.map(f => f.id);
  document.querySelectorAll('.heart-btn').forEach(btn => {
    const card = btn.closest('article');
    const name = card?.dataset.name || card?.querySelector('h6')?.textContent.trim();
    if (ids.includes(name)) btn.classList.add('liked');
  });

  renderFavSidebar();

  // 5. Hook Offcanvas event
  const favOffcanvas = document.getElementById('favSidebar');
  if (favOffcanvas) {
    favOffcanvas.addEventListener('show.bs.offcanvas', renderFavSidebar);
  }
});


// Heart favourite toggle — persists to localStorage
function toggleHeart(btn) {
  const card = btn.closest('article');
  const d = card.dataset;
  const name = d.name || card.querySelector('h6').textContent.trim();
  const id = name;

  const data = {
    id,
    name,
    img: d.img || card.querySelector('img').src,
    alt: card.querySelector('img').alt,
    price: d.price || card.querySelector('.text-warning.fw-semibold')?.textContent.trim().replace('₹', '') || '',
    time: d.time || card.querySelector('small.text-secondary')?.textContent.trim() || '',
    calories: d.calories || '',
    ingredients: d.ingredients || '',
    allergens: d.allergens || '',
    desc: d.desc || card.querySelector('.recipe-meta')?.textContent.trim() || '',
    category: d.category || '',
    badge: d.badge || card.querySelector('.badge')?.textContent.trim() || '',
    badgeclass: d.badgeclass || card.querySelector('.badge')?.className || '',
    order: d.order || card.querySelector('.btn-warning.w-100')?.getAttribute('onclick') || ''
  };

  let favs = JSON.parse(localStorage.getItem('royalFavourites') || '[]');
  const exists = favs.findIndex(f => f.id === id);

  if (exists > -1) {
    favs.splice(exists, 1);
    btn.classList.remove('liked');
  } else {
    favs.push(data);
    btn.classList.add('liked');
  }

  localStorage.setItem('royalFavourites', JSON.stringify(favs));
  renderFavSidebar();
}

// Render favourites in sidebar
function renderFavSidebar() {
  const container = document.getElementById('favSidebarContent');
  if (!container) return;

  const favs = JSON.parse(localStorage.getItem('royalFavourites') || '[]');
  console.log("Rendering Favourites Sidebar. Items count:", favs.length);

  if (favs.length === 0) {
    container.innerHTML = `
            <div class="text-center py-5 opacity-50">
                <i class="bi bi-heart fs-1 mb-3 text-warning"></i>
                <p>Your favourites list is empty</p>
            </div>`;
    return;
  }

  container.innerHTML = favs.map(item => `
        <div class="card bg-dark border-warning border-opacity-25 overflow-hidden mb-2">
            <div class="row g-0 align-items-center">
                <div class="col-4">
                    <img src="${item.img}" class="img-fluid h-100 object-fit-cover" alt="${item.name}" style="min-height: 80px;">
                </div>
                <div class="col-8">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="card-title mb-0 small fw-bold text-warning">${item.name}</h6>
                            <button class="btn btn-link text-danger p-0 border-0" onclick="removeFav('${item.id.replace(/'/g, "\\'")}')">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="text-white fw-semibold small">₹${item.price}</span>
                            <button class="btn btn-warning btn-sm py-0 px-2 rounded-pill small" style="font-size: 0.7rem;" 
                                onclick="${item.order?.replace(/"/g, "'") || ''}">
                                Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Remove favourite and refresh UI
function removeFav(id) {
  let favs = JSON.parse(localStorage.getItem('royalFavourites') || '[]');
  favs = favs.filter(f => f.id !== id);
  localStorage.setItem('royalFavourites', JSON.stringify(favs));

  // Refresh hearts on page
  document.querySelectorAll('article.recipe-card').forEach(card => {
    const cardId = card.dataset.name || card.querySelector('h6').textContent.trim();
    if (cardId === id) {
      card.querySelector('.heart-btn')?.classList.remove('liked');
    }
  });

  renderFavSidebar();
}

// Open dish detail modal
function openDishModal(article) {
  const d = article.dataset;
  document.getElementById('modal-img').src = d.img || '';
  document.getElementById('modal-img').alt = d.name || '';
  document.getElementById('modal-name').textContent = d.name || '';
  document.getElementById('modal-badge').className = (d.badgeclass || 'badge') + ' mb-2';
  document.getElementById('modal-badge').textContent = d.badge || '';
  document.getElementById('modal-price').textContent = '₹' + (d.price || '');
  document.getElementById('modal-time').innerHTML = '<i class="bi bi-clock me-1"></i>' + (d.time || '');
  document.getElementById('modal-cal').innerHTML = '<i class="bi bi-fire me-1"></i>' + (d.calories || '');
  document.getElementById('modal-desc').textContent = d.desc || '';
  document.getElementById('modal-ingredients').textContent = d.ingredients || '';
  document.getElementById('modal-allergens').textContent = d.allergens || '';
  document.getElementById('modal-order').href = d.order || '#';

  // Using the global bootstrap object correctly
  if (window.bootstrap) {
    const modalElement = document.getElementById('dishModal');
    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
      modal = new bootstrap.Modal(modalElement);
    }
    modal.show();
  }
}
