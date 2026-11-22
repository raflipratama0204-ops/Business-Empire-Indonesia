// Business Empire: RichMan - Master Catalogs & Config

const GAME_CONFIG = {
  SAVE_KEY: 'BUSINESS_EMPIRE_GAME_DATA',
  STARTING_CASH: 8000000, // Rp 8.000.000 (Setara modal $500)
  STARTING_CLICK_REWARD: 50000, // Rp 50.000 per klik kerja sampingan
  TICK_INTERVAL_MS: 1000, // 1 detik = 1 unit waktu
  GAME_HOUR_SECONDS: 3600, // 1 jam game = 1 jam dunia nyata (3.600 detik)
  OFFLINE_MAX_HOURS: 72, // Maksimal 72 jam offline earnings
  TAX_CONFIG: {
    RATE: 0.05, // Tarif Pajak 5% dari pendapatan setiap jam game
    MANDATORY_THRESHOLD: 25000000, // Ambang batas Rp 25.000.000/jam: di bawah ini potong otomatis, di atas ini wajib bayar mandiri
    TERM_HOURS_REAL: 72, // Term waktu pembayaran: 72 jam dunia nyata (3 hari)
    TERM_SECONDS_REAL: 259200 // 72 jam * 3.600 detik = 259.200 detik dunia nyata
  }
};

const NET_WORTH_RANKS = [
  { min: 0, title: 'Pemula Finansial', badge: '🌱' },
  { min: 10000000, title: 'Pekerja Mandiri', badge: '💼' },
  { min: 50000000, title: 'Juragan UMKM', badge: '🏪' },
  { min: 250000000, title: 'Pengusaha Mapan', badge: '🏢' },
  { min: 1000000000, title: 'Miliarder Muda', badge: '💎' },
  { min: 10000000000, title: 'Multi-Miliarder', badge: '👑' },
  { min: 100000000000, title: 'Konglomerat Nasional', badge: '🏛️' },
  { min: 1000000000000, title: 'Triliuner Global', badge: '🪐' },
  { min: 10000000000000, title: 'Penguasa Ekonomi Dunia', badge: '⚡' },
];

// Sektor Usaha yang dapat didirikan oleh pemain
const BUSINESS_SECTORS = [
  {
    sectorId: 'retail',
    name: 'Toko & Supermarket',
    icon: '🏪',
    image: 'images/sector_retail.jpg',
    desc: 'Buka toko ritel kebutuhan masyarakat. Pilih skala toko: Kecil, Sedang, atau Besar.',
    hasSubtypes: true,
    subtypes: [
      {
        id: 'small',
        name: 'Kios & Toko Kelontong (Small)',
        cost: 12000000, // Rp 12 Juta
        revenue: 280000, // Rp 280.000 / jam
        desc: 'Warung sembako dan kebutuhan harian warga sekitar.',
        icon: '🏪'
      },
      {
        id: 'medium',
        name: 'Minimarket Waralaba (Medium)',
        cost: 45000000, // Rp 45 Juta
        revenue: 1150000, // Rp 1.150.000 / jam
        desc: 'Minimarket ber-AC modern dengan ratusan produk & fasilitas e-money.',
        icon: '🏬'
      },
      {
        id: 'large',
        name: 'Supermarket Megastore (Large)',
        cost: 160000000, // Rp 160 Juta
        revenue: 4200000, // Rp 4,2 Juta / jam
        desc: 'Supermarket lengkap berskala besar dengan area grosir dan produk impor.',
        icon: '🛒'
      }
    ]
  },
  {
    sectorId: 'taxi',
    name: 'Armada Taksi & Ojol',
    icon: '🚕',
    image: 'images/veh_avanza.jpg',
    desc: 'Layanan transportasi penumpang. Anda membeli unit armada sendiri, merawat masa pakai jarak tempuh (KM), dan memperluas kapasitas lahan parkir.',
    baseCost: 75000000, // Rp 75 Juta (termasuk izin trayek & fasilitas parkir awal)
    isFleet: true
  },
  {
    sectorId: 'cafe',
    name: 'Kafe & Restoran Kekinian',
    icon: '☕',
    image: 'images/sector_cafe.jpg',
    desc: 'Tempat nongkrong favorit anak muda dengan menu kopi spesial dan makanan lezat.',
    baseCost: 220000000, // Rp 220 Juta
    baseRevenue: 5800000 // Rp 5,8 Juta / jam
  },
  {
    sectorId: 'fashion',
    name: 'Brand Fashion & Pakaian',
    icon: '👕',
    image: 'images/sector_fashion.jpg',
    desc: 'Industri pakaian & garmen. Pilih membuka Brand Distro Biasa, Pakaian Bisnis Formal, atau Luxury Brand Haute-Couture.',
    hasSubtypes: true,
    subtypes: [
      {
        id: 'regular',
        name: 'Brand Distro & Streetwear Biasa',
        cost: 280000000, // Rp 280 Juta
        revenue: 7500000, // Rp 7,5 Juta / jam
        desc: 'Desain apparel distro urban streetwear untuk pasar anak muda.',
        icon: '👕'
      },
      {
        id: 'business',
        name: 'Brand Pakaian Bisnis & Jas Eksekutif',
        cost: 650000000, // Rp 650 Juta
        revenue: 17500000, // Rp 17,5 Juta / jam
        desc: 'Busana kerja formal, setelan jas tailored, kemeja eksekutif premium, dan blazer kantor.',
        icon: '👔'
      },
      {
        id: 'luxury',
        name: 'Luxury Haute-Couture Fashion House',
        cost: 1400000000, // Rp 1,4 Miliar
        revenue: 38000000, // Rp 38 Juta / jam
        desc: 'Rumah mode mewah internasional dengan produk eksklusif dan margin laba tinggi.',
        icon: '✨'
      }
    ]
  },
  {
    sectorId: 'hotel',
    name: 'Jaringan Hotel & Resort Bintang',
    icon: '🏨',
    image: 'images/sector_hotel.jpg',
    desc: 'Industri perhotelan & hospitality. Pilih kelas hotel bintang impian Anda, kelola kamar, dan tingkatkan rating bintang dengan menambah fasilitas mewah.',
    hasSubtypes: true,
    isHotel: true,
    subtypes: [
      {
        id: 'hotel_budget',
        name: 'Hotel Budget & Transit (⭐⭐ Bintang 2)',
        cost: 450000000, // Rp 450 Juta
        revenue: 12000000, // Rp 12 Juta / jam
        desc: 'Hotel kapsul & transit nyaman untuk pelancong praktis dan backpacker.',
        icon: '🛏️',
        stars: 2
      },
      {
        id: 'hotel_business',
        name: 'City Business Hotel (⭐⭐⭐ Bintang 3)',
        cost: 3200000000, // Rp 3,2 Miliar
        revenue: 85000000, // Rp 85 Juta / jam
        desc: 'Hotel bisnis perkotaan dengan fasilitas ballroom rapat dan restoran prasmanan.',
        icon: '🏨',
        stars: 3
      },
      {
        id: 'hotel_luxury',
        name: 'Grand Luxury Resort & Spa (⭐⭐⭐⭐⭐ Bintang 5)',
        cost: 22000000000, // Rp 22 Miliar
        revenue: 580000000, // Rp 580 Juta / jam
        desc: 'Resort mewah bintang lima dengan presidential suite, infinity pool, spa, dan helipad.',
        icon: '👑',
        stars: 5
      }
    ]
  },
  {
    sectorId: 'logistics',
    name: 'Ekspedisi & Pergudangan Logistik',
    icon: '🚚',
    image: 'images/trk_canter.jpg',
    desc: 'Bisnis kargo lengkap: beli armada truk kontainer sendiri, kelola jarak tempuh (KM), dan perluas hub gudang untuk bermitra dengan perusahaan penyewa.',
    baseCost: 1600000000, // Rp 1,6 Miliar
    isLogistics: true
  },
  {
    sectorId: 'bank',
    name: 'Bank Komersial Swasta',
    icon: '🏦',
    image: 'images/sector_bank.jpg',
    desc: 'Lembaga keuangan perbankan. Anda mengatur suku bunga simpanan & pinjaman untuk meraup cuan bunga masif!',
    baseCost: 8000000000, // Rp 8 Miliar
    isBank: true,
    vaultReserves: 2000000000, // Modal awal brankas bank Rp 2 Miliar
    initialCustomerDeposits: 1500000000, // Dana awal simpanan nasabah Rp 1.5 Miliar
    depositRate: 5.0,
    creditRate: 11.5
  },
  {
    sectorId: 'tech',
    name: 'Studio Game & Software House',
    icon: '💻',
    image: 'images/sector_tech.jpg',
    desc: 'Perusahaan teknologi & software house. Rekrut tim programmer, pimpin proyek IT bergengsi, dan raih honor kontrak bernilai miliaran rupiah.',
    baseCost: 28000000000, // Rp 28 Miliar
    isTech: true
  },
  {
    sectorId: 'airline',
    name: 'Maskapai Penerbangan Komersial',
    icon: '✈️',
    image: 'images/sector_airline.jpg',
    desc: 'Beli armada jet, boeing, wide-body, hingga superjumbo double-deck. Buka izin slot rute penerbangan ke berbagai bandara negara di dunia dan jaga kelaikan terbang armada Anda.',
    baseCost: 65000000000, // Rp 65 Miliar
    isAirline: true
  },
  {
    sectorId: 'oil',
    name: 'Perusahaan Minyak & Gas Bumi',
    icon: '🛢️',
    image: 'images/sector_oil.jpg',
    desc: 'Eksplorasi sumur minyak lepas pantai, anjungan gas, dan kilang LNG. Bangun fasilitas produksi untuk memenuhi kuota barel migas dan tandatangani kontrak suplai bernilai triliunan rupiah.',
    baseCost: 120000000000, // Rp 120 Miliar
    baseRevenue: 1200000000, // Rp 1,2 Miliar / jam starter
    isOil: true
  },
  {
    sectorId: 'mining',
    name: 'Korporasi Tambang Nikel & Emas',
    icon: '⛏️',
    image: 'images/sector_mining.jpg',
    desc: 'Operasi alat berat tambang raksasa, konsesi nikel baterai EV, dan smelter emas. Tingkatkan kapasitas tonase untuk mengamankan kontrak pasokan raksasa industri dunia.',
    baseCost: 260000000000, // Rp 260 Miliar
    baseRevenue: 2500000000, // Rp 2,5 Miliar / jam starter
    isMining: true
  },
  {
    sectorId: 'space',
    name: 'Agensi Antariksa & Dirgantara',
    icon: '🚀',
    image: 'images/sector_space.jpg',
    desc: 'Peluncuran satelit komersial orbit rendah, eksplorasi bulan, dan armada pesawat luar angkasa.',
    baseCost: 1500000000000, // Rp 1,5 Triliun
    baseRevenue: 42000000000 // Rp 42 Miliar / jam
  }
];

// Tahap Milestone Perjalanan Bisnis Fashion & Adibusana (6 Tingkatan)
const FASHION_STAGES = [
  {
    level: 1,
    title: 'Studio Konveksi Rumahan',
    desc: 'Produksi pakaian skala terbatas dari studio garasi rumah, dipasarkan ke teman, komunitas, dan reseller lokal.',
    marketScope: 'Komunitas & Pasar Lokal',
    icon: '🧵',
    multiplier: 1.0,
    upgradeDuration: 20 // 20 detik dunia nyata
  },
  {
    level: 2,
    title: 'Butik Distro & Pop-Up Store',
    desc: 'Membuka gerai distro mandiri pertama di pusat kota, mulai viral di media sosial dan kolaborasi dengan influencer.',
    marketScope: 'Penggemar Fashion Kota Megapolitan',
    icon: '🏬',
    multiplier: 1.85,
    upgradeDuration: 45 // 45 detik
  },
  {
    level: 3,
    title: 'Pabrik Manufaktur & Garment Massal',
    desc: 'Membangun fasilitas pabrik garment sendiri dengan puluhan mesin jahit untuk memasok pesanan besar ke department store.',
    marketScope: 'Distribusi Grosir Ritel Se-Provinsi',
    icon: '🏭',
    multiplier: 3.4,
    upgradeDuration: 90 // 1.5 menit
  },
  {
    level: 4,
    title: 'Jaringan Flagship Store Nasional',
    desc: 'Mendirikan puluhan gerai megah di mall-mall kelas atas se-Indonesia dengan branding prestisius.',
    marketScope: 'Seluruh Indonesia (Pangsa Pasar Nasional)',
    icon: '💎',
    multiplier: 6.0,
    upgradeDuration: 180 // 3 menit
  },
  {
    level: 5,
    title: 'Top Brand & Runway Fashion Week',
    desc: 'Menjadi brand busana terdepan di Indonesia, tampil sebagai sorotan utama di panggung Jakarta Fashion Week.',
    marketScope: 'Pasar Elit Nasional & Asia Tenggara',
    icon: '🌟',
    multiplier: 11.0,
    upgradeDuration: 300 // 5 menit
  },
  {
    level: 6,
    title: 'Ekspansi Global & Paris Fashion Week',
    desc: 'Puncak mahakarya adibusana dunia! Membuka butik ikonik di Champs-Élysées Paris, Milan, dan New York.',
    marketScope: 'Pasar Kemewahan Internasional Global 🌍',
    icon: '👑',
    multiplier: 19.5,
    upgradeDuration: 600 // 10 menit
  }
];

// Tahap Milestone Fasilitas & Bintang Jaringan Hotel & Resort (6 Tingkatan)
const HOTEL_STAGES = [
  {
    level: 1,
    title: 'Kamar Standar & Resepsionis 24 Jam',
    desc: 'Layanan akomodasi kamar standar dengan sarapan pagi dan Wi-Fi cepat.',
    facilityScope: 'Akomodasi Standar',
    icon: '🛏️',
    multiplier: 1.0,
    starBonus: 0,
    upgradeDuration: 25 // 25 detik
  },
  {
    level: 2,
    title: 'Coffee Lounge & Layanan Room Service',
    desc: 'Kafe modern di lobi dan room service 24 jam untuk kenyamanan para tamu.',
    facilityScope: 'Kafe & Room Service',
    icon: '☕',
    multiplier: 1.9,
    starBonus: 1,
    upgradeDuration: 50 // 50 detik
  },
  {
    level: 3,
    title: 'Pusat Kebugaran, Sauna & Kolam Renang Infinity',
    desc: 'Fasilitas infinity pool rooftop dan gym lengkap untuk menambah kepuasan tamu menginap.',
    facilityScope: 'Pusat Kebugaran & Kolam Renang',
    icon: '🏊‍♂️',
    multiplier: 3.5,
    starBonus: 1,
    upgradeDuration: 100 // 1.5 menit
  },
  {
    level: 4,
    title: 'Grand Ballroom & Restoran Fine Dining Rooftop',
    desc: 'Pusat konvensi megah untuk resepsi pernikahan dan kuliner rooftop berkelas internasional.',
    facilityScope: 'Grand Ballroom & Kuliner Michelin',
    icon: '🍽️',
    multiplier: 6.2,
    starBonus: 2,
    upgradeDuration: 200 // 3.3 menit
  },
  {
    level: 5,
    title: 'Presidential Suites, Luxury Spa & Helipad VIP',
    desc: 'Fasilitas ultra-mewah tingkat dunia! Melayani tamu VVIP, konglomerat, dan selebritas internasional.',
    facilityScope: 'Presidential Suites & Helipad VVIP',
    icon: '🚁',
    multiplier: 11.5,
    starBonus: 2,
    upgradeDuration: 360 // 6 menit
  },
  {
    level: 6,
    title: 'World-Class Sovereign Palace & Private Beach',
    desc: 'Mahakarya resor perhotelan terdepan di dunia dengan sertifikasi Diamond 7-Star Hospitality.',
    facilityScope: 'Resor Megah Diamond Palace 🌟',
    icon: '👑',
    multiplier: 21.0,
    starBonus: 3,
    upgradeDuration: 720 // 12 menit
  }
];

