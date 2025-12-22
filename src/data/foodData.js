import rawData from './vnfoods_info.json';

// list of 36 slugs matching the exact order of json data
const slugs = [
  'banh_bao', 'banh_beo', 'banh_bot_loc', 'banh_chung', 'banh_cuon', 'banh_da_cua', 
  'banh_gai', 'banh_giay', 'banh_gio', 'banh_mi', 'banh_pia', 'banh_tom', 
  'banh_troi_nuoc', 'banh_trung_thu', 'banh_xeo', 'bo_la_lot', 'bo_ne', 'bun_bo_hue', 
  'bun_cha', 'bun_dau_mam_tom', 'bun_rieu', 'ca_kho_to', 'cha_com', 'com_lam', 
  'com_rang', 'com_tam', 'ga_luoc', 'goi_cuon', 'hu_tieu', 'mi_quang', 
  'nem_chua', 'nem_nuong_nha_trang', 'pho', 'tao_pho', 'thit_kho_tau', 'trung_vit_lon'
];

// this will serve for PuzzleGame and MemoryGame
const foodData = rawData.map((item, index) => {
  const slug = slugs[index];
  return {
    ...item,
    id: slug,
    slug: slug,
    imageUrl: `/food_images/${slug}.jpg`,
    introduction: item.sections[0].content, 
  };
});

export default foodData;