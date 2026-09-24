/**
 * KRISSY GREER - CENTURY 21 ADVANTAGE REALTY
 * Modern Interactive Application Logic & RESO MLS Integration
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initMLSExplorer();
  initModals();
  initContactForms();
});

/**
 * Header Scroll Effects
 */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/**
 * Mobile Navigation Menu
 */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * RESO MLS Explorer & Dynamic Listing Engine
 */
function initMLSExplorer() {
  const gridContainer = document.getElementById('propertiesGrid');
  if (!gridContainer || !window.MLSService) return;

  const keywordInput = document.getElementById('mlsKeywordInput');
  const priceFilter = document.getElementById('mlsPriceFilter');
  const bedsFilter = document.getElementById('mlsBedsFilter');
  const sortSelect = document.getElementById('mlsSortSelect');
  const resetBtn = document.getElementById('mlsResetBtn');
  const resultCount = document.getElementById('mlsResultCount');
  const filterTabs = document.querySelectorAll('.filter-btn');

  const state = {
    query: '',
    category: 'all',
    minPrice: 0,
    maxPrice: 0,
    minBeds: 0,
    sortBy: 'newest'
  };

  let debounceTimer = null;

  async function renderListings() {
    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--c21-text-secondary);">
        Loading active MLS properties...
      </div>
    `;

    try {
      let listings = await window.MLSService.fetchListings({
        query: state.query,
        category: state.category,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        sortBy: state.sortBy
      });

      // Filter by minBeds if selected
      if (state.minBeds > 0) {
        listings = listings.filter(item => item.BedroomsTotal >= state.minBeds);
      }

      // Update Result Count
      if (resultCount) {
        resultCount.textContent = `Showing ${listings.length} active MLS ${listings.length === 1 ? 'property' : 'properties'}`;
      }

      if (listings.length === 0) {
        gridContainer.innerHTML = `
          <div class="mls-no-results">
            <h4 style="font-family: var(--font-serif); font-size: 1.3rem; margin-bottom: 0.5rem; color: var(--c21-black);">
              No properties matched your criteria
            </h4>
            <p style="margin-bottom: 1.5rem;">Try adjusting your price range, removing search keywords, or selecting 'All Listings'.</p>
            <button type="button" class="btn btn-primary" id="mlsClearEmptyBtn">
              Reset Filters
            </button>
          </div>
        `;
        const clearBtn = document.getElementById('mlsClearEmptyBtn');
        if (clearBtn) clearBtn.addEventListener('click', resetAll);
        return;
      }

      // Render cards
      gridContainer.innerHTML = listings.map(listing => {
        const photo = listing.Media?.[0]?.MediaURL || 'images/spacejoy.jpg';
        const price = window.MLSService.formatCurrency(listing.ListPrice);
        const area = window.MLSService.formatArea(listing.LivingArea);
        const lot = listing.LotSizeAcres ? `${listing.LotSizeAcres} Acres` : '';

        return `
          <article class="property-card" data-listing-id="${listing.ListingId}">
            <div class="property-thumb-wrap">
              <img src="${photo}" alt="${listing.UnparsedAddress}" class="property-thumb" loading="lazy">
              <span class="property-badge-status">${listing.StandardStatus || 'Active'} • ${listing.ListingId}</span>
              <span class="property-price-tag">${price}</span>
            </div>
            <div class="property-body">
              <h3 class="property-title">${listing.PropertySubType}</h3>
              <p class="property-address">
                <svg style="width: 14px; height: 14px; fill: currentColor; display: inline;" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                ${listing.UnparsedAddress} • ${listing.City}, ${listing.StateOrProvince}
              </p>
              <div class="property-features-row">
                <span class="feature-item">
                  <svg viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
                  ${listing.BedroomsTotal || 0} Beds
                </span>
                <span class="feature-item">
                  <svg viewBox="0 0 24 24"><path d="M21 10.78V8c0-1.65-1.35-3-3-3h-4c-1.65 0-3 1.35-3 3v2.78c-2.34.69-4 2.89-4 5.22V19h18v-3c0-2.33-1.66-4.53-4-5.22z"/></svg>
                  ${listing.BathroomsTotalInteger || 0} Baths
                </span>
                <span class="feature-item">
                  <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></svg>
                  ${area}
                </span>
                ${lot ? `<span class="feature-item">${lot}</span>` : ''}
              </div>
              <div class="property-card-footer" style="display: flex; gap: 0.6rem;">
                <button type="button" class="btn btn-primary btn-view-details" style="flex: 1; padding: 0.75rem 1rem; font-size: 0.88rem;" data-id="${listing.ListingId}">
                  View Details
                </button>
                <button type="button" class="btn btn-outline-dark btn-quick-inquire" style="padding: 0.75rem 1rem; font-size: 0.88rem;" data-id="${listing.ListingId}" data-title="${listing.UnparsedAddress} (${listing.ListingId})">
                  Schedule Showing
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('');

      attachCardListeners();

    } catch (err) {
      console.error('Error rendering MLS listings', err);
      gridContainer.innerHTML = `<div class="mls-no-results">Unable to load MLS listings. Please try again.</div>`;
    }
  }

  function attachCardListeners() {
    // Detail sheet button
    gridContainer.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        openPropertyDetails(id);
      });
    });

    // Quick Inquire button
    gridContainer.querySelectorAll('.btn-quick-inquire').forEach(btn => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.title;
        const contactModal = document.getElementById('contactModal');
        if (contactModal && typeof contactModal.showModal === 'function') {
          const msg = contactModal.querySelector('#modalMessage');
          if (msg) {
            msg.value = `Hello Krissy, I would like to schedule a private showing for: ${title}.`;
          }
          contactModal.showModal();
        }
      });
    });
  }

  function resetAll() {
    state.query = '';
    state.category = 'all';
    state.minPrice = 0;
    state.maxPrice = 0;
    state.minBeds = 0;
    state.sortBy = 'newest';

    if (keywordInput) keywordInput.value = '';
    if (priceFilter) priceFilter.value = '';
    if (bedsFilter) bedsFilter.value = '';
    if (sortSelect) sortSelect.value = 'newest';

    filterTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === 'all');
    });

    renderListings();
  }

  // Event Listeners
  if (keywordInput) {
    keywordInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.query = e.target.value;
        renderListings();
      }, 250);
    });
  }

  if (priceFilter) {
    priceFilter.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        const [min, max] = val.split('-').map(Number);
        state.minPrice = min;
        state.maxPrice = max;
      } else {
        state.minPrice = 0;
        state.maxPrice = 0;
      }
      renderListings();
    });
  }

  if (bedsFilter) {
    bedsFilter.addEventListener('change', (e) => {
      state.minBeds = Number(e.target.value) || 0;
      renderListings();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderListings();
    });
  }

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.category = tab.dataset.filter;
      renderListings();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', resetAll);
  }

  // Initial Load
  renderListings();
}