// Katalog Kendaraan Armada Taksi & Ojol
const TAXI_FLEET_VEHICLES = [
  {
    id: 'veh_vios',
    name: 'Toyota Vios Sedan Regular',
    type: 'Sedan Taksi Standar',
    cost: 175000000, // Rp 175 Juta
    revenue: 580000, // Rp 580.000 / jam
    maxKm: 180000,
    icon: '🚕',
    image: 'images/veh_vios.jpg',
    desc: 'Sedan taksi andalan hemat BBM, armada utama perkotaan dengan tarif terjangkau.'
  },
  {
    id: 'veh_avanza',
    name: 'Toyota Avanza Transmover',
    type: 'MPV Taksi Penumpang',
    cost: 215000000, // Rp 215 Juta
    revenue: 720000, // Rp 720.000 / jam
    maxKm: 210000,
    icon: '🚐',
    image: 'images/veh_avanza.jpg',
    desc: 'Mobil 7-seater luas andalan keluarga, pesanan taksi harian tak pernah sepi.'
  },
  {
    id: 'veh_innova',
    name: 'Toyota Kijang Innova Reborn',
    type: 'MPV Eksekutif Nyaman',
    cost: 440000000, // Rp 440 Juta
    revenue: 1600000, // Rp 1,6 Juta / jam
    maxKm: 260000,
    icon: '🚘',
    image: 'images/veh_innova.jpg',
    desc: 'Kabin super senyap dan suspensi empuk, tarif sewa eksekutif perkantoran.'
  },
  {
    id: 'veh_camry',
    name: 'Toyota Camry Hybrid VIP',
    type: 'Sedan Premium Bandara',
    cost: 780000000, // Rp 780 Juta
    revenue: 3100000, // Rp 3,1 Juta / jam
    maxKm: 300000,
    icon: '✨',
    image: 'images/veh_camry.jpg',
    desc: 'Layanan VIP antar-jemput eksekutif hotel bintang 5 dan bandara internasional.'
  },
  {
    id: 'veh_ioniq5',
    name: 'Hyundai Ioniq 5 Electric Taxi',
    type: 'Taksi Listrik Modern VIP',
    cost: 890000000, // Rp 890 Juta
    revenue: 3800000, // Rp 3,8 Juta / jam
    maxKm: 320000,
    icon: '⚡',
    image: 'images/veh_ioniq5.jpg',
    desc: 'Armada mobil listrik ramah lingkungan berteknologi tinggi dengan tarif premium.'
  },
  {
    id: 'veh_alphard',
    name: 'Toyota Alphard VIP Golden Bird',
    type: 'Layanan Mewah Sultan',
    cost: 1550000000, // Rp 1,55 Miliar
    revenue: 7500000, // Rp 7,5 Juta / jam
    maxKm: 360000,
    icon: '👑',
    image: 'images/veh_alphard.jpg',
    desc: 'Kenyamanan tertinggi untuk pejabat, selebriti, dan pengusaha papan atas.'
  },
  {
    id: 'veh_beat',
    name: 'Honda BeAT Ojol Kilat',
    type: 'Ojek Motor Harian',
    cost: 18000000, // Rp 18 Juta
    revenue: 110000, // Rp 110.000 / jam
    maxKm: 90000,
    icon: '🛵',
    image: 'images/veh_beat.jpg',
    desc: 'Motor matic gesit selap-selip kemacetan kota untuk antar penumpang dan paket kilat.'
  },
  {
    id: 'veh_nmax',
    name: 'Yamaha NMAX 155 Maxi Ojol',
    type: 'Ojek Motor Premium',
    cost: 35000000, // Rp 35 Juta
    revenue: 230000, // Rp 230.000 / jam
    maxKm: 120000,
    icon: '🏍️',
    image: 'images/veh_nmax.jpg',
    desc: 'Motor matic berbadan besar untuk perjalanan penumpang jarak jauh yang nyaman.'
  }
];

// Katalog Kendaraan Armada Logistik & Kargo
const LOGISTICS_FLEET_VEHICLES = [
  {
    id: 'trk_granmax',
    name: 'Daihatsu Gran Max Blind Van',
    type: 'Kurir Paket E-Commerce',
    cost: 165000000, // Rp 165 Juta
    revenue: 780000, // Rp 780.000 / jam
    maxKm: 180000,
    icon: '🚐',
    image: 'images/trk_granmax.jpg',
    desc: 'Kendaraan boks tertutup lincah dalam kota untuk mengantar ribuan paket belanja online.'
  },
  {
    id: 'trk_pickup',
    name: 'Mitsubishi L300 Pickup Box',
    type: 'Angkutan Logistik Cepat',
    cost: 225000000, // Rp 225 Juta
    revenue: 1150000, // Rp 1,15 Juta / jam
    maxKm: 220000,
    icon: '🛻',
    image: 'images/trk_pickup.jpg',
    desc: 'Legenda angkutan niaga tangguh di segala medan untuk distribusi komoditas.'
  },
  {
    id: 'trk_engkel',
    name: 'Isuzu Elf NMR Truk Engkel 4-Roda',
    type: 'Kargo Distribusi Kota & Daerah',
    cost: 460000000, // Rp 460 Juta
    revenue: 2650000, // Rp 2,65 Juta / jam
    maxKm: 280000,
    icon: '🚚',
    image: 'images/trk_engkel.jpg',
    desc: 'Truk boks 4-roda serbaguna dengan kapasitas angkut hingga 5 ton bebas masuk jalan kota.'
  },
  {
    id: 'trk_canter',
    name: 'Mitsubishi Fuso Canter 6-Roda Double',
    type: 'Ekspedisi Kargo Antar Provinsi',
    cost: 720000000, // Rp 720 Juta
    revenue: 4500000, // Rp 4,5 Juta / jam
    maxKm: 340000,
    icon: '🚛',
    image: 'images/trk_canter.jpg',
    desc: 'Truk diesel bertenaga besar untuk jalur tol trans-Jawa dan antar pulau.'
  },
  {
    id: 'trk_fuso_wing',
    name: 'Fuso Fighter Wingbox Tronton 10-Roda',
    type: 'Kargo Pabrik & Manufaktur Besar',
    cost: 1450000000, // Rp 1,45 Miliar
    revenue: 9800000, // Rp 9,8 Juta / jam
    maxKm: 420000,
    icon: '🏗️',
    image: 'images/trk_fuso_wing.jpg',
    desc: 'Truk raksasa bersayap hidrolik untuk bongkar muat cepat barang industri seberat 20 ton.'
  },
  {
    id: 'trk_trailer',
    name: 'Hino 700 Heavy Trailer Kontainer 40ft',
    type: 'Peti Kemas Pelabuhan Ekspor-Impor',
    cost: 2950000000, // Rp 2,95 Miliar
    revenue: 22000000, // Rp 22 Juta / jam
    maxKm: 520000,
    icon: '🚢',
    image: 'images/trk_trailer.jpg',
    desc: 'Pengangkut kontainer peti kemas pelabuhan internasional dengan hasil sewa fantastis.'
  }
];

// Tingkat Fasilitas Pergudangan Logistik (Maksimal Level 10, 10 Slot Mitra)
const WAREHOUSE_TIERS = [
  {
    level: 1,
    name: 'Gudang Kargo Dasar & Konsolidasi UMKM',
    desc: 'Fasilitas hub transit paket kargo umum, sortir manual & kemitraan UMKM nusantara.',
    upgradeCost: 0,
    upgradeDuration: 0,
    slots: 1
  },
  {
    level: 2,
    name: 'Hub Sortir Semi-Otomatis E-Commerce',
    desc: 'Conveyor belt pemilah cepat dan integrasi sistem resi barcode online untuk e-commerce.',
    upgradeCost: 150000000, // Rp 150 Juta
    upgradeDuration: 30, // 30 detik
    slots: 2
  },
  {
    level: 3,
    name: 'Racking Bertingkat & Forklift Elektrik',
    desc: 'Sistem rak vertikal heavy-duty 4 tingkat & armada forklift elektrik ramah lingkungan.',
    upgradeCost: 350000000, // Rp 350 Juta
    upgradeDuration: 45, // 45 detik
    slots: 3
  },
  {
    level: 4,
    name: 'Gudang Ber-AC & Climate Control',
    desc: 'Pengatur suhu dan kelembaban udara presisi untuk produk tekstil dan garmen ekspor.',
    upgradeCost: 650000000, // Rp 650 Juta
    upgradeDuration: 60, // 60 detik
    slots: 4
  },
  {
    level: 5,
    name: 'High-Security & Proteksi Anti-Statis ESD',
    desc: 'Kamera CCTV AI 24/7, lantai anti-statis, dan pengamanan biometrik untuk gadget & mikrochip.',
    upgradeCost: 1200000000, // Rp 1,2 Miliar
    upgradeDuration: 90, // 1.5 menit
    slots: 5
  },
  {
    level: 6,
    name: 'Cold-Chain Steril Medis Sub-Zero',
    desc: 'Fasilitas pendingin medis steril bersertifikasi internasional untuk vaksin dan obat biofarma.',
    upgradeCost: 2000000000, // Rp 2 Miliar
    upgradeDuration: 120, // 2 menit
    slots: 6
  },
  {
    level: 7,
    name: 'Automated Storage & Retrieval System (ASRS)',
    desc: 'Crane otomatis robotik pengambil palet dengan kecepatan tinggi tanpa operator manual.',
    upgradeCost: 3500000000, // Rp 3,5 Miliar
    upgradeDuration: 180, // 3 menit
    slots: 7
  },
  {
    level: 8,
    name: 'Blast Freezer & Cold Logistics Internasional',
    desc: 'Ruang beku industri super-cepat -30°C untuk komoditas daging wagyu dan makanan laut ekspor.',
    upgradeCost: 5500000000, // Rp 5,5 Miliar
    upgradeDuration: 240, // 4 menit
    slots: 8
  },
  {
    level: 9,
    name: 'Pusat Logistik Berikat (PLB) Kawasan Khusus',
    desc: 'Status kepabeanan resmi bebas bea transit, brankas lapis baja berstandar internasional.',
    upgradeCost: 8500000000, // Rp 8,5 Miliar
    upgradeDuration: 300, // 5 menit
    slots: 9
  },
  {
    level: 10,
    name: 'Smart Mega Hub AI & Robotik Otomatis Penuh',
    desc: 'Mega distribution center otonom terintegrasi AI, drone pengawas, dan rel distribusi pelabuhan.',
    upgradeCost: 15000000000, // Rp 15 Miliar
    upgradeDuration: 420, // 7 menit
    slots: 10
  }
];

// Katalog 10 Mitra Penyewa Pergudangan Logistik (1 Slot per Mitra, Max 10 Slot)
const LOGISTICS_TENANTS_CATALOG = [
  {
    id: 'tenant_umkm',
    name: 'Mitra UMKM & Toko Online Lokal',
    desc: 'Penyewa hub pengumpulan produk kerajinan, fashion lokal, dan camilan UMKM nusantara.',
    contractFee: 25000000, // Rp 25 Juta
    hourlyRent: 2200000, // Rp 2,2 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 1,
    icon: '📦'
  },
  {
    id: 'tenant_ecommerce',
    name: 'Mitra E-Commerce Marketplace Nasional',
    desc: 'Pusat sortir dan fulfillment order belanja online kilat untuk puluhan ribu paket harian.',
    contractFee: 65000000, // Rp 65 Juta
    hourlyRent: 5800000, // Rp 5,8 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 2,
    icon: '🛍️'
  },
  {
    id: 'tenant_fmcg',
    name: 'Distributor Nasional FMCG & Sembako',
    desc: 'Pusat distribusi grosir kebutuhan pangan pokok, minyak goreng, dan minuman kemasan.',
    contractFee: 160000000, // Rp 160 Juta
    hourlyRent: 14500000, // Rp 14,5 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 3,
    icon: '🥫'
  },
  {
    id: 'tenant_textile',
    name: 'Eksportir Tekstil & Brand Fashion Garment',
    desc: 'Pusat penyimpanan garmen kain gulungan premium dan pakaian siap ekspor mancanegara.',
    contractFee: 320000000, // Rp 320 Juta
    hourlyRent: 26000000, // Rp 26 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 4,
    icon: '👔'
  },
  {
    id: 'tenant_electronics',
    name: 'Vendor Gadget & Komponen Mikroelektronika',
    desc: 'Ruang bersih anti-statis (ESD) untuk inventaris smartphone flagship, laptop, dan chip semikonduktor.',
    contractFee: 650000000, // Rp 650 Juta
    hourlyRent: 48000000, // Rp 48 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 5,
    icon: '📱'
  },
  {
    id: 'tenant_pharma',
    name: 'Industri Farmasi & Vaksin Cold-Chain',
    desc: 'Penyewa cold-storage medis steril sub-zero untuk vaksin, plasma darah, dan obat biofarma.',
    contractFee: 1200000000, // Rp 1,2 Miliar
    hourlyRent: 88000000, // Rp 88 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 6,
    icon: '💊'
  },
  {
    id: 'tenant_automotive',
    name: 'Pabrikan Komponen Otomotif & Baterai EV',
    desc: 'Hub distribusi suku cadang presisi mesin, transmisi mobil, dan modul baterai kendaraan listrik.',
    contractFee: 2200000000, // Rp 2,2 Miliar
    hourlyRent: 155000000, // Rp 155 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 7,
    icon: '⚙️'
  },
  {
    id: 'tenant_coldfood',
    name: 'Importir Daging Wagyu & Seafood Premium',
    desc: 'Gudang beku blast freezer suhu ekstrem untuk daging wagyu impor, salmon Atlantik, dan lobster.',
    contractFee: 3800000000, // Rp 3,8 Miliar
    hourlyRent: 265000000, // Rp 265 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 8,
    icon: '🥩'
  },
  {
    id: 'tenant_luxury_import',
    name: 'Konsorsium Perhiasan & Brankas Mewah PLB',
    desc: 'Pusat Logistik Berikat dengan brankas lapis baja tahan api untuk perhiasan, jam tangan mewah & barang seni.',
    contractFee: 6500000000, // Rp 6,5 Miliar
    hourlyRent: 450000000, // Rp 450 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 9,
    icon: '💎'
  },
  {
    id: 'tenant_global_forwarder',
    name: 'Aliansi Mega Logistik Kontainer Multinasional',
    desc: 'Korporasi kargo antarbenua penguasa rute pelayaran internasional dan armada kargo udara global.',
    contractFee: 12000000000, // Rp 12 Miliar
    hourlyRent: 820000000, // Rp 820 Juta / jam
    slotsRequired: 1,
    requiredWarehouseLevel: 10,
    icon: '🌐'
  }
];

// Peran Karyawan Software House (4 Divisi Utama)
const TECH_ROLES = [
  {
    id: 'dev',
    name: 'Software Developers',
    title: 'Programmer / Developer',
    icon: '👨‍💻',
    hireCost: 25000000, // Rp 25 Juta
    salary: 4500000, // Rp 4,5 Juta / jam
    desc: 'Menulis kode arsitektur backend, frontend, API, dan logika inti aplikasi.'
  },
  {
    id: 'lead',
    name: 'Project Team Leaders',
    title: 'Ketua Tim / Tech Lead',
    icon: '👔',
    hireCost: 55000000, // Rp 55 Juta
    salary: 9500000, // Rp 9,5 Juta / jam
    desc: 'Mengkoordinasi sprint agile, code review, arsitektur teknis, dan manajemen proyek.'
  },
  {
    id: 'designer',
    name: 'UI/UX & Graphic Designers',
    title: 'Desainer UI/UX & Grafis',
    icon: '🎨',
    hireCost: 30000000, // Rp 30 Juta
    salary: 5200000, // Rp 5,2 Juta / jam
    desc: 'Mendesain tata letak antarmuka, aset visual, wireframe, prototipe, dan pengalaman pengguna.'
  },
  {
    id: 'tester',
    name: 'QA & Software Testers',
    title: 'Penguji Kualitas / QA Tester',
    icon: '🔍',
    hireCost: 20000000, // Rp 20 Juta
    salary: 3800000, // Rp 3,8 Juta / jam
    desc: 'Melakukan pengujian otomatis, bug hunting, stress test, dan jaminan stabilitas sistem.'
  }
];

// Opsi Upgrade Ruang Kantor & Workstation
const TECH_OFFICE_TYPES = [
  {
    id: 'small',
    name: 'Small Office Space (Co-Working Hub)',
    icon: '🏢',
    addedWorkstations: 15,
    cost: 450000000, // Rp 450 Juta
    durationSeconds: 840, // 14 Menit (Waktu minimal upgrade dunia nyata)
    desc: 'Sewa ruang kerja open-space co-working modern perkotaan dengan fasilitas rapat ber-AC (+15 Meja Kerja).'
  },
  {
    id: 'standard',
    name: 'Standard Office (Lantai Gedung Komersial)',
    icon: '🏬',
    addedWorkstations: 70,
    cost: 1800000000, // Rp 1,8 Miliar
    durationSeconds: 1680, // 28 Menit
    desc: 'Satu lantai kantor komersial eksklusif dengan ruang server mandiri dan studio tim terintegrasi (+70 Meja Kerja).'
  },
  {
    id: 'business_center',
    name: 'Business Center (Mega Tech Tower)',
    icon: '🏙️',
    addedWorkstations: 250,
    cost: 6500000000, // Rp 6,5 Miliar
    durationSeconds: 2700, // 45 Menit
    desc: 'Gedung mega-hub teknologi megah bertingkat untuk menampung ratusan talenta digital kelas dunia (+250 Meja Kerja).'
  }
];

