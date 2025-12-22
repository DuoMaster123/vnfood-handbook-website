import axios from 'axios';
import foodData from '../data/foodData';

// Mapping configuration for 36 dishes with Video IDs
const FOOD_MAPPING = {
  'banh_bao': { types: ['Side Dishes', 'Hot Dishes'], region: 'South', city: 'Ho Chi Minh City', videoId: 'w5r0JOYZP3g' },
  'banh_beo': { types: ['Side Dishes'], region: 'Central', city: 'Hue', videoId: 'Rp5knYwAckk' },
  'banh_bot_loc': { types: ['Side Dishes'], region: 'Central', city: 'Hue', videoId: 'pSfOPyBKlFQ' },
  'banh_chung': { types: ['Cold Dishes', 'Side Dishes'], region: 'North', city: 'Hanoi', videoId: 'ZGs59VEu3hQ' },
  'banh_cuon': { types: ['Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'g1JPS0izpmA' },
  'banh_da_cua': { types: ['Soup', 'Hot Dishes'], region: 'North', city: 'Hai Phong', videoId: 'mqXM3ISBVzQ' },
  'banh_gai': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Hai Duong', videoId: 'ffIhuGden6o' },
  'banh_giay': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Phu Tho', videoId: 'iwDKZD7qEtQ' },
  'banh_gio': { types: ['Hot Dishes', 'Side Dishes'], region: 'North', city: 'Hanoi', videoId: 'NZAgjAJTaUM' },
  'banh_mi': { types: ['Side Dishes', 'Hot Dishes'], region: 'South', city: 'Ho Chi Minh City', videoId: 'zpxCFAvde0s' },
  'banh_pia': { types: ['Side Dishes', 'Cold Dishes'], region: 'South', city: 'Soc Trang', videoId: 'ldzJ4u6A9Xk' },
  'banh_tom': { types: ['Side Dishes', 'Hot Dishes'], region: 'North', city: 'Hanoi', videoId: '1pRTZDKh8cI' },
  'banh_troi_nuoc': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Hanoi', videoId: 'YXLQMfSUTWs' },
  'banh_trung_thu': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Hanoi', videoId: 'sHshUZzMI2g' },
  'banh_xeo': { types: ['Hot Dishes', 'Side Dishes'], region: 'South', city: 'Can Tho', videoId: 'ff910BJQgFo' },
  'bo_la_lot': { types: ['Hot Dishes'], region: 'South', city: 'Ho Chi Minh City', videoId: '3qfEsGyUcZk' },
  'bo_ne': { types: ['Hot Dishes'], region: 'South', city: 'Ho Chi Minh City', videoId: 'YmCCDzqn4Eg' },
  'bun_bo_hue': { types: ['Soup', 'Hot Dishes'], region: 'Central', city: 'Hue', videoId: 'OSGiO2lMkis' },
  'bun_cha': { types: ['Soup', 'Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'SQ1j8WkOUZM' },
  'bun_dau_mam_tom': { types: ['Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'lVnIzd53z_E' },
  'bun_rieu': { types: ['Soup', 'Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'U3UvZot7uZk' },
  'ca_kho_to': { types: ['Hot Dishes'], region: 'South', city: 'Vinh Long', videoId: 'oClgVfQmW0g' },
  'cha_com': { types: ['Side Dishes', 'Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'j3Vuh5cEMSg' },
  'com_lam': { types: ['Hot Dishes', 'Side Dishes'], region: 'North', city: 'Hoa Binh', videoId: 'WVjPd8NwMYI' },
  'com_rang': { types: ['Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'FR4DH5sSysI' },
  'com_tam': { types: ['Hot Dishes'], region: 'South', city: 'Ho Chi Minh City', videoId: 'OVb5uoDWspM' },
  'ga_luoc': { types: ['Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'Ee137adkByY' },
  'goi_cuon': { types: ['Cold Dishes', 'Side Dishes'], region: 'South', city: 'Ho Chi Minh City', videoId: 'LJ_3BeqH63w' },
  'hu_tieu': { types: ['Soup', 'Hot Dishes'], region: 'South', city: 'My Tho', videoId: 'd967hL_eMOs' },
  'mi_quang': { types: ['Soup', 'Hot Dishes'], region: 'Central', city: 'Quang Nam', videoId: 'g3V_oNeMdHs' },
  'nem_chua': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Thanh Hoa', videoId: 'p82P3fDfpDY' },
  'nem_nuong_nha_trang': { types: ['Hot Dishes', 'Side Dishes'], region: 'Central', city: 'Nha Trang', videoId: 'NVzRMbREV_c' },
  'pho': { types: ['Soup', 'Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'c9GfHgMk1ac' },
  'tao_pho': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Hanoi', videoId: 'dN3gsdjLxc' },
  'thit_kho_tau': { types: ['Hot Dishes'], region: 'South', city: 'Ben Tre', videoId: 'MQ7VatOIRQM' },
  'trung_vit_lon': { types: ['Side Dishes', 'Hot Dishes'], region: 'North', city: 'Hanoi', videoId: 'Wz7zM7wcoAA' }
};

const SLUG_CORRECTION = { 'banh_gjay': 'banh_giay', 'hu_iteu': 'hu_tieu', 'nem_nuong_nha_trans': 'nem_nuong_nha_trang' };

export const seedDataToMySQL = async () => {
  const payload = foodData.map(food => {
    const correctKey = SLUG_CORRECTION[food.slug] || food.slug;
    const info = FOOD_MAPPING[correctKey] || { types: ['Other'], region: 'Unknown', city: 'Unknown', videoId: '' };
    
    // Fallback content generation
    const fullContent = food.sections?.length > 0 
      ? JSON.stringify(food.sections) 
      : JSON.stringify([{ title: "Description", content: "No details available." }]);

    return {
      slug: food.slug,
      name: food.name,
      introduction: fullContent,
      recipe: info.videoId || ("https://www.youtube.com/results?search_query=how+to+cook+" + encodeURIComponent(food.name)),
      ingredients: ["Main Ingredient", "Spices", "Herbs"], 
      region: info.region,
      city: info.city,
      type: info.types, 
      imageUrl: `static/food_images/${food.slug}.jpg`,
      author: 'admin',
      createdAt: new Date("2024-01-01").toISOString()
    };
  });

  try {
    // Note: Ensure Backend is running on port 8000
    await axios.post('http://localhost:8000/api/seed-data', payload);
    alert(`Success! Seeded 36 items to MySQL.`);
  } catch (error) {
    alert("Seeding Error: " + error.message);
  }
};