/**
 * Open Property Details Modal (RESO Specification Sheet)
 */
async function openPropertyDetails(listingId) {
  const modal = document.getElementById('propertyDetailModal');
  if (!modal || !window.MLSService) return;

  const listing = await window.MLSService.getListingById(listingId);
  if (!listing) return;

  // Populate modal fields
  document.getElementById('propModalMLS').textContent = `RESO MLS #${listing.ListingId}`;
  document.getElementById('propModalTitle').textContent = listing.PropertySubType;
  document.getElementById('propModalStatus').textContent = listing.StandardStatus;
  document.getElementById('propModalPrice').textContent = window.MLSService.formatCurrency(listing.ListPrice);
  document.getElementById('propModalImage').src = listing.Media?.[0]?.MediaURL || 'images/spacejoy.jpg';
  document.getElementById('propModalImage').alt = listing.UnparsedAddress;
  document.getElementById('propModalAddress').textContent = `${listing.UnparsedAddress}, ${listing.City}, ${listing.StateOrProvince} ${listing.PostalCode} (${listing.CountyOrParish})`;

  document.getElementById('propModalType').textContent = listing.PropertySubType;
  document.getElementById('propModalBedBath').textContent = `${listing.BedroomsTotal || 0} Beds / ${listing.BathroomsTotalInteger || 0} Baths`;
  document.getElementById('propModalSqFt').textContent = window.MLSService.formatArea(listing.LivingArea);
  document.getElementById('propModalLot').textContent = listing.LotSizeAcres ? `${listing.LotSizeAcres} Acres` : 'Standard Lot';
  document.getElementById('propModalYear').textContent = listing.YearBuilt || 'N/A';
  document.getElementById('propModalGarage').textContent = listing.GarageSpaces ? `${listing.GarageSpaces}-Car Attached` : 'Driveway / None';
  document.getElementById('propModalHVAC').textContent = listing.Heating ? `${listing.Heating} / ${listing.Cooling}` : 'Central Air';
  document.getElementById('propModalTaxes').textContent = listing.TaxAnnualAmount ? `$${new Intl.NumberFormat('en-US').format(listing.TaxAnnualAmount)} / yr` : 'TBD';
  document.getElementById('propModalSchools').textContent = `${listing.ElementarySchool} / ${listing.HighSchool}`;
  document.getElementById('propModalRemarks').textContent = listing.PublicRemarks || 'No remarks provided.';

  // Schedule Showing CTA inside modal
  const scheduleBtn = document.getElementById('propModalScheduleBtn');
  if (scheduleBtn) {
    scheduleBtn.onclick = () => {
      modal.close();
      const contactModal = document.getElementById('contactModal');
      if (contactModal && typeof contactModal.showModal === 'function') {
        const msg = contactModal.querySelector('#modalMessage');
        if (msg) {
          msg.value = `Hello Krissy, I am interested in scheduling a private showing for MLS #${listing.ListingId} (${listing.UnparsedAddress}, ${listing.City}).`;
        }
        contactModal.showModal();
      }
    };
  }

  modal.showModal();
}

/**
 * Accessible Modal System with Native <dialog>
 */
function initModals() {
  const contactModal = document.getElementById('contactModal');
  const successModal = document.getElementById('successModal');
  const propertyModal = document.getElementById('propertyDetailModal');
  const openModalButtons = document.querySelectorAll('[data-open-modal]');
  const closeModalButtons = document.querySelectorAll('[data-close-modal]');

  openModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modalId = button.dataset.openModal;
      const targetModal = document.getElementById(modalId);
      if (targetModal && typeof targetModal.showModal === 'function') {
        targetModal.showModal();
      }
    });
  });

  closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('dialog');
      if (modal && typeof modal.close === 'function') {
        modal.close();
      }
    });
  });

  [contactModal, successModal, propertyModal].forEach(dialog => {
    if (!dialog) return;
    dialog.addEventListener('click', (e) => {
      const rect = dialog.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        dialog.close();
      }
    });
  });
}

/**
 * Contact Form Submissions & Interactive Feedback
 */
function initContactForms() {
  const forms = [
    document.getElementById('mainContactForm'),
    document.getElementById('modalContactForm')
  ];

  const successModal = document.getElementById('successModal');
  const contactModal = document.getElementById('contactModal');

  forms.forEach(form => {
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `Sending...`;

      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (contactModal && contactModal.open) {
          contactModal.close();
        }

        if (successModal && typeof successModal.showModal === 'function') {
          successModal.showModal();
        }
      }, 750);
    });
  });
}