// 11 Proyek Perangkat Lunak Software House
const TECH_PROJECTS_CATALOG = [
  {
    id: 'proj_layout',
    name: 'Tata Letak Antarmuka (Interface Layout)',
    icon: '📱',
    desc: 'Perancangan tata letak antarmuka responsif mobile-first untuk aplikasi startup lokal.',
    req: { dev: 4, lead: 1, designer: 4, tester: 2 },
    reward: 650000000, // Rp 650 Juta
    durationSeconds: 1800 // 30 Menit (paling cepat 30 menit)
  },
  {
    id: 'proj_corp_web',
    name: 'Pengembangan Website Korporat (Corporate Website Development)',
    icon: '🌐',
    desc: 'Portal korporat resmi perusahaan multinasional dengan CMS kustom dan proteksi keamanan tingkat tinggi.',
    req: { dev: 8, lead: 2, designer: 5, tester: 3 },
    reward: 1400000000, // Rp 1,4 Miliar
    durationSeconds: 2700 // 45 Menit
  },
  {
    id: 'proj_ecommerce',
    name: 'Pengembangan Situs Toko Online (Development of Online Store)',
    icon: '🛒',
    desc: 'Platform marketplace toko online terpadu dengan gateway pembayaran otomatis dan pelacakan kurir instan.',
    req: { dev: 14, lead: 3, designer: 6, tester: 5 },
    reward: 2800000000, // Rp 2,8 Miliar
    durationSeconds: 3600 // 60 Menit (1 Jam)
  },
  {
    id: 'proj_wms',
    name: 'Software Manajemen Pergudangan (Warehouse Management Software)',
    icon: '📦',
    desc: 'Perangkat lunak WMS pelacakan inventaris gudang, pemindaian QR code otomatis, dan distribusi logistik multi-cabang.',
    req: { dev: 22, lead: 4, designer: 6, tester: 8 },
    reward: 5200000000, // Rp 5,2 Miliar
    durationSeconds: 5400 // 90 Menit (1.5 Jam)
  },
  {
    id: 'proj_face_rec',
    name: 'Software Pengenal Wajah (Face Recognition Software)',
    icon: '👤',
    desc: 'Sistem computer vision biometrik deteksi wajah berkecepatan milidetik untuk absensi dan keamanan perimeter.',
    req: { dev: 32, lead: 5, designer: 8, tester: 12 },
    reward: 9500000000, // Rp 9,5 Miliar
    durationSeconds: 7200 // 2 Jam
  },
  {
    id: 'proj_engineering',
    name: 'Software Kalkulasi & Rekayasa Teknik (Engineering Calculations Software)',
    icon: '📐',
    desc: 'Software komputasi elemen hingga (FEM), simulasi aerodinamika, dan perhitungan beban struktur konstruksi jembatan/gedung.',
    req: { dev: 45, lead: 7, designer: 10, tester: 16 },
    reward: 16000000000, // Rp 16 Miliar
    durationSeconds: 10800 // 3 Jam
  },
  {
    id: 'proj_flight_mgmt',
    name: 'Sistem Manajemen Penerbangan (Flight Management Software)',
    icon: '✈️',
    desc: 'Perangkat lunak avionik navigasi pesawat udara, radar pemantau jalur penerbangan, dan koordinasi bandara internasional.',
    req: { dev: 60, lead: 9, designer: 12, tester: 24 },
    reward: 28000000000, // Rp 28 Miliar
    durationSeconds: 14400 // 4 Jam
  },
  {
    id: 'proj_aaa_game',
    name: 'Pengembangan Game Kaliber Dunia (Development of AAA Games)',
    icon: '🎮',
    desc: 'Karya mahakarya video game open-world grafis Unreal Engine fotorealistis dengan physics dinamis dan narasi epik.',
    req: { dev: 85, lead: 12, designer: 35, tester: 30 },
    reward: 55000000000, // Rp 55 Miliar
    durationSeconds: 21600 // 6 Jam
  },
  {
    id: 'proj_digital_eco',
    name: 'Pengembangan Ekosistem Digital (Development of Digital Ecosystem)',
    icon: '🌐',
    desc: 'Super-app terintegrasi multi-sektor: perbankan digital, ride-hailing, e-wallet, cloud storage, dan federasi identitas tunggal.',
    req: { dev: 110, lead: 16, designer: 32, tester: 38 },
    reward: 95000000000, // Rp 95 Miliar
    durationSeconds: 28800 // 8 Jam
  },
  {
    id: 'proj_os',
    name: 'Pengembangan Sistem Operasi (Development of Operating System)',
    icon: '🖥️',
    desc: 'Kernel OS otonom berarsitektur mikrokernel, isolasi memori mutakhir, hemat konsumsi daya, dan kompatibel jutaan aplikasi.',
    req: { dev: 140, lead: 20, designer: 30, tester: 50 },
    reward: 180000000000, // Rp 180 Miliar
    durationSeconds: 43200 // 12 Jam
  },
  {
    id: 'proj_ai',
    name: 'Pengembangan Kecerdasan Buatan Terdepan (AI Development)',
    icon: '🤖',
    desc: 'Model pondasi kecerdasan buatan super-skala triliunan parameter dengan penalaran otonom dan kapabilitas problem solving saintifik.',
    req: { dev: 180, lead: 25, designer: 35, tester: 60 },
    reward: 350000000000, // Rp 350 Miliar
    durationSeconds: 57600 // 16 Jam
  }
];

// ==========================================
// MASKAPAI PENERBANGAN: KATALOG ARMADA & RUTE
// ==========================================

const AIRCRAFT_CATEGORIES = {
  jet: {
    id: 'jet',
    name: 'Pesawat Jet Regional',
    shortName: 'Jet Regional',
    icon: '🛩️',
    desc: 'Pesawat jet cepat & lincah untuk rute jarak dekat (Short-Haul) antarnegara tetangga.'
  },
  narrow_body: {
    id: 'narrow_body',
    name: 'Boeing Sedang / Lorong Tunggal',
    shortName: 'Boeing Sedang',
    icon: '✈️',
    desc: 'Pesawat komersial kapasitas menengah untuk rute jarak menengah (Medium-Haul) antarnegara kawasan.'
  },
  wide_body: {
    id: 'wide_body',
    name: 'Pesawat Besar Berbadan Lebar',
    shortName: 'Wide-Body',
    icon: '🛫',
    desc: 'Pesawat jarak jauh dua lorong (Long-Haul) untuk penerbangan lintas benua berkapasitas besar.'
  },
  double_deck: {
    id: 'double_deck',
    name: 'Pesawat Besar Double Deck (Superjumbo)',
    shortName: 'Double Deck',
    icon: '🛬',
    desc: 'Raksasa bertingkat dua dengan daya angkut masif (Ultra Long-Haul) untuk rute tersibuk dunia.'
  }
};

const AIRLINE_AIRCRAFT_CATALOG = [
  // 1. KATEGORI JET REGIONAL (Rute Dekat)
  {
    id: 'jet_embraer_195',
    name: 'Embraer E195-E2 Profit Hunter',
    category: 'jet',
    manufacturer: 'Embraer Aerospace',
    price: 95000000000, // Rp 95 Miliar
    capacity: 132,
    rangeKm: 4815,
    maintenanceCost: 110000000, // Rp 110 Juta / jam
    icon: '🛩️',
    image: 'images/plane_embraer.jpg',
    desc: 'Pesawat jet modern aerodinamis hemat bahan bakar untuk rute komuter cepat antarnegara tetangga.'
  },
  {
    id: 'jet_bombardier_crj',
    name: 'Bombardier CRJ-1000 NextGen',
    category: 'jet',
    manufacturer: 'Bombardier Aerospace',
    price: 120000000000, // Rp 120 Miliar
    capacity: 104,
    rangeKm: 5100,
    maintenanceCost: 135000000, // Rp 135 Juta / jam
    icon: '🛩️',
    image: 'images/plane_crj.jpg',
    desc: 'Jet regional kabin sunyi dengan keandalan operasional tinggi dan efisiensi perawatan mesin turbofan.'
  },

  // 2. KATEGORI BOEING SEDANG / NARROW-BODY (Rute Menengah)
  {
    id: 'boeing_737_max',
    name: 'Boeing 737 MAX 9',
    category: 'narrow_body',
    manufacturer: 'Boeing Commercial Airplanes',
    price: 280000000000, // Rp 280 Miliar
    capacity: 193,
    rangeKm: 6570,
    maintenanceCost: 320000000, // Rp 320 Juta / jam
    icon: '✈️',
    image: 'images/plane_b737.jpg',
    desc: 'Pesawat lorong tunggal paling laris di dunia, tulang punggung penerbangan komersial antarnegara kawasan.'
  },
  {
    id: 'airbus_a321_neo',
    name: 'Airbus A321neo XLR',
    category: 'narrow_body',
    manufacturer: 'Airbus Industrie',
    price: 340000000000, // Rp 340 Miliar
    capacity: 220,
    rangeKm: 8700,
    maintenanceCost: 390000000, // Rp 390 Juta / jam
    icon: '✈️',
    image: 'images/plane_a321.jpg',
    desc: 'Pesawat berteknologi kabin Airspace dengan jangkauan ekstra jauh melintasi berbagai negara di Asia.'
  },

  // 3. KATEGORI PESAWAT BESAR / WIDE-BODY (Rute Jarak Jauh)
  {
    id: 'boeing_787_dreamliner',
    name: 'Boeing 787-9 Dreamliner',
    category: 'wide_body',
    manufacturer: 'Boeing Commercial Airplanes',
    price: 680000000000, // Rp 680 Miliar
    capacity: 296,
    rangeKm: 14140,
    maintenanceCost: 780000000, // Rp 780 Juta / jam
    icon: '🛫',
    image: 'images/plane_b787.jpg',
    desc: 'Pesawat badan lebar berkonstruksi serat karbon komposit modern dengan jendela elektrokromik mewah.'
  },
  {
    id: 'airbus_a350_900',
    name: 'Airbus A350-900 XWB',
    category: 'wide_body',
    manufacturer: 'Airbus Industrie',
    price: 820000000000, // Rp 820 Miliar
    capacity: 325,
    rangeKm: 15000,
    maintenanceCost: 920000000, // Rp 920 Juta / jam
    icon: '🛫',
    image: 'images/plane_a350.jpg',
    desc: 'Pesawat flagship antarbenua berdaya jelajah tinggi dengan kapasitas angkut kargo dan penumpang superior.'
  },

  // 4. KATEGORI PESAWAT BESAR DOUBLE DECK / SUPERJUMBO (Rute Padat Antarbenua)
  {
    id: 'boeing_747_8',
    name: 'Boeing 747-8 Intercontinental',
    category: 'double_deck',
    manufacturer: 'Boeing Commercial Airplanes',
    price: 1550000000000, // Rp 1,55 Triliun
    capacity: 467,
    rangeKm: 14815,
    maintenanceCost: 1650000000, // Rp 1,65 Miliar / jam
    icon: '🛬',
    image: 'images/plane_b747.jpg',
    desc: 'Sang "Queen of the Skies" bertingkat dua legendaris dengan punuk ikonik dan daya angkut kargo masif.'
  },
  {
    id: 'airbus_a380',
    name: 'Airbus A380-800 Superjumbo',
    category: 'double_deck',
    manufacturer: 'Airbus Industrie',
    price: 1850000000000, // Rp 1,85 Triliun
    capacity: 575,
    rangeKm: 15200,
    maintenanceCost: 1950000000, // Rp 1,95 Miliar / jam
    icon: '🛬',
    image: 'images/plane_a380.jpg',
    desc: 'Pesawat penumpang komersial terbesar di dunia bertingkat penuh (full double-deck) dengan fasilitas suite bintang lima.'
  }
];

const AIRLINE_ROUTES_CATALOG = [
  // Jarak Pendek (Butuh Jet)
  {
    id: 'route_sin',
    destination: 'Changi Airport (SIN), Singapura',
    country: 'Singapura',
    flag: '🇸🇬',
    distanceKm: 890,
    category: 'jet',
    requiredCategory: 'jet',
    unlockCost: 12000000000, // Rp 12 Miliar
    durationSeconds: 300, // 5 Menit dunia nyata
    hourlyRevenue: 1250000000, // Rp 1,25 Miliar / jam
    desc: 'Rute komuter bisnis terpadat antar negara tetangga dengan frekuensi penerbangan tinggi CGK - SIN.'
  },
  {
    id: 'route_kul',
    destination: 'Kuala Lumpur International (KUL), Malaysia',
    country: 'Malaysia',
    flag: '🇲🇾',
    distanceKm: 1190,
    category: 'jet',
    requiredCategory: 'jet',
    unlockCost: 18000000000, // Rp 18 Miliar
    durationSeconds: 480, // 8 Menit
    hourlyRevenue: 1650000000, // Rp 1,65 Miliar / jam
    desc: 'Jalur strategis wisata belanja dan perdagangan bilateral serumpun Asia Tenggara CGK - KUL.'
  },

  // Jarak Menengah (Butuh Boeing Sedang)
  {
    id: 'route_bkk',
    destination: 'Suvarnabhumi Airport (BKK), Thailand',
    country: 'Thailand',
    flag: '🇹🇭',
    distanceKm: 2330,
    category: 'narrow_body',
    requiredCategory: 'narrow_body',
    unlockCost: 35000000000, // Rp 35 Miliar
    durationSeconds: 720, // 12 Menit
    hourlyRevenue: 3200000000, // Rp 3,2 Miliar / jam
    desc: 'Penerbangan favorit turis mancanegara menuju destinasi kuliner dan pariwisata kuil eksotis CGK - BKK.'
  },
  {
    id: 'route_hkg',
    destination: 'Hong Kong International (HKG)',
    country: 'Hong Kong',
    flag: '🇭🇰',
    distanceKm: 3280,
    category: 'narrow_body',
    requiredCategory: 'narrow_body',
    unlockCost: 55000000000, // Rp 55 Miliar
    durationSeconds: 900, // 15 Menit
    hourlyRevenue: 4800000000, // Rp 4,8 Miliar / jam
    desc: 'Koridor hub keuangan dunia dan transit kargo udara logistik internasional terpadat Asia Timur CGK - HKG.'
  },
  {
    id: 'route_icn',
    destination: 'Incheon International (ICN), Korea Selatan',
    country: 'Korea Selatan',
    flag: '🇰🇷',
    distanceKm: 5290,
    category: 'narrow_body',
    requiredCategory: 'narrow_body',
    unlockCost: 80000000000, // Rp 80 Miliar
    durationSeconds: 1200, // 20 Menit
    hourlyRevenue: 6900000000, // Rp 6,9 Miliar / jam
    desc: 'Arus wisatawan K-Pop, industri kecantikan, serta perjalanan bisnis konglomerat teknologi semikonduktor CGK - ICN.'
  },

  // Jarak Jauh (Butuh Pesawat Besar Wide-Body)
  {
    id: 'route_hnd',
    destination: 'Haneda Airport (HND), Tokyo, Jepang',
    country: 'Jepang',
    flag: '🇯🇵',
    distanceKm: 5790,
    category: 'wide_body',
    requiredCategory: 'wide_body',
    unlockCost: 130000000000, // Rp 130 Miliar
    durationSeconds: 1500, // 25 Menit
    hourlyRevenue: 10500000000, // Rp 10,5 Miliar / jam
    desc: 'Rute eksekutif premium korporasi multinasional dan wisata empat musim bunga sakura CGK - HND.'
  },
  {
    id: 'route_syd',
    destination: 'Kingsford Smith (SYD), Sydney, Australia',
    country: 'Australia',
    flag: '🇦🇺',
    distanceKm: 5510,
    category: 'wide_body',
    requiredCategory: 'wide_body',
    unlockCost: 160000000000, // Rp 160 Miliar
    durationSeconds: 1800, // 30 Menit
    hourlyRevenue: 12800000000, // Rp 12,8 Miliar / jam
    desc: 'Jalur perdagangan benua selatan, pelajar mahasiswa internasional, dan ekspor impor produk segar CGK - SYD.'
  },
  {
    id: 'route_dxb',
    destination: 'Dubai International (DXB), Uni Emirat Arab',
    country: 'Uni Emirat Arab',
    flag: '🇦🇪',
    distanceKm: 6560,
    category: 'wide_body',
    requiredCategory: 'wide_body',
    unlockCost: 220000000000, // Rp 220 Miliar
    durationSeconds: 2100, // 35 Menit
    hourlyRevenue: 17500000000, // Rp 17,5 Miliar / jam
    desc: 'Pintu gerbang transit mega-hub Timur Tengah dengan load factor penumpang kelas utama yang sangat tinggi CGK - DXB.'
  },

  // Jarak Sangat Jauh & Penumpang Masif (Butuh Pesawat Double Deck Superjumbo)
  {
    id: 'route_lhr',
    destination: 'Heathrow Airport (LHR), London, Inggris',
    country: 'Inggris',
    flag: '🇬🇧',
    distanceKm: 11720,
    category: 'double_deck',
    requiredCategory: 'double_deck',
    unlockCost: 420000000000, // Rp 420 Miliar
    durationSeconds: 2700, // 45 Menit
    hourlyRevenue: 32000000000, // Rp 32 Miliar / jam
    desc: 'Rute mahakarya paling prestisius menghubungkan Asia dengan pusat finansial City of London. Butuh pesawat bertingkat untuk mengakomodasi ribuan penumpang CGK - LHR.'
  },
  {
    id: 'route_jfk',
    destination: 'John F. Kennedy (JFK), New York, Amerika Serikat',
    country: 'Amerika Serikat',
    flag: '🇺🇸',
    distanceKm: 16180,
    category: 'double_deck',
    requiredCategory: 'double_deck',
    unlockCost: 650000000000, // Rp 650 Miliar
    durationSeconds: 3600, // 60 Menit
    hourlyRevenue: 48000000000, // Rp 48 Miliar / jam
    desc: 'Penerbangan transpasifik terpanjang dan terpadat di dunia menuju ibu kota finansial Wall Street. Hanya pesawat double deck raksasa yang mampu melayani rute ini CGK - JFK.'
  }
];

