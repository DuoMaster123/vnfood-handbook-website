import { db } from '../firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import foodData from '../data/foodData';

// Compact Data Mapping
const FOOD_MAPPING = {
  'banh_bao': { types: ['Side Dishes', 'Hot Dishes'], region: 'South', city: 'Ho Chi Minh City' },
  'banh_beo': { types: ['Side Dishes'], region: 'Central', city: 'Hue' },
  'banh_bot_loc': { types: ['Side Dishes'], region: 'Central', city: 'Hue' },
  'banh_chung': { types: ['Cold Dishes', 'Side Dishes'], region: 'North', city: 'Hanoi' },
  'banh_cuon': { types: ['Hot Dishes'], region: 'North', city: 'Hanoi' },
  'banh_da_cua': { types: ['Soup', 'Hot Dishes'], region: 'North', city: 'Hai Phong' },
  'banh_gai': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Hai Duong' },
  'banh_giay': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Phu Tho' },
  'banh_gio': { types: ['Hot Dishes', 'Side Dishes'], region: 'North', city: 'Hanoi' },
  'banh_mi': { types: ['Side Dishes', 'Hot Dishes'], region: 'South', city: 'Ho Chi Minh City' },
  'banh_pia': { types: ['Side Dishes', 'Cold Dishes'], region: 'South', city: 'Soc Trang' },
  'banh_tom': { types: ['Side Dishes', 'Hot Dishes'], region: 'North', city: 'Hanoi' },
  'banh_troi_nuoc': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Hanoi' },
  'banh_trung_thu': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Hanoi' },
  'banh_xeo': { types: ['Hot Dishes', 'Side Dishes'], region: 'South', city: 'Can Tho' },
  'bo_la_lot': { types: ['Hot Dishes'], region: 'South', city: 'Ho Chi Minh City' },
  'bo_ne': { types: ['Hot Dishes'], region: 'South', city: 'Ho Chi Minh City' },
  'bun_bo_hue': { types: ['Soup', 'Hot Dishes'], region: 'Central', city: 'Hue' },
  'bun_cha': { types: ['Soup', 'Hot Dishes'], region: 'North', city: 'Hanoi' },
  'bun_dau_mam_tom': { types: ['Hot Dishes'], region: 'North', city: 'Hanoi' },
  'bun_rieu': { types: ['Soup', 'Hot Dishes'], region: 'North', city: 'Hanoi' },
  'ca_kho_to': { types: ['Hot Dishes'], region: 'South', city: 'Vinh Long' },
  'cha_com': { types: ['Side Dishes', 'Hot Dishes'], region: 'North', city: 'Hanoi' },
  'com_lam': { types: ['Hot Dishes', 'Side Dishes'], region: 'North', city: 'Hoa Binh' },
  'com_rang': { types: ['Hot Dishes'], region: 'North', city: 'Hanoi' },
  'com_tam': { types: ['Hot Dishes'], region: 'South', city: 'Ho Chi Minh City' },
  'ga_luoc': { types: ['Hot Dishes'], region: 'North', city: 'Hanoi' },
  'goi_cuon': { types: ['Cold Dishes', 'Side Dishes'], region: 'South', city: 'Ho Chi Minh City' },
  'hu_tieu': { types: ['Soup', 'Hot Dishes'], region: 'South', city: 'My Tho' },
  'mi_quang': { types: ['Soup', 'Hot Dishes'], region: 'Central', city: 'Quang Nam' },
  'nem_chua': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Thanh Hoa' },
  'nem_nuong_nha_trang': { types: ['Hot Dishes', 'Side Dishes'], region: 'Central', city: 'Nha Trang' },
  'pho': { types: ['Soup', 'Hot Dishes'], region: 'North', city: 'Hanoi' },
  'tao_pho': { types: ['Side Dishes', 'Cold Dishes'], region: 'North', city: 'Hanoi' },
  'thit_kho_tau': { types: ['Hot Dishes'], region: 'South', city: 'Ben Tre' },
  'trung_vit_lon': { types: ['Side Dishes', 'Hot Dishes'], region: 'North', city: 'Hanoi' }
};

export const uploadFoodsToFirestore = async () => {
  const batch = writeBatch(db);
  const collectionRef = collection(db, "foods");

  foodData.forEach((food) => {
    const docRef = doc(collectionRef, food.slug);
    const info = FOOD_MAPPING[food.slug] || { types: ['Hot Dishes'], region: 'North', city: 'Unknown' };

    batch.set(docRef, {
      ...food,
      region: info.region,
      type: info.types,
      city: info.city,
      author: 'admin_system',
      createdAt: new Date(),
      views: Math.floor(Math.random() * 5000) + 100, 
      likes: Math.floor(Math.random() * 1000) + 10 
    });
  });

  try {
    await batch.commit();
    alert("Data updated successfully to Firestore.");
  } catch (error) {
    alert("Upload failed: " + error.message);
  }
};