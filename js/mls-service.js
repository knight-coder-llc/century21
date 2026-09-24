/**
 * RESO (Real Estate Standards Organization) MLS Service Adapter
 * 
 * Provides unified interface to query property listings.
 * Defaults to the local RESO-compliant mock dataset, but is architected
 * to connect directly to any RESO Web API, SimplyRETS, Repliers, or MoxiWorks endpoint.
 */

const MLSConfig = {
  // Toggle to false when you insert your live MLS / RESO Web API credentials
  USE_MOCK: true,
  
  // Live RESO Web API / SimplyRETS / Repliers credentials
  LIVE_API_ENDPOINT: 'https://api.simplyrets.com/properties', // Example RESO endpoint
  LIVE_API_KEY: '', // Your MLS Bearer token or API key
  
  // Local Mock dataset path
  MOCK_DATA_PATH: 'data/mls-listings.json'
};

class MLSServiceClient {
  constructor(config = MLSConfig) {
    this.config = config;
    this.cache = null;
  }

  /**
   * Fetch all raw listings from either Mock JSON or Live MLS API
   */
  async getAllListings() {
    if (this.cache) return this.cache;

    if (this.config.USE_MOCK) {
      try {
        const response = await fetch(this.config.MOCK_DATA_PATH);
        if (!response.ok) {
          throw new Error(`Failed to load MLS mock data: ${response.statusText}`);
        }
        this.cache = await response.json();
        return this.cache;
      } catch (err) {
        console.error('MLSService: Error loading mock data', err);
        return [];
      }
    } else {
      // Live RESO Web API fetch pattern
      try {
        const response = await fetch(this.config.LIVE_API_ENDPOINT, {
          headers: {
            'Authorization': `Bearer ${this.config.LIVE_API_KEY}`,
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`Live MLS API responded with ${response.statusText}`);
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error('MLSService: Live API query failed', err);
        return [];
      }
    }
  }

  /**
   * Search and filter listings based on criteria
   * @param {Object} criteria
   * @param {string} criteria.query - Search keyword (city, address, MLS #, description)
   * @param {string} criteria.category - Category tab ('all', 'luxury', 'family', 'land')
   * @param {number} criteria.minPrice - Minimum listing price
   * @param {number} criteria.maxPrice - Maximum listing price
   * @param {string} criteria.sortBy - Sort order ('price-asc', 'price-desc', 'newest', 'beds')
   */
  async fetchListings(criteria = {}) {
    const listings = await this.getAllListings();
    let results = [...listings];

    // Filter by category tab
    if (criteria.category && criteria.category !== 'all') {
      results = results.filter(item => 
        item.Category === criteria.category || 
        item.PropertySubType?.toLowerCase().includes(criteria.category.toLowerCase())
      );
    }

    // Filter by keyword query
    if (criteria.query && criteria.query.trim() !== '') {
      const q = criteria.query.toLowerCase().trim();
      results = results.filter(item => {
        return (
          item.ListingId?.toLowerCase().includes(q) ||
          item.UnparsedAddress?.toLowerCase().includes(q) ||
          item.City?.toLowerCase().includes(q) ||
          item.PostalCode?.includes(q) ||
          item.CountyOrParish?.toLowerCase().includes(q) ||
          item.PropertySubType?.toLowerCase().includes(q) ||
          item.PublicRemarks?.toLowerCase().includes(q)
        );
      });
    }

    // Filter by price range
    if (criteria.minPrice && criteria.minPrice > 0) {
      results = results.filter(item => item.ListPrice >= criteria.minPrice);
    }
    if (criteria.maxPrice && criteria.maxPrice > 0) {
      results = results.filter(item => item.ListPrice <= criteria.maxPrice);
    }

    // Sorting
    if (criteria.sortBy) {
      switch (criteria.sortBy) {
        case 'price-asc':
          results.sort((a, b) => a.ListPrice - b.ListPrice);
          break;
        case 'price-desc':
          results.sort((a, b) => b.ListPrice - a.ListPrice);
          break;
        case 'beds':
          results.sort((a, b) => b.BedroomsTotal - a.BedroomsTotal);
          break;
        case 'newest':
        default:
          results.sort((a, b) => (b.YearBuilt || 0) - (a.YearBuilt || 0));
          break;
      }
    }

    return results;
  }

  /**
   * Get single listing details by ListingId
   * @param {string} listingId
   */
  async getListingById(listingId) {
    const listings = await this.getAllListings();
    return listings.find(item => item.ListingId === listingId) || null;
  }

  /**
   * Utility formatting helpers
   */
  formatCurrency(amount) {
    if (amount === undefined || amount === null) return 'Price Upon Request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatArea(sqft) {
    if (!sqft || sqft === 0) return 'Acreage';
    return `${new Intl.NumberFormat('en-US').format(sqft)} Sq Ft`;
  }
}

// Global Singleton Instance
window.MLSService = new MLSServiceClient();