// ==========================================
// SEKTOR MINYAK & GAS BUMI (FASILITAS & KONTRAK)
// ==========================================

const OIL_FACILITIES_CATALOG = [
  {
    id: 'oil_pumpjack',
    name: 'Sumur Pompa Darat (Beam Pumping Unit)',
    cost: 8000000000, // Rp 8 Miliar
    oilBblPerHour: 150, // +150 Barel Minyak / jam
    gasBoePerHour: 40,  // +40 BOE Gas / jam
    icon: '🛢️',
    desc: 'Unit pompa angguk konvensional darat untuk memompa cadangan minyak mentah dan gas terlarut.'
  },
  {
    id: 'oil_offshore_platform',
    name: 'Anjungan Lepas Pantai (Offshore Rig Platform)',
    cost: 35000000000, // Rp 35 Miliar
    oilBblPerHour: 650, // +650 Barel Minyak / jam
    gasBoePerHour: 250, // +250 BOE Gas / jam
    icon: '🏗️',
    desc: 'Platform kilang baja laut dangkal dengan sistem pemisahan separator gas alam otomatis.'
  },
  {
    id: 'oil_fpso_vessel',
    name: 'Kapal Produksi Terapung (FPSO Deepwater Vessel)',
    cost: 120000000000, // Rp 120 Miliar
    oilBblPerHour: 2200, // +2.200 Barel Minyak / jam
    gasBoePerHour: 950,  // +950 BOE Gas / jam
    icon: '🚢',
    desc: 'Kapal raksasa pemrosesan, penyimpanan, dan bongkar muat migas laut dalam lepas pantai.'
  },
  {
    id: 'oil_lng_complex',
    name: 'Kompleks Kilang Terpadu & Kilang LNG (Integrated Mega Refinery)',
    cost: 380000000000, // Rp 380 Miliar
    oilBblPerHour: 7500, // +7.500 Barel Minyak / jam
    gasBoePerHour: 4000, // +4.000 BOE Gas / jam
    icon: '🏭',
    desc: 'Fasilitas pemurnian mega-skala untuk fraksinasi minyak mentah dan likuefaksi gas alam cair.'
  }
];

const OIL_CONTRACTS_CATALOG = [
  {
    id: 'contract_oil_1',
    partner: 'PT Pertamina Patra Niaga',
    title: 'Pasokan Distribusi Bahan Bakar Domestik (Tahap I)',
    reqOilBbl: 250,
    reqGasBoe: 80,
    cost: 15000000000, // Rp 15 Miliar
    durationSeconds: 300, // 5 Menit
    hourlyRevenue: 2200000000, // Rp 2,2 Miliar / jam
    icon: '🇮🇩',
    desc: 'Kontrak penyaluran minyak mentah untuk kilang domestik dan jaringan SPBU nasional.'
  },
  {
    id: 'contract_oil_2',
    partner: 'PT PLN Nusantara Power',
    title: 'Suplai Bahan Bakar Gas PLTG Pembangkit Listrik',
    reqOilBbl: 600,
    reqGasBoe: 250,
    cost: 35000000000, // Rp 35 Miliar
    durationSeconds: 480, // 8 Menit
    hourlyRevenue: 4500000000, // Rp 4,5 Miliar / jam
    icon: '⚡',
    desc: 'Penyediaan gas alam pipa bertekanan tinggi untuk turbin listrik interkoneksi pulau Jawa-Bali.'
  },
  {
    id: 'contract_oil_3',
    partner: 'PT Pertamina Kilang Internasional',
    title: 'Pasokan Bahan Baku Kilang Balikpapan (Tahap II)',
    reqOilBbl: 1400,
    reqGasBoe: 600,
    cost: 80000000000, // Rp 80 Miliar
    durationSeconds: 720, // 12 Menit
    hourlyRevenue: 8800000000, // Rp 8,8 Miliar / jam
    icon: '🏭',
    desc: 'Kontrak jangka panjang pasokan minyak mentah manis dan kondensat untuk kilang modernisasi RDMP.'
  },
  {
    id: 'contract_oil_4',
    partner: 'Shell Eastern Petroleum Singapore',
    title: 'Ekspor Bahan Bakar Regional Selat Malaka',
    reqOilBbl: 3000,
    reqGasBoe: 1200,
    cost: 150000000000, // Rp 150 Miliar
    durationSeconds: 900, // 15 Menit
    hourlyRevenue: 16500000000, // Rp 16,5 Miliar / jam
    icon: '🇸🇬',
    desc: 'Ekspor kargo minyak bunker laut dan gas alam cair menuju hub perdagangan energi Singapura.'
  },
  {
    id: 'contract_oil_5',
    partner: 'Sinopec Energy Consortium',
    title: 'Kontrak Suplai Petrokimia Terpadu Asia Timur',
    reqOilBbl: 6000,
    reqGasBoe: 2500,
    cost: 280000000000, // Rp 280 Miliar
    durationSeconds: 1200, // 20 Menit
    hourlyRevenue: 28000000000, // Rp 28 Miliar / jam
    icon: '🇨🇳',
    desc: 'Suplai nafta dan bahan baku polimer untuk rantai pasok industri petrokimia raksasa Asia Timur.'
  },
  {
    id: 'contract_oil_6',
    partner: 'Tokyo Gas & JERA Consortium',
    title: 'Perjanjian Jual Beli Jangka Panjang LNG Jepang',
    reqOilBbl: 11000,
    reqGasBoe: 5000,
    cost: 500000000000, // Rp 500 Miliar
    durationSeconds: 1800, // 30 Menit
    hourlyRevenue: 45000000000, // Rp 45 Miliar / jam
    icon: '🇯🇵',
    desc: 'Pengapalan armada tanker LNG cryogenic untuk kebutuhan pemanas kota dan ketahanan energi Jepang.'
  },
  {
    id: 'contract_oil_7',
    partner: 'BP Global Trading Alliance',
    title: 'Konsorsium Perdagangan Energi Transatlantik',
    reqOilBbl: 20000,
    reqGasBoe: 9000,
    cost: 900000000000, // Rp 900 Miliar
    durationSeconds: 2700, // 45 Menit
    hourlyRevenue: 75000000000, // Rp 75 Miliar / jam
    icon: '🇬🇧',
    desc: 'Perjanjian offtake minyak mentah patokan Brent dan gas alam pasar Eropa bernilai puluhan triliun rupiah.'
  },
  {
    id: 'contract_oil_8',
    partner: 'Chevron Global Energy Strategic Reserve',
    title: 'Aliansi Mega Cadangan Energi Dunia',
    reqOilBbl: 35000,
    reqGasBoe: 16000,
    cost: 1600000000000, // Rp 1,6 Triliun
    durationSeconds: 3600, // 60 Menit
    hourlyRevenue: 120000000000, // Rp 120 Miliar / jam
    icon: '🌐',
    desc: 'Kontrak bilateral tertinggi penyedia cadangan energi strategis global dengan proteksi harga patokan dunia.'
  }
];

// ==========================================
// SEKTOR TAMBANG NIKEL & EMAS (FASILITAS & KONTRAK)
// ==========================================

const MINING_FACILITIES_CATALOG = [
  {
    id: 'mining_excavator_fleet',
    name: 'Excavator Tambang Raksasa & Dump Truck HD',
    cost: 15000000000, // Rp 15 Miliar
    nickelTonPerHour: 80, // +80 Ton Nikel / jam
    goldKgPerHour: 0.5,   // +0.5 Kg Emas / jam
    icon: '🚜',
    desc: 'Armada alat berat pemindah tanah lapisan penutup (overburden) dan pengerukan bijih mineral mentah.'
  },
  {
    id: 'mining_shaft_drilling',
    name: 'Pengeboran Terowongan Bawah Tanah (Deep Underground Shaft)',
    cost: 65000000000, // Rp 65 Miliar
    nickelTonPerHour: 350, // +350 Ton Nikel / jam
    goldKgPerHour: 2.5,    // +2.5 Kg Emas / jam
    icon: '⛏️',
    desc: 'Terowongan poros tambang dalam untuk menambang urat kuarsa emas berkadar tinggi dan nikel sulfida.'
  },
  {
    id: 'mining_smelter_rkef',
    name: 'Pabrik Smelter HPAL & Tungku RKEF (High Pressure Acid Leach)',
    cost: 220000000000, // Rp 220 Miliar
    nickelTonPerHour: 1200, // +1.200 Ton Nikel / jam
    goldKgPerHour: 8.0,     // +8.0 Kg Emas / jam
    icon: '🔥',
    desc: 'Teknologi hidrometalurgi asam tekanan tinggi (HPAL) untuk memproduksi nikel murni MHP grade baterai EV.'
  },
  {
    id: 'mining_gold_refinery',
    name: 'Pabrik Pemurnian & Ekstraksi Logam Mulia Bullion (Gold Refinery)',
    cost: 750000000000, // Rp 750 Miliar
    nickelTonPerHour: 3800, // +3.800 Ton Nikel / jam
    goldKgPerHour: 25.0,    // +25.0 Kg Emas / jam
    icon: '🏆',
    desc: 'Fasilitas pemurnian modern electrolytic cell berakreditasi LBMA untuk mencetak emas batangan 99.99% murni.'
  }
];

const MINING_CONTRACTS_CATALOG = [
  {
    id: 'contract_mining_1',
    partner: 'PT Aneka Tambang Tbk (Antam)',
    title: 'Pasokan Konsentrat Mineral Domestik (Tahap I)',
    reqNickelTon: 120,
    reqGoldKg: 1.0,
    cost: 25000000000, // Rp 25 Miliar
    durationSeconds: 300, // 5 Menit
    hourlyRevenue: 4500000000, // Rp 4,5 Miliar / jam
    icon: '🇮🇩',
    desc: 'Kontrak penyaluran bijih nikel laterit kadar tinggi dan konsentrat emas untuk peleburan BUMN Antam.'
  },
  {
    id: 'contract_mining_2',
    partner: 'PT Timah & Pabrik Peleburan Lokal',
    title: 'Konsorsium Peleburan Logam Paduan Nusantara',
    reqNickelTon: 350,
    reqGoldKg: 3.0,
    cost: 60000000000, // Rp 60 Miliar
    durationSeconds: 480, // 8 Menit
    hourlyRevenue: 9500000000, // Rp 9,5 Miliar / jam
    icon: '🏭',
    desc: 'Kerjasama pengadaan nikel pig iron (NPI) dan logam mulia untuk industri pengecoran dalam negeri.'
  },
  {
    id: 'contract_mining_3',
    partner: 'PT Vale Indonesia Tbk',
    title: 'Pasokan Strategis Bahan Baku Nikel Matte',
    reqNickelTon: 800,
    reqGoldKg: 7.0,
    cost: 140000000000, // Rp 140 Miliar
    durationSeconds: 720, // 12 Menit
    hourlyRevenue: 18000000000, // Rp 18 Miliar / jam
    icon: '⛰️',
    desc: 'Perjanjian suplai nikel matte berkadar 78% untuk kebutuhan ekspor ke pabrik stainless steel dunia.'
  },
  {
    id: 'contract_mining_4',
    partner: 'CATL (Contemporary Amperex Technology)',
    title: 'Rantai Pasok Bahan Baku Katoda Baterai EV',
    reqNickelTon: 1800,
    reqGoldKg: 15.0,
    cost: 300000000000, // Rp 300 Miliar
    durationSeconds: 900, // 15 Menit
    hourlyRevenue: 34000000000, // Rp 34 Miliar / jam
    icon: '🔋',
    desc: 'Kontrak jangka panjang pasokan nikel sulfat kemurnian tinggi untuk raksasa manufaktur sel baterai mobil listrik.'
  },
  {
    id: 'contract_mining_5',
    partner: 'LG Energy Solution & Hyundai Consortium',
    title: 'Aliansi Pabrik Sel Baterai Lithium Generasi Baru',
    reqNickelTon: 3500,
    reqGoldKg: 30.0,
    cost: 600000000000, // Rp 60 Miliar
    durationSeconds: 1200, // 20 Menit
    hourlyRevenue: 58000000000, // Rp 58 Miliar / jam
    icon: '🇰🇷',
    desc: 'Kemitraan integrasi hulu-hilir ekosistem mobil listrik Asia Pasifik dengan offtake nikel dan logam pelapis.'
  },
  {
    id: 'contract_mining_6',
    partner: 'Bank Indonesia & World Gold Council',
    title: 'Pengadaan Cadangan Devisa Emas Batangan Negara',
    reqNickelTon: 6500,
    reqGoldKg: 55.0,
    cost: 1100000000000, // Rp 1,1 Triliun
    durationSeconds: 1800, // 30 Menit
    hourlyRevenue: 95000000000, // Rp 95 Miliar / jam
    icon: '🥇',
    desc: 'Pencetakan emas batangan bersertifikasi London Bullion Market (LBMA) untuk memperkuat cadangan devisa emas moneter.'
  },
  {
    id: 'contract_mining_7',
    partner: 'Tesla Giga-Factory Global Supply',
    title: 'Kontrak Suplai Nikel Kelas Satu (Class 1 EV Nickel)',
    reqNickelTon: 12000,
    reqGoldKg: 95.0,
    cost: 1900000000000, // Rp 1,9 Triliun
    durationSeconds: 2700, // 45 Menit
    hourlyRevenue: 155000000000, // Rp 155 Miliar / jam
    icon: '⚡',
    desc: 'Pasokan eksklusif nikel bebas karbon rendah emisi untuk jaringan pabrik perakitan mobil listrik global.'
  },
  {
    id: 'contract_mining_8',
    partner: 'Glencore International Consortium',
    title: 'Mega Aliansi Komoditas Tambang Multi-Benua',
    reqNickelTon: 22000,
    reqGoldKg: 160.0,
    cost: 3200000000000, // Rp 3,2 Triliun
    durationSeconds: 3600, // 60 Menit
    hourlyRevenue: 250000000000, // Rp 250 Miliar / jam
    icon: '👑',
    desc: 'Kontrak perdagangan komoditas mineral terbesar di dunia dengan jaminan penyerapan seluruh produksi konsentrat logam.'
  }
];

// Normalisasi helper atribut kontrak Migas & Tambang
if (typeof OIL_CONTRACTS_CATALOG !== 'undefined') {
  OIL_CONTRACTS_CATALOG.forEach(c => {
    if (c.tenderFee === undefined) c.tenderFee = c.cost;
    if (c.revenuePerHour === undefined) c.revenuePerHour = c.hourlyRevenue;
    if (c.badge === undefined) c.badge = c.icon;
    if (c.country === undefined) c.country = c.icon === '🇮🇩' ? 'Indonesia' : (c.icon === '⚡' ? 'Indonesia' : (c.icon === '🏭' ? 'Indonesia' : (c.icon === '🇸🇬' ? 'Singapura' : (c.icon === '🇨🇳' ? 'Tiongkok' : (c.icon === '🇯🇵' ? 'Jepang' : (c.icon === '🇬🇧' ? 'Inggris' : 'Global'))))));
  });
}

if (typeof MINING_CONTRACTS_CATALOG !== 'undefined') {
  MINING_CONTRACTS_CATALOG.forEach(c => {
    if (c.tenderFee === undefined) c.tenderFee = c.cost;
    if (c.revenuePerHour === undefined) c.revenuePerHour = c.hourlyRevenue;
    if (c.badge === undefined) c.badge = c.icon;
    if (c.country === undefined) c.country = c.icon === '🇮🇩' ? 'Indonesia' : (c.icon === '🏭' ? 'Indonesia' : (c.icon === '⛰️' ? 'Indonesia' : (c.icon === '🔋' ? 'Tiongkok' : (c.icon === '🇰🇷' ? 'Korea Selatan' : (c.icon === '🥇' ? 'Bank Indonesia' : (c.icon === '⚡' ? 'Global' : 'Swiss'))))));
  });
}

