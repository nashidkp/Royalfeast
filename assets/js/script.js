document.addEventListener('DOMContentLoaded', () => {
  // Simple front-end filter: All / Veg / Non‑veg
  const filterButtons = document.querySelectorAll('.filter-btn');
  const recipeCards = document.querySelectorAll('.recipe-card[data-category]');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Button active state
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Show / hide cards
      recipeCards.forEach((card) => {
        const type = card.dataset.category;
        if (filter === 'all' || type === filter) {
          card.parentElement.classList.remove('d-none');
        } else {
          card.parentElement.classList.add('d-none');
        }
      });
    });
  });

  // Sort by rate (price) low–high / high–low from dropdown
  const sortMenuItems = document.querySelectorAll('.dropdown-menu [data-sort]');
  const productsGrid = document.getElementById('productsGrid');
  const sortDropdownButton = document.getElementById('sortDropdownButton');

  if (productsGrid && sortMenuItems.length && sortDropdownButton) {
    sortMenuItems.forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();

        const sortType = item.dataset.sort;

        // Update active state in dropdown and button label
        sortMenuItems.forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        sortDropdownButton.textContent = item.textContent.trim();

        if (sortType === 'price-asc' || sortType === 'price-desc') {
          const columns = Array.from(productsGrid.children);

          columns.sort((a, b) => {
            const priceA = parseFloat(a.querySelector('.recipe-card').dataset.price || '0');
            const priceB = parseFloat(b.querySelector('.recipe-card').dataset.price || '0');

            return sortType === 'price-asc' ? priceA - priceB : priceB - priceA;
          });

          columns.forEach((col) => productsGrid.appendChild(col));
        }
      });
    });
  }

  // Favourites handling
  const favouriteButtons = document.querySelectorAll('.favourite-toggle');
  const favouritesPanel = document.getElementById('favouritesPanel');
  const favouritesList = document.getElementById('favouritesList');
  const openFavouritesBtn = document.querySelector('.js-open-favourites');
  const favourites = new Map();

  function renderFavourites() {
    favouritesList.innerHTML = '';
    if (favourites.size === 0) {
      favouritesPanel.classList.add('d-none');
      return;
    }

    favouritesPanel.classList.remove('d-none');

    favourites.forEach((name, id) => {
      const chip = document.createElement('span');
      chip.className = 'favourite-chip d-inline-flex align-items-center gap-1';
      chip.innerHTML = `<span>${name}</span><i class="bi bi-x fs-6" data-remove="${id}"></i>`;
      favouritesList.appendChild(chip);
    });

    // Attach remove listeners
    favouritesList.querySelectorAll('[data-remove]').forEach((icon) => {
      icon.addEventListener('click', () => {
        const id = icon.getAttribute('data-remove');
        favourites.delete(id);
        // sync button state
        favouriteButtons.forEach((btn) => {
          if (btn.dataset.id === id) {
            btn.classList.remove('active');
          }
        });
        renderFavourites();
      });
    });
  }

  favouriteButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;

      if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        favourites.delete(id);
      } else {
        btn.classList.add('active');
        favourites.set(id, name);
      }

      renderFavourites();
    });
  });

  if (openFavouritesBtn && favouritesPanel) {
    openFavouritesBtn.addEventListener('click', () => {
      if (favourites.size > 0) {
        favouritesPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
});
