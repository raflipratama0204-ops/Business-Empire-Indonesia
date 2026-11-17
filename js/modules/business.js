// Business Empire: RichMan - Business Management System Module
Object.assign(GameEngine.prototype, {
  showOwnedBusinesses() {
    this.businessView = 'owned';
    const owned = document.getElementById('biz-view-owned');
    const cat = document.getElementById('biz-view-catalog');
    const det = document.getElementById('biz-view-detail');
    if (owned) {
      owned.classList.remove('hidden');
      owned.classList.remove('view-transition');
      void owned.offsetWidth;
      owned.classList.add('view-transition');
    }
    if (cat) cat.classList.add('hidden');
    if (det) det.classList.add('hidden');
    this.renderOwnedBusinesses();
  },

  showBusinessCatalog() {
    this.businessView = 'catalog';
    const owned = document.getElementById('biz-view-owned');
    const cat = document.getElementById('biz-view-catalog');
    const det = document.getElementById('biz-view-detail');
    if (owned) owned.classList.add('hidden');
    if (cat) {
      cat.classList.remove('hidden');
      cat.classList.remove('view-transition');
      void cat.offsetWidth;
      cat.classList.add('view-transition');
    }
    if (det) det.classList.add('hidden');
    this.renderBusinessCatalog();
  },

  showBusinessDetail(instanceId) {
    this.businessView = 'detail';
    if (this.selectedBizId !== instanceId) {
      this.detailSubTab = 'active';
    }
    this.selectedBizId = instanceId;
    const owned = document.getElementById('biz-view-owned');
    const cat = document.getElementById('biz-view-catalog');
    const det = document.getElementById('biz-view-detail');
    if (owned) owned.classList.add('hidden');
    if (cat) cat.classList.add('hidden');
    if (det) {
      det.classList.remove('hidden');
      det.classList.remove('view-transition');
      void det.offsetWidth;
      det.classList.add('view-transition');
    }
    this.renderBusinessDetail(instanceId);
  },

  setDetailSubTab(subTab) {
    this.detailSubTab = subTab;
    window.sound.playClick();
    if (this.selectedBizId) {
      this.renderBusinessDetail(this.selectedBizId);
    }
  },

  openFoundBusinessModal(sectorId, subTypeId = null) {
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === sectorId);
    if (!sector) return;

    this.pendingFoundSectorId = sectorId;
    this.pendingFoundSubtypeId = subTypeId || (sector.hasSubtypes ? sector.subtypes[0].id : null);

    const modal = document.getElementById('found-biz-modal');
    document.getElementById('found-biz-modal-title').innerText = `Dirikan ${sector.name}`;

    const subtypeCont = document.getElementById('found-biz-subtype-container');
    const subtypeList = document.getElementById('found-biz-subtypes-list');

    if (sector.hasSubtypes) {
      subtypeCont.classList.remove('hidden');
      subtypeList.innerHTML = sector.subtypes.map(sub => `
        <label class="flex items-center justify-between p-2.5 rounded-xl border ${this.pendingFoundSubtypeId === sub.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'} cursor-pointer transition">
          <div class="flex items-center gap-2">
            <input type="radio" name="biz_subtype_radio" value="${sub.id}" ${this.pendingFoundSubtypeId === sub.id ? 'checked' : ''} onchange="game.selectSubtype('${sub.id}')" class="text-emerald-500">
            <div>
              <div class="font-bold text-white text-xs">${sub.name}</div>
              <div class="text-[11px] text-slate-400">${sub.desc}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-white text-xs">${this.formatCompact(sub.cost)}</div>
            <div class="text-[11px] text-emerald-400">+${this.formatCompact(sub.revenue)}/jam</div>
          </div>
        </label>
      `).join('');
    } else {
      subtypeCont.classList.add('hidden');
    }

    // Default Name Suggestion
    const defaultName = `${sector.name} ${this.state.businesses.length + 1}`;
    document.getElementById('found-biz-name-input').value = defaultName;

    this.updateFoundModalCostAndRev();
    modal.classList.remove('hidden');
    window.sound.playClick();
  },

  selectSubtype(subId) {
    this.pendingFoundSubtypeId = subId;
    this.updateFoundModalCostAndRev();
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === this.pendingFoundSectorId);
    if (sector && sector.hasSubtypes) {
      const sub = sector.subtypes.find(x => x.id === subId);
      if (sub) {
        document.getElementById('found-biz-name-input').value = `${sub.name}`;
      }
    }
  },

  updateFoundModalCostAndRev() {
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === this.pendingFoundSectorId);
    if (!sector) return;

    let cost = 0;
    let rev = 0;

    if (sector.hasSubtypes && this.pendingFoundSubtypeId) {
      const sub = sector.subtypes.find(x => x.id === this.pendingFoundSubtypeId);
      if (sub) {
        cost = sub.cost;
        rev = sub.revenue;
      }
    } else {
      cost = sector.baseCost || 0;
      rev = sector.baseRevenue || 0;
    }

    document.getElementById('found-biz-cost-display').innerText = this.formatMoney(cost);
    document.getElementById('found-biz-rev-display').innerText = sector.isFleet
      ? 'Tergantung Pembelian Armada'
      : (sector.isBank ? 'Bunga Dinamis' : (sector.isTech ? 'Honor Proyek & Beban Gaji' : (sector.isAirline ? 'Tergantung Rute & Armada' : (sector.isOil ? 'Kontrak Pasokan Migas' : (sector.isMining ? 'Kontrak Suplai Mineral' : `+${this.formatMoney(rev)}/jam`)))));
  },

  closeFoundBizModal() {
    const modal = document.getElementById('found-biz-modal');
    if (modal) modal.classList.add('hidden');
  },

  confirmFoundBusiness() {
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === this.pendingFoundSectorId);
    if (!sector) return;

    let cost = 0;
    let sub = null;
    if (sector.hasSubtypes && this.pendingFoundSubtypeId) {
      sub = sector.subtypes.find(x => x.id === this.pendingFoundSubtypeId);
      cost = sub ? sub.cost : 0;
    } else {
      cost = sector.baseCost || 0;
    }

    if (this.state.cash < cost) {
      window.sound.playError();
      this.showToast('Uang tunai Anda tidak mencukupi untuk mendirikan bisnis ini!', 'error');
      return;
    }

    const nameInput = document.getElementById('found-biz-name-input').value.trim();
    const bizName = nameInput || (sub ? sub.name : sector.name);

    this.state.cash -= cost;

    const newBiz = {
      instanceId: 'biz_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      sectorId: sector.sectorId,
      subTypeId: this.pendingFoundSubtypeId,
      name: bizName,
      level: 1,
      foundedAt: this.state.gameHours,
      parkingCapacity: sector.isFleet ? 10 : (sector.isLogistics ? 8 : 0),
      vehicles: sector.isFleet ? [
        { id: 'v_' + Date.now(), modelId: 'veh_vios', km: 0 }
      ] : [],
      trucks: sector.isLogistics ? [
        { id: 't_' + Date.now(), modelId: 'trk_pickup', km: 0 }
      ] : [],
      warehouseLevel: sector.isLogistics ? 1 : 0,
      warehouseCapacity: sector.isLogistics ? 1 : 0,
      tenants: sector.isLogistics ? ['tenant_umkm'] : [],
      vault: sector.isBank ? (sector.vaultReserves || 2000000000) : 0,
      customerDeposits: sector.isBank ? (sector.initialCustomerDeposits || 1500000000) : 0,
      depositRate: sector.isBank ? (sector.depositRate || 5.0) : 0,
      creditRate: sector.isBank ? (sector.creditRate || 11.5) : 0,
      workstations: sector.isTech ? 15 : 0,
      employees: sector.isTech ? { dev: 4, lead: 1, designer: 4, tester: 2 } : null,
      activeProject: null,
      completedProjectsCount: 0,
      planes: sector.isAirline ? [
        { id: 'plane_' + Date.now(), modelId: 'jet_embraer_195', isGrounded: false }
      ] : [],
      routes: sector.isAirline ? ['route_sin'] : [],
      planeAssignments: sector.isAirline ? {} : null,
      autoMaintenance: sector.isAirline ? true : false,
      routeUnlockInProgress: null,
      facilities: sector.isOil ? [
        { id: 'oil_pumpjack', count: 1 }
      ] : (sector.isMining ? [
        { id: 'mining_excavator_fleet', count: 1 }
      ] : []),
      contracts: (sector.isOil || sector.isMining) ? [] : undefined,
      contractSigningInProgress: null,
      allTimeEarnings: 0,
      tax: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 }
    };

    this.state.businesses.push(newBiz);
    this.closeFoundBizModal();
    window.sound.playUpgrade();
    this.showToast(`Selamat! "${bizName}" resmi didirikan dan beroperasi!`, 'success');
    this.saveGame();
    this.showOwnedBusinesses();
    this.render();
  },

  getBusinessUpgradeCost(biz) {
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
    let baseCost = sector ? (sector.baseCost || 50000000) : 50000000;
    if (sector && sector.hasSubtypes && biz.subTypeId) {
      const sub = sector.subtypes.find(st => st.id === biz.subTypeId);
      if (sub) baseCost = sub.cost;
    }
    return Math.round(baseCost * Math.pow(1.5, biz.level));
  },

  getUpgradeDurationSeconds(biz) {
    if (biz.sectorId === 'fashion') {
      const stage = FASHION_STAGES.find(s => s.level === biz.level + 1);
      if (stage && stage.upgradeDuration) return stage.upgradeDuration;
    }
    if (biz.level === 1) return 20; // 20 detik
    if (biz.level === 2) return 45; // 45 detik
    if (biz.level === 3) return 90; // 1.5 menit
    if (biz.level === 4) return 180; // 3 menit
    if (biz.level === 5) return 300; // 5 menit
    return 600; // 10 menit
  },

  getBankCustomerDeposits(biz) {
    if (typeof biz.customerDeposits === 'number') {
      return Math.round(biz.customerDeposits);
    }
    return 1500000000;
  },

  getBankDepositGrowthRate(biz) {
    const lvl = biz.level || 1;
    const depRate = biz.depositRate || 5.0; // Benchmark suku bunga simpanan perbankan ~4.0%
    const rateMultiplier = Math.max(0.2, Math.min(2.5, depRate / 4.0));
    const baseGrowthByLevel = {
      1: 85000000,       // ~Rp 85 Juta / jam
      2: 280000000,      // ~Rp 280 Juta / jam
      3: 950000000,      // ~Rp 950 Juta / jam
      4: 3200000000,     // ~Rp 3.2 Miliar / jam
      5: 9500000000,     // ~Rp 9.5 Miliar / jam
      6: 28000000000     // ~Rp 28 Miliar / jam
    };
    const baseGrowth = baseGrowthByLevel[lvl] || Math.round(28000000000 * Math.pow(2.2, lvl - 6));
    return Math.round(baseGrowth * rateMultiplier);
  },

  getBankRequiredCustomerDeposits(level) {
    const requirements = {
      1: 5000000000,    // Level 1 -> 2: Butuh Rp 5 Miliar DPK Nasabah
      2: 20000000000,   // Level 2 -> 3: Butuh Rp 20 Miliar DPK Nasabah
      3: 75000000000,   // Level 3 -> 4: Butuh Rp 75 Miliar DPK Nasabah
      4: 250000000000,  // Level 4 -> 5: Butuh Rp 250 Miliar DPK Nasabah
      5: 750000000000,  // Level 5 -> 6: Butuh Rp 750 Miliar DPK Nasabah
      6: 2000000000000  // Level 6 -> 7: Butuh Rp 2 Triliun DPK Nasabah
    };
    return requirements[level] || Math.round(2000000000000 * Math.pow(2.5, level - 6));
  },

  getGarageUpgradeDuration(biz) {
    const isTaxi = biz.sectorId === 'taxi';
    const curCap = biz.parkingCapacity || (isTaxi ? 10 : 8);
    if (isTaxi) {
      return Math.min(300, 25 + Math.floor((curCap - 10) / 5) * 15);
    } else {
      return Math.min(300, 30 + Math.floor((curCap - 8) / 4) * 20);
    }
  },

  upgradeBusinessLevel(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    if (biz.sectorId === 'taxi' || biz.sectorId === 'logistics' || biz.sectorId === 'tech' || biz.sectorId === 'airline' || biz.sectorId === 'oil' || biz.sectorId === 'mining') {
      let msg = 'Pemasukan armada dihitung dari unit kendaraan di Showroom, bukan dari upgrade level bisnis!';
      if (biz.sectorId === 'tech') {
        msg = 'Software house meraih cuan dari honor proyek! Rekrut karyawan & upgrade kantor untuk mengambil proyek besar.';
      } else if (biz.sectorId === 'airline') {
        msg = 'Maskapai berkembang dengan membuka rute penerbangan baru ke berbagai negara & membeli pesawat!';
      } else if (biz.sectorId === 'oil') {
        msg = 'Perusahaan minyak berkembang melalui pemenuhan kontrak pasokan migas dan perluasan fasilitas produksi!';
      } else if (biz.sectorId === 'mining') {
        msg = 'Perusahaan tambang berkembang melalui pemenuhan kontrak pasokan mineral dan pengadaan fasilitas tambang!';
      }
      this.showToast(msg, 'info');
      return;
    }

    if (biz.upgradeInProgress) {
      const remSec = Math.max(0, Math.ceil((biz.upgradeEndTime - Date.now()) / 1000));
      this.showToast(`Proyek ekspansi masih berlangsung! Tersisa ${this.formatDuration(remSec)}.`, 'warning');
      return;
    }

    if (biz.sectorId === 'fashion' && biz.level >= FASHION_STAGES.length) {
      this.showToast('Brand Fashion telah mencapai puncak ekspansi internasional tertinggi (Level 6)!', 'info');
      return;
    }

    // Khusus Bisnis Bank: Syarat Dana Simpanan Nasabah
    if (biz.sectorId === 'bank') {
      const currentDeposits = this.getBankCustomerDeposits(biz);
      const requiredDeposits = this.getBankRequiredCustomerDeposits(biz.level);
      if (currentDeposits < requiredDeposits) {
        window.sound.playError();
        const growthRate = this.getBankDepositGrowthRate(biz);
        this.showToast(`⚠️ Syarat ekspansi bank belum terpenuhi! Bank Anda membutuhkan dana simpanan nasabah minimal ${this.formatMoney(requiredDeposits)} (Saat ini: ${this.formatMoney(currentDeposits)}). Simpanan nasabah bertambah otomatis +${this.formatCompact(growthRate)}/jam. Naikkan suku bunga simpanan agar lebih cepat!`, 'error');
        return;
      }
    }

    const cost = this.getBusinessUpgradeCost(biz);
    if (this.state.cash < cost) {
      window.sound.playError();
      this.showToast(`Uang tunai tidak mencukupi untuk biaya proyek ekspansi! Butuh ${this.formatCompact(cost)}`, 'error');
      return;
    }

    const durationSec = this.getUpgradeDurationSeconds(biz);
    this.state.cash -= cost;
    biz.upgradeInProgress = true;
    biz.upgradeStartTime = Date.now();
    biz.upgradeEndTime = Date.now() + durationSec * 1000;
    biz.upgradeTargetLevel = biz.level + 1;

    window.sound.playUpgrade();
    this.showToast(`Proyek renovasi & ekspansi "${biz.name}" resmi dimulai! Estimasi pengerjaan: ${this.formatDuration(durationSec)}`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  upgradeParkingCapacity(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    if (biz.garageUpgradeInProgress) {
      const remSec = Math.max(0, Math.ceil((biz.garageUpgradeEndTime - Date.now()) / 1000));
      this.showToast(`Proyek perluasan garasi sedang berlangsung! Tersisa ${this.formatDuration(remSec)}.`, 'warning');
      return;
    }

    const isTaxi = biz.sectorId === 'taxi';
    const cost = isTaxi ? 35000000 : 95000000;
    const addedSlots = isTaxi ? 5 : 4;

    if (this.state.cash < cost) {
      window.sound.playError();
      this.showToast(`Uang tunai tidak mencukupi untuk memperluas garasi! Butuh ${this.formatCompact(cost)}`, 'error');
      return;
    }

    const durationSec = this.getGarageUpgradeDuration(biz);
    this.state.cash -= cost;
    biz.garageUpgradeInProgress = true;
    biz.garageUpgradeStartTime = Date.now();
    biz.garageUpgradeEndTime = Date.now() + durationSec * 1000;
    biz.garageUpgradeAddedSlots = addedSlots;
    biz.garageUpgradeTargetCapacity = (biz.parkingCapacity || (isTaxi ? 10 : 8)) + addedSlots;

    window.sound.playUpgrade();
    this.showToast(`Proyek konstruksi garasi "${biz.name}" (+${addedSlots} slot) resmi dimulai! Estimasi: ${this.formatDuration(durationSec)}.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  buyTaxiVehicle(instanceId, modelId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    const currentCount = (biz.vehicles || []).length;
    if (currentCount >= (biz.parkingCapacity || 10)) {
      window.sound.playError();
      this.showToast('Parkiran penuh! Upgrade kapasitas lahan parkir terlebih dahulu.', 'error');
      return;
    }

    const model = TAXI_FLEET_VEHICLES.find(x => x.id === modelId);
    if (!model) return;

    if (this.state.cash < model.cost) {
      window.sound.playError();
      this.showToast('Uang tunai tidak mencukupi untuk membeli armada ini!', 'error');
      return;
    }

    this.state.cash -= model.cost;
    if (!biz.vehicles) biz.vehicles = [];
    biz.vehicles.push({
      id: 'v_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      modelId: model.id,
      km: 0
    });

    window.sound.playCash();
    this.showToast(`Berhasil membeli 1 unit ${model.name}!`, 'success');
    this.saveGame();
    this.render();
    this.renderBusinessDetail(instanceId);
  },

  serviceTaxiVehicle(instanceId, vId) {
    this.showToast('Masa pakai armada kini habis pakai (pensiun otomatis). Silakan beli armada baru di showroom!', 'info');
  },

  sellTaxiVehicle(instanceId, vId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || !biz.vehicles) return;

    const idx = biz.vehicles.findIndex(x => x.id === vId);
    if (idx === -1) return;

    const v = biz.vehicles[idx];
    const model = TAXI_FLEET_VEHICLES.find(x => x.id === v.modelId);
    if (!model) {
      biz.vehicles.splice(idx, 1);
      this.saveGame();
      this.render();
      this.renderBusinessDetail(instanceId);
      return;
    }
    const scrapVal = Math.round(model.cost * 0.35 * Math.max(0.3, 1 - (v.km / model.maxKm)));

    biz.vehicles.splice(idx, 1);
    this.state.cash += scrapVal;
    biz.allTimeEarnings = (biz.allTimeEarnings || 0) + scrapVal;
    window.sound.playCash();
    this.showToast(`Armada ${model.name} dijual seharga ${this.formatCompact(scrapVal)}. 1 slot parkir kosong!`, 'info');
    this.saveGame();
    this.render();
    this.renderBusinessDetail(instanceId);
  },

  buyLogisticsTruck(instanceId, modelId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    const currentCount = (biz.trucks || []).length;
    if (currentCount >= (biz.parkingCapacity || 8)) {
      window.sound.playError();
      this.showToast('Lahan parkir truk penuh! Upgrade kapasitas garasi terlebih dahulu.', 'error');
      return;
    }

    const model = LOGISTICS_FLEET_VEHICLES.find(x => x.id === modelId);
    if (!model) return;

    if (this.state.cash < model.cost) {
      window.sound.playError();
      this.showToast('Uang tunai tidak mencukupi untuk membeli truk ini!', 'error');
      return;
    }

    this.state.cash -= model.cost;
    if (!biz.trucks) biz.trucks = [];
    biz.trucks.push({
      id: 't_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      modelId: model.id,
      km: 0
    });

    window.sound.playCash();
    this.showToast(`Berhasil membeli 1 unit ${model.name}!`, 'success');
    this.saveGame();
    this.render();
    this.renderBusinessDetail(instanceId);
  },

  serviceLogisticsTruck(instanceId, tId) {
    this.showToast('Masa pakai truk kini habis pakai (pensiun otomatis). Silakan beli unit baru di showroom!', 'info');
  },

  sellLogisticsTruck(instanceId, tId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || !biz.trucks) return;

    const idx = biz.trucks.findIndex(x => x.id === tId);
    if (idx === -1) return;

    const t = biz.trucks[idx];
    const model = LOGISTICS_FLEET_VEHICLES.find(x => x.id === t.modelId);
    if (!model) {
      biz.trucks.splice(idx, 1);
      this.saveGame();
      this.render();
      this.renderBusinessDetail(instanceId);
      return;
    }
    const scrapVal = Math.round(model.cost * 0.35 * Math.max(0.3, 1 - (t.km / model.maxKm)));

    biz.trucks.splice(idx, 1);
    this.state.cash += scrapVal;
    biz.allTimeEarnings = (biz.allTimeEarnings || 0) + scrapVal;
    window.sound.playCash();
    this.showToast(`Truk ${model.name} dijual seharga ${this.formatCompact(scrapVal)}!`, 'info');
    this.saveGame();
    this.render();
    this.renderBusinessDetail(instanceId);
  },

  upgradeWarehouse(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    if (biz.warehouseUpgradeInProgress) {
      const remSec = Math.max(0, Math.ceil((biz.warehouseUpgradeEndTime - Date.now()) / 1000));
      this.showToast(`Proyek ekspansi gudang sedang berlangsung! Tersisa ${this.formatDuration(remSec)}.`, 'warning');
      return;
    }

    const curLvl = biz.warehouseLevel || 1;
    if (curLvl >= WAREHOUSE_TIERS.length || curLvl >= 10) {
      this.showToast('Fasilitas & slot gudang telah mencapai tingkat maksimal (Level 10 - 10 Slot Mitra)!', 'info');
      return;
    }

    const nextTier = WAREHOUSE_TIERS.find(t => t.level === curLvl + 1);
    if (!nextTier) return;

    if (this.state.cash < nextTier.upgradeCost) {
      window.sound.playError();
      this.showToast(`Uang tidak cukup untuk ekspansi gudang! Butuh ${this.formatCompact(nextTier.upgradeCost)}`, 'error');
      return;
    }

    const durationSec = nextTier.upgradeDuration || 30;
    this.state.cash -= nextTier.upgradeCost;
    biz.warehouseUpgradeInProgress = true;
    biz.warehouseUpgradeStartTime = Date.now();
    biz.warehouseUpgradeEndTime = Date.now() + durationSec * 1000;
    biz.warehouseUpgradeTargetLevel = curLvl + 1;

    window.sound.playUpgrade();
    this.showToast(`Proyek ekspansi gudang ke Level ${biz.warehouseUpgradeTargetLevel} (+1 Slot: "${nextTier.name}") resmi dimulai! Estimasi pengerjaan: ${this.formatDuration(durationSec)}.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  upgradeWarehouseTier(instanceId) {
    this.upgradeWarehouse(instanceId);
  },

  upgradeWarehouseCapacity(instanceId) {
    this.upgradeWarehouse(instanceId);
  },

  signTenantContract(instanceId, tenantId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    const tenant = LOGISTICS_TENANTS_CATALOG.find(x => x.id === tenantId);
    if (!tenant) return;

    if (!biz.tenants) biz.tenants = [];
    if (biz.tenants.includes(tenantId)) {
      this.showToast('Perusahaan ini sudah menjadi mitra aktif di gudang Anda!', 'info');
      return;
    }

    const curLvl = biz.warehouseLevel || 1;
    if (curLvl < tenant.requiredWarehouseLevel) {
      window.sound.playError();
      this.showToast(`Gudang belum memenuhi standar! Mitra ini mewajibkan Fasilitas Gudang Level ${tenant.requiredWarehouseLevel}. Tingkatkan fasilitas & slot gudang terlebih dahulu!`, 'error');
      return;
    }

    const maxSlots = Math.min(10, Math.max(biz.warehouseCapacity || 1, curLvl));
    if (biz.tenants.length >= maxSlots) {
      window.sound.playError();
      this.showToast(`Kapasitas slot gudang penuh (${biz.tenants.length}/${maxSlots})! Tingkatkan slot gudang untuk bermitra dengan perusahaan baru.`, 'error');
      return;
    }

    if (this.state.cash < tenant.contractFee) {
      window.sound.playError();
      this.showToast('Uang tunai tidak mencukupi untuk biaya persiapan fasilitas & penandatanganan kontrak!', 'error');
      return;
    }

    this.state.cash -= tenant.contractFee;
    biz.tenants.push(tenantId);
    window.sound.playUpgrade();
    this.showToast(`Kontrak kemitraan resmi dimulai dengan "${tenant.name}"! +${this.formatCompact(tenant.hourlyRent)}/jam`, 'success');
    this.saveGame();
    this.render();
    this.renderBusinessDetail(instanceId);
  },

  terminateTenantContract(instanceId, tenantId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || !biz.tenants) return;

    const idx = biz.tenants.indexOf(tenantId);
    if (idx === -1) return;

    biz.tenants.splice(idx, 1);
    window.sound.playClick();
    this.showToast('Kontrak kemitraan diakhiri. Slot gudang telah dibebaskan.', 'info');
    this.saveGame();
    this.render();
    this.renderBusinessDetail(instanceId);
  },

  adjustBankRate(id, type, val) {
    const b = this.state.businesses.find(x => x.instanceId === id);
    if (!b) return;
    if (type === 'deposit') b.depositRate = parseFloat(val);
    if (type === 'credit') b.creditRate = parseFloat(val);
    this.render();
  },

  addVaultCapital(id, amount) {
    const b = this.state.businesses.find(x => x.instanceId === id);
    if (!b) return;
    if (this.state.cash < amount) {
      window.sound.playError();
      this.showToast('Uang tunai tidak mencukupi untuk setor ke brankas bank!', 'error');
      return;
    }
    this.state.cash -= amount;
    b.vault = (b.vault || 0) + amount;
    window.sound.playCash();
    this.showToast(`Berhasil menambah cadangan brankas +${this.formatCompact(amount)}!`, 'success');
    this.render();
  },

  withdrawVaultCapital(id, amount) {
    const b = this.state.businesses.find(x => x.instanceId === id);
    if (!b) return;
    if ((b.vault || 0) < amount) {
      window.sound.playError();
      this.showToast('Cadangan brankas tidak mencukupi!', 'error');
      return;
    }
    b.vault -= amount;
    this.state.cash += amount;
    window.sound.playCash();
    this.showToast(`Berhasil menarik modal brankas ${this.formatCompact(amount)} ke kas tunai!`, 'success');
    this.render();
  },

  openBankModal(id) {
    this.bankDetailId = id;
    const b = this.state.businesses.find(x => x.instanceId === id);
    if (!b) return;

    const modal = document.getElementById('bank-modal');
    if (!modal) return;

    document.getElementById('bank-modal-title').innerText = `Manajemen ${b.name}`;
    document.getElementById('bank-vault-display').innerText = this.formatMoney(b.vault || 0);

    const custDep = this.getBankCustomerDeposits(b);
    const reqDep = this.getBankRequiredCustomerDeposits(b.level);
    const percentDep = Math.min(100, Math.floor((custDep / reqDep) * 100));
    const isReqMet = custDep >= reqDep;

    const custDepEl = document.getElementById('bank-customer-deposits');
    if (custDepEl) custDepEl.innerText = this.formatMoney(custDep);

    const reqDepEl = document.getElementById('bank-required-deposits');
    if (reqDepEl) reqDepEl.innerText = `${this.formatMoney(reqDep)} (Lvl ${b.level + 1})`;

    const percentEl = document.getElementById('bank-dpk-percent');
    if (percentEl) percentEl.innerText = `${percentDep}% ${isReqMet ? '✅ Terpenuhi' : '❌ Belum Terpenuhi'}`;

    const progEl = document.getElementById('bank-dpk-progress');
    if (progEl) {
      progEl.style.width = `${percentDep}%`;
      progEl.className = `h-full ${isReqMet ? 'bg-emerald-400' : 'bg-amber-400'} rounded-full transition-all`;
    }

    const growthRate = this.getBankDepositGrowthRate(b);
    const growthEl = document.getElementById('bank-deposit-growth-rate');
    if (growthEl) {
      growthEl.innerHTML = `<span>Pertumbuhan Otomatis:</span> <span class="font-bold text-blue-400">+${this.formatCompact(growthRate)}/jam</span>`;
    }

    const depSlider = document.getElementById('bank-dep-slider');
    const credSlider = document.getElementById('bank-cred-slider');
    const depVal = document.getElementById('bank-dep-val');
    const credVal = document.getElementById('bank-cred-val');

    depSlider.value = b.depositRate || 5.0;
    credSlider.value = b.creditRate || 11.5;
    depVal.innerText = `${(b.depositRate || 5.0).toFixed(1)}%`;
    credVal.innerText = `${(b.creditRate || 11.5).toFixed(1)}%`;

    const profit = this.calculateBankProfit(b);
    const profitEl = document.getElementById('bank-projected-profit');
    profitEl.innerText = `${profit >= 0 ? '+' : ''}${this.formatMoney(profit)}/jam`;
    profitEl.className = `text-sm font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

    modal.classList.remove('hidden');
  },

  closeBankModal() {
    const modal = document.getElementById('bank-modal');
    if (modal) modal.classList.add('hidden');
    this.saveGame();
    this.render();
  },

  // === FITUR STUDIO GAME & SOFTWARE HOUSE ===

  hireTechEmployee(instanceId, roleId, count = 1) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    if (!biz.employees) biz.employees = { dev: 0, lead: 0, designer: 0, tester: 0 };
    biz.workstations = biz.workstations || 15;

    const totalEmpl = this.getTechTotalEmployees(biz);
    if (totalEmpl + count > biz.workstations) {
      window.sound.playError();
      this.showToast(`Kapasitas workstation tidak cukup! Tersedia ${biz.workstations - totalEmpl} meja kosong. Upgrade kantor untuk menambah workstation.`, 'error');
      return;
    }

    const roleDef = TECH_ROLES.find(r => r.id === roleId);
    if (!roleDef) return;

    const totalCost = roleDef.hireCost * count;
    if (this.state.cash < totalCost) {
      window.sound.playError();
      this.showToast(`Uang tunai tidak cukup untuk rekrutmen ${count} ${roleDef.title}! Butuh ${this.formatCompact(totalCost)}`, 'error');
      return;
    }

    this.state.cash -= totalCost;
    biz.employees[roleId] = (biz.employees[roleId] || 0) + count;
    window.sound.playCash();
    this.showToast(`Berhasil merekrut ${count} ${roleDef.title}! Total sekarang: ${biz.employees[roleId]} orang.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  fireTechEmployee(instanceId, roleId, count = 1) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || !biz.employees) return;

    const currentCount = biz.employees[roleId] || 0;
    if (currentCount < count) {
      this.showToast('Jumlah karyawan tidak mencukupi untuk diberhentikan!', 'error');
      return;
    }

    // Cegah PHK jika proyek yang sedang berjalan membutuhkan peran ini
    if (biz.activeProject && !biz.activeProject.completed) {
      const proj = TECH_PROJECTS_CATALOG.find(p => p.id === biz.activeProject.projectId);
      if (proj && proj.req && (currentCount - count) < (proj.req[roleId] || 0)) {
        window.sound.playError();
        this.showToast(`Tidak dapat mem-PHK karyawan! Proyek "${proj.name}" yang sedang berjalan membutuhkan minimal ${proj.req[roleId]} ${roleId}.`, 'error');
        return;
      }
    }

    biz.employees[roleId] -= count;
    const roleDef = TECH_ROLES.find(r => r.id === roleId);
    window.sound.playClick();
    this.showToast(`${count} ${roleDef ? roleDef.title : roleId} telah diberhentikan. Workstation kini kosong & beban gaji berkurang.`, 'info');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  upgradeOffice(instanceId, officeTypeId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    if (biz.officeUpgradeInProgress) {
      const remSec = Math.max(0, Math.ceil((biz.officeUpgradeEndTime - Date.now()) / 1000));
      this.showToast(`Proyek renovasi kantor sedang berlangsung! Tersisa ${this.formatDuration(remSec)}.`, 'warning');
      return;
    }

    const officeType = TECH_OFFICE_TYPES.find(o => o.id === officeTypeId);
    if (!officeType) return;

    if (this.state.cash < officeType.cost) {
      window.sound.playError();
      this.showToast(`Uang tunai tidak cukup untuk renovasi kantor! Butuh ${this.formatCompact(officeType.cost)}`, 'error');
      return;
    }

    this.state.cash -= officeType.cost;
    biz.officeUpgradeInProgress = true;
    biz.officeUpgradeType = officeTypeId;
    biz.officeUpgradeStartTime = Date.now();
    biz.officeUpgradeEndTime = Date.now() + officeType.durationSeconds * 1000;
    biz.officeUpgradeAddedWorkstations = officeType.addedWorkstations;
    biz.officeUpgradeTargetWorkstations = (biz.workstations || 15) + officeType.addedWorkstations;

    window.sound.playUpgrade();
    this.showToast(`Proyek renovasi "${officeType.name}" dimulai (+${officeType.addedWorkstations} workstation)! Estimasi: ${this.formatDuration(officeType.durationSeconds)}.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  startTechProject(instanceId, projectId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    if (biz.activeProject) {
      if (biz.activeProject.completed) {
        this.showToast('Klaim pembayaran proyek sebelumnya terlebih dahulu sebelum mengambil proyek baru!', 'warning');
      } else {
        const remSec = Math.max(0, Math.ceil((biz.activeProject.endTime - Date.now()) / 1000));
        this.showToast(`Tim sedang mengerjakan proyek lain! Selesai dalam ${this.formatDuration(remSec)}.`, 'warning');
      }
      return;
    }

    const proj = TECH_PROJECTS_CATALOG.find(p => p.id === projectId);
    if (!proj) return;

    if (!biz.employees) biz.employees = { dev: 0, lead: 0, designer: 0, tester: 0 };

    const req = proj.req;
    const missing = [];
    if ((biz.employees.dev || 0) < req.dev) missing.push(`${req.dev - (biz.employees.dev || 0)} Developer`);
    if ((biz.employees.lead || 0) < req.lead) missing.push(`${req.lead - (biz.employees.lead || 0)} Team Lead`);
    if ((biz.employees.designer || 0) < req.designer) missing.push(`${req.designer - (biz.employees.designer || 0)} Designer`);
    if ((biz.employees.tester || 0) < req.tester) missing.push(`${req.tester - (biz.employees.tester || 0)} Tester`);

    if (missing.length > 0) {
      window.sound.playError();
      this.showToast(`Syarat tim belum lengkap! Kurang: ${missing.join(', ')}. Rekrut karyawan di tab Tim Karyawan!`, 'error');
      return;
    }

    biz.activeProject = {
      projectId: proj.id,
      name: proj.name,
      reward: proj.reward,
      startTime: Date.now(),
      endTime: Date.now() + proj.durationSeconds * 1000,
      durationSeconds: proj.durationSeconds,
      completed: false
    };

    window.sound.playClick();
    this.showToast(`🚀 Proyek "${proj.name}" resmi dikerjakan tim! Estimasi selesai: ${this.formatDuration(proj.durationSeconds)}.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  claimTechProject(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || !biz.activeProject) return;

    const now = Date.now();
    if (!biz.activeProject.completed && now < biz.activeProject.endTime) {
      const remSec = Math.max(0, Math.ceil((biz.activeProject.endTime - now) / 1000));
      this.showToast(`Proyek belum selesai! Tim masih bekerja keras (Tersisa ${this.formatDuration(remSec)}).`, 'info');
      return;
    }

    const reward = biz.activeProject.reward;
    const projName = biz.activeProject.name || this.getProjectName(biz.activeProject.projectId);

    this.state.cash += reward;
    this.state.totalEarnedLifetime += reward;
    biz.allTimeEarnings = (biz.allTimeEarnings || 0) + reward;
    if (!this.state.stats) this.state.stats = {};
    this.state.stats.businessEarnings = (this.state.stats.businessEarnings || 0) + reward;
    biz.completedProjectsCount = (biz.completedProjectsCount || 0) + 1;
    biz.activeProject = null;

    window.sound.playCash();
    this.showToast(`🎉 Luar Biasa! Proyek "${projName}" resmi rampung. Honor kontrak ${this.formatMoney(reward)} telah masuk ke rekening kas Anda!`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  getProjectName(projectId) {
    if (typeof TECH_PROJECTS_CATALOG !== 'undefined') {
      const p = TECH_PROJECTS_CATALOG.find(x => x.id === projectId);
      if (p) return p.name;
    }
    return 'Proyek Software';
  },

  // ==========================================
  // METODE BISNIS MASKAPAI PENERBANGAN
  // ==========================================

  buyAirlinePlane(instanceId, modelId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;
    if (typeof AIRLINE_AIRCRAFT_CATALOG === 'undefined') return;

    const model = AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === modelId);
    if (!model) return;

    if (this.state.cash < model.price) {
      window.sound.playError();
      this.showToast(`Uang kas tidak cukup untuk membeli ${model.name}! Butuh ${this.formatMoney(model.price)}`, 'error');
      return;
    }

    this.state.cash -= model.price;
    if (!biz.planes) biz.planes = [];

    const newPlane = {
      id: 'plane_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      modelId: model.id,
      isGrounded: false,
      purchasedAt: Date.now()
    };
    biz.planes.push(newPlane);

    window.sound.playCash();
    this.showToast(`✈️ Berhasil membeli armada pesawat baru: ${model.name}! Siap diterbangkan untuk membuka rute internasional.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  unlockAirlineRoute(instanceId, routeId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;
    if (typeof AIRLINE_ROUTES_CATALOG === 'undefined' || typeof AIRCRAFT_CATEGORIES === 'undefined') return;

    const route = AIRLINE_ROUTES_CATALOG.find(r => r.id === routeId);
    if (!route) return;

    if (!biz.routes) biz.routes = [];
    if (biz.routes.includes(routeId)) {
      this.showToast(`Rute menuju ${route.destination} sudah resmi dibuka dan aktif!`, 'info');
      return;
    }

    if (biz.routeUnlockInProgress) {
      const remSec = Math.max(0, Math.ceil((biz.routeUnlockInProgress.endTime - Date.now()) / 1000));
      this.showToast(`Sedang ada proses izin rute lain (${biz.routeUnlockInProgress.destination})! Tersisa ${this.formatDuration(remSec)}.`, 'warning');
      return;
    }

    const catInfo = AIRCRAFT_CATEGORIES[route.requiredCategory] || { name: route.requiredCategory };

    // Check requirement: Airline must own a plane of this category that is not already occupied by another route
    const planes = biz.planes || [];
    const matchingPlanes = planes.filter(p => {
      const m = AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId);
      return m && m.category === route.requiredCategory;
    });

    if (matchingPlanes.length === 0) {
      window.sound.playError();
      this.showToast(`⚠️ Syarat armada belum terpenuhi! Rute ini memerlukan pesawat tipe ${catInfo.name}. Beli pesawat tersebut di Showroom Armada terlebih dahulu!`, 'error');
      return;
    }

    // Check if player has more open routes of this category than planes of this category
    const usedCount = biz.routes.filter(rId => {
      const r = AIRLINE_ROUTES_CATALOG.find(x => x.id === rId);
      return r && r.requiredCategory === route.requiredCategory;
    }).length;

    if (matchingPlanes.length <= usedCount) {
      window.sound.playError();
      this.showToast(`⚠️ Seluruh armada ${catInfo.name} Anda (${matchingPlanes.length} unit) telah ditugaskan di rute lain! Anda harus membeli 1 unit pesawat ${catInfo.name} tambahan untuk melayani rute ${route.destination}.`, 'error');
      return;
    }

    // Check cash for permit / slot license
    if (this.state.cash < route.unlockCost) {
      window.sound.playError();
      this.showToast(`Uang kas tidak mencukupi untuk biaya izin slot rute penerbangan (${this.formatMoney(route.unlockCost)})!`, 'error');
      return;
    }

    this.state.cash -= route.unlockCost;
    biz.routeUnlockInProgress = {
      routeId: route.id,
      destination: route.destination,
      startTime: Date.now(),
      endTime: Date.now() + (route.durationSeconds * 1000),
      durationSeconds: route.durationSeconds
    };

    window.sound.playClick();
    this.showToast(`🛫 Pengurusan izin rute "${route.destination}" dimulai! Estimasi persetujuan otoritas: ⏱️ ${this.formatDuration(route.durationSeconds)}.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  payAirlineMaintenance(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;
    const stats = this.getAirlineOperatingStats(biz);
    const totalCost = stats.totalMaintenanceCost || 0;

    if (this.state.cash < totalCost) {
      window.sound.playError();
      this.showToast(`Uang kas tidak cukup untuk membayar biaya perawatan armada (${this.formatMoney(totalCost)})!`, 'error');
      return;
    }

    this.state.cash -= totalCost;
    biz.allTimeEarnings = (biz.allTimeEarnings || 0) - totalCost;
    (biz.planes || []).forEach(p => {
      p.isGrounded = false;
    });

    window.sound.playCash();
    this.showToast(`🔧 Seluruh biaya perawatan armada (${this.formatMoney(totalCost)}) berhasil dibayar lunas! Seluruh armada kembali mengudara (Airworthy).`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  toggleAirlineAutoMaintenance(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;

    biz.autoMaintenance = !biz.autoMaintenance;
    window.sound.playClick();
    this.showToast(
      biz.autoMaintenance
        ? '✅ Otomatis Bayar Perawatan diaktifkan (Biaya dipotong per jam saat kas mencukupi).'
        : '⚠️ Otomatis Bayar Perawatan dinonaktifkan (Pesawat akan di-grounded jika perawatan tidak dibayar manual)!',
      'info'
    );
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  assignPlaneToRoute(instanceId, routeId, planeId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;
    if (!biz.planeAssignments) biz.planeAssignments = {};

    biz.planeAssignments[routeId] = planeId;
    window.sound.playClick();
    this.showToast('Penugasan pesawat ke rute berhasil diperbarui!', 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  buyOilFacility(instanceId, facilityId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || (biz.sectorId !== 'oil' && !BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId)?.isOil)) return;

    const fac = OIL_FACILITIES_CATALOG.find(f => f.id === facilityId);
    if (!fac) return;

    if (this.state.cash < fac.cost) {
      window.sound.playError();
      this.showToast(`Saldo kas Anda tidak mencukupi untuk membangun "${fac.name}" (${this.formatMoney(fac.cost)})!`, 'error');
      return;
    }

    this.state.cash -= fac.cost;
    if (!Array.isArray(biz.facilities)) biz.facilities = [];
    const existing = biz.facilities.find(f => f.id === facilityId);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      biz.facilities.push({ id: facilityId, count: 1 });
    }

    window.sound.playUpgrade();
    this.showToast(`🏗️ Fasilitas "${fac.name}" berhasil dibangun! Kapasitas produksi bertambah +${this.formatCompact(fac.oilBblPerHour)} Bbl/j & +${this.formatCompact(fac.gasBoePerHour)} BOE/j.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  signOilContract(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || (biz.sectorId !== 'oil' && !BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId)?.isOil)) return;

    if (biz.contractSigningInProgress) {
      const remSec = Math.max(0, Math.ceil((biz.contractSigningInProgress.endTime - Date.now()) / 1000));
      this.showToast(`Negosiasi kontrak pasokan migas masih berlangsung! Tersisa ${this.formatDuration(remSec)}.`, 'warning');
      return;
    }

    if (!Array.isArray(biz.contracts)) biz.contracts = [];
    const nextIndex = biz.contracts.length;
    if (nextIndex >= OIL_CONTRACTS_CATALOG.length) {
      this.showToast('Seluruh kontrak pasokan migas strategis telah ditandatangani!', 'info');
      return;
    }

    const targetContract = OIL_CONTRACTS_CATALOG[nextIndex];
    const stats = this.getOilProductionStats(biz);

    if (stats.totalOilBblPerHour < targetContract.reqOilBbl || stats.totalGasBoePerHour < targetContract.reqGasBoe) {
      window.sound.playError();
      this.showToast(`⚠️ Kapasitas produksi belum memenuhi kuota minimum kontrak! Butuh ${targetContract.reqOilBbl.toLocaleString('id-ID')} Bbl/j (Saat ini: ${stats.totalOilBblPerHour.toLocaleString('id-ID')}) & ${targetContract.reqGasBoe.toLocaleString('id-ID')} BOE/j (Saat ini: ${stats.totalGasBoePerHour.toLocaleString('id-ID')}). Bangun fasilitas produksi terlebih dahulu!`, 'error');
      return;
    }

    const tenderFee = targetContract.tenderFee !== undefined ? targetContract.tenderFee : (targetContract.cost || 0);
    if (this.state.cash < tenderFee) {
      window.sound.playError();
      this.showToast(`Saldo kas Anda tidak mencukupi untuk biaya tender kontrak (${this.formatMoney(tenderFee)})!`, 'error');
      return;
    }

    this.state.cash -= tenderFee;
    const duration = targetContract.durationSeconds || 300;
    const now = Date.now();
    biz.contractSigningInProgress = {
      contractId: targetContract.id,
      startTime: now,
      duration: duration,
      endTime: now + duration * 1000
    };

    window.sound.playCash();
    this.showToast(`📑 Berkas tender diajukan ke ${targetContract.partner}! Negosiasi & legalisasi kontrak diperkirakan selesai dalam ${this.formatDuration(duration)}.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  buyMiningFacility(instanceId, facilityId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || (biz.sectorId !== 'mining' && !BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId)?.isMining)) return;

    const fac = MINING_FACILITIES_CATALOG.find(f => f.id === facilityId);
    if (!fac) return;

    if (this.state.cash < fac.cost) {
      window.sound.playError();
      this.showToast(`Saldo kas Anda tidak mencukupi untuk pengadaan "${fac.name}" (${this.formatMoney(fac.cost)})!`, 'error');
      return;
    }

    this.state.cash -= fac.cost;
    if (!Array.isArray(biz.facilities)) biz.facilities = [];
    const existing = biz.facilities.find(f => f.id === facilityId);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      biz.facilities.push({ id: facilityId, count: 1 });
    }

    window.sound.playUpgrade();
    this.showToast(`⛏️ Fasilitas "${fac.name}" berhasil dioperasikan! Kapasitas tambang bertambah +${this.formatCompact(fac.nickelTonPerHour)} Ton/j & +${this.formatCompact(fac.goldKgPerHour)} Kg/j.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  },

  signMiningContract(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz || (biz.sectorId !== 'mining' && !BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId)?.isMining)) return;

    if (biz.contractSigningInProgress) {
      const remSec = Math.max(0, Math.ceil((biz.contractSigningInProgress.endTime - Date.now()) / 1000));
      this.showToast(`Negosiasi kontrak pasokan mineral masih berlangsung! Tersisa ${this.formatDuration(remSec)}.`, 'warning');
      return;
    }

    if (!Array.isArray(biz.contracts)) biz.contracts = [];
    const nextIndex = biz.contracts.length;
    if (nextIndex >= MINING_CONTRACTS_CATALOG.length) {
      this.showToast('Seluruh kontrak pasokan mineral strategis telah ditandatangani!', 'info');
      return;
    }

    const targetContract = MINING_CONTRACTS_CATALOG[nextIndex];
    const stats = this.getMiningProductionStats(biz);

    if (stats.totalNickelTonPerHour < targetContract.reqNickelTon || stats.totalGoldKgPerHour < targetContract.reqGoldKg) {
      window.sound.playError();
      this.showToast(`⚠️ Kapasitas produksi belum memenuhi kuota minimum kontrak! Butuh ${targetContract.reqNickelTon.toLocaleString('id-ID')} Ton/j (Saat ini: ${stats.totalNickelTonPerHour.toLocaleString('id-ID')}) & ${targetContract.reqGoldKg.toLocaleString('id-ID')} Kg/j (Saat ini: ${stats.totalGoldKgPerHour.toLocaleString('id-ID')}). Bangun fasilitas tambang terlebih dahulu!`, 'error');
      return;
    }

    const tenderFee = targetContract.tenderFee !== undefined ? targetContract.tenderFee : (targetContract.cost || 0);
    if (this.state.cash < tenderFee) {
      window.sound.playError();
      this.showToast(`Saldo kas Anda tidak mencukupi untuk biaya tender kontrak (${this.formatMoney(tenderFee)})!`, 'error');
      return;
    }

    this.state.cash -= tenderFee;
    const duration = targetContract.durationSeconds || 300;
    const now = Date.now();
    biz.contractSigningInProgress = {
      contractId: targetContract.id,
      startTime: now,
      duration: duration,
      endTime: now + duration * 1000
    };

    window.sound.playCash();
    this.showToast(`📑 Berkas tender diajukan ke ${targetContract.partner}! Negosiasi & klausul suplai diperkirakan selesai dalam ${this.formatDuration(duration)}.`, 'success');
    this.saveGame();
    this.render();
    if (this.businessView === 'detail') this.renderBusinessDetail(instanceId);
  }
});