const STOCKS_CATALOG = [
  {
    symbol: 'BBCA',
    name: 'Bank Central Asia',
    category: 'Perbankan Swasta Terbesar',
    basePrice: 10250,
    volatility: 0.015,
    dividendYieldHourly: 0.0035,
    icon: '🏛️'
  },
  {
    symbol: 'BBRI',
    name: 'Bank Rakyat Indonesia',
    category: 'Perbankan Mikro & BUMN',
    basePrice: 4750,
    volatility: 0.018,
    dividendYieldHourly: 0.0045,
    icon: '🏦'
  },
  {
    symbol: 'BMRI',
    name: 'Bank Mandiri Persero',
    category: 'Perbankan Korporasi BUMN',
    basePrice: 6550,
    volatility: 0.019,
    dividendYieldHourly: 0.0040,
    icon: '🏢'
  },
  {
    symbol: 'TLKM',
    name: 'Telkom Indonesia',
    category: 'Telekomunikasi BUMN',
    basePrice: 3200,
    volatility: 0.02,
    dividendYieldHourly: 0.0042,
    icon: '📡'
  },
  {
    symbol: 'ASII',
    name: 'Astra International',
    category: 'Otomotif & Industri',
    basePrice: 5350,
    volatility: 0.022,
    dividendYieldHourly: 0.0048,
    icon: '🚗'
  },
  {
    symbol: 'ICBP',
    name: 'Indofood CBP Makmur',
    category: 'Consumer Goods & F&B',
    basePrice: 11400,
    volatility: 0.016,
    dividendYieldHourly: 0.0032,
    icon: '🍜'
  },
  {
    symbol: 'UNVR',
    name: 'Unilever Indonesia',
    category: 'Barang Konsumen Rumah Tangga',
    basePrice: 2800,
    volatility: 0.021,
    dividendYieldHourly: 0.0038,
    icon: '🧼'
  },
  {
    symbol: 'ANTM',
    name: 'Aneka Tambang (Emas)',
    category: 'Komoditas & Logam Mulia',
    basePrice: 1680,
    volatility: 0.035,
    dividendYieldHourly: 0.0028,
    icon: '🪙'
  },
  {
    symbol: 'ADRO',
    name: 'Adaro Energy Indonesia',
    category: 'Energi Batu Bara & Hijau',
    basePrice: 3650,
    volatility: 0.032,
    dividendYieldHourly: 0.0055,
    icon: '⚡'
  },
  {
    symbol: 'PGAS',
    name: 'Perusahaan Gas Negara',
    category: 'Distribusi Energi Gas Bumi',
    basePrice: 1540,
    volatility: 0.026,
    dividendYieldHourly: 0.0036,
    icon: '🔥'
  },
  {
    symbol: 'GOTO',
    name: 'GoTo Ekosistem Digital',
    category: 'Teknologi & Ride-hailing',
    basePrice: 88,
    volatility: 0.065,
    dividendYieldHourly: 0.0,
    icon: '📱'
  },
  {
    symbol: 'BUKA',
    name: 'Bukalapak Marketplace',
    category: 'E-Commerce & Mitra UMKM',
    basePrice: 135,
    volatility: 0.055,
    dividendYieldHourly: 0.0,
    icon: '🛍️'
  },
  {
    symbol: 'NVDA',
    name: 'Nvidia AI Chipmaker',
    category: 'Global AI Tech Leader',
    basePrice: 2250000,
    volatility: 0.045,
    dividendYieldHourly: 0.0015,
    icon: '🤖'
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc Global',
    category: 'Global Consumer Tech',
    basePrice: 3850000,
    volatility: 0.025,
    dividendYieldHourly: 0.0025,
    icon: '🍎'
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'Cloud, Software & AI',
    basePrice: 7100000,
    volatility: 0.022,
    dividendYieldHourly: 0.0020,
    icon: '💻'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Motors & EV',
    category: 'Kendaraan Listrik & Otonom',
    basePrice: 3450000,
    volatility: 0.050,
    dividendYieldHourly: 0.0,
    icon: '🚘'
  }
];

const CRYPTO_CATALOG = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    basePrice: 1480000000,
    volatility: 0.075,
    icon: '₿',
    color: '#f59e0b',
    logo: 'images/crypto_bitcoin.svg'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    basePrice: 52000000,
    volatility: 0.09,
    icon: 'Ξ',
    color: '#6366f1',
    logo: 'images/crypto_bitcoin.svg'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    basePrice: 3100000,
    volatility: 0.12,
    icon: '◎',
    color: '#a855f7',
    logo: 'images/crypto_bitcoin.svg'
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    basePrice: 3450,
    volatility: 0.18,
    icon: '🐕',
    color: '#eab308',
    logo: 'images/crypto_bitcoin.svg'
  }
];

const REAL_ESTATE_CATALOG = [
  {
    id: 'kost_jogja',
    name: 'Rumah Kos 12 Pintu (Jogja)',
    location: 'Sleman, D.I. Yogyakarta',
    group: 'domestik',
    price: 680000000, // Rp 680 Juta
    hourlyRent: 1400000, // Rp 1,4 Juta / jam
    furnitureCost: 55000000,
    internetCost: 20000000,
    hourlyMaintenance: 160000, // Biaya perawatan rutin per jam
    icon: '🏡',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'apt_jakarta',
    name: 'Apartemen Studio Central Park',
    location: 'Jakarta Barat',
    group: 'domestik',
    price: 1850000000, // Rp 1,85 Miliar
    hourlyRent: 3900000, // Rp 3,9 Juta / jam
    furnitureCost: 148000000,
    internetCost: 55000000,
    hourlyMaintenance: 460000,
    icon: '🏢',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'rumah_pik',
    name: 'Rumah Minimalis Modern PIK 2',
    location: 'Pantai Indah Kapuk, Jakarta',
    group: 'domestik',
    price: 3400000000, // Rp 3,4 Miliar
    hourlyRent: 7500000, // Rp 7,5 Juta / jam
    furnitureCost: 270000000,
    internetCost: 95000000,
    hourlyMaintenance: 900000,
    icon: '🏠',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'ruko_surabaya',
    name: 'Ruko Komersial 3 Lantai',
    location: 'Surabaya Timur',
    group: 'domestik',
    price: 4800000000, // Rp 4,8 Miliar
    hourlyRent: 10500000, // Rp 10,5 Juta / jam
    furnitureCost: 380000000,
    internetCost: 140000000,
    hourlyMaintenance: 1250000,
    icon: '🏬',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'villa_bali',
    name: 'Luxury Tropical Pool Villa',
    location: 'Canggu, Bali',
    group: 'domestik',
    price: 18500000000, // Rp 18,5 Miliar
    hourlyRent: 45000000, // Rp 45 Juta / jam
    furnitureCost: 1450000000,
    internetCost: 550000000,
    hourlyMaintenance: 5400000,
    icon: '🌴',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_pondokindah',
    name: 'Mansion Megah Pondok Indah',
    location: 'Jakarta Selatan',
    group: 'domestik',
    price: 48000000000, // Rp 48 Miliar
    hourlyRent: 120000000, // Rp 120 Juta / jam
    furnitureCost: 3800000000,
    internetCost: 1400000000,
    hourlyMaintenance: 14000000,
    icon: '🏰',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'tower_sudirman',
    name: 'Gedung Wisma Perkantoran',
    location: 'Sudirman CBD, Jakarta',
    group: 'domestik',
    price: 125000000000, // Rp 125 Miliar
    hourlyRent: 320000000, // Rp 320 Juta / jam
    furnitureCost: 10000000000,
    internetCost: 3750000000,
    hourlyMaintenance: 38000000,
    icon: '🏙️',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'resort_labuanbajo',
    name: 'Resort Tebing Laut Komodo',
    location: 'Labuan Bajo, NTT',
    group: 'domestik',
    price: 260000000000, // Rp 260 Miliar
    hourlyRent: 720000000, // Rp 720 Juta / jam
    furnitureCost: 20000000000,
    internetCost: 7800000000,
    hourlyMaintenance: 86000000,
    icon: '⛵',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'penthouse_nyc',
    name: 'Manhattan 5th Ave Penthouse',
    location: 'New York City, USA',
    group: 'global',
    price: 480000000000, // Rp 480 Miliar
    hourlyRent: 1350000000, // Rp 1,35 Miliar / jam
    furnitureCost: 38000000000,
    internetCost: 14000000000,
    hourlyMaintenance: 160000000,
    icon: '✨',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'condo_tokyo',
    name: 'Kondominium Mewah Roppongi',
    location: 'Minato, Tokyo, Jepang',
    group: 'global',
    price: 850000000000, // Rp 850 Miliar
    hourlyRent: 2450000000, // Rp 2,45 Miliar / jam
    furnitureCost: 68000000000,
    internetCost: 25000000000,
    hourlyMaintenance: 290000000,
    icon: '🗼',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'burj_dubai',
    name: 'Burj Luxury Skyscraper Suite',
    location: 'Downtown Dubai, UAE',
    group: 'global',
    price: 1400000000000, // Rp 1,4 Triliun
    hourlyRent: 4200000000, // Rp 4,2 Miliar / jam
    furnitureCost: 110000000000,
    internetCost: 42000000000,
    hourlyMaintenance: 500000000,
    icon: '🌆',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'chateau_france',
    name: 'Château Klasik & Perkebunan Anggur',
    location: 'Bordeaux, Prancis',
    group: 'global',
    price: 3200000000000, // Rp 3,2 Triliun
    hourlyRent: 10500000000, // Rp 10,5 Miliar / jam
    furnitureCost: 250000000000,
    internetCost: 95000000000,
    hourlyMaintenance: 1250000000,
    icon: '🍇',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&auto=format&fit=crop&q=80'
  }
];

const LUXURY_CATALOG = [
  // ==========================================
  // 1. MOTOR (SEPEDA MOTOR & SUPERBIKE - 20 ITEMS)
  // ==========================================
  {
    id: 'moto_beat',
    name: 'Honda BeAT eSP 110cc',
    category: 'Motor',
    type: 'moto',
    price: 18500000,
    icon: '🛵',
    prestige: 25,
    image: 'images/veh_beat.jpg'
  },
  {
    id: 'moto_scoopy',
    name: 'Honda Scoopy Prestige Smart Key',
    category: 'Motor',
    type: 'moto',
    price: 23500000,
    icon: '🛵',
    prestige: 35,
    image: 'images/moto_scoopy.jpg'
  },
  {
    id: 'moto_vario',
    name: 'Honda Vario 160 eSP+ ABS',
    category: 'Motor',
    type: 'moto',
    price: 29500000,
    icon: '🛵',
    prestige: 45,
    image: 'images/moto_vario.jpg'
  },
  {
    id: 'moto_aerox',
    name: 'Yamaha Aerox 155 CyberCity',
    category: 'Motor',
    type: 'moto',
    price: 31500000,
    icon: '🛵',
    prestige: 50,
    image: 'images/moto_aerox.jpg'
  },
  {
    id: 'moto_nmax',
    name: 'Yamaha NMAX 155 Connected/ABS',
    category: 'Motor',
    type: 'moto',
    price: 36000000,
    icon: '🛵',
    prestige: 60,
    image: 'images/veh_nmax.jpg'
  },
  {
    id: 'moto_pcx',
    name: 'Honda PCX 160 RoadSync Gold Edition',
    category: 'Motor',
    type: 'moto',
    price: 37500000,
    icon: '🛵',
    prestige: 65,
    image: 'images/moto_pcx.jpg'
  },
  {
    id: 'moto_vespa_lx',
    name: 'Vespa LX 125 i-get Classic',
    category: 'Motor',
    type: 'moto',
    price: 45000000,
    icon: '🛵',
    prestige: 80,
    image: 'images/moto_vespa.jpg'
  },
  {
    id: 'moto_vespa',
    name: 'Vespa Primavera 150 i-get ABS',
    category: 'Motor',
    type: 'moto',
    price: 54000000,
    icon: '🛵',
    prestige: 100,
    image: 'images/moto_vespa.jpg'
  },
  {
    id: 'moto_vespa_sprint',
    name: 'Vespa Sprint S 150 TFT Edition',
    category: 'Motor',
    type: 'moto',
    price: 63000000,
    icon: '🛵',
    prestige: 120,
    image: 'images/moto_vespa.jpg'
  },
  {
    id: 'moto_klx',
    name: 'Kawasaki KLX 250 Dual Purpose Enduro',
    category: 'Motor',
    type: 'moto',
    price: 73000000,
    icon: '🏍️',
    prestige: 140,
    image: 'images/moto_klx.jpg'
  },
  {
    id: 'moto_cbr250',
    name: 'Honda CBR250RR SP Quick Shifter',
    category: 'Motor',
    type: 'moto',
    price: 81000000,
    icon: '🏍️',
    prestige: 160,
    image: 'images/moto_cbr250.jpg'
  },
  {
    id: 'moto_ninja',
    name: 'Kawasaki Ninja ZX-25R 4-Silinder Screamer',
    category: 'Motor',
    type: 'moto',
    price: 118000000,
    icon: '🏍️',
    prestige: 220,
    image: 'images/moto_ninja.jpg'
  },
  {
    id: 'moto_vespa_gts',
    name: 'Vespa GTS Super Tech 300 HPE',
    category: 'Motor',
    type: 'moto',
    price: 165000000,
    icon: '🛵',
    prestige: 300,
    image: 'images/moto_vespa_gts.jpg'
  },
  {
    id: 'moto_yamaha_tmax',
    name: 'Yamaha TMAX Tech MAX 560cc Maxi-Scooter',
    category: 'Motor',
    type: 'moto',
    price: 420000000,
    icon: '🛵',
    prestige: 600,
    image: 'images/moto_yamaha_tmax.jpg'
  },
  {
    id: 'moto_harley',
    name: 'Harley-Davidson Fat Boy 114 Milwaukee-Eight',
    category: 'Motor',
    type: 'moto',
    price: 790000000,
    icon: '🏍️',
    prestige: 900,
    image: 'images/moto_harley.jpg'
  },
  {
    id: 'moto_ducati',
    name: 'Ducati Panigale V4 S Superbike',
    category: 'Motor',
    type: 'moto',
    price: 820000000,
    icon: '🏍️',
    prestige: 1000,
    image: 'images/moto_ducati.jpg'
  },
  {
    id: 'moto_bmw_gs',
    name: 'BMW R 1250 GS Adventure Trophy Edition',
    category: 'Motor',
    type: 'moto',
    price: 950000000,
    icon: '🏍️',
    prestige: 1200,
    image: 'images/moto_bmw_gs.jpg'
  },
  {
    id: 'moto_honda_goldwing',
    name: 'Honda Gold Wing Tour 1800cc Dual Clutch',
    category: 'Motor',
    type: 'moto',
    price: 1100000000,
    icon: '🏍️',
    prestige: 1500,
    image: 'images/moto_honda_goldwing.jpg'
  },
  {
    id: 'moto_mv_agusta',
    name: 'MV Agusta Superveloce 800 Serie Oro',
    category: 'Motor',
    type: 'moto',
    price: 1450000000,
    icon: '🏍️',
    prestige: 2000,
    image: 'images/moto_mv_agusta.jpg'
  },
  {
    id: 'moto_ducati_superleggera',
    name: 'Ducati Superleggera V4 Carbon (1 of 500)',
    category: 'Motor',
    type: 'moto',
    price: 3200000000,
    icon: '🏍️',
    prestige: 4000,
    image: 'images/moto_ducati_superleggera.jpg'
  },

  // ==========================================
  // 2. MOBIL (DARI LCGC HINGGA HYPERCAR - 20 ITEMS)
  // ==========================================
  {
    id: 'car_ayla',
    name: 'Daihatsu Ayla 1.0 M City Car',
    category: 'Mobil',
    type: 'car',
    price: 88000000,
    icon: '🚗',
    prestige: 120,
    image: 'images/car_ayla.jpg'
  },
  {
    id: 'car_calya',
    name: 'Toyota Calya 1.2 G MPV Keluarga',
    category: 'Mobil',
    type: 'car',
    price: 175000000,
    icon: '🚗',
    prestige: 240,
    image: 'images/car_calya.jpg'
  },
  {
    id: 'car_brio',
    name: 'Honda Brio RS Sporty Edition',
    category: 'Mobil',
    type: 'car',
    price: 245000000,
    icon: '🚗',
    prestige: 350,
    image: 'images/car_brio.jpg'
  },
  {
    id: 'car_xpander',
    name: 'Mitsubishi Xpander Ultimate CVT',
    category: 'Mobil',
    type: 'car',
    price: 320000000,
    icon: '🚐',
    prestige: 450,
    image: 'images/car_xpander.jpg'
  },
  {
    id: 'car_innova',
    name: 'Toyota Kijang Innova Zenix Hybrid Q',
    category: 'Mobil',
    type: 'car',
    price: 485000000,
    icon: '🚐',
    prestige: 600,
    image: 'images/veh_innova.jpg'
  },
  {
    id: 'car_civic',
    name: 'Honda Civic RS Turbo VTEC',
    category: 'Mobil',
    type: 'car',
    price: 630000000,
    icon: '🏎️',
    prestige: 850,
    image: 'images/car_civic.jpg'
  },
  {
    id: 'car_fortuner',
    name: 'Toyota Fortuner 2.8 GR Sport 4x4',
    category: 'Mobil',
    type: 'car',
    price: 740000000,
    icon: '🚙',
    prestige: 1000,
    image: 'images/car_fortuner.jpg'
  },
  {
    id: 'car_hyundai_ioniq5',
    name: 'Hyundai IONIQ 5 EV Signature Long Range',
    category: 'Mobil',
    type: 'car',
    price: 890000000,
    icon: '⚡',
    prestige: 1250,
    image: 'images/veh_ioniq5.jpg'
  },
  {
    id: 'car_alphard',
    name: 'Toyota Alphard 2.5 HEV Executive Lounge',
    category: 'Mobil',
    type: 'car',
    price: 1720000000,
    icon: '👑',
    prestige: 2200,
    image: 'images/veh_alphard.jpg'
  },
  {
    id: 'car_bmw',
    name: 'BMW M4 Competition Coupé M xDrive',
    category: 'Mobil',
    type: 'car',
    price: 2750000000,
    icon: '🏎️',
    prestige: 3200,
    image: 'images/car_bmw.jpg'
  },
  {
    id: 'car_lexus_lm',
    name: 'Lexus LM 350 4-Seater Ultra Luxury',
    category: 'Mobil',
    type: 'car',
    price: 3250000000,
    icon: '👑',
    prestige: 4000,
    image: 'images/car_lexus_lm.jpg'
  },
  {
    id: 'car_gwagon',
    name: 'Mercedes-AMG G63 V8 BiTurbo Stronger Than Time',
    category: 'Mobil',
    type: 'car',
    price: 6800000000,
    icon: '🚙',
    prestige: 6500,
    image: 'images/car_gwagon.jpg'
  },
  {
    id: 'car_porsche',
    name: 'Porsche 911 GT3 RS Weissach Package',
    category: 'Mobil',
    type: 'car',
    price: 8900000000,
    icon: '🏎️',
    prestige: 9000,
    image: 'images/car_porsche.jpg'
  },
  {
    id: 'car_urus',
    name: 'Lamborghini Urus Performante Super SUV',
    category: 'Mobil',
    type: 'car',
    price: 11500000000,
    icon: '🐂',
    prestige: 12500,
    image: 'images/car_urus.jpg'
  },
  {
    id: 'car_ferrari',
    name: 'Ferrari SF90 Stradale Hybrid Assetto Fiorano',
    category: 'Mobil',
    type: 'car',
    price: 18500000000,
    icon: '🐎',
    prestige: 19000,
    image: 'images/car_ferrari.jpg'
  },
  {
    id: 'car_lambo',
    name: 'Lamborghini Revuelto V12 HPEV Flagship',
    category: 'Mobil',
    type: 'car',
    price: 26000000000,
    icon: '🐂',
    prestige: 26000,
    image: 'images/car_lambo.jpg'
  },
  {
    id: 'car_rolls',
    name: 'Rolls-Royce Phantom VIII Extended Starlight',
    category: 'Mobil',
    type: 'car',
    price: 34000000000,
    icon: '👑',
    prestige: 35000,
    image: 'images/car_rolls.jpg'
  },
  {
    id: 'car_pagani',
    name: 'Pagani Huayra Roadster BC V12 Twin-Turbo',
    category: 'Mobil',
    type: 'car',
    price: 65000000000,
    icon: '🚀',
    prestige: 60000,
    image: 'images/car_pagani.jpg'
  },
  {
    id: 'car_bugatti',
    name: 'Bugatti Chiron Super Sport 300+ W16 Quad-Turbo',
    category: 'Mobil',
    type: 'car',
    price: 88000000000,
    icon: '🏁',
    prestige: 85000,
    image: 'images/car_bugatti.jpg'
  },
  {
    id: 'car_koenigsegg',
    name: 'Koenigsegg Jesko Absolut 1.600 HP Hypercar',
    category: 'Mobil',
    type: 'car',
    price: 145000000000,
    icon: '🚀',
    prestige: 140000,
    image: 'images/car_koenigsegg.jpg'
  },

  // ==========================================
  // 3. JAM TANGAN MEWAH (HOROLOGY - 20 ITEMS)
  // ==========================================
  {
    id: 'watch_seiko',
    name: 'Seiko 5 Sports Automatic Diver',
    category: 'Jam Tangan',
    type: 'watch',
    price: 4500000,
    icon: '⌚',
    prestige: 10,
    image: 'images/watch_seiko.jpg'
  },
  {
    id: 'watch_tissot',
    name: 'Tissot PRX Powermatic 80 Blue Waffle',
    category: 'Jam Tangan',
    type: 'watch',
    price: 12000000,
    icon: '⌚',
    prestige: 25,
    image: 'images/watch_tissot.jpg'
  },
  {
    id: 'watch_tag_heuer',
    name: 'TAG Heuer Carrera Calibre 16 Chrono',
    category: 'Jam Tangan',
    type: 'watch',
    price: 45000000,
    icon: '⌚',
    prestige: 80,
    image: 'images/watch_tag_heuer.jpg'
  },
  {
    id: 'watch_tudor',
    name: 'Tudor Black Bay Fifty-Eight Gilt',
    category: 'Jam Tangan',
    type: 'watch',
    price: 68000000,
    icon: '⌚',
    prestige: 120,
    image: 'images/watch_tudor.jpg'
  },
  {
    id: 'watch_breitling',
    name: 'Breitling Navitimer B01 Chronograph 43',
    category: 'Jam Tangan',
    type: 'watch',
    price: 125000000,
    icon: '⌚',
    prestige: 200,
    image: 'images/watch_breitling.jpg'
  },
  {
    id: 'watch_omega_speedmaster',
    name: 'Omega Speedmaster Moonwatch Professional Master Chronometer',
    category: 'Jam Tangan',
    type: 'watch',
    price: 135000000,
    icon: '⌚',
    prestige: 240,
    image: 'images/watch_omega.jpg'
  },
  {
    id: 'watch_cartier',
    name: 'Cartier Santos de Cartier Two-Tone 18K Gold',
    category: 'Jam Tangan',
    type: 'watch',
    price: 190000000,
    icon: '⌚',
    prestige: 320,
    image: 'images/watch_cartier.jpg'
  },
  {
    id: 'watch_rolex',
    name: 'Rolex Submariner Date 18K Yellow Gold',
    category: 'Jam Tangan',
    type: 'watch',
    price: 280000000,
    icon: '⌚',
    prestige: 450,
    image: 'images/watch_rolex.jpg'
  },
  {
    id: 'watch_rolex_daytona',
    name: 'Rolex Cosmograph Daytona Panda Ceramic',
    category: 'Jam Tangan',
    type: 'watch',
    price: 420000000,
    icon: '⌚',
    prestige: 650,
    image: 'images/watch_rolex_daytona.jpg'
  },
  {
    id: 'watch_rolex_daydate',
    name: 'Rolex Day-Date 40 Platinum "President" Ice Blue',
    category: 'Jam Tangan',
    type: 'watch',
    price: 680000000,
    icon: '⌚',
    prestige: 950,
    image: 'images/watch_rolex_daydate.jpg'
  },
  {
    id: 'watch_ap',
    name: 'Audemars Piguet Royal Oak "Jumbo" Extra-Thin',
    category: 'Jam Tangan',
    type: 'watch',
    price: 850000000,
    icon: '⌚',
    prestige: 1200,
    image: 'images/watch_ap.jpg'
  },
  {
    id: 'watch_vacheron',
    name: 'Vacheron Constantin Overseas Dual Time Blue',
    category: 'Jam Tangan',
    type: 'watch',
    price: 980000000,
    icon: '⌚',
    prestige: 1400,
    image: 'images/watch_vacheron.jpg'
  },
  {
    id: 'watch_patek',
    name: 'Patek Philippe Nautilus 5711/1A Blue Dial',
    category: 'Jam Tangan',
    type: 'watch',
    price: 1850000000,
    icon: '⌚',
    prestige: 2500,
    image: 'images/watch_patek.jpg'
  },
  {
    id: 'watch_patek_aquanaut',
    name: 'Patek Philippe Aquanaut Chronograph 5968R Rose Gold',
    category: 'Jam Tangan',
    type: 'watch',
    price: 2200000000,
    icon: '⌚',
    prestige: 3000,
    image: 'images/watch_patek_aquanaut.jpg'
  },
  {
    id: 'watch_ap_chrono',
    name: 'Audemars Piguet Royal Oak Concept Flying Tourbillon',
    category: 'Jam Tangan',
    type: 'watch',
    price: 2900000000,
    icon: '⌚',
    prestige: 4000,
    image: 'images/watch_ap_chrono.jpg'
  },
  {
    id: 'watch_rm',
    name: 'Richard Mille RM 11-03 Flyback Chronograph Titanium',
    category: 'Jam Tangan',
    type: 'watch',
    price: 4900000000,
    icon: '⌚',
    prestige: 6500,
    image: 'images/watch_rm.jpg'
  },
  {
    id: 'watch_jacob_astronomia',
    name: 'Jacob & Co. Astronomia Sky Celestial Triple-Axis Tourbillon',
    category: 'Jam Tangan',
    type: 'watch',
    price: 9500000000,
    icon: '🌌',
    prestige: 12000,
    image: 'images/watch_jacob_astronomia.jpg'
  },
  {
    id: 'watch_rm_bupati',
    name: 'Richard Mille RM 50-03 McLaren F1 Ultralight Graph TPT',
    category: 'Jam Tangan',
    type: 'watch',
    price: 17500000000,
    icon: '🏎️',
    prestige: 22000,
    image: 'images/watch_rm_bupati.jpg'
  },
  {
    id: 'watch_patek_grandmaster',
    name: 'Patek Philippe Grandmaster Chime 6300G 20-Complications',
    category: 'Jam Tangan',
    type: 'watch',
    price: 48000000000,
    icon: '👑',
    prestige: 55000,
    image: 'images/watch_patek_grandmaster.jpg'
  },
  {
    id: 'watch_graff_hallucination',
    name: 'Graff Diamonds Hallucination 110-Carat Rare Gemstones',
    category: 'Jam Tangan',
    type: 'watch',
    price: 120000000000,
    icon: '💎',
    prestige: 130000,
    image: 'images/watch_graff_hallucination.jpg'
  },

  // ==========================================
  // 4. MANSION & HUNIAN PRIBADI MEWAH (20 ITEMS)
  // ==========================================
  {
    id: 'mansion_cluster_bsd',
    name: 'Modern Smart Home BSD City Serpong',
    category: 'Mansion',
    type: 'mansion',
    price: 4200000000,
    icon: '🏡',
    prestige: 4000,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_townhouse_jaksel',
    name: 'Luxury Townhouse Kemang Jakarta Selatan',
    category: 'Mansion',
    type: 'mansion',
    price: 7500000000,
    icon: '🏘️',
    prestige: 7000,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_villa_lembang',
    name: 'Mountain View Resort Villa Lembang Bandung',
    category: 'Mansion',
    type: 'mansion',
    price: 9800000000,
    icon: '⛰️',
    prestige: 9000,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'residence_villa_bali',
    name: 'Villa Hunian Tropis Canggu Bali',
    category: 'Mansion',
    type: 'mansion',
    price: 15000000000,
    icon: '🌴',
    prestige: 14000,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_cliff_uluwatu',
    name: 'Cliffside Oceanfront Villa Uluwatu Bali',
    category: 'Mansion',
    type: 'mansion',
    price: 24000000000,
    icon: '🌊',
    prestige: 22000,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_pondok_indah',
    name: 'Classic Colonial Mega Mansion Pondok Indah',
    category: 'Mansion',
    type: 'mansion',
    price: 28000000000,
    icon: '🏛️',
    prestige: 26000,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'residence_penthouse_scbd',
    name: 'Sky Penthouse SCBD Sudirman Triple-Floor',
    category: 'Mansion',
    type: 'mansion',
    price: 38000000000,
    icon: '🌆',
    prestige: 35000,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_menteng',
    name: 'Heritage Diplomatic Residence Menteng Jakarta',
    category: 'Mansion',
    type: 'mansion',
    price: 65000000000,
    icon: '🏛️',
    prestige: 58000,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_sentosa_cove',
    name: 'Waterfront Ocean Bungalow Sentosa Cove Singapore',
    category: 'Mansion',
    type: 'mansion',
    price: 95000000000,
    icon: '🇸🇬',
    prestige: 85000,
    image: 'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_the_peak_hk',
    name: 'Luxury Sky Villa The Peak Victoria Harbour Hong Kong',
    category: 'Mansion',
    type: 'mansion',
    price: 140000000000,
    icon: '🇭🇰',
    prestige: 125000,
    image: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'residence_beverly_mansion',
    name: 'Grand Mega Mansion Beverly Hills 90210',
    category: 'Mansion',
    type: 'mansion',
    price: 180000000000,
    icon: '🏰',
    prestige: 160000,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_miami_starisland',
    name: 'Biscayne Bay Mega Palace Star Island Miami',
    category: 'Mansion',
    type: 'mansion',
    price: 260000000000,
    icon: '🏖️',
    prestige: 230000,
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_bel_air',
    name: 'Promenade Estate Bel-Air Los Angeles',
    category: 'Mansion',
    type: 'mansion',
    price: 350000000000,
    icon: '🌴',
    prestige: 310000,
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_french_riviera',
    name: 'Villa Ephrussi-Style Estate Saint-Jean-Cap-Ferrat',
    category: 'Mansion',
    type: 'mansion',
    price: 480000000000,
    icon: '🇫🇷',
    prestige: 420000,
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_lake_como',
    name: 'Historic Waterfront Villa Lake Como Italy',
    category: 'Mansion',
    type: 'mansion',
    price: 620000000000,
    icon: '🇮🇹',
    prestige: 550000,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_swiss_alps',
    name: 'Ultra-Luxury Ski Chalet Zermatt Swiss Alps',
    category: 'Mansion',
    type: 'mansion',
    price: 710000000000,
    icon: '🏔️',
    prestige: 630000,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'residence_royal_castle',
    name: 'European Royal Castle & 100-Hectare Vineyard',
    category: 'Mansion',
    type: 'mansion',
    price: 850000000000,
    icon: '👑',
    prestige: 750000,
    image: 'https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_london_kensington',
    name: 'Billionaires Row Mansion Kensington Palace Gardens London',
    category: 'Mansion',
    type: 'mansion',
    price: 1250000000000,
    icon: '🇬🇧',
    prestige: 1100000,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_manhattan_penthouse',
    name: 'Central Park Tower 360-View Penthouse NYC',
    category: 'Mansion',
    type: 'mansion',
    price: 1850000000000,
    icon: '🗽',
    prestige: 1600000,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'mansion_antilia_tower',
    name: 'Private 27-Story Sky Skyscraper Residence',
    category: 'Mansion',
    type: 'mansion',
    price: 4500000000000,
    icon: '🏛️',
    prestige: 4000000,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=80'
  },

  // ==========================================
  // 5. JET & HELIKOPTER VIP (DIRGANTARA - 20 ITEMS)
  // ==========================================
  {
    id: 'heli_robinson_r44',
    name: 'Helikopter Robinson R44 Raven II',
    category: 'Jet & Heli',
    type: 'flight',
    price: 9500000000,
    icon: '🚁',
    prestige: 8000,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'heli_bell_505',
    name: 'Bell 505 Jet Ranger X Turboshaft',
    category: 'Jet & Heli',
    type: 'flight',
    price: 28000000000,
    icon: '🚁',
    prestige: 25000,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'heli_eurocopter_ec130',
    name: 'Airbus EC130 Fenestron Quiet Flight VIP',
    category: 'Jet & Heli',
    type: 'flight',
    price: 48000000000,
    icon: '🚁',
    prestige: 42000,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_cirrus_vision',
    name: 'Cirrus Vision SF50 Personal Single-Engine Jet',
    category: 'Jet & Heli',
    type: 'flight',
    price: 52000000000,
    icon: '✈️',
    prestige: 46000,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'heli_agusta_aw109',
    name: 'Leonardo AW109 GrandNew Twin-Engine VIP',
    category: 'Jet & Heli',
    type: 'flight',
    price: 85000000000,
    icon: '🚁',
    prestige: 75000,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'heli_bell_429',
    name: 'Bell 429 GlobalRanger Executive Transport',
    category: 'Jet & Heli',
    type: 'flight',
    price: 120000000000,
    icon: '🚁',
    prestige: 105000,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'heli_airbus',
    name: 'Helikopter Airbus H145 VIP Twin-Turbine Helionix',
    category: 'Jet & Heli',
    type: 'flight',
    price: 165000000000,
    icon: '🚁',
    prestige: 150000,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_pilatus_pc24',
    name: 'Pilatus PC-24 Super Versatile Jet',
    category: 'Jet & Heli',
    type: 'flight',
    price: 175000000000,
    icon: '✈️',
    prestige: 160000,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'heli_sikorsky_s76',
    name: 'Sikorsky S-76D Presidential Luxury Transport',
    category: 'Jet & Heli',
    type: 'flight',
    price: 220000000000,
    icon: '🚁',
    prestige: 195000,
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_embraer_phenom300',
    name: 'Embraer Phenom 300E Best-Selling Light Jet',
    category: 'Jet & Heli',
    type: 'flight',
    price: 240000000000,
    icon: '✈️',
    prestige: 215000,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_cessna',
    name: 'Cessna Citation Longitude Super Mid-Size Jet',
    category: 'Jet & Heli',
    type: 'flight',
    price: 460000000000,
    icon: '✈️',
    prestige: 420000,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_bombardier_challenger',
    name: 'Bombardier Challenger 3500 Executive Cabin',
    category: 'Jet & Heli',
    type: 'flight',
    price: 580000000000,
    icon: '✈️',
    prestige: 520000,
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4eae16e3a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_dassault_falcon8x',
    name: 'Dassault Falcon 8X Trijet Ultra-Long Range',
    category: 'Jet & Heli',
    type: 'flight',
    price: 890000000000,
    icon: '✈️',
    prestige: 780000,
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4eae16e3a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_bombardier_global7500',
    name: 'Bombardier Global 7500 4-Zone Master Suite Jet',
    category: 'Jet & Heli',
    type: 'flight',
    price: 1150000000000,
    icon: '🛩️',
    prestige: 1000000,
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4eae16e3a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_gulfstream',
    name: 'Private Jet Gulfstream G700 Flagship Luxury',
    category: 'Jet & Heli',
    type: 'flight',
    price: 1250000000000,
    icon: '🛩️',
    prestige: 1100000,
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4eae16e3a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_gulfstream_g800',
    name: 'Gulfstream G800 Mach 0.925 8.000nm Intercontinental',
    category: 'Jet & Heli',
    type: 'flight',
    price: 1380000000000,
    icon: '🛩️',
    prestige: 1200000,
    image: 'https://images.unsplash.com/photo-1519074069444-1ba4eae16e3a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_airbus_acj319',
    name: 'Airbus ACJ319neo Private Corporate Jetliner',
    category: 'Jet & Heli',
    type: 'flight',
    price: 1850000000000,
    icon: '🛫',
    prestige: 1650000,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_boeing_bbj737',
    name: 'Boeing BBJ 737 MAX 8 Private Bedroom & Boardroom',
    category: 'Jet & Heli',
    type: 'flight',
    price: 2200000000000,
    icon: '🛫',
    prestige: 2000000,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_boeing_bbj787',
    name: 'Boeing BBJ 787-8 Dreamliner "Flying Palace" VIP',
    category: 'Jet & Heli',
    type: 'flight',
    price: 4500000000000,
    icon: '👑',
    prestige: 4000000,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'jet_airbus_acj380',
    name: 'Airbus ACJ380 Double-Deck Sovereign State Flagship',
    category: 'Jet & Heli',
    type: 'flight',
    price: 8800000000000,
    icon: '🪐',
    prestige: 8000000,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80'
  },

  // ==========================================
  // 6. YACHT & KAPAL PESIAR (TAB TERPISAH: 'yacht' - 20 ITEMS)
  // ==========================================
  {
    id: 'yacht_axopar_37',
    name: 'Axopar 37 Sun-Top Sports Day Cruiser',
    category: 'Yacht',
    type: 'yacht',
    price: 6500000000,
    icon: '🚤',
    prestige: 5500,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_searay_sundancer',
    name: 'Sea Ray Sundancer 400 Luxury Cabin Cruiser',
    category: 'Yacht',
    type: 'yacht',
    price: 14000000000,
    icon: '🚤',
    prestige: 12000,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_riva_aquarama',
    name: 'Riva Aquarama Special Classic Italian Mahogany',
    category: 'Yacht',
    type: 'yacht',
    price: 28000000000,
    icon: '🚤',
    prestige: 25000,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_azimut_atlantic',
    name: 'Azimut 53 Flybridge Luxury Italian Cruiser',
    category: 'Yacht',
    type: 'yacht',
    price: 38000000000,
    icon: '🛥️',
    prestige: 34000,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_princess_v65',
    name: 'Princess V65 Express British Sports Yacht',
    category: 'Yacht',
    type: 'yacht',
    price: 55000000000,
    icon: '🛥️',
    prestige: 48000,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_ferretti_720',
    name: 'Ferretti Yachts 720 Aerodynamic Masterpiece',
    category: 'Yacht',
    type: 'yacht',
    price: 82000000000,
    icon: '🛥️',
    prestige: 72000,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_pershing_8x',
    name: 'Pershing 8X High-Speed Full-Carbon Motoryacht',
    category: 'Yacht',
    type: 'yacht',
    price: 120000000000,
    icon: '🛥️',
    prestige: 105000,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_sanlorenzo_sx88',
    name: 'Sanlorenzo SX88 Eco-Crossover Open Beach Club',
    category: 'Yacht',
    type: 'yacht',
    price: 150000000000,
    icon: '🛥️',
    prestige: 130000,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_sunseeker',
    name: 'Sunseeker 95ft Luxury Motor Yacht',
    category: 'Yacht',
    type: 'yacht',
    price: 210000000000,
    icon: '🚤',
    prestige: 190000,
    image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_benetti_oasisl',
    name: 'Benetti Oasis 40M Infinity Pool Superyacht',
    category: 'Yacht',
    type: 'yacht',
    price: 420000000000,
    icon: '🛥️',
    prestige: 380000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_heesen_50m',
    name: 'Heesen 50M Fast Aluminum Semi-Displacement Yacht',
    category: 'Yacht',
    type: 'yacht',
    price: 680000000000,
    icon: '🛥️',
    prestige: 600000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_fipa_ab145',
    name: 'AB Yachts 145 Superfast Hydrojet (42 Knots)',
    category: 'Yacht',
    type: 'yacht',
    price: 850000000000,
    icon: '🛥️',
    prestige: 750000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_amels_60',
    name: 'Amels 60 Limited Editions Hybrid Superyacht',
    category: 'Yacht',
    type: 'yacht',
    price: 1250000000000,
    icon: '🛥️',
    prestige: 1100000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_feadship_70m',
    name: 'Feadship 75-Meter Custom Dutch Master Superyacht',
    category: 'Yacht',
    type: 'yacht',
    price: 1950000000000,
    icon: '🛥️',
    prestige: 1700000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_oceanco_90m',
    name: 'Oceanco 90-Meter Transatlantic Helideck Yacht',
    category: 'Yacht',
    type: 'yacht',
    price: 2800000000000,
    icon: '🛥️',
    prestige: 2400000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'superyacht_100m',
    name: 'Megayacht 110 Meter Dual Helipad & Beach Club',
    category: 'Yacht',
    type: 'yacht',
    price: 3900000000000,
    icon: '🛥️',
    prestige: 3400000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_lurssen_flying_fox',
    name: 'Lürssen 136M "Flying Fox" Cryo-Sauna Explorer Megayacht',
    category: 'Yacht',
    type: 'yacht',
    price: 6200000000000,
    icon: '🚢',
    prestige: 5400000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_rev_ocean',
    name: 'REV Ocean 183M Polar Research & Luxury Giga Yacht',
    category: 'Yacht',
    type: 'yacht',
    price: 8500000000000,
    icon: '🚢',
    prestige: 7500000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_eclipse',
    name: 'Megayacht "Eclipse" Submarine & Laser Defense',
    category: 'Yacht',
    type: 'yacht',
    price: 12000000000000,
    icon: '🛡️',
    prestige: 10500000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'yacht_somnio',
    name: 'Somnio 222-Meter Ultra Luxury Private Yacht Liner',
    category: 'Yacht',
    type: 'yacht',
    price: 18500000000000,
    icon: '👑',
    prestige: 16000000,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500&auto=format&fit=crop&q=80'
  },

  // ==========================================
  // 7. PULAU PRIBADI (TAB TERPISAH: 'island' - 20 ITEMS)
  // ==========================================
  {
    id: 'island_seribu_atol',
    name: 'Karang Atol Tropis Kepulauan Seribu Jakarta',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 35000000000,
    icon: '🏝️',
    prestige: 32000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_belitung_coral',
    name: 'Pulau Batu Granit Eksotis Belitung Timur',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 75000000000,
    icon: '🏝️',
    prestige: 68000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_karimunjawa',
    name: 'Atol Tropis Private Karimunjawa Jawa Tengah',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 140000000000,
    icon: '🏝️',
    prestige: 125000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_mentawai_surf',
    name: 'Pulau Ombak Privat Surf Paradise Mentawai',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 290000000000,
    icon: '🏄',
    prestige: 260000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_anambas',
    name: 'Pulau Laguna Pirus Kepulauan Anambas',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 580000000000,
    icon: '🏝️',
    prestige: 510000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_alor',
    name: 'Pulau Selat Laut Tropis Alor Nusa Tenggara',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 920000000000,
    icon: '🏝️',
    prestige: 800000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_komodo_fringing',
    name: 'Pulau Perawan Teluk Komodo NTT',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 1650000000000,
    icon: '🦎',
    prestige: 1450000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_gili_trawangan_private',
    name: 'Pulau Karang Pasir Putih Utara Lombok Gili',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 2800000000000,
    icon: '🏝️',
    prestige: 2400000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_wakatobi',
    name: 'Pulau Konservasi Terumbu Karang Wakatobi',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 4500000000000,
    icon: '🐠',
    prestige: 3900000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_morotai',
    name: 'Pulau Pasir Putih Bersejarah Morotai Maluku',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 6800000000000,
    icon: '🏝️',
    prestige: 5900000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_fiji_reef',
    name: 'Vatuvara Private Lagoon & Barrier Reef Fiji',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 9500000000000,
    icon: '🌴',
    prestige: 8200000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_maldives_atoll',
    name: 'Baa Atoll Private Island Resort Maldives',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 12500000000000,
    icon: '🏝️',
    prestige: 10800000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'private_island_rajaampat',
    name: 'Gugusan Pulau Karang Eksotis Raja Ampat Papua',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 16000000000000,
    icon: '🏝️',
    prestige: 14000000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_seychelles',
    name: 'Desroches Coral Island Estate Seychelles',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 21000000000000,
    icon: '🌴',
    prestige: 18500000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_polynesia',
    name: 'Motu Tane Private Lagoon French Polynesia',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 28000000000000,
    icon: '🌺',
    prestige: 24500000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_necker',
    name: 'Great Dog Island & Luxury Compound British Virgin Islands',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 36000000000000,
    icon: '🏖️',
    prestige: 31500000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'private_island_bahamas',
    name: 'Kepulauan Privat Bahama Exuma Archipelago',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 45000000000000,
    icon: '🌴',
    prestige: 40000000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_greece_cyclades',
    name: 'Aegean Private Archipelago Island Cyclades Yunani',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 60000000000000,
    icon: '🏛️',
    prestige: 53000000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_hawaii_lanai',
    name: 'Lanai Island Coastline Sanctuary Hawaii',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 85000000000000,
    icon: '🌋',
    prestige: 75000000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80'
  },
  {
    id: 'island_atlantis_sovereignty',
    name: 'Kepulauan Buatan Berdaulat Atlantis Megastructure',
    category: 'Pulau Pribadi',
    type: 'island',
    price: 150000000000000,
    icon: '⚡',
    prestige: 130000000,
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=500&auto=format&fit=crop&q=80'
  }
];

// ==========================================
// 8. MASTER CATALOG KOMODITAS GLOBAL (TRADING LONG / SHORT)
// ==========================================
const COMMODITIES_CATALOG = [
  {
    id: 'gold',
    name: 'Emas Murni (XAU)',
    symbol: 'GOLD',
    icon: '🥇',
    unit: 'troy oz',
    basePrice: 42000000, // Rp 42.000.000 / troy oz (~$2.650)
    volatility: 0.025,
    desc: 'Instrumen safe-haven terpopuler dunia. Lindung nilai terhadap inflasi & ketidakpastian pasar.'
  },
  {
    id: 'oil',
    name: 'Minyak Mentah Brent',
    symbol: 'BRENT',
    icon: '🛢️',
    unit: 'barrel',
    basePrice: 1250000, // Rp 1.250.000 / barel (~$78)
    volatility: 0.045,
    desc: 'Komoditas energi utama pendorong industri dunia. Sangat dipengaruhi tensi geopolitik & OPEC+.'
  },
  {
    id: 'gas',
    name: 'Gas Alam (Natural Gas)',
    symbol: 'NATGAS',
    icon: '🔥',
    unit: 'MMBtu',
    basePrice: 450000, // Rp 450.000 / MMBtu
    volatility: 0.065,
    desc: 'Bahan bakar pembangkit listrik & pemanas global dengan fluktuasi cuaca & musim yang tajam.'
  },
  {
    id: 'silver',
    name: 'Perak Murni (XAG)',
    symbol: 'SILVER',
    icon: '🥈',
    unit: 'kg',
    basePrice: 16500000, // Rp 16.500.000 / kg
    volatility: 0.035,
    desc: 'Logam mulia sekaligus bahan baku vital panel surya, elektronika, dan industri kendaraan listrik.'
  },
  {
    id: 'copper',
    name: 'Tembaga Industri',
    symbol: 'COPPER',
    icon: '🥉',
    unit: 'ton',
    basePrice: 145000000, // Rp 145.000.000 / ton
    volatility: 0.038,
    desc: '"Doctor Copper" barometer utama pertumbuhan manufaktur, jaringan listrik, dan infrastruktur dunia.'
  },
  {
    id: 'cpo',
    name: 'Minyak Kelapa Sawit (CPO)',
    symbol: 'CPO',
    icon: '🌴',
    unit: 'ton',
    basePrice: 15500000, // Rp 15.500.000 / ton
    volatility: 0.040,
    desc: 'Komoditas ekspor andalan Indonesia untuk kebutuhan pangan nabati, oleokimia & program biodiesel.'
  },
  {
    id: 'coffee',
    name: 'Kopi Robusta & Arabika',
    symbol: 'COFFEE',
    icon: '☕',
    unit: 'ton',
    basePrice: 68000000, // Rp 68.000.000 / ton
    volatility: 0.050,
    desc: 'Komoditas perkebunan paling aktif diperdagangkan di bursa berjangka komoditas internasional.'
  },
  {
    id: 'wheat',
    name: 'Gandum Pangan (Wheat)',
    symbol: 'WHEAT',
    icon: '🌾',
    unit: 'bushel',
    basePrice: 95000, // Rp 95.000 / bushel
    volatility: 0.042,
    desc: 'Komoditas pangan pokok strategis dunia. Sangat rentan terhadap gangguan cuaca ekstrem dan rantai pasok.'
  }
];


// ==========================================
// COLLECTIONS_CATALOG & RESIDENCE_TIERS
// ==========================================
const RESIDENCE_TIERS = [
  {
    "level": 1,
    "name": "Studio Penthouse Sudirman",
    "price": 2500000000,
    "prestige": 100,
    "icon": "🏢"
  },
  {
    "level": 2,
    "name": "Luxury Townhouse Menteng",
    "price": 12000000000,
    "prestige": 350,
    "icon": "🏡"
  },
  {
    "level": 3,
    "name": "Cliffside Villa Uluwatu Bali",
    "price": 35000000000,
    "prestige": 850,
    "icon": "🏖️"
  },
  {
    "level": 4,
    "name": "Modern Minimalist Pondok Indah",
    "price": 85000000000,
    "prestige": 2200,
    "icon": "🏠"
  },
  {
    "level": 5,
    "name": "Mediterranean Estate Sentosa Cove",
    "price": 250000000000,
    "prestige": 6000,
    "icon": "🏰"
  },
  {
    "level": 6,
    "name": "French Riviera Coastal Chateau",
    "price": 850000000000,
    "prestige": 15000,
    "icon": "🏛️"
  },
  {
    "level": 7,
    "name": "Neo-Classical Palace Jakarta",
    "price": 4300000000000,
    "prestige": 50000,
    "icon": "👑"
  },
  {
    "level": 8,
    "name": "Royal Sovereign Island Estate",
    "price": 15000000000000,
    "prestige": 150000,
    "icon": "🏝️"
  }
];

const COLLECTIONS_CATALOG = {
  "coins": [
    {
      "id": "coin_1",
      "name": "Koin Emas Dinasti Lydian Lion",
      "price": 450000000,
      "prestige": 120,
      "icon": "🪙"
    },
    {
      "id": "coin_2",
      "name": "Tetradrachm Athena Kuno",
      "price": 750000000,
      "prestige": 200,
      "icon": "🪙"
    },
    {
      "id": "coin_3",
      "name": "Aureus Julius Caesar 44 SM",
      "price": 1250000000,
      "prestige": 350,
      "icon": "🪙"
    },
    {
      "id": "coin_4",
      "name": "Solidus Byzantium Emas",
      "price": 1850000000,
      "prestige": 500,
      "icon": "🪙"
    },
    {
      "id": "coin_5",
      "name": "Dinar Emas Kekhalifahan Umayyah",
      "price": 2900000000,
      "prestige": 750,
      "icon": "🪙"
    },
    {
      "id": "coin_6",
      "name": "Koin Emas Majapahit Gobog",
      "price": 4200000000,
      "prestige": 1100,
      "icon": "🪙"
    },
    {
      "id": "coin_7",
      "name": "Florin Emas Edward III 1344",
      "price": 6800000000,
      "prestige": 1800,
      "icon": "🪙"
    },
    {
      "id": "coin_8",
      "name": "Koin Emas Ducat Venesia",
      "price": 9500000000,
      "prestige": 2500,
      "icon": "🪙"
    },
    {
      "id": "coin_9",
      "name": "Spanish Eight Reales Doubloon",
      "price": 14000000000,
      "prestige": 3600,
      "icon": "🪙"
    },
    {
      "id": "coin_10",
      "name": "Brasher Doubloon Emas 1787",
      "price": 22000000000,
      "prestige": 5500,
      "icon": "🪙"
    },
    {
      "id": "coin_11",
      "name": "1794 Flowing Hair Silver Dollar",
      "price": 35000000000,
      "prestige": 8500,
      "icon": "🪙"
    },
    {
      "id": "coin_12",
      "name": "1804 Draped Bust Silver Dollar",
      "price": 50000000000,
      "prestige": 12500,
      "icon": "🪙"
    },
    {
      "id": "coin_13",
      "name": "1849 Double Eagle Proof Pattern",
      "price": 75000000000,
      "prestige": 18000,
      "icon": "🪙"
    },
    {
      "id": "coin_14",
      "name": "1907 Saint-Gaudens Ultra High Relief",
      "price": 110000000000,
      "prestige": 26000,
      "icon": "🪙"
    },
    {
      "id": "coin_15",
      "name": "1913 Liberty Head Nickel",
      "price": 160000000000,
      "prestige": 38000,
      "icon": "🪙"
    },
    {
      "id": "coin_16",
      "name": "1933 Saint-Gaudens Double Eagle",
      "price": 240000000000,
      "prestige": 55000,
      "icon": "🪙"
    },
    {
      "id": "coin_17",
      "name": "1343 Double Leopard Emas Inggris",
      "price": 350000000000,
      "prestige": 80000,
      "icon": "🪙"
    },
    {
      "id": "coin_18",
      "name": "Koin Emas Ratu Victoria Una and the Lion",
      "price": 520000000000,
      "prestige": 115000,
      "icon": "🪙"
    },
    {
      "id": "coin_19",
      "name": "Koin Emas Kekaisaran Romawi Septimius Severus",
      "price": 780000000000,
      "prestige": 170000,
      "icon": "🪙"
    },
    {
      "id": "coin_20",
      "name": "Koin Emas Kuno Terlangka Di Dunia (Unique)",
      "price": 1200000000000,
      "prestige": 250000,
      "icon": "🪙"
    }
  ],
  "paintings": [
    {
      "id": "paint_1",
      "name": "Sketsa Klasik Leonardo da Vinci",
      "price": 650000000,
      "prestige": 150,
      "icon": "🎨"
    },
    {
      "id": "paint_2",
      "name": "Karya Lanskap Rembrandt",
      "price": 1200000000,
      "prestige": 300,
      "icon": "🎨"
    },
    {
      "id": "paint_3",
      "name": "Potret Claude Monet Nymphéas",
      "price": 2500000000,
      "prestige": 600,
      "icon": "🎨"
    },
    {
      "id": "paint_4",
      "name": "Lukisan Raden Saleh Penangkapan Diponegoro",
      "price": 4500000000,
      "prestige": 1100,
      "icon": "🎨"
    },
    {
      "id": "paint_5",
      "name": "Lanskap Vincent van Gogh Sunflowers",
      "price": 8000000000,
      "prestige": 1900,
      "icon": "🎨"
    },
    {
      "id": "paint_6",
      "name": "The Starry Night - Van Gogh",
      "price": 15000000000,
      "prestige": 3500,
      "icon": "🎨"
    },
    {
      "id": "paint_7",
      "name": "The Scream - Edvard Munch",
      "price": 25000000000,
      "prestige": 5800,
      "icon": "🎨"
    },
    {
      "id": "paint_8",
      "name": "Girl with a Pearl Earring - Vermeer",
      "price": 40000000000,
      "prestige": 9000,
      "icon": "🎨"
    },
    {
      "id": "paint_9",
      "name": "The Kiss - Gustav Klimt",
      "price": 65000000000,
      "prestige": 14500,
      "icon": "🎨"
    },
    {
      "id": "paint_10",
      "name": "The Night Watch - Rembrandt",
      "price": 95000000000,
      "prestige": 21000,
      "icon": "🎨"
    },
    {
      "id": "paint_11",
      "name": "The Birth of Venus - Botticelli",
      "price": 140000000000,
      "prestige": 30000,
      "icon": "🎨"
    },
    {
      "id": "paint_12",
      "name": "Las Meninas - Diego Velázquez",
      "price": 200000000000,
      "prestige": 42000,
      "icon": "🎨"
    },
    {
      "id": "paint_13",
      "name": "Guernica - Pablo Picasso",
      "price": 280000000000,
      "prestige": 58000,
      "icon": "🎨"
    },
    {
      "id": "paint_14",
      "name": "The Persistence of Memory - Salvador Dalí",
      "price": 380000000000,
      "prestige": 78000,
      "icon": "🎨"
    },
    {
      "id": "paint_15",
      "name": "Water Lilies Grand Mural - Monet",
      "price": 500000000000,
      "prestige": 105000,
      "icon": "🎨"
    },
    {
      "id": "paint_16",
      "name": "The Last Supper Study - Da Vinci",
      "price": 680000000000,
      "prestige": 140000,
      "icon": "🎨"
    },
    {
      "id": "paint_17",
      "name": "Creation of Adam Original - Michelangelo",
      "price": 900000000000,
      "prestige": 185000,
      "icon": "🎨"
    },
    {
      "id": "paint_18",
      "name": "Les Femmes d Alger - Picasso",
      "price": 1200000000000,
      "prestige": 240000,
      "icon": "🎨"
    },
    {
      "id": "paint_19",
      "name": "Salvator Mundi - Leonardo da Vinci",
      "price": 1600000000000,
      "prestige": 320000,
      "icon": "🎨"
    },
    {
      "id": "paint_20",
      "name": "Mona Lisa Masterpiece Original - Da Vinci",
      "price": 2500000000000,
      "prestige": 500000,
      "icon": "🎨"
    },
    {
      "id": "paint_21",
      "name": "Impression, Sunrise - Claude Monet",
      "price": 3500000000000,
      "prestige": 680000,
      "icon": "🎨"
    },
    {
      "id": "paint_22",
      "name": "American Gothic - Grant Wood",
      "price": 4800000000000,
      "prestige": 900000,
      "icon": "🎨"
    },
    {
      "id": "paint_23",
      "name": "Wanderer above the Sea of Fog - Friedrich",
      "price": 6500000000000,
      "prestige": 1200000,
      "icon": "🎨"
    },
    {
      "id": "paint_24",
      "name": "Whistler Mother - James McNeill",
      "price": 8500000000000,
      "prestige": 1600000,
      "icon": "🎨"
    },
    {
      "id": "paint_25",
      "name": "The School of Athens Full Fresco - Raphael",
      "price": 12000000000000,
      "prestige": 2200000,
      "icon": "🎨"
    }
  ],
  "unique": [
    {
      "id": "uniq_1",
      "name": "Mesin Asli Pesawat Wright Flyer 1903",
      "price": 45000000000,
      "prestige": 12000,
      "icon": "🔖"
    },
    {
      "id": "uniq_2",
      "name": "Salinan Manuskrip Asli Magna Carta 1215",
      "price": 120000000000,
      "prestige": 35000,
      "icon": "🔖"
    },
    {
      "id": "uniq_3",
      "name": "Buku Catatan Codex Leicester Leonardo Da Vinci",
      "price": 350000000000,
      "prestige": 95000,
      "icon": "🔖"
    },
    {
      "id": "uniq_4",
      "name": "Telur Emas Musim Dingin Kekaisaran Fabergé",
      "price": 850000000000,
      "prestige": 220000,
      "icon": "🔖"
    },
    {
      "id": "uniq_5",
      "name": "Topeng Emas Firaun Tutankhamun Sejati",
      "price": 2500000000000,
      "prestige": 650000,
      "icon": "🔖"
    }
  ],
  "retro_cars": [
    {
      "id": "retro_1",
      "name": "1957 Chevrolet Bel Air Nomad",
      "price": 1200000000,
      "prestige": 280,
      "icon": "🚗"
    },
    {
      "id": "retro_2",
      "name": "1967 Volkswagen Beetle Klasik Mint",
      "price": 1800000000,
      "prestige": 420,
      "icon": "🚗"
    },
    {
      "id": "retro_3",
      "name": "1959 Cadillac Eldorado Biarritz",
      "price": 2900000000,
      "prestige": 680,
      "icon": "🚗"
    },
    {
      "id": "retro_4",
      "name": "1964 Lincoln Continental Convertible",
      "price": 4500000000,
      "prestige": 1050,
      "icon": "🚗"
    },
    {
      "id": "retro_5",
      "name": "1968 Dodge Charger R/T 426 Hemi",
      "price": 7200000000,
      "prestige": 1650,
      "icon": "🚗"
    },
    {
      "id": "retro_6",
      "name": "1970 Plymouth Hemi Cuda Convertible",
      "price": 11000000000,
      "prestige": 2500,
      "icon": "🚗"
    },
    {
      "id": "retro_7",
      "name": "1969 Chevrolet Camaro ZL1",
      "price": 16500000000,
      "prestige": 3800,
      "icon": "🚗"
    },
    {
      "id": "retro_8",
      "name": "1967 Ford Mustang Shelby GT500 Eleonor",
      "price": 24000000000,
      "prestige": 5500,
      "icon": "🚗"
    },
    {
      "id": "retro_9",
      "name": "1963 Porsche 356C Carrera 2",
      "price": 36000000000,
      "prestige": 8200,
      "icon": "🚗"
    },
    {
      "id": "retro_10",
      "name": "1973 Porsche 911 Carrera RS 2.7",
      "price": 55000000000,
      "prestige": 12500,
      "icon": "🚗"
    },
    {
      "id": "retro_11",
      "name": "1961 Jaguar E-Type Series 1 Roadster",
      "price": 82000000000,
      "prestige": 18500,
      "icon": "🚗"
    },
    {
      "id": "retro_12",
      "name": "1965 Shelby 427 Cobra Original",
      "price": 125000000000,
      "prestige": 28000,
      "icon": "🚗"
    },
    {
      "id": "retro_13",
      "name": "1955 Mercedes-Benz 300 SL Gullwing",
      "price": 190000000000,
      "prestige": 42000,
      "icon": "🚗"
    },
    {
      "id": "retro_14",
      "name": "1964 Aston Martin DB5 Silver Birch",
      "price": 280000000000,
      "prestige": 60000,
      "icon": "🚗"
    },
    {
      "id": "retro_15",
      "name": "1967 Ferrari 275 GTB/4 NART Spider",
      "price": 420000000000,
      "prestige": 88000,
      "icon": "🚗"
    },
    {
      "id": "retro_16",
      "name": "1971 Lamborghini Miura SV",
      "price": 620000000000,
      "prestige": 130000,
      "icon": "🚗"
    },
    {
      "id": "retro_17",
      "name": "1937 Bugatti Type 57SC Atalante",
      "price": 920000000000,
      "prestige": 190000,
      "icon": "🚗"
    },
    {
      "id": "retro_18",
      "name": "1956 Aston Martin DBR1 Le Mans",
      "price": 1350000000000,
      "prestige": 280000,
      "icon": "🚗"
    },
    {
      "id": "retro_19",
      "name": "1962 Ferrari 250 GTO Scaglietti",
      "price": 2100000000000,
      "prestige": 420000,
      "icon": "🚗"
    },
    {
      "id": "retro_20",
      "name": "1955 Mercedes-Benz 300 SLR Uhlenhaut",
      "price": 3500000000000,
      "prestige": 700000,
      "icon": "🚗"
    }
  ],
  "stamps": [
    {
      "id": "stmp_1",
      "name": "Perangko Batavia Hindia Belanda 1864",
      "price": 350000000,
      "prestige": 90,
      "icon": "📮"
    },
    {
      "id": "stmp_2",
      "name": "Perangko Penny Black Inggris 1840",
      "price": 680000000,
      "prestige": 175,
      "icon": "📮"
    },
    {
      "id": "stmp_3",
      "name": "Two Penny Blue 1840 Cetakan Pertama",
      "price": 1200000000,
      "prestige": 310,
      "icon": "📮"
    },
    {
      "id": "stmp_4",
      "name": "Perangko Basel Dove Swiss 1845",
      "price": 2100000000,
      "prestige": 540,
      "icon": "📮"
    },
    {
      "id": "stmp_5",
      "name": "Perangko Bull Eye Brasil 1843",
      "price": 3600000000,
      "prestige": 920,
      "icon": "📮"
    },
    {
      "id": "stmp_6",
      "name": "Perangko Mauritius Two Pence 1847",
      "price": 6200000000,
      "prestige": 1600,
      "icon": "📮"
    },
    {
      "id": "stmp_7",
      "name": "1851 Hawaiian Missionaries Stamp",
      "price": 10500000000,
      "prestige": 2700,
      "icon": "📮"
    },
    {
      "id": "stmp_8",
      "name": "1857 Canada 12d Black Queen Victoria",
      "price": 17500000000,
      "prestige": 4400,
      "icon": "📮"
    },
    {
      "id": "stmp_9",
      "name": "1868 Benjamin Franklin 1c Z-Grill",
      "price": 29000000000,
      "prestige": 7200,
      "icon": "📮"
    },
    {
      "id": "stmp_10",
      "name": "1897 Red Revenue Small One Dollar China",
      "price": 48000000000,
      "prestige": 11800,
      "icon": "📮"
    },
    {
      "id": "stmp_11",
      "name": "1918 24c Inverted Jenny Curtiss JN-4",
      "price": 78000000000,
      "prestige": 19000,
      "icon": "📮"
    },
    {
      "id": "stmp_12",
      "name": "1855 Sweden Treskilling Yellow Error",
      "price": 125000000000,
      "prestige": 30000,
      "icon": "📮"
    },
    {
      "id": "stmp_13",
      "name": "1851 Baden 9 Kreuzer Green Error",
      "price": 195000000000,
      "prestige": 47000,
      "icon": "📮"
    },
    {
      "id": "stmp_14",
      "name": "1847 Mauritius One Penny Post Office",
      "price": 310000000000,
      "prestige": 75000,
      "icon": "📮"
    },
    {
      "id": "stmp_15",
      "name": "1856 British Guiana 1c Magenta (Holy Grail)",
      "price": 550000000000,
      "prestige": 130000,
      "icon": "📮"
    }
  ],
  "jewels": [
    {
      "id": "jwl_1",
      "name": "Cincin Safir Biru Ceylon Alami 5 Karat",
      "price": 550000000,
      "prestige": 150,
      "icon": "💎"
    },
    {
      "id": "jwl_2",
      "name": "Gelang Emas Putih Berlian Tiffany & Co.",
      "price": 950000000,
      "prestige": 260,
      "icon": "💎"
    },
    {
      "id": "jwl_3",
      "name": "Kalung Zamrud Kolombia Muzo Hijau Royal",
      "price": 1800000000,
      "prestige": 480,
      "icon": "💎"
    },
    {
      "id": "jwl_4",
      "name": "Rolex Daytona 'Paul Newman' Ref. 6239",
      "price": 3500000000,
      "prestige": 950,
      "icon": "👑",
      "image": "images/watch_rolex_daytona.jpg"
    },
    {
      "id": "jwl_5",
      "name": "Bros Berlian Cartier Art Deco 1920",
      "price": 6200000000,
      "prestige": 1650,
      "icon": "👑"
    },
    {
      "id": "jwl_6",
      "name": "Patek Philippe Nautilus 5711/1R Rose Gold",
      "price": 10500000000,
      "prestige": 2700,
      "icon": "👑",
      "image": "images/watch_patek.jpg"
    },
    {
      "id": "jwl_7",
      "name": "Tiara Mutiara Alami Basra & Berlian Ratu",
      "price": 18000000000,
      "prestige": 4500,
      "icon": "👑"
    },
    {
      "id": "jwl_8",
      "name": "Audemars Piguet Royal Oak Openworked",
      "price": 28000000000,
      "prestige": 7000,
      "icon": "👑",
      "image": "images/watch_ap.jpg"
    },
    {
      "id": "jwl_9",
      "name": "Cincin Berlian Kuning Fancy Vivid 12 Karat",
      "price": 45000000000,
      "prestige": 11000,
      "icon": "💎"
    },
    {
      "id": "jwl_10",
      "name": "Vacheron Constantin Tourbillon Skeleton",
      "price": 72000000000,
      "prestige": 17500,
      "icon": "👑",
      "image": "images/watch_vacheron.jpg"
    },
    {
      "id": "jwl_11",
      "name": "Kalung Rubi Burma 'Pigeon Blood' 15 Karat",
      "price": 115000000000,
      "prestige": 28000,
      "icon": "💎"
    },
    {
      "id": "jwl_12",
      "name": "Richard Mille RM 052 Skull Tourbillon",
      "price": 180000000000,
      "prestige": 43000,
      "icon": "👑",
      "image": "images/watch_rm.jpg"
    },
    {
      "id": "jwl_13",
      "name": "Berlian Biru 'De Beers Cullinan' 15 Karat",
      "price": 280000000000,
      "prestige": 68000,
      "icon": "💎"
    },
    {
      "id": "jwl_14",
      "name": "Jacob & Co. Astronomia Tourbillon Baguette",
      "price": 420000000000,
      "prestige": 100000,
      "icon": "👑",
      "image": "images/watch_jacob_astronomia.jpg"
    },
    {
      "id": "jwl_15",
      "name": "Mahkota Emas Permata Dinasti Bourbon-Parma",
      "price": 650000000000,
      "prestige": 155000,
      "icon": "👑"
    },
    {
      "id": "jwl_16",
      "name": "Patek Philippe Grandmaster Chime 6300G",
      "price": 980000000000,
      "prestige": 230000,
      "icon": "👑",
      "image": "images/watch_patek_grandmaster.jpg"
    },
    {
      "id": "jwl_17",
      "name": "The Pink Star Diamond 59.60 Karat",
      "price": 1450000000000,
      "prestige": 340000,
      "icon": "💎"
    },
    {
      "id": "jwl_18",
      "name": "Graff Diamonds Hallucination 110 Karat",
      "price": 2100000000000,
      "prestige": 500000,
      "icon": "👑",
      "image": "images/watch_graff_hallucination.jpg"
    },
    {
      "id": "jwl_19",
      "name": "Berlian Koh-i-Noor Mahkota Monarki Britania",
      "price": 3200000000000,
      "prestige": 750000,
      "icon": "👑"
    },
    {
      "id": "jwl_20",
      "name": "The Hope Diamond 45.52 Karat & Brankas Abadi",
      "price": 5000000000000,
      "prestige": 1200000,
      "icon": "👑"
    }
  ]
};
