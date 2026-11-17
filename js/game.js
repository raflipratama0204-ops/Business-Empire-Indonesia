// Business Empire: RichMan - Core Game Engine (Consolidated Distribution)
// --- BEGIN js/modules/core.js ---
// Business Empire: RichMan - Core Game Engine
class GameEngine {
  constructor() {
    this.state = this.getDefaultState();
    this.stockPrices = {};
    this.cryptoPrices = {};
    this.commodityPrices = {};
    this.stockHistories = {};
    this.cryptoHistories = {};
    this.commodityHistories = {};
    this.activeTab = 'home';
    this.businessView = 'owned'; // 'owned' | 'catalog' | 'detail'
    this.selectedBizId = null;
    this.detailSubTab = 'active'; // 'active' | 'buy' | 'warehouse'
    this.pendingFoundSectorId = null;
    this.pendingFoundSubtypeId = null;
    this.investSubTab = 'stocks';
    this.stockView = 'portfolio'; // 'portfolio' | 'market'
    this.cryptoView = 'portfolio'; // 'portfolio' | 'market'
    this.propertyView = 'portfolio'; // 'portfolio' | 'catalog'
    this.luxuryView = 'owned'; // 'owned' | 'catalog'
    this.realEstateFilter = 'all';
    this.luxuryFilter = 'all';
    this.speed = 1;
    this.subTickTimer = 0;
    this.intervalId = null;
    this.bankDetailId = null;
    this.stockDetailSymbol = null;
    this.cryptoDetailSymbol = null;
    this.commodityDetailSymbol = null;
    this.commodityOrderType = 'LONG'; // 'LONG' | 'SHORT'
    this.commodityOrderLeverage = 5;
  }

  getDefaultState() {
    return {
      cash: GAME_CONFIG.STARTING_CASH,
      clickLevel: 1,
      totalEarnedLifetime: GAME_CONFIG.STARTING_CASH,
      stats: {
        stockTradingProfit: 0,      // Keuntungan trading saham (capital gain)
        cryptoTradingProfit: 0,     // Keuntungan trading kripto (capital gain)
        commodityTradingProfit: 0,  // Keuntungan trading komoditas (Long/Short)
        dividendsEarned: 0,         // Pendapatan dividen saham
        businessEarnings: 0,        // Pendapatan operasional bisnis
        rentalEarnings: 0           // Pendapatan sewa properti
      },
      gameHours: 0,
      businesses: [], // Array of business instances
      stocks: {},     // { [symbol]: { shares: 0, totalCost: 0 } }
      crypto: {},     // { [symbol]: { amount: 0, totalCost: 0 } }
      commodityPositions: [], // [ { id, symbol, type: 'LONG'|'SHORT', entryPrice, margin, leverage, openedAt } ]
      properties: {}, // { [id]: count }
      luxury: [],     // [ id ]
      taxes: {
        business: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 },
        property: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 },
        stocks:   { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 }
      },
      lastSaved: Date.now()
    };
  }

  init() {
    this.initMarkets();
    this.loadGame();
    this.setupEventListeners();
    this.startLoop();
    this.switchTab(this.activeTab);
    this.checkOfflineEarnings();
  }

  initMarkets() {
    STOCKS_CATALOG.forEach(stock => {
      this.stockPrices[stock.symbol] = stock.basePrice;
      this.stockHistories[stock.symbol] = [stock.basePrice];
      for (let i = 0; i < 15; i++) {
        const change = (Math.random() - 0.49) * stock.volatility * stock.basePrice;
        const newP = Math.max(stock.basePrice * 0.4, this.stockHistories[stock.symbol][0] + change);
        this.stockHistories[stock.symbol].unshift(Math.round(newP));
      }
      this.stockPrices[stock.symbol] = this.stockHistories[stock.symbol][this.stockHistories[stock.symbol].length - 1];
    });

    CRYPTO_CATALOG.forEach(coin => {
      this.cryptoPrices[coin.symbol] = coin.basePrice;
      this.cryptoHistories[coin.symbol] = [coin.basePrice];
      for (let i = 0; i < 15; i++) {
        const change = (Math.random() - 0.49) * coin.volatility * coin.basePrice;
        const newP = Math.max(coin.basePrice * 0.2, this.cryptoHistories[coin.symbol][0] + change);
        this.cryptoHistories[coin.symbol].unshift(Math.round(newP));
      }
      this.cryptoPrices[coin.symbol] = this.cryptoHistories[coin.symbol][this.cryptoHistories[coin.symbol].length - 1];
    });

    if (typeof COMMODITIES_CATALOG !== 'undefined') {
      COMMODITIES_CATALOG.forEach(comm => {
        this.commodityPrices[comm.symbol] = comm.basePrice;
        this.commodityHistories[comm.symbol] = [comm.basePrice];
        for (let i = 0; i < 15; i++) {
          const change = (Math.random() - 0.49) * comm.volatility * comm.basePrice;
          const newP = Math.max(comm.basePrice * 0.3, this.commodityHistories[comm.symbol][0] + change);
          this.commodityHistories[comm.symbol].unshift(Math.round(newP));
        }
        this.commodityPrices[comm.symbol] = this.commodityHistories[comm.symbol][this.commodityHistories[comm.symbol].length - 1];
      });
    }
  }

  doClickWork(event) {
    const baseReward = GAME_CONFIG.STARTING_CLICK_REWARD;
    const reward = Math.round(baseReward * Math.pow(1.3, this.state.clickLevel - 1));
    this.state.cash += reward;
    this.state.totalEarnedLifetime += reward;
    window.sound.playCash();

    // Floating text particle above button
    const btn = document.getElementById('hustle-click-btn');
    const appContainer = document.getElementById('app-container');
    if (btn && appContainer) {
      const btnRect = btn.getBoundingClientRect();
      const appRect = appContainer.getBoundingClientRect();
      const floatEl = document.createElement('div');
      floatEl.className = 'floating-click-reward';
      floatEl.innerText = `+${this.formatCompact(reward)}`;
      
      const posX = (btnRect.left + btnRect.width / 2) - appRect.left;
      const posY = btnRect.top - appRect.top - 6;
      floatEl.style.left = `${posX}px`;
      floatEl.style.top = `${posY}px`;

      appContainer.appendChild(floatEl);
      setTimeout(() => floatEl.remove(), 750);
    }

    this.showToast(`Kerja Selesai! +${this.formatCompact(reward)}`, 'success');
    this.renderHeader();
  }

  upgradeClickWork() {
    const cost = Math.round(150000 * Math.pow(1.65, this.state.clickLevel - 1));
    if (this.state.cash < cost) {
      window.sound.playError();
      this.showToast('Uang tidak cukup untuk upgrade keterampilan!', 'error');
      return;
    }
    this.state.cash -= cost;
    this.state.clickLevel += 1;
    window.sound.playUpgrade();
    this.showToast(`Keterampilan Freelance Naik ke Level ${this.state.clickLevel}!`, 'info');
    this.render();
  }

  startLoop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.tick();
    }, GAME_CONFIG.TICK_INTERVAL_MS);
  }

  tick() {
    this.subTickTimer += this.speed;
    this.simulateMarketTick();

    // Cek Penyelesaian Proyek Upgrade Bisnis & Konstruksi Garasi / Gudang (Real-World Timer)
    if (Array.isArray(this.state.businesses)) {
      const now = Date.now();
      let hasCompletedUpgrade = false;
      this.state.businesses.forEach(biz => {
        // 1. Proyek Upgrade Bisnis Umum
        if (biz.upgradeInProgress && now >= biz.upgradeEndTime) {
          biz.upgradeInProgress = false;
          biz.level = biz.upgradeTargetLevel || (biz.level + 1);
          delete biz.upgradeStartTime;
          delete biz.upgradeEndTime;
          delete biz.upgradeTargetLevel;
          hasCompletedUpgrade = true;

          window.sound.playUpgrade();
          this.showToast(`🎉 Proyek ekspansi "${biz.name}" selesai! Kini resmi beroperasi di Level ${biz.level}!`, 'success');
        }

        // 2. Proyek Perluasan Garasi Armada (Taksi & Logistik)
        if (biz.garageUpgradeInProgress && now >= biz.garageUpgradeEndTime) {
          biz.garageUpgradeInProgress = false;
          const isTaxi = biz.sectorId === 'taxi';
          biz.parkingCapacity = biz.garageUpgradeTargetCapacity || ((biz.parkingCapacity || (isTaxi ? 10 : 8)) + (biz.garageUpgradeAddedSlots || (isTaxi ? 5 : 4)));
          delete biz.garageUpgradeStartTime;
          delete biz.garageUpgradeEndTime;
          delete biz.garageUpgradeAddedSlots;
          delete biz.garageUpgradeTargetCapacity;
          hasCompletedUpgrade = true;

          window.sound.playUpgrade();
          this.showToast(`🎉 Konstruksi perluasan garasi "${biz.name}" selesai! Kapasitas baru: ${biz.parkingCapacity} unit armada!`, 'success');
        }

        // 3. Proyek Ekspansi Fasilitas & Slot Gudang (Logistik)
        if (biz.warehouseUpgradeInProgress && now >= biz.warehouseUpgradeEndTime) {
          biz.warehouseUpgradeInProgress = false;
          biz.warehouseLevel = biz.warehouseUpgradeTargetLevel || ((biz.warehouseLevel || 1) + 1);
          biz.warehouseCapacity = biz.warehouseLevel;
          delete biz.warehouseUpgradeStartTime;
          delete biz.warehouseUpgradeEndTime;
          delete biz.warehouseUpgradeTargetLevel;
          hasCompletedUpgrade = true;

          window.sound.playUpgrade();
          this.showToast(`🎉 Konstruksi ekspansi gudang "${biz.name}" selesai! Kini mencapai Level ${biz.warehouseLevel} dengan total ${biz.warehouseCapacity} slot mitra!`, 'success');
        }

        // 4. Proyek Renovasi Kantor & Workstation (Software House)
        if (biz.officeUpgradeInProgress && now >= biz.officeUpgradeEndTime) {
          biz.officeUpgradeInProgress = false;
          biz.workstations = biz.officeUpgradeTargetWorkstations || ((biz.workstations || 15) + (biz.officeUpgradeAddedWorkstations || 15));
          delete biz.officeUpgradeType;
          delete biz.officeUpgradeStartTime;
          delete biz.officeUpgradeEndTime;
          delete biz.officeUpgradeAddedWorkstations;
          delete biz.officeUpgradeTargetWorkstations;
          hasCompletedUpgrade = true;

          window.sound.playUpgrade();
          this.showToast(`🎉 Renovasi kantor "${biz.name}" selesai! Kapasitas baru: ${biz.workstations} workstation!`, 'success');
        }

        // 5. Penyelesaian Proyek Software House
        if (biz.activeProject && !biz.activeProject.completed && now >= biz.activeProject.endTime) {
          biz.activeProject.completed = true;
          hasCompletedUpgrade = true;

          window.sound.playUpgrade();
          const pName = biz.activeProject.name || this.getProjectName(biz.activeProject.projectId);
          this.showToast(`🎉 Proyek software "${pName}" telah rampung dikerjakan tim! Segera klaim honor sebesar ${this.formatMoney(biz.activeProject.reward)}!`, 'success');
        }

        // 6. Pembukaan Rute Maskapai Penerbangan
        if (biz.routeUnlockInProgress && now >= biz.routeUnlockInProgress.endTime) {
          if (!biz.routes) biz.routes = [];
          const routeId = biz.routeUnlockInProgress.routeId;
          if (!biz.routes.includes(routeId)) {
            biz.routes.push(routeId);
          }
          const destName = biz.routeUnlockInProgress.destination;
          biz.routeUnlockInProgress = null;
          hasCompletedUpgrade = true;

          window.sound.playUpgrade();
          this.showToast(`🎉 Izin Rute "${destName}" Resmi Disetujui Otoritas Penerbangan! Penerbangan komersial kini beroperasi dan menghasilkan cuan.`, 'success');
        }

        // 7. Penandatanganan Kontrak Pasokan Migas & Tambang Mineral
        if (biz.contractSigningInProgress && now >= biz.contractSigningInProgress.endTime) {
          if (!biz.contracts) biz.contracts = [];
          const contractId = biz.contractSigningInProgress.contractId;
          if (!biz.contracts.includes(contractId)) {
            biz.contracts.push(contractId);
          }
          
          let partnerName = 'Mitra Korporasi';
          let revText = '';
          if (biz.sectorId === 'oil') {
            const cDef = typeof OIL_CONTRACTS_CATALOG !== 'undefined' ? OIL_CONTRACTS_CATALOG.find(c => c.id === contractId) : null;
            if (cDef) {
              partnerName = `${cDef.partner} (${cDef.title})`;
              revText = `+${this.formatCompact(cDef.revenuePerHour)}/jam`;
            }
          } else if (biz.sectorId === 'mining') {
            const cDef = typeof MINING_CONTRACTS_CATALOG !== 'undefined' ? MINING_CONTRACTS_CATALOG.find(c => c.id === contractId) : null;
            if (cDef) {
              partnerName = `${cDef.partner} (${cDef.title})`;
              revText = `+${this.formatCompact(cDef.revenuePerHour)}/jam`;
            }
          }
          biz.contractSigningInProgress = null;
          hasCompletedUpgrade = true;

          window.sound.playUpgrade();
          this.showToast(`🎉 Kontrak Pasokan Strategis dengan ${partnerName} Resmi Diteken! Pendapatan pasokan ${revText} kini mengalir.`, 'success');
        }
      });

      if (hasCompletedUpgrade) {
        this.saveGame();
        this.render();
      } else {
        this.updateLiveUpgradeTimers();
      }
    }

    // Akumulasi pendapatan real-time berbasis jam dunia nyata (3.600 detik = 1 jam)
    // Diperbarui setiap 5 detik agar responsif dan dinamis berbasis jam dunia asli
    if (this.subTickTimer >= 5) {
      const secondsToPass = this.subTickTimer;
      this.subTickTimer = 0;
      const hoursToPass = secondsToPass / GAME_CONFIG.GAME_HOUR_SECONDS;
      this.processInGameHours(hoursToPass);
    }

    // Cek Jatuh Tempo Pajak Mandiri (Term 72 Jam Waktu Nyata)
    if (this.state.taxes) {
      const now = Date.now();
      let taxStateChanged = false;

      // 1. Cek tunggakan pajak masing-masing bisnis
      if (Array.isArray(this.state.businesses)) {
        this.state.businesses.forEach(biz => {
          const t = this.getBusinessTax(biz);
          if (t && t.unpaid > 0 && t.deadline && now >= t.deadline && !t.suspended) {
            t.suspended = true;
            taxStateChanged = true;
            this.showToast(`🚨 SANKSI KANTOR PAJAK (DJP): Batas waktu jatuh tempo 72 jam terlampaui! Operasional & pendapatan bisnis "${biz.name}" resmi DIBEKUKAN hingga tunggakan dilunasi!`, 'error');
          }
        });
      }

      // 2. Cek tunggakan pajak sewa properti & dividen saham
      ['property', 'stocks'].forEach(sec => {
        const t = this.state.taxes[sec];
        if (t && t.unpaid > 0 && t.deadline && now >= t.deadline && !t.suspended) {
          t.suspended = true;
          taxStateChanged = true;
          const secName = sec === 'property' ? 'Sewa Properti' : 'Dividen Saham';
          this.showToast(`🚨 SANKSI KANTOR PAJAK (DJP): Batas waktu jatuh tempo 72 jam terlampaui! Seluruh pendapatan sektor ${secName} resmi DIBEKUKAN hingga tunggakan dilunasi!`, 'error');
        }
      });

      if (taxStateChanged) {
        this.saveGame();
        this.render();
      } else {
        this.updateLiveTaxTimers();
      }
    }

    this.renderHeader();
  }

  updateLiveUpgradeTimers() {
    const now = Date.now();
    document.querySelectorAll('[data-biz-timer]').forEach(el => {
      const endTime = parseInt(el.getAttribute('data-biz-timer'), 10);
      if (isNaN(endTime)) return;
      const remSec = Math.max(0, Math.ceil((endTime - now) / 1000));
      const hours = Math.floor(remSec / 3600);
      const mins = Math.floor((remSec % 3600) / 60);
      const secs = remSec % 60;
      if (hours > 0) {
        el.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      } else {
        el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    });

    document.querySelectorAll('[data-biz-progress]').forEach(el => {
      const startTime = parseInt(el.getAttribute('data-biz-start') || el.getAttribute('data-start-time'), 10);
      const endTime = parseInt(el.getAttribute('data-biz-end') || el.getAttribute('data-end-time'), 10);
      if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) return;
      const progress = Math.min(100, Math.max(0, ((now - startTime) / (endTime - startTime)) * 100));
      el.style.width = `${progress}%`;
    });
  }

  skipHour() {
    this.processInGameHours(1);
    this.simulateMarketTick(true);
    window.sound.playClick();
    this.showToast('Waktu dimajukan 1 Jam!', 'info');
    this.render();
  }

  setSpeed(s) {
    this.speed = s;
    window.sound.playClick();
    this.renderHeader();
  }

  processInGameHours(hours) {
    this.state.gameHours += hours;

    const threshold = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.MANDATORY_THRESHOLD) || 25000000;
    const rate = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.RATE) || 0.05;
    const termMs = ((GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.TERM_SECONDS_REAL) || 259200) * 1000;

    // 1. Akumulasi Pendapatan & Pajak Per Bisnis Individual
    let netBiz = 0;
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(biz => {
        const raw = this.calculateSingleBusinessRevenue(biz);
        const taxObj = this.getBusinessTax(biz);

        let singleNet = 0;
        if (taxObj.suspended) {
          singleNet = 0; // Sanksi suspensi DJP: omzet dibekukan
        } else if (raw > 0) {
          if (raw >= threshold) {
            // Wajib bayar mandiri (5%) dengan tenggat 72 jam
            const taxDue = Math.round(raw * rate * hours);
            taxObj.unpaid = (taxObj.unpaid || 0) + taxDue;
            if (!taxObj.deadline) {
              taxObj.deadline = Date.now() + termMs;
            }
            singleNet = raw * hours;
          } else {
            // Pemula: Otomatis potong 5%
            const taxDeducted = Math.round(raw * rate * hours);
            taxObj.totalAutoPaidLifetime = (taxObj.totalAutoPaidLifetime || 0) + taxDeducted;
            singleNet = (raw * hours) - taxDeducted;
          }
        } else if (raw < 0) {
          singleNet = raw * hours;
        }

        biz.allTimeEarnings = (biz.allTimeEarnings || 0) + singleNet;
        netBiz += singleNet;
      });
    }

    // 2. Pajak Portofolio Saham (Dividen)
    let rawStocks = 0;
    for (const [sym, st] of Object.entries(this.state.stocks)) {
      const cat = STOCKS_CATALOG.find(x => x.symbol === sym);
      const pr = this.stockPrices[sym] || (cat ? cat.basePrice : 0);
      if (st.shares > 0 && cat && cat.dividendYieldHourly) {
        rawStocks += Math.round(st.shares * pr * cat.dividendYieldHourly);
      }
    }

    const taxStock = this.state.taxes.stocks;
    let netStocks = 0;
    if (taxStock && !taxStock.suspended) {
      if (rawStocks >= threshold) {
        const taxDue = Math.round(rawStocks * rate * hours);
        taxStock.unpaid = (taxStock.unpaid || 0) + taxDue;
        if (!taxStock.deadline) {
          taxStock.deadline = Date.now() + termMs;
        }
        netStocks = rawStocks * hours;
      } else if (rawStocks > 0) {
        const taxDeducted = Math.round(rawStocks * rate * hours);
        taxStock.totalAutoPaidLifetime = (taxStock.totalAutoPaidLifetime || 0) + taxDeducted;
        netStocks = (rawStocks * hours) - taxDeducted;
      }
    }

    // 3. Pajak Sewa Properti
    let rawProp = 0;
    for (const [id, val] of Object.entries(this.state.properties)) {
      const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
      const count = typeof val === 'number' ? val : (val ? val.count : 0);
      if (prop && count > 0) {
        let singleRent = prop.hourlyRent;
        if (typeof val === 'object') {
          if (val.furnished) singleRent += prop.furnishedBonus;
          if (val.internet) singleRent += prop.internetBonus;
          const condMultiplier = 0.5 + ((val.condition || 100) / 100) * 0.5;
          singleRent = Math.round(singleRent * condMultiplier);
        }
        rawProp += singleRent * count;
      }
    }

    const taxProp = this.state.taxes.property;
    let netProp = 0;
    if (taxProp && !taxProp.suspended) {
      if (rawProp >= threshold) {
        const taxDue = Math.round(rawProp * rate * hours);
        taxProp.unpaid = (taxProp.unpaid || 0) + taxDue;
        if (!taxProp.deadline) {
          taxProp.deadline = Date.now() + termMs;
        }
        netProp = rawProp * hours;
      } else if (rawProp > 0) {
        const taxDeducted = Math.round(rawProp * rate * hours);
        taxProp.totalAutoPaidLifetime = (taxProp.totalAutoPaidLifetime || 0) + taxDeducted;
        netProp = (rawProp * hours) - taxDeducted;
      }
    }

    // Akumulasi statistik pendapatan spesifik per sektor
    if (!this.state.stats) {
      this.state.stats = { stockTradingProfit: 0, cryptoTradingProfit: 0, dividendsEarned: 0, businessEarnings: 0, rentalEarnings: 0 };
    }
    if (netBiz > 0) this.state.stats.businessEarnings = (this.state.stats.businessEarnings || 0) + netBiz;
    if (netStocks > 0) this.state.stats.dividendsEarned = (this.state.stats.dividendsEarned || 0) + netStocks;
    if (netProp > 0) this.state.stats.rentalEarnings = (this.state.stats.rentalEarnings || 0) + netProp;

    const earnings = (netBiz + netStocks + netProp);

    if (earnings !== 0) {
      this.state.cash += earnings;
      if (earnings > 0) {
        this.state.totalEarnedLifetime += earnings;
      }
    }

    // Update Fleet KM Mileage for Taksi & Logistik with Auto-Retire on Max KM
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(biz => {
        if (biz.vehicles) {
          let retiredCount = 0;
          biz.vehicles = biz.vehicles.filter(v => {
            const cat = TAXI_FLEET_VEHICLES.find(x => x.id === v.modelId);
            if (!cat) return false;
            v.km += Math.floor((180 + Math.random() * 120) * hours);
            if (v.km >= cat.maxKm) {
              retiredCount++;
              return false; // Auto-retire: langsung pensiun & keluar dari armada
            }
            return true;
          });
          if (retiredCount > 0) {
            this.showToast(`⚠️ ${retiredCount} unit armada taksi (${biz.name}) telah mencapai batas KM maksimal dan otomatis pensiun! Silakan beli armada baru di showroom.`, 'warning');
          }
        }
        if (biz.trucks) {
          let retiredCount = 0;
          biz.trucks = biz.trucks.filter(t => {
            const cat = LOGISTICS_FLEET_VEHICLES.find(x => x.id === t.modelId);
            if (!cat) return false;
            t.km += Math.floor((220 + Math.random() * 140) * hours);
            if (t.km >= cat.maxKm) {
              retiredCount++;
              return false; // Auto-retire: langsung pensiun & keluar dari garasi
            }
            return true;
          });
          if (retiredCount > 0) {
            this.showToast(`⚠️ ${retiredCount} unit truk logistik (${biz.name}) telah mencapai batas KM maksimal dan otomatis pensiun! Slot garasi kini kosong.`, 'warning');
          }
        }

        // Pertumbuhan organik simpanan nasabah bank komersial (DPK)
        if (biz.sectorId === 'bank') {
          if (typeof biz.customerDeposits !== 'number') {
            biz.customerDeposits = 1500000000;
          }
          const hourlyRate = this.getBankDepositGrowthRate(biz);
          const variance = 0.95 + (Math.random() * 0.1);
          const growth = Math.round(hourlyRate * hours * variance);
          biz.customerDeposits += growth;
        }

        // Pemeliharaan Armada Pesawat Maskapai Penerbangan
        if (biz.sectorId === 'airline' && Array.isArray(biz.planes) && biz.planes.length > 0) {
          const stats = this.getAirlineOperatingStats(biz);
          const totalMaint = (stats.totalMaintenanceCost || 0) * hours;
          if (biz.autoMaintenance !== false && totalMaint > 0) {
            if (this.state.cash >= totalMaint) {
              this.state.cash -= totalMaint;
              biz.planes.forEach(p => { p.isGrounded = false; });
            } else {
              // Kas tidak mencukupi untuk bayar perawatan
              const alreadyGrounded = biz.planes.every(p => p.isGrounded);
              biz.planes.forEach(p => { p.isGrounded = true; });
              if (!alreadyGrounded) {
                this.showToast(`🚨 Saldo kas tidak cukup membayar perawatan armada (${biz.name})! Seluruh pesawat di-grounded dan rute penerbangan berhenti menghasilkan cuan.`, 'error');
              }
            }
          }
        }
      });
    }

    // Degradasi kondisi fisik properti seiring waktu (-0.15% per jam game)
    for (const [id, val] of Object.entries(this.state.properties)) {
      const pData = this.getPropertyData(id);
      if (pData.count > 0 && pData.condition > 40) {
        pData.condition = Math.max(40, Math.round((pData.condition - (0.15 * hours)) * 10) / 10);
      }
    }

    if (!this.lastAutoSaveTime || Date.now() - this.lastAutoSaveTime >= 15000) {
      this.lastAutoSaveTime = Date.now();
      this.saveGame();
    }
  }

  checkOfflineEarnings() {
    const now = Date.now();
    // Periksa penyelesaian proyek upgrade selama offline
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(biz => {
        if (biz.upgradeInProgress && now >= biz.upgradeEndTime) {
          biz.upgradeInProgress = false;
          biz.level = biz.upgradeTargetLevel || (biz.level + 1);
          delete biz.upgradeStartTime;
          delete biz.upgradeEndTime;
          delete biz.upgradeTargetLevel;
        }
        if (biz.garageUpgradeInProgress && now >= biz.garageUpgradeEndTime) {
          biz.garageUpgradeInProgress = false;
          const isTaxi = biz.sectorId === 'taxi';
          biz.parkingCapacity = biz.garageUpgradeTargetCapacity || ((biz.parkingCapacity || (isTaxi ? 10 : 8)) + (biz.garageUpgradeAddedSlots || (isTaxi ? 5 : 4)));
          delete biz.garageUpgradeStartTime;
          delete biz.garageUpgradeEndTime;
          delete biz.garageUpgradeAddedSlots;
          delete biz.garageUpgradeTargetCapacity;
        }
        if (biz.warehouseUpgradeInProgress && now >= biz.warehouseUpgradeEndTime) {
          biz.warehouseUpgradeInProgress = false;
          biz.warehouseLevel = biz.warehouseUpgradeTargetLevel || ((biz.warehouseLevel || 1) + 1);
          biz.warehouseCapacity = biz.warehouseLevel;
          delete biz.warehouseUpgradeStartTime;
          delete biz.warehouseUpgradeEndTime;
          delete biz.warehouseUpgradeTargetLevel;
        }
        if (biz.officeUpgradeInProgress && now >= biz.officeUpgradeEndTime) {
          biz.officeUpgradeInProgress = false;
          biz.workstations = biz.officeUpgradeTargetWorkstations || ((biz.workstations || 15) + (biz.officeUpgradeAddedWorkstations || 15));
          delete biz.officeUpgradeType;
          delete biz.officeUpgradeStartTime;
          delete biz.officeUpgradeEndTime;
          delete biz.officeUpgradeAddedWorkstations;
          delete biz.officeUpgradeTargetWorkstations;
        }
        if (biz.activeProject && !biz.activeProject.completed && now >= biz.activeProject.endTime) {
          biz.activeProject.completed = true;
        }
        if (biz.routeUnlockInProgress && now >= biz.routeUnlockInProgress.endTime) {
          if (!biz.routes) biz.routes = [];
          const routeId = biz.routeUnlockInProgress.routeId;
          if (!biz.routes.includes(routeId)) {
            biz.routes.push(routeId);
          }
          biz.routeUnlockInProgress = null;
        }
        if (biz.contractSigningInProgress && now >= biz.contractSigningInProgress.endTime) {
          if (!biz.contracts) biz.contracts = [];
          const contractId = biz.contractSigningInProgress.contractId;
          if (!biz.contracts.includes(contractId)) {
            biz.contracts.push(contractId);
          }
          biz.contractSigningInProgress = null;
        }
      });
    }

    // Periksa suspensi pajak jika tenggat waktu 72 jam dunia nyata terlewati saat offline
    if (this.state.taxes) {
      if (Array.isArray(this.state.businesses)) {
        this.state.businesses.forEach(biz => {
          const t = this.getBusinessTax(biz);
          if (t && t.unpaid > 0 && t.deadline && now >= t.deadline) {
            t.suspended = true;
          }
        });
      }
      ['property', 'stocks'].forEach(sec => {
        const t = this.state.taxes[sec];
        if (t && t.unpaid > 0 && t.deadline && now >= t.deadline) {
          t.suspended = true;
        }
      });
    }

    const lastSaved = this.state.lastSaved;
    if (!lastSaved) return;

    const elapsedMs = now - lastSaved;
    const hourMs = GAME_CONFIG.GAME_HOUR_SECONDS * 1000;
    const elapsedRealHours = elapsedMs / hourMs;

    if (elapsedRealHours >= 0.05) {
      const cappedHours = Math.min(GAME_CONFIG.OFFLINE_MAX_HOURS, elapsedRealHours);

      // Pertumbuhan organik simpanan nasabah bank komersial selama offline
      if (Array.isArray(this.state.businesses) && cappedHours > 0) {
        this.state.businesses.forEach(biz => {
          if (biz.sectorId === 'bank') {
            if (typeof biz.customerDeposits !== 'number') {
              biz.customerDeposits = 1500000000;
            }
            const hourlyRate = this.getBankDepositGrowthRate(biz);
            const offlineGrowth = Math.round(hourlyRate * cappedHours);
            biz.customerDeposits += offlineGrowth;
          }

          // Akumulasi pendapatan masing-masing bisnis selama offline
          const raw = this.calculateSingleBusinessRevenue(biz);
          const t = this.getBusinessTax(biz);
          if (!t.suspended && raw > 0) {
            const bizEarned = Math.round(raw * cappedHours);
            biz.allTimeEarnings = (biz.allTimeEarnings || 0) + bizEarned;
          }
        });
      }

      const hourlyIncome = this.calculateHourlyIncome();
      const offlineEarnings = Math.round(hourlyIncome * cappedHours);

      if (offlineEarnings > 0) {
        this.state.cash += offlineEarnings;
        this.state.totalEarnedLifetime += offlineEarnings;

        if (!this.state.stats) {
          this.state.stats = { stockTradingProfit: 0, cryptoTradingProfit: 0, dividendsEarned: 0, businessEarnings: 0, rentalEarnings: 0 };
        }
        const { rawBiz, rawStocks, rawProp } = this.getSectorRevenueBreakdown();
        const totalRaw = rawBiz + rawStocks + rawProp;
        if (totalRaw > 0) {
          this.state.stats.businessEarnings = (this.state.stats.businessEarnings || 0) + Math.round(offlineEarnings * (rawBiz / totalRaw));
          this.state.stats.dividendsEarned = (this.state.stats.dividendsEarned || 0) + Math.round(offlineEarnings * (rawStocks / totalRaw));
          this.state.stats.rentalEarnings = (this.state.stats.rentalEarnings || 0) + Math.round(offlineEarnings * (rawProp / totalRaw));
        }

        const displayHours = Math.max(1, Math.round(cappedHours));
        this.showOfflineModal(displayHours, offlineEarnings);
      }
    }
  }

  showOfflineModal(hours, amount) {
    const modal = document.getElementById('offline-modal');
    if (!modal) return;
    document.getElementById('offline-hours-text').innerText = `${hours} Jam Game`;
    document.getElementById('offline-earned-text').innerText = `+${this.formatMoney(amount)}`;
    modal.classList.remove('hidden');
    window.sound.playUpgrade();
  }

  closeOfflineModal() {
    const modal = document.getElementById('offline-modal');
    if (modal) modal.classList.add('hidden');
    this.saveGame();
    this.render();
  }

  saveGame() {
    this.state.lastSaved = Date.now();
    try {
      localStorage.setItem((GAME_CONFIG.SAVE_KEY || 'BUSINESS_EMPIRE_GAME_DATA'), JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem((GAME_CONFIG.SAVE_KEY || 'BUSINESS_EMPIRE_GAME_DATA'));
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = Object.assign(this.getDefaultState(), parsed);
        // Migrasi armada taksi legacy veh_sedan -> veh_vios
        if (Array.isArray(this.state.businesses)) {
          this.state.businesses.forEach(biz => {
            if (biz.vehicles) {
              biz.vehicles.forEach(v => {
                if (v.modelId === 'veh_sedan') v.modelId = 'veh_vios';
              });
            }
            if (biz.sectorId === 'logistics') {
              if (!biz.warehouseLevel) {
                biz.warehouseLevel = Math.min(10, Math.max(biz.warehouseCapacity || 1, (biz.tenants || []).length || 1, 1));
              }
              biz.warehouseCapacity = biz.warehouseLevel;
            }
            if (biz.sectorId === 'tech') {
              biz.workstations = biz.workstations || 15;
              biz.employees = biz.employees || { dev: 4, lead: 1, designer: 4, tester: 2 };
            }
          });
        }

        // Migrasi jika format businesses lama (object)
        if (this.state.businesses && !Array.isArray(this.state.businesses)) {
          const oldMap = this.state.businesses;
          this.state.businesses = [];
          for (const [key, val] of Object.entries(oldMap)) {
            if (val && val.level > 0) {
              const secId = key === 'commercial_bank' ? 'bank' : (key === 'oil_corp' ? 'oil' : (key === 'mining_corp' ? 'mining' : (key === 'taxi_fleet' ? 'taxi' : (key === 'logistics_cargo' ? 'logistics' : 'retail'))));
              const sector = BUSINESS_SECTORS.find(s => s.sectorId === secId) || BUSINESS_SECTORS[0];
              this.state.businesses.push({
                instanceId: 'biz_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
                sectorId: secId,
                subTypeId: secId === 'retail' ? 'small' : null,
                name: sector.name,
                level: val.level || 1,
                parkingCapacity: secId === 'taxi' ? 10 : (secId === 'logistics' ? 8 : 0),
                vehicles: secId === 'taxi' ? [{ id: 'v_' + Date.now(), modelId: 'veh_sedan', km: 2500 }] : [],
                trucks: secId === 'logistics' ? [{ id: 't_' + Date.now(), modelId: 'trk_pickup', km: 3500 }] : [],
                warehouseCapacity: secId === 'logistics' ? 2 : 0,
                tenants: secId === 'logistics' ? ['tenant_ecommerce'] : [],
                vault: val.vault || 2000000000,
                depositRate: val.depositRate || 5.0,
                creditRate: val.creditRate || 11.5
              });
            }
          }
        }
        // Migrasi format properties jika data lama masih primitif
        if (this.state.properties) {
          for (const [key, val] of Object.entries(this.state.properties)) {
            if (typeof val === 'number') {
              this.state.properties[key] = { count: val, furnished: false, internet: false, condition: 100 };
            } else if (val && typeof val === 'object') {
              if (val.condition === undefined) val.condition = 100;
              if (val.furnished === undefined) val.furnished = false;
              if (val.internet === undefined) val.internet = false;
              if (val.count === undefined) val.count = 0;
            }
          }
        }

        // Inisialisasi customerDeposits untuk bisnis bank jika belum ada
        if (Array.isArray(this.state.businesses)) {
          this.state.businesses.forEach(biz => {
            if (biz.sectorId === 'bank' && (biz.customerDeposits === undefined || biz.customerDeposits === null)) {
              biz.customerDeposits = Math.max(1500000000, Math.round((biz.vault || 2000000000) * (biz.level || 1) * 1.2));
            }
            if (biz.sectorId === 'airline') {
              if (!Array.isArray(biz.planes) || biz.planes.length === 0) {
                biz.planes = [
                  { id: 'plane_' + Date.now(), modelId: 'jet_embraer_195', isGrounded: false }
                ];
              }
              if (!Array.isArray(biz.routes) || biz.routes.length === 0) {
                biz.routes = ['route_sin'];
              }
              if (biz.autoMaintenance === undefined) {
                biz.autoMaintenance = true;
              }
            }
            if (biz.sectorId === 'oil') {
              if (!Array.isArray(biz.facilities) || biz.facilities.length === 0) {
                biz.facilities = [{ id: 'oil_pumpjack', count: 1 }];
              }
              if (!Array.isArray(biz.contracts)) {
                biz.contracts = [];
              }
            }
            if (biz.sectorId === 'mining') {
              if (!Array.isArray(biz.facilities) || biz.facilities.length === 0) {
                biz.facilities = [{ id: 'mining_excavator_fleet', count: 1 }];
              }
              if (!Array.isArray(biz.contracts)) {
                biz.contracts = [];
              }
            }

            // Inisialisasi allTimeEarnings & tax per bisnis
            if (biz.allTimeEarnings === undefined) {
              biz.allTimeEarnings = 0;
            }
            if (!biz.tax) {
              biz.tax = { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 };
            }
          });

          // Migrasi pajak bisnis lama jika ada tunggakan
          if (this.state.taxes?.business?.unpaid > 0 && this.state.businesses.length > 0) {
            const firstBiz = this.state.businesses[0];
            if (!firstBiz.tax.unpaid) {
              firstBiz.tax.unpaid = this.state.taxes.business.unpaid;
              firstBiz.tax.deadline = this.state.taxes.business.deadline;
              firstBiz.tax.suspended = this.state.taxes.business.suspended;
            }
            this.state.taxes.business.unpaid = 0;
          }
        }

        // Bersihkan sisa koin kripto desimal mikro/debu (< 0.00001) yang tertinggal setelah penjualan
        if (this.state.crypto) {
          for (const sym of Object.keys(this.state.crypto)) {
            const cr = this.state.crypto[sym];
            if (cr && cr.amount <= 0.00001) {
              cr.amount = 0;
              cr.totalCost = 0;
            }
          }
        }

        // Validasi format taxes untuk kompatibilitas data lama
        if (!this.state.taxes) {
          this.state.taxes = {
            business: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 },
            property: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 },
            stocks:   { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 }
          };
        } else {
          ['business', 'property', 'stocks'].forEach(k => {
            if (!this.state.taxes[k]) {
              this.state.taxes[k] = { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 };
            }
          });
        }

        // Inisialisasi posisi komoditas jika belum ada
        if (!Array.isArray(this.state.commodityPositions)) {
          this.state.commodityPositions = [];
        }

        // Validasi & inisialisasi stats pendapatan terpisah
        if (!this.state.stats) {
          this.state.stats = {
            stockTradingProfit: 0,
            cryptoTradingProfit: 0,
            commodityTradingProfit: 0,
            dividendsEarned: 0,
            businessEarnings: 0,
            rentalEarnings: 0
          };
        } else {
          if (typeof this.state.stats.stockTradingProfit !== 'number') this.state.stats.stockTradingProfit = 0;
          if (typeof this.state.stats.cryptoTradingProfit !== 'number') this.state.stats.cryptoTradingProfit = 0;
          if (typeof this.state.stats.commodityTradingProfit !== 'number') this.state.stats.commodityTradingProfit = 0;
          if (typeof this.state.stats.dividendsEarned !== 'number') this.state.stats.dividendsEarned = 0;
          if (typeof this.state.stats.businessEarnings !== 'number') this.state.stats.businessEarnings = 0;
          if (typeof this.state.stats.rentalEarnings !== 'number') this.state.stats.rentalEarnings = 0;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved game data, using defaults', e);
    }
  }

  resetGame() {
    if (confirm('Apakah Anda yakin ingin me-reset seluruh kerajaan bisnis dan mulai dari awal lagi?')) {
      localStorage.removeItem((GAME_CONFIG.SAVE_KEY || 'BUSINESS_EMPIRE_GAME_DATA'));
      this.state = this.getDefaultState();
      this.initMarkets();
      this.saveGame();
      this.showOwnedBusinesses();
      this.render();
      window.sound.playCash();
      this.showToast('Kerajaan bisnis telah di-reset ke modal awal!', 'info');
    }
  }

  setupEventListeners() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
        window.sound.playClick();
      });
    });

    const hustleBtn = document.getElementById('hustle-click-btn');
    if (hustleBtn) {
      hustleBtn.addEventListener('click', (e) => this.doClickWork(e));
    }

    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.add('hidden');
      }
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      const isCurrent = btn.getAttribute('data-tab') === tabName;
      if (btn.getAttribute('data-tab') === 'home') {
        if (isCurrent) {
          btn.classList.add('active-home');
        } else {
          btn.classList.remove('active-home');
        }
      } else {
        if (isCurrent) {
          btn.classList.add('text-emerald-400', 'border-emerald-500');
          btn.classList.remove('text-slate-400', 'border-transparent');
        } else {
          btn.classList.remove('text-emerald-400', 'border-emerald-500');
          btn.classList.add('text-slate-400', 'border-transparent');
        }
      }
    });

    // Card Total Kekayaan Bersih HANYA tampil di Tab Beranda (Home)
    const nwCard = document.getElementById('header-networth-card');
    if (nwCard) {
      if (tabName === 'home') {
        nwCard.classList.remove('hidden');
        nwCard.classList.remove('view-transition');
        void nwCard.offsetWidth;
        nwCard.classList.add('view-transition');
      } else {
        nwCard.classList.add('hidden');
      }
    }

    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      if (panel.id === `tab-${tabName}`) {
        panel.classList.remove('hidden');
        panel.classList.remove('view-transition');
        void panel.offsetWidth;
        panel.classList.add('view-transition');
      } else {
        panel.classList.add('hidden');
      }
    });

    this.render();
  }
}

// --- END js/modules/core.js ---

// --- BEGIN js/utils.js ---
// Business Empire: RichMan - Utility & Formatting Module
Object.assign(GameEngine.prototype, {
  formatMoney(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    return sign + 'Rp ' + Math.floor(abs).toLocaleString('id-ID');
  },

  formatCompact(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1_000_000_000_000) {
      return sign + 'Rp ' + (abs / 1_000_000_000_000).toFixed(2).replace('.', ',') + ' T';
    }
    if (abs >= 1_000_000_000) {
      return sign + 'Rp ' + (abs / 1_000_000_000).toFixed(2).replace('.', ',') + ' M';
    }
    if (abs >= 1_000_000) {
      return sign + 'Rp ' + (abs / 1_000_000).toFixed(2).replace('.', ',') + ' Jt';
    }
    if (abs >= 1_000) {
      return sign + 'Rp ' + (abs / 1_000).toFixed(1).replace('.', ',') + ' Rb';
    }
    return sign + 'Rp ' + Math.floor(abs).toLocaleString('id-ID');
  },

  formatDuration(seconds) {
    if (seconds < 60) return `${seconds} dtk`;
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return rem > 0 ? `${mins} mnt ${rem} dtk` : `${mins} mnt`;
  },

  generateSparkline(history, color) {
    if (!history || history.length < 2) return '';
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 1;
    const width = 280;
    const height = 28;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
        <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
      </svg>
    `;
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    const existingToasts = container.querySelectorAll('.toast');
    existingToasts.forEach(oldToast => {
      oldToast.classList.remove('toast-enter');
      oldToast.classList.add('toast-exit');
      setTimeout(() => oldToast.remove(), 180);
    });

    const toast = document.createElement('div');
    toast.className = `toast toast-enter ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    this.toastTimer = setTimeout(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }
});

// --- END js/utils.js ---

// --- BEGIN js/modules/calculations.js ---
// Business Empire: RichMan - Financial Calculations & Valuations Module
Object.assign(GameEngine.prototype, {
  getCurrentRank() {
    const netWorth = this.calculateNetWorth();
    let current = NET_WORTH_RANKS[0];
    for (const r of NET_WORTH_RANKS) {
      if (netWorth >= r.min) current = r;
    }
    return current;
  },

  calculateNetWorth() {
    let nw = this.state.cash;

    // Businesses & Fleets
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(biz => {
        nw += this.calculateBusinessValuation(biz);
      });
    }

    // Stocks
    for (const [sym, st] of Object.entries(this.state.stocks)) {
      if (st.shares > 0 && this.stockPrices[sym]) {
        nw += st.shares * this.stockPrices[sym];
      }
    }

    // Crypto
    for (const [sym, cr] of Object.entries(this.state.crypto)) {
      if (cr.amount > 0.00001 && this.cryptoPrices[sym]) {
        nw += cr.amount * this.cryptoPrices[sym];
      }
    }

    // Real Estate
    for (const [id, propVal] of Object.entries(this.state.properties)) {
      const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
      const count = typeof propVal === 'number' ? propVal : (propVal ? propVal.count : 0);
      if (prop && count > 0) {
        let singleVal = prop.price;
        if (typeof propVal === 'object') {
          if (propVal.furnished) singleVal += prop.furnitureCost;
          if (propVal.internet) singleVal += prop.internetCost;
        }
        nw += singleVal * count;
      }
    }

    // Luxury
    for (const id of this.state.luxury) {
      const lux = LUXURY_CATALOG.find(x => x.id === id);
      if (lux) nw += lux.price;
    }

    // Ekuitas Posisi Trading Komoditas (Margin + Floating PnL)
    if (Array.isArray(this.state.commodityPositions)) {
      this.state.commodityPositions.forEach(pos => {
        const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
        const priceChange = (curPrice - pos.entryPrice) / pos.entryPrice;
        const pnlRate = (pos.type === 'LONG' ? priceChange : -priceChange) * (pos.leverage || 1);
        const equity = Math.max(0, Math.round(pos.margin * (1 + pnlRate)));
        nw += equity;
      });
    }

    return Math.max(0, nw);
  },

  calculateBusinessValuation(biz) {
    let val = 0;
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
    if (!sector) return 0;

    if (sector.hasSubtypes && biz.subTypeId) {
      const sub = sector.subtypes.find(st => st.id === biz.subTypeId);
      if (sub) val += sub.cost * biz.level;
    } else {
      val += (sector.baseCost || 50000000) * biz.level;
    }

    if (sector.isFleet && biz.vehicles) {
      biz.vehicles.forEach(v => {
        const cat = TAXI_FLEET_VEHICLES.find(x => x.id === v.modelId);
        if (cat) val += cat.cost * Math.max(0.2, 1 - (v.km / cat.maxKm));
      });
      val += (biz.parkingCapacity - 10) * 5000000;
    }

    if (sector.isLogistics && biz.trucks) {
      biz.trucks.forEach(t => {
        const cat = LOGISTICS_FLEET_VEHICLES.find(x => x.id === t.modelId);
        if (cat) val += cat.cost * Math.max(0.2, 1 - (t.km / cat.maxKm));
      });
      val += (biz.warehouseCapacity || 2) * 250000000;
    }

    if (sector.isBank && biz.vault) {
      val += biz.vault;
    }

    if ((sector.isTech || biz.sectorId === 'tech') && biz.workstations) {
      val += ((biz.workstations || 15) - 15) * 35000000;
      val += (this.getTechTotalEmployees(biz) || 0) * 15000000;
    }

    if ((sector.isAirline || biz.sectorId === 'airline') && biz.planes) {
      if (typeof AIRLINE_AIRCRAFT_CATALOG !== 'undefined') {
        biz.planes.forEach(p => {
          const model = AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId);
          if (model) val += model.price * 0.9;
        });
      }
      if (typeof AIRLINE_ROUTES_CATALOG !== 'undefined' && biz.routes) {
        biz.routes.forEach(rId => {
          const r = AIRLINE_ROUTES_CATALOG.find(x => x.id === rId);
          if (r) val += r.unlockCost * 0.8;
        });
      }
    }

    if ((sector.isOil || biz.sectorId === 'oil') && biz.facilities) {
      if (typeof OIL_FACILITIES_CATALOG !== 'undefined') {
        biz.facilities.forEach(f => {
          const cat = OIL_FACILITIES_CATALOG.find(x => x.id === f.id);
          if (cat) val += cat.cost * (f.count || 1) * 0.9;
        });
      }
      if (typeof OIL_CONTRACTS_CATALOG !== 'undefined' && biz.contracts) {
        biz.contracts.forEach(cId => {
          const c = OIL_CONTRACTS_CATALOG.find(x => x.id === cId);
          if (c) val += c.cost * 0.8;
        });
      }
    }

    if ((sector.isMining || biz.sectorId === 'mining') && biz.facilities) {
      if (typeof MINING_FACILITIES_CATALOG !== 'undefined') {
        biz.facilities.forEach(f => {
          const cat = MINING_FACILITIES_CATALOG.find(x => x.id === f.id);
          if (cat) val += cat.cost * (f.count || 1) * 0.9;
        });
      }
      if (typeof MINING_CONTRACTS_CATALOG !== 'undefined' && biz.contracts) {
        biz.contracts.forEach(cId => {
          const c = MINING_CONTRACTS_CATALOG.find(x => x.id === cId);
          if (c) val += c.cost * 0.8;
        });
      }
    }

    return Math.round(val);
  },

  getOilProductionStats(biz) {
    if (!biz) return { totalOilBblPerHour: 0, totalGasBoePerHour: 0, totalContractRevenue: 0, signedContractsCount: 0, totalHourlyRevenue: 0 };

    const facilities = biz.facilities || [];
    const contracts = biz.contracts || [];

    let totalOilBblPerHour = 0;
    let totalGasBoePerHour = 0;

    facilities.forEach(f => {
      const cat = typeof OIL_FACILITIES_CATALOG !== 'undefined' ? OIL_FACILITIES_CATALOG.find(x => x.id === f.id) : null;
      if (cat) {
        totalOilBblPerHour += (cat.oilBblPerHour || 0) * (f.count || 1);
        totalGasBoePerHour += (cat.gasBoePerHour || 0) * (f.count || 1);
      }
    });

    let totalContractRevenue = 0;
    contracts.forEach(cId => {
      const c = typeof OIL_CONTRACTS_CATALOG !== 'undefined' ? OIL_CONTRACTS_CATALOG.find(x => x.id === cId) : null;
      if (c) {
        totalContractRevenue += c.hourlyRevenue || 0;
      }
    });

    const baseRevenue = 1200000000; // Rp 1,2 Miliar starter
    const totalHourlyRevenue = baseRevenue + totalContractRevenue;

    return {
      totalOilBblPerHour,
      totalGasBoePerHour,
      totalContractRevenue,
      signedContractsCount: contracts.length,
      totalHourlyRevenue
    };
  },

  getMiningProductionStats(biz) {
    if (!biz) return { totalNickelTonPerHour: 0, totalGoldKgPerHour: 0, totalContractRevenue: 0, signedContractsCount: 0, totalHourlyRevenue: 0 };

    const facilities = biz.facilities || [];
    const contracts = biz.contracts || [];

    let totalNickelTonPerHour = 0;
    let totalGoldKgPerHour = 0;

    facilities.forEach(f => {
      const cat = typeof MINING_FACILITIES_CATALOG !== 'undefined' ? MINING_FACILITIES_CATALOG.find(x => x.id === f.id) : null;
      if (cat) {
        totalNickelTonPerHour += (cat.nickelTonPerHour || 0) * (f.count || 1);
        totalGoldKgPerHour += (cat.goldKgPerHour || 0) * (f.count || 1);
      }
    });

    let totalContractRevenue = 0;
    contracts.forEach(cId => {
      const c = typeof MINING_CONTRACTS_CATALOG !== 'undefined' ? MINING_CONTRACTS_CATALOG.find(x => x.id === cId) : null;
      if (c) {
        totalContractRevenue += c.hourlyRevenue || 0;
      }
    });

    const baseRevenue = 2500000000; // Rp 2,5 Miliar starter
    const totalHourlyRevenue = baseRevenue + totalContractRevenue;

    return {
      totalNickelTonPerHour,
      totalGoldKgPerHour,
      totalContractRevenue,
      signedContractsCount: contracts.length,
      totalHourlyRevenue
    };
  },

  getAirlineOperatingStats(biz) {
    if (!biz) return { grossRevenue: 0, totalMaintenanceCost: 0, netRevenue: 0, operatingPlanesCount: 0, groundedPlanesCount: 0, openRoutesCount: 0, operatingRoutesCount: 0, routeDetails: [] };

    const planes = biz.planes || [];
    const routes = biz.routes || [];
    const assignments = biz.planeAssignments || {};

    let totalMaintenanceCost = 0;
    let operatingPlanesCount = 0;
    let groundedPlanesCount = 0;

    planes.forEach(p => {
      const model = typeof AIRLINE_AIRCRAFT_CATALOG !== 'undefined' ? AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId) : null;
      if (model) {
        totalMaintenanceCost += model.maintenanceCost || 0;
      }
      if (p.isGrounded) {
        groundedPlanesCount++;
      } else {
        operatingPlanesCount++;
      }
    });

    let grossRevenue = 0;
    let operatingRoutesCount = 0;
    const routeDetails = [];
    const usedPlaneIds = new Set();

    routes.forEach(routeId => {
      const route = typeof AIRLINE_ROUTES_CATALOG !== 'undefined' ? AIRLINE_ROUTES_CATALOG.find(r => r.id === routeId) : null;
      if (!route) return;

      // Find assigned plane
      let assignedPlane = null;
      const explicitPlaneId = assignments[routeId];
      if (explicitPlaneId) {
        const found = planes.find(p => p.id === explicitPlaneId && !usedPlaneIds.has(p.id));
        if (found) {
          const model = typeof AIRLINE_AIRCRAFT_CATALOG !== 'undefined' ? AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === found.modelId) : null;
          if (model && model.category === route.requiredCategory) {
            assignedPlane = found;
          }
        }
      }

      // Auto-assign matching unassigned plane
      if (!assignedPlane) {
        assignedPlane = planes.find(p => {
          if (usedPlaneIds.has(p.id)) return false;
          const model = typeof AIRLINE_AIRCRAFT_CATALOG !== 'undefined' ? AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId) : null;
          return model && model.category === route.requiredCategory;
        }) || null;
      }

      let isOperating = false;
      let reason = 'no_plane';
      let rev = 0;

      if (assignedPlane) {
        usedPlaneIds.add(assignedPlane.id);
        if (assignedPlane.isGrounded) {
          reason = 'grounded';
          isOperating = false;
        } else {
          isOperating = true;
          reason = 'flying';
          rev = route.hourlyRevenue || 0;
          grossRevenue += rev;
          operatingRoutesCount++;
        }
      }

      routeDetails.push({
        route,
        plane: assignedPlane,
        isOperating,
        reason,
        revenue: rev
      });
    });

    const netRevenue = Math.max(0, grossRevenue - totalMaintenanceCost);

    return {
      totalPlanes: planes.length,
      operatingPlanesCount,
      groundedPlanesCount,
      openRoutesCount: routes.length,
      operatingRoutesCount,
      totalMaintenanceCost,
      grossRevenue,
      netRevenue: operatingRoutesCount > 0 ? netRevenue : 0,
      routeDetails
    };
  },

  getTechTotalEmployees(biz) {
    if (!biz || !biz.employees) return 0;
    return (biz.employees.dev || 0) + (biz.employees.lead || 0) + (biz.employees.designer || 0) + (biz.employees.tester || 0);
  },

  getTechHourlySalaries(biz) {
    if (!biz || !biz.employees) return 0;
    if (typeof TECH_ROLES === 'undefined') return 0;
    let total = 0;
    for (const [roleId, count] of Object.entries(biz.employees)) {
      const r = TECH_ROLES.find(x => x.id === roleId);
      if (r) total += (count || 0) * r.salary;
    }
    return total;
  },

  getSectorRevenueBreakdown() {
    let rawBiz = 0;
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(biz => {
        rawBiz += this.calculateSingleBusinessRevenue(biz);
      });
    }

    let rawStocks = 0;
    for (const [sym, st] of Object.entries(this.state.stocks)) {
      if (st.shares > 0 && this.stockPrices[sym]) {
        const stockDef = STOCKS_CATALOG.find(x => x.symbol === sym);
        if (stockDef && stockDef.dividendYieldHourly > 0) {
          const marketVal = st.shares * this.stockPrices[sym];
          rawStocks += Math.round(marketVal * stockDef.dividendYieldHourly);
        }
      }
    }

    let rawProp = 0;
    for (const [id, propVal] of Object.entries(this.state.properties)) {
      const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
      const count = typeof propVal === 'number' ? propVal : (propVal ? propVal.count : 0);
      if (prop && count > 0) {
        const isFurnished = typeof propVal === 'object' && propVal.furnished;
        const isInternet = typeof propVal === 'object' && propVal.internet;
        const condition = typeof propVal === 'object' && propVal.condition !== undefined ? propVal.condition : 100;

        let multiplier = 1.0;
        if (isFurnished) multiplier += 0.25;
        if (isInternet) multiplier += 0.15;
        const condMultiplier = Math.max(0.4, condition / 100);

        const grossRent = Math.round(prop.hourlyRent * multiplier * condMultiplier * count);
        const maintCost = Math.round((prop.hourlyMaintenance || (prop.hourlyRent * 0.12)) * count);
        rawProp += Math.max(0, grossRent - maintCost);
      }
    }

    return { rawBiz, rawStocks, rawProp };
  },

  calculateHourlyIncome() {
    const { rawBiz, rawStocks, rawProp } = this.getSectorRevenueBreakdown();
    const threshold = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.MANDATORY_THRESHOLD) || 25000000;
    const rate = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.RATE) || 0.05;

    let total = 0;

    // 1. Sektor Bisnis
    if (this.state.taxes && this.state.taxes.business && this.state.taxes.business.suspended) {
      // Disuspend oleh KPP DJP -> Rp 0
    } else {
      if (rawBiz <= 0) {
        total += rawBiz; // Beban rutin (gaji karyawan dll) langsung memotong pendapatan
      } else if (rawBiz < threshold) {
        total += Math.round(rawBiz * (1 - rate)); // Dipotong pajak otomatis 5% (PPh Final UMKM)
      } else {
        total += rawBiz; // Wajib Lapor Mandiri: pemain menerima omzet dan membayar tagihan pajak mandiri
      }
    }

    // 2. Sektor Dividen Saham
    if (this.state.taxes && this.state.taxes.stocks && this.state.taxes.stocks.suspended) {
      // Disuspend oleh KPP DJP -> Rp 0
    } else {
      if (rawStocks < threshold) {
        total += Math.round(rawStocks * (1 - rate)); // Dipotong pajak otomatis 5%
      } else {
        total += rawStocks; // Wajib Lapor Mandiri
      }
    }

    // 3. Sektor Properti
    if (this.state.taxes && this.state.taxes.property && this.state.taxes.property.suspended) {
      // Disuspend oleh KPP DJP -> Rp 0
    } else {
      if (rawProp <= 0) {
        // 0
      } else if (rawProp < threshold) {
        total += Math.round(rawProp * (1 - rate)); // Dipotong pajak otomatis 5%
      } else {
        total += rawProp; // Wajib Lapor Mandiri
      }
    }

    return total;
  },

  calculateSingleBusinessRevenue(biz) {
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
    if (!sector) return 0;

    // 1. Toko & Supermarket
    if (biz.sectorId === 'retail') {
      const sub = sector.subtypes.find(st => st.id === biz.subTypeId) || sector.subtypes[0];
      return Math.round(sub.revenue * Math.pow(1.25, biz.level - 1));
    }

    // 2. Taksi & Ojol (Dihitung dari armada kendaraan aktif)
    if (sector.isFleet) {
      let fleetRev = 0;
      if (biz.vehicles) {
        biz.vehicles.forEach(v => {
          const cat = TAXI_FLEET_VEHICLES.find(x => x.id === v.modelId);
          if (cat && v.km < cat.maxKm) {
            fleetRev += cat.revenue;
          }
        });
      }
      return fleetRev;
    }

    // 3. Fashion Brand (Milestones / Stages Roadmap)
    if (biz.sectorId === 'fashion') {
      const sub = sector.subtypes.find(st => st.id === biz.subTypeId) || sector.subtypes[0];
      const stageIdx = Math.min(biz.level, FASHION_STAGES.length) - 1;
      const stage = FASHION_STAGES[stageIdx] || FASHION_STAGES[0];
      return Math.round(sub.revenue * stage.multiplier);
    }

    // 4. Ekspedisi & Pergudangan Logistik
    if (sector.isLogistics) {
      let rev = 0;
      // Truk aktif
      if (biz.trucks) {
        biz.trucks.forEach(t => {
          const cat = LOGISTICS_FLEET_VEHICLES.find(x => x.id === t.modelId);
          if (cat && t.km < cat.maxKm) {
            rev += cat.revenue;
          }
        });
      }
      // Sewa mitra gudang
      if (biz.tenants) {
        biz.tenants.forEach(tenId => {
          const tenant = LOGISTICS_TENANTS_CATALOG.find(x => x.id === tenId);
          if (tenant) rev += tenant.hourlyRent;
        });
      }
      return rev;
    }

    // 5. Bank Komersial
    if (sector.isBank) {
      return this.calculateBankProfit(biz);
    }

    // 6. Studio Game & Software House (Beban Rutin Gaji Karyawan)
    if (sector.isTech || biz.sectorId === 'tech') {
      return -this.getTechHourlySalaries(biz);
    }

    // 7. Maskapai Penerbangan Komersial (Rute Antarnegara & Armada Pesawat)
    if (sector.isAirline || biz.sectorId === 'airline') {
      const stats = this.getAirlineOperatingStats(biz);
      return stats.grossRevenue;
    }

    // 8. Perusahaan Minyak & Gas Bumi (Kontrak Penyaluran Migas)
    if (sector.isOil || biz.sectorId === 'oil') {
      return this.getOilProductionStats(biz).totalHourlyRevenue;
    }

    // 9. Korporasi Tambang Nikel & Emas (Kontrak Suplai Konsentrat Logam)
    if (sector.isMining || biz.sectorId === 'mining') {
      return this.getMiningProductionStats(biz).totalHourlyRevenue;
    }

    // 10. Bisnis Lainnya (Kafe, Space)
    return Math.round((sector.baseRevenue || 0) * Math.pow(1.35, biz.level - 1));
  },

  calculateBankProfit(bankState) {
    const vault = bankState.vault || 0;
    const depRate = bankState.depositRate || 5.0;
    const credRate = bankState.creditRate || 11.5;
    const customerDeposits = this.getBankCustomerDeposits(bankState);

    const creditDemand = Math.max(0.1, 1 - (credRate - 5) / 30);
    const lendableFunds = vault + (customerDeposits * 0.85);
    const customerCredits = lendableFunds * creditDemand * 0.95;

    const creditIncome = customerCredits * (credRate / 100) / 12;
    const depositExpense = customerDeposits * (depRate / 100) / 12;

    return Math.round(creditIncome - depositExpense);
  }
});

// --- END js/modules/calculations.js ---

// --- BEGIN js/modules/tax.js ---
// Business Empire: RichMan - Tax System Module (DJP & PPh Final)
Object.assign(GameEngine.prototype, {
  getBusinessTax(biz) {
    if (!biz) return { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 };
    if (!biz.tax) {
      biz.tax = { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 };
    }
    return biz.tax;
  },

  renderTaxWidget() {
    const container = document.getElementById('home-tax-widget');
    if (!container) return;

    if (!this.state.taxes) {
      this.state.taxes = {
        business: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 },
        property: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 },
        stocks:   { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 }
      };
    }

    const { rawStocks, rawProp } = this.getSectorRevenueBreakdown();
    const threshold = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.MANDATORY_THRESHOLD) || 25000000;
    const now = Date.now();

    const bizList = this.state.businesses || [];
    let totalBizUnpaid = 0;
    let anyBizSuspended = false;
    bizList.forEach(b => {
      const t = this.getBusinessTax(b);
      totalBizUnpaid += (t.unpaid || 0);
      if (t.suspended) anyBizSuspended = true;
    });

    const taxProp = this.state.taxes.property || { unpaid: 0, deadline: null, suspended: false };
    const taxStock = this.state.taxes.stocks || { unpaid: 0, deadline: null, suspended: false };

    const totalUnpaid = totalBizUnpaid + (taxProp.unpaid || 0) + (taxStock.unpaid || 0);
    const hasSuspended = anyBizSuspended || taxProp.suspended || taxStock.suspended;

    let globalStatusBadge = '';
    if (hasSuspended) {
      globalStatusBadge = `<span class="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 font-extrabold text-[11px] border border-rose-500/40 tax-warning-pulse flex items-center gap-1">🚨 SANKSI PEMBEKUAN AKTIF</span>`;
    } else if (totalUnpaid > 0) {
      globalStatusBadge = `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/40 flex items-center gap-1">⏳ SPT MASA PERLU DIBAYAR</span>`;
    } else {
      globalStatusBadge = `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/40 flex items-center gap-1">✅ STATUS PAJAK TAAT</span>`;
    }

    const formatDeadline = (deadline, unpaid, isSuspended) => {
      if (isSuspended) {
        return `<span class="text-rose-400 font-black">LEWAT WAKTU (DISUSPEND)</span>`;
      }
      if (!unpaid || !deadline) {
        return `<span class="text-slate-400">Tidak ada tunggakan</span>`;
      }
      const remSec = Math.max(0, Math.ceil((deadline - now) / 1000));
      const hours = Math.floor(remSec / 3600);
      const mins = Math.floor((remSec % 3600) / 60);
      const secs = remSec % 60;
      let timeStr = '';
      if (hours > 0) {
        timeStr = `${hours}j ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}d`;
      } else {
        timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      const color = remSec <= 3600 ? 'text-rose-400 font-bold tax-warning-pulse' : 'text-amber-400 font-bold';
      return `<span class="${color}" data-tax-timer="${deadline}">${timeStr}</span>`;
    };

    const renderSectorCard = (title, icon, rawIncome, taxObj, sectorKey) => {
      const isMandatory = rawIncome >= threshold;
      const isSuspended = taxObj.suspended;
      const unpaid = taxObj.unpaid || 0;

      let modeBadge = '';
      if (isSuspended) {
        modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">DIBEKUKAN DJP</span>`;
      } else if (isMandatory) {
        modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">Wajib Bayar Mandiri (5%)</span>`;
      } else {
        modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">Otomatis Net 95%</span>`;
      }

      return `
        <div class="p-3 rounded-xl bg-slate-950/80 border ${isSuspended ? 'tax-suspended-glow border-rose-500/80' : (unpaid > 0 ? 'border-amber-500/40' : 'border-slate-800')} space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 font-bold text-white text-xs">
              <span>${icon}</span>
              <span>${title}</span>
            </div>
            ${modeBadge}
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span class="text-slate-400 block text-[10px]">Pendapatan Kotor:</span>
              <span class="font-bold text-slate-200">${rawIncome >= 0 ? '+' : ''}${this.formatCompact(rawIncome)}/jam</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Tagihan Pajak Terhutang:</span>
              <span class="font-bold ${unpaid > 0 ? (isSuspended ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}">
                ${unpaid > 0 ? this.formatMoney(unpaid) : (isMandatory ? 'Rp 0' : 'Auto 5% Terpotong')}
              </span>
            </div>
          </div>

          ${isMandatory || unpaid > 0 || isSuspended ? `
            <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
              <span class="text-slate-400">Jatuh Tempo:</span>
              ${formatDeadline(taxObj.deadline, unpaid, isSuspended)}
            </div>
            <button onclick="game.payTax('${sectorKey}')" ${unpaid <= 0 ? 'disabled' : ''} class="btn-press w-full mt-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${unpaid > 0 ? (isSuspended ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-md shadow-rose-500/20' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20') : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
              <span>Bayar Pajak ${unpaid > 0 ? '(' + this.formatCompact(unpaid) + ')' : ''}</span>
            </button>
          ` : `
            <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
              ✓ Omzet di bawah ${this.formatCompact(threshold)}/jam, pajak 5% otomatis terpotong saat jam game berganti.
            </div>
          `}
        </div>
      `;
    };

    const bizCardsHtml = bizList.length === 0
      ? `<div class="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center text-xs text-slate-400">Belum ada bisnis yang didirikan.</div>`
      : bizList.map(biz => {
          const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId) || { name: 'Bisnis', icon: '🏢' };
          const rawIncome = this.calculateSingleBusinessRevenue(biz);
          const taxObj = this.getBusinessTax(biz);
          const unpaid = taxObj.unpaid || 0;
          const isSuspended = taxObj.suspended;
          const isMandatory = rawIncome >= threshold;

          let modeBadge = '';
          if (isSuspended) {
            modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">DIBEKUKAN DJP</span>`;
          } else if (isMandatory) {
            modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">Wajib Mandiri (5%)</span>`;
          } else {
            modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">Otomatis Net 95%</span>`;
          }

          return `
            <div class="p-3 rounded-xl bg-slate-950/80 border ${isSuspended ? 'tax-suspended-glow border-rose-500/80' : (unpaid > 0 ? 'border-amber-500/40' : 'border-slate-800')} space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 font-bold text-white text-xs">
                  <span>${sector.icon}</span>
                  <span class="truncate max-w-[170px]">${biz.name}</span>
                  <span class="text-[10px] text-slate-400 font-normal">(${sector.name})</span>
                </div>
                ${modeBadge}
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span class="text-slate-400 block text-[10px]">Pendapatan Kotor:</span>
                  <span class="font-bold text-slate-200">${rawIncome >= 0 ? '+' : ''}${this.formatCompact(rawIncome)}/jam</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Tagihan Pajak Terhutang:</span>
                  <span class="font-bold ${unpaid > 0 ? (isSuspended ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}">
                    ${unpaid > 0 ? this.formatMoney(unpaid) : (isMandatory ? 'Rp 0' : 'Auto 5% Terpotong')}
                  </span>
                </div>
              </div>

              ${isMandatory || unpaid > 0 || isSuspended ? `
                <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span class="text-slate-400">Jatuh Tempo (72 Jam):</span>
                  ${formatDeadline(taxObj.deadline, unpaid, isSuspended)}
                </div>
                <button onclick="game.payBusinessTax('${biz.instanceId}')" ${unpaid <= 0 ? 'disabled' : ''} class="btn-press w-full mt-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${unpaid > 0 ? (isSuspended ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-md shadow-rose-500/20' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20') : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
                  <span>Bayar Pajak ${unpaid > 0 ? '(' + this.formatCompact(unpaid) + ')' : ''}</span>
                </button>
              ` : `
                <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                  ✓ Omzet di bawah ${this.formatCompact(threshold)}/jam, pajak 5% otomatis terpotong saat jam game berganti.
                </div>
              `}
            </div>
          `;
        }).join('');

    container.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-base">
            🏛️
          </div>
          <div>
            <h3 class="text-xs uppercase tracking-wider font-extrabold text-white">KPP & Kepatuhan Fiskal (DJP)</h3>
            <span class="text-[10px] text-slate-400">Tarif 5% Per Jam Game • Tenggat 72 Jam</span>
          </div>
        </div>
        ${globalStatusBadge}
      </div>

      <!-- Ringkasan Total Tagihan & Aksi Bayar Semua -->
      <div class="p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Pajak Terhutang</span>
          <div class="text-lg font-black ${totalUnpaid > 0 ? (hasSuspended ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}">
            ${this.formatMoney(totalUnpaid)}
          </div>
        </div>
        ${totalUnpaid > 0 ? `
          <button onclick="game.payAllTaxes()" class="btn-press px-4 py-2 rounded-xl ${hasSuspended ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'} font-black text-xs shadow-md flex items-center gap-1.5">
            <span>💳 Lunasi Semua Pajak</span>
          </button>
        ` : `
          <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            Bebas Tunggakan ✨
          </span>
        `}
      </div>

      <!-- Sektor Pajak Bisnis Komersial (Per Bisnis) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between pt-1">
          <span class="text-xs uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-1.5">
            <span>🏢</span> Pajak Bisnis Komersial (${bizList.length} Entitas)
          </span>
          <span class="text-[11px] font-mono text-amber-400 font-bold">
            ${totalBizUnpaid > 0 ? this.formatMoney(totalBizUnpaid) : 'Rp 0'}
          </span>
        </div>
        ${bizCardsHtml}
      </div>

      <!-- Sektor Investasi & Properti -->
      <div class="space-y-2 pt-2 border-t border-slate-800/80">
        <span class="text-xs uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-1.5">
          <span>💼</span> Pajak Investasi & Properti
        </span>
        ${renderSectorCard('Sewa Properti', '🏠', rawProp, taxProp, 'property')}
        ${renderSectorCard('Dividen Portofolio Saham', '📈', rawStocks, taxStock, 'stocks')}
      </div>

      <!-- Ketentuan Peraturan Pajak -->
      <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
        <div class="font-bold text-slate-300 flex items-center gap-1">
          <span>📜 Ketentuan Kebijakan Fiskal DJP:</span>
        </div>
        <div>• <strong>Tarif Pajak:</strong> Flat 5% dari pendapatan usahanya setiap jam game (berbasis 1 jam dunia nyata).</div>
        <div>• <strong>Pajak Terpisah Per Bisnis:</strong> Masing-masing perusahaan memiliki catatan pajak mandiri dan dapat dibayar terpisah.</div>
        <div>• <strong>Usaha Pemula (&lt; Rp 25 Jt/jam):</strong> Pajak 5% dipotong otomatis dari kas masuk (PPh Final net 95%).</div>
        <div>• <strong>Usaha Besar (&ge; Rp 25 Jt/jam):</strong> Wajib bayar mandiri dengan batas jatuh tempo <strong>72 jam dunia nyata (3 hari)</strong>.</div>
        <div>• <strong>Sanksi Suspensi:</strong> Jika melewati batas 72 jam belum dibayar, operasional bisnis terkait DIBEKUKAN sampai pajak dilunasi.</div>
      </div>
    `;
  },

  updateLiveTaxTimers() {
    const now = Date.now();
    document.querySelectorAll('[data-tax-timer]').forEach(el => {
      const deadline = parseInt(el.getAttribute('data-tax-timer'), 10);
      if (isNaN(deadline) || deadline <= 0) return;
      const remSec = Math.max(0, Math.ceil((deadline - now) / 1000));
      if (remSec === 0) {
        el.textContent = 'LEWAT WAKTU (DISUSPEND)';
        el.className = 'text-rose-400 font-black';
      } else {
        const hours = Math.floor(remSec / 3600);
        const mins = Math.floor((remSec % 3600) / 60);
        const secs = remSec % 60;
        if (hours > 0) {
          el.textContent = `${hours}j ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}d`;
        } else {
          el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        if (remSec <= 3600) {
          el.className = 'text-rose-400 font-bold tax-warning-pulse';
        } else {
          el.className = 'text-amber-400 font-bold';
        }
      }
    });
  },

  payBusinessTax(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;
    const taxObj = this.getBusinessTax(biz);
    const amount = taxObj.unpaid || 0;

    if (amount <= 0) {
      this.showToast(`Tidak ada tunggakan pajak untuk bisnis "${biz.name}".`, 'info');
      return;
    }

    if (this.state.cash < amount) {
      window.sound.playError();
      this.showToast(`Kas tunai tidak cukup! Butuh ${this.formatMoney(amount)} untuk melunasi pajak bisnis ini.`, 'error');
      return;
    }

    this.state.cash -= amount;
    taxObj.totalPaidLifetime = (taxObj.totalPaidLifetime || 0) + amount;
    taxObj.unpaid = 0;
    taxObj.deadline = null;
    const wasSuspended = taxObj.suspended;
    taxObj.suspended = false;

    window.sound.playCash();
    if (wasSuspended) {
      this.showToast(`✅ Pembayaran pajak bisnis "${biz.name}" sebesar ${this.formatMoney(amount)} BERHASIL! Sanksi suspensi resmi DICABUT dan operasional kembali aktif!`, 'success');
    } else {
      this.showToast(`✅ Pembayaran pajak bisnis "${biz.name}" sebesar ${this.formatMoney(amount)} BERHASIL disetorkan ke Kas Negara!`, 'success');
    }

    this.saveGame();
    this.render();
  },

  payTax(sector) {
    if (sector === 'business') {
      let totalBizDue = 0;
      if (Array.isArray(this.state.businesses)) {
        this.state.businesses.forEach(b => {
          totalBizDue += (this.getBusinessTax(b).unpaid || 0);
        });
      }
      if (totalBizDue <= 0) {
        this.showToast('Tidak ada tagihan pajak bisnis yang perlu dibayar.', 'info');
        return;
      }
      if (this.state.cash < totalBizDue) {
        window.sound.playError();
        this.showToast(`Kas tunai tidak cukup! Butuh ${this.formatMoney(totalBizDue)} untuk melunasi seluruh pajak bisnis.`, 'error');
        return;
      }
      this.state.cash -= totalBizDue;
      let hadSuspended = false;
      this.state.businesses.forEach(b => {
        const t = this.getBusinessTax(b);
        if (t.unpaid > 0) {
          if (t.suspended) hadSuspended = true;
          t.totalPaidLifetime = (t.totalPaidLifetime || 0) + t.unpaid;
          t.unpaid = 0;
          t.deadline = null;
          t.suspended = false;
        }
      });
      window.sound.playCash();
      if (hadSuspended) {
        this.showToast(`✅ Pembayaran seluruh pajak bisnis (${this.formatMoney(totalBizDue)}) BERHASIL! Seluruh sanksi suspensi bisnis dicabut!`, 'success');
      } else {
        this.showToast(`✅ Pembayaran seluruh pajak bisnis (${this.formatMoney(totalBizDue)}) BERHASIL disetorkan!`, 'success');
      }
      this.saveGame();
      this.render();
      return;
    }

    if (!this.state.taxes || !this.state.taxes[sector]) return;
    const taxObj = this.state.taxes[sector];
    const amount = taxObj.unpaid || 0;

    if (amount <= 0) {
      this.showToast('Tidak ada tagihan pajak untuk sektor ini.', 'info');
      return;
    }

    if (this.state.cash < amount) {
      window.sound.playError();
      this.showToast(`Kas tunai tidak cukup! Butuh ${this.formatMoney(amount)} untuk melunasi pajak.`, 'error');
      return;
    }

    this.state.cash -= amount;
    taxObj.totalPaidLifetime = (taxObj.totalPaidLifetime || 0) + amount;
    taxObj.unpaid = 0;
    taxObj.deadline = null;
    const wasSuspended = taxObj.suspended;
    taxObj.suspended = false;

    window.sound.playCash();
    const secName = sector === 'property' ? 'Sewa Properti' : 'Dividen Saham';
    if (wasSuspended) {
      this.showToast(`✅ Pembayaran pajak ${secName} sebesar ${this.formatMoney(amount)} BERHASIL! Sanksi suspensi resmi DICABUT dan pendapatan kembali aktif!`, 'success');
    } else {
      this.showToast(`✅ Pembayaran pajak ${secName} sebesar ${this.formatMoney(amount)} BERHASIL! SPT Masa telah disetorkan ke Kas Negara.`, 'success');
    }

    this.saveGame();
    this.render();
  },

  payAllTaxes() {
    let totalDue = 0;
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(b => {
        totalDue += (this.getBusinessTax(b).unpaid || 0);
      });
    }
    ['property', 'stocks'].forEach(s => {
      if (this.state.taxes && this.state.taxes[s]) {
        totalDue += (this.state.taxes[s].unpaid || 0);
      }
    });

    if (totalDue <= 0) {
      this.showToast('Seluruh kewajiban pajak Anda telah lunas!', 'info');
      return;
    }

    if (this.state.cash < totalDue) {
      window.sound.playError();
      this.showToast(`Kas tunai tidak cukup! Butuh total ${this.formatMoney(totalDue)} untuk melunasi seluruh pajak.`, 'error');
      return;
    }

    this.state.cash -= totalDue;
    let hadSuspended = false;

    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(b => {
        const t = this.getBusinessTax(b);
        if (t.unpaid > 0) {
          if (t.suspended) hadSuspended = true;
          t.totalPaidLifetime = (t.totalPaidLifetime || 0) + t.unpaid;
          t.unpaid = 0;
          t.deadline = null;
          t.suspended = false;
        }
      });
    }

    ['property', 'stocks'].forEach(s => {
      const taxObj = this.state.taxes[s];
      if (taxObj && taxObj.unpaid > 0) {
        if (taxObj.suspended) hadSuspended = true;
        taxObj.totalPaidLifetime = (taxObj.totalPaidLifetime || 0) + taxObj.unpaid;
        taxObj.unpaid = 0;
        taxObj.deadline = null;
        taxObj.suspended = false;
      }
    });

    window.sound.playCash();
    if (hadSuspended) {
      this.showToast(`✅ Seluruh pajak senilai ${this.formatMoney(totalDue)} LUNAS! Seluruh pembekuan/suspensi telah dicabut!`, 'success');
    } else {
      this.showToast(`✅ Seluruh pajak senilai ${this.formatMoney(totalDue)} LUNAS! Kerajaan bisnis Anda 100% taat aturan pajak!`, 'success');
    }

    this.saveGame();
    this.render();
  }
});

// --- END js/modules/tax.js ---

// --- BEGIN js/modules/business.js ---
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

// --- END js/modules/business.js ---

// --- BEGIN js/modules/invest.js ---
// Business Empire: RichMan - Investment System Module (Stocks, Crypto, Real Estate, Luxury)
Object.assign(GameEngine.prototype, {
  setStockView(view) {
    this.stockView = view;
    window.sound.playClick();
    const port = document.getElementById('stocks-view-portfolio');
    const mkt = document.getElementById('stocks-view-market');
    if (port && mkt) {
      if (view === 'portfolio') {
        port.classList.remove('hidden');
        port.classList.remove('view-transition');
        void port.offsetWidth;
        port.classList.add('view-transition');
        mkt.classList.add('hidden');
      } else {
        port.classList.add('hidden');
        mkt.classList.remove('hidden');
        mkt.classList.remove('view-transition');
        void mkt.offsetWidth;
        mkt.classList.add('view-transition');
      }
    }
    this.renderStockList();
  },

  setCryptoView(view) {
    this.cryptoView = view;
    window.sound.playClick();
    const port = document.getElementById('crypto-view-portfolio');
    const mkt = document.getElementById('crypto-view-market');
    if (port && mkt) {
      if (view === 'portfolio') {
        port.classList.remove('hidden');
        port.classList.remove('view-transition');
        void port.offsetWidth;
        port.classList.add('view-transition');
        mkt.classList.add('hidden');
      } else {
        port.classList.add('hidden');
        mkt.classList.remove('hidden');
        mkt.classList.remove('view-transition');
        void mkt.offsetWidth;
        mkt.classList.add('view-transition');
      }
    }
    this.renderCryptoList();
  },

  setPropertyView(view) {
    this.propertyView = view;
    window.sound.playClick();
    const port = document.getElementById('property-view-portfolio');
    const cat = document.getElementById('property-view-catalog');
    if (port && cat) {
      if (view === 'portfolio') {
        port.classList.remove('hidden');
        port.classList.remove('view-transition');
        void port.offsetWidth;
        port.classList.add('view-transition');
        cat.classList.add('hidden');
      } else {
        port.classList.add('hidden');
        cat.classList.remove('hidden');
        cat.classList.remove('view-transition');
        void cat.offsetWidth;
        cat.classList.add('view-transition');
      }
    }
    this.renderRealEstate();
  },

  setLuxuryView(view) {
    this.luxuryView = view;
    window.sound.playClick();
    const owned = document.getElementById('luxury-view-owned');
    const cat = document.getElementById('luxury-view-catalog');
    if (owned && cat) {
      if (view === 'owned') {
        owned.classList.remove('hidden');
        owned.classList.remove('view-transition');
        void owned.offsetWidth;
        owned.classList.add('view-transition');
        cat.classList.add('hidden');
      } else {
        owned.classList.add('hidden');
        cat.classList.remove('hidden');
        cat.classList.remove('view-transition');
        void cat.offsetWidth;
        cat.classList.add('view-transition');
      }
    }
    this.renderLuxury();
  },

  switchInvestSubTab(subTab) {
    this.investSubTab = subTab;
    window.sound.playClick();

    ['stocks', 'crypto', 'commodity', 'property'].forEach(tab => {
      const btn = document.getElementById(`invest-sub-btn-${tab}`);
      const sec = document.getElementById(`invest-${tab}-sec`);
      if (btn) {
        if (tab === subTab) {
          btn.className = 'flex-1 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs shadow transition';
        } else {
          btn.className = 'flex-1 py-1.5 rounded-lg text-slate-400 hover:text-white font-semibold text-xs transition';
        }
      }
      if (sec) {
        if (tab === subTab) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      }
    });

    this.renderInvestments();
  },

  setRealEstateFilter(filter) {
    this.realEstateFilter = filter;
    window.sound.playClick();
    this.renderRealEstate();
  },

  setLuxuryFilter(filter) {
    this.luxuryFilter = filter;
    window.sound.playClick();
    this.renderLuxury();
  },

  getPropertyData(id) {
    let p = this.state.properties[id];
    if (!p) {
      this.state.properties[id] = { count: 0, furnished: false, internet: false, condition: 100 };
      return this.state.properties[id];
    }
    if (typeof p === 'number') {
      this.state.properties[id] = { count: p, furnished: false, internet: false, condition: 100 };
      return this.state.properties[id];
    }
    if (p.condition === undefined) p.condition = 100;
    if (p.furnished === undefined) p.furnished = false;
    if (p.internet === undefined) p.internet = false;
    if (p.count === undefined) p.count = 0;
    return p;
  },

  buyProperty(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    if (!prop) return;

    const pData = this.getPropertyData(id);
    if (pData.count >= 1) {
      window.sound.playClick();
      this.showToast(`Properti ${prop.name} sudah Anda miliki! Setiap unit properti bersifat eksklusif (1 unit per aset).`, 'warning');
      return;
    }

    if (this.state.cash < prop.price) {
      window.sound.playError();
      this.showToast('Uang tunai tidak cukup untuk membeli properti ini!', 'error');
      return;
    }

    this.state.cash -= prop.price;
    pData.count = 1;
    pData.condition = 100;
    pData.furnished = false;
    pData.internet = false;
    window.sound.playUpgrade();
    this.showToast(`Selamat! Anda resmi memiliki ${prop.name}! Properti telah dipindahkan ke portofolio Anda.`, 'success');
    this.saveGame();
    this.render();
  },

  buyPropertyFurniture(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    const pData = this.getPropertyData(id);
    if (!prop || pData.count <= 0) return;

    if (pData.furnished) {
      this.showToast('Tempat tidur dan perabot furnitur sudah terpasang lengkap!', 'info');
      return;
    }

    const totalCost = prop.furnitureCost * pData.count;
    if (this.state.cash < totalCost) {
      window.sound.playError();
      this.showToast(`Uang tidak cukup untuk pembelian perabot & kasur! Butuh ${this.formatCompact(totalCost)}`, 'error');
      return;
    }

    this.state.cash -= totalCost;
    pData.furnished = true;
    window.sound.playUpgrade();
    this.showToast(`Tempat tidur & furnitur lengkap dipasang di unit ${prop.name}! (+25% Pendapatan Sewa)`, 'success');
    this.saveGame();
    this.render();
  },

  buyPropertyInternet(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    const pData = this.getPropertyData(id);
    if (!prop || pData.count <= 0) return;

    if (pData.internet) {
      this.showToast('Jaringan WiFi internet cepat sudah terpasang!', 'info');
      return;
    }

    const totalCost = prop.internetCost * pData.count;
    if (this.state.cash < totalCost) {
      window.sound.playError();
      this.showToast(`Uang tidak cukup untuk pasang internet! Butuh ${this.formatCompact(totalCost)}`, 'error');
      return;
    }

    this.state.cash -= totalCost;
    pData.internet = true;
    window.sound.playUpgrade();
    this.showToast(`Pemasangan internet cepat fiber optik selesai di unit ${prop.name}! (+15% Pendapatan Sewa)`, 'success');
    this.saveGame();
    this.render();
  },

  serviceProperty(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    const pData = this.getPropertyData(id);
    if (!prop || pData.count <= 0) return;

    if (pData.condition >= 100) {
      this.showToast('Kondisi properti masih prima 100%, belum butuh servis perbaikan.', 'info');
      return;
    }

    const serviceCost = Math.round(prop.price * 0.03 * pData.count * ((100 - pData.condition) / 100)) + 500000;
    if (this.state.cash < serviceCost) {
      window.sound.playError();
      this.showToast(`Uang tidak cukup untuk biaya perbaikan! Butuh ${this.formatCompact(serviceCost)}`, 'error');
      return;
    }

    this.state.cash -= serviceCost;
    pData.condition = 100;
    window.sound.playUpgrade();
    this.showToast(`Servis dan perbaikan selesai! Kondisi ${prop.name} kembali 100% prima.`, 'success');
    this.saveGame();
    this.render();
  },

  sellProperty(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    const pData = this.getPropertyData(id);
    if (!prop || pData.count <= 0) return;

    const sellPrice = Math.round(prop.price * 0.9);
    pData.count -= 1;
    if (pData.count === 0) {
      pData.furnished = false;
      pData.internet = false;
      pData.condition = 100;
    }
    this.state.cash += sellPrice;
    window.sound.playCash();
    this.showToast(`1 unit ${prop.name} berhasil dijual seharga ${this.formatCompact(sellPrice)}!`, 'info');
    this.saveGame();
    this.render();
  },

  buyLuxury(id) {
    const lux = LUXURY_CATALOG.find(x => x.id === id);
    if (!lux) return;

    if (this.state.luxury.includes(id)) {
      this.showToast('Barang mewah ini sudah Anda miliki dalam koleksi!', 'info');
      return;
    }

    if (this.state.cash < lux.price) {
      window.sound.playError();
      this.showToast('Uang tunai belum cukup untuk barang bergengsi ini!', 'error');
      return;
    }

    this.state.cash -= lux.price;
    this.state.luxury.push(id);
    window.sound.playUpgrade();
    this.showToast(`Koleksi Baru! ${lux.name} telah masuk ke garasi/koleksi Anda!`, 'success');
    this.saveGame();
    this.render();
  },

  sellLuxury(id) {
    const idx = (this.state.luxury || []).indexOf(id);
    if (idx === -1) return;
    const lux = LUXURY_CATALOG.find(x => x.id === id);
    if (!lux) return;

    const sellPrice = Math.round(lux.price * 0.75);
    this.state.luxury.splice(idx, 1);
    this.state.cash += sellPrice;
    window.sound.playCash();
    this.showToast(`Berhasil menjual ${lux.name} seharga ${this.formatCompact(sellPrice)}!`, 'info');
    this.saveGame();
    this.render();
  },

  buyStock(symbol, shares) {
    const price = this.stockPrices[symbol];
    if (!price || shares <= 0) return;
    const totalCost = price * shares;
    if (this.state.cash < totalCost) {
      window.sound.playError();
      this.showToast('Uang tunai tidak cukup untuk membeli saham ini!', 'error');
      return;
    }

    this.state.cash -= totalCost;
    if (!this.state.stocks[symbol]) {
      this.state.stocks[symbol] = { shares: 0, totalCost: 0 };
    }
    this.state.stocks[symbol].shares += shares;
    this.state.stocks[symbol].totalCost += totalCost;

    window.sound.playCash();
    this.showToast(`Membeli ${shares.toLocaleString()} lembar ${symbol} seharga ${this.formatCompact(totalCost)}`, 'success');
    this.saveGame();
    this.render();
  },

  sellStock(symbol, shares) {
    const price = this.stockPrices[symbol];
    const userStock = this.state.stocks[symbol];
    if (!price || !userStock || userStock.shares < shares || shares <= 0) {
      window.sound.playError();
      this.showToast('Jumlah lembar saham tidak mencukupi untuk dijual!', 'error');
      return;
    }

    const totalRevenue = price * shares;
    const avgCostPerShare = userStock.shares > 0 ? (userStock.totalCost / userStock.shares) : 0;
    const costBasis = Math.round(avgCostPerShare * shares);
    const profit = Math.round(totalRevenue - costBasis);

    userStock.shares -= shares;
    userStock.totalCost = Math.max(0, userStock.totalCost - costBasis);
    this.state.cash += totalRevenue;

    // Catat akumulasi keuntungan trading saham
    if (!this.state.stats) {
      this.state.stats = { stockTradingProfit: 0, cryptoTradingProfit: 0, dividendsEarned: 0, businessEarnings: 0, rentalEarnings: 0 };
    }
    this.state.stats.stockTradingProfit = (this.state.stats.stockTradingProfit || 0) + profit;

    window.sound.playCash();
    const profitSign = profit >= 0 ? '+' : '-';
    this.showToast(`Menjual ${shares.toLocaleString()} lembar ${symbol} seharga ${this.formatCompact(totalRevenue)} (Profit: ${profitSign}${this.formatCompact(Math.abs(profit))})`, 'info');
    this.saveGame();
    this.render();
  },

  buyCrypto(symbol, spendCash) {
    const price = this.cryptoPrices[symbol];
    if (!price || spendCash <= 0) return;
    if (this.state.cash < spendCash) {
      window.sound.playError();
      this.showToast('Uang tunai tidak mencukupi!', 'error');
      return;
    }

    const amount = spendCash / price;
    this.state.cash -= spendCash;
    if (!this.state.crypto[symbol]) {
      this.state.crypto[symbol] = { amount: 0, totalCost: 0 };
    }
    this.state.crypto[symbol].amount += amount;
    this.state.crypto[symbol].totalCost += spendCash;

    window.sound.playCash();
    this.showToast(`Membeli ${amount.toFixed(4)} ${symbol} seharga ${this.formatCompact(spendCash)}`, 'success');
    this.saveGame();
    this.render();
  },

  sellCrypto(symbol, fraction) {
    const price = this.cryptoPrices[symbol];
    const userCrypto = this.state.crypto[symbol];
    if (!price || !userCrypto || userCrypto.amount <= 0.00001) {
      window.sound.playError();
      this.showToast('Saldo koin kripto Anda kosong!', 'error');
      return;
    }

    const isFullSell = fraction >= 0.99999;
    const amountToSell = isFullSell ? userCrypto.amount : userCrypto.amount * fraction;
    const totalRevenue = amountToSell * price;
    const costBasis = isFullSell ? userCrypto.totalCost : Math.round(userCrypto.totalCost * fraction);
    const profit = Math.round(totalRevenue - costBasis);

    if (isFullSell || (userCrypto.amount - amountToSell) <= 0.00001) {
      userCrypto.amount = 0;
      userCrypto.totalCost = 0;
    } else {
      userCrypto.amount -= amountToSell;
      userCrypto.totalCost = Math.max(0, userCrypto.totalCost - costBasis);
    }
    this.state.cash += totalRevenue;

    // Catat akumulasi keuntungan trading kripto
    if (!this.state.stats) {
      this.state.stats = { stockTradingProfit: 0, cryptoTradingProfit: 0, dividendsEarned: 0, businessEarnings: 0, rentalEarnings: 0 };
    }
    this.state.stats.cryptoTradingProfit = (this.state.stats.cryptoTradingProfit || 0) + profit;

    window.sound.playCash();
    const profitSign = profit >= 0 ? '+' : '-';
    this.showToast(`Menjual ${amountToSell.toFixed(4)} ${symbol} seharga ${this.formatCompact(totalRevenue)} (Profit: ${profitSign}${this.formatCompact(Math.abs(profit))})`, 'info');
    this.saveGame();
    this.render();
  },

  simulateMarketTick(forceLargeChange = false) {
    STOCKS_CATALOG.forEach(stock => {
      const vol = stock.volatility * (forceLargeChange ? 2.5 : 1);
      const deltaPercent = (Math.random() - 0.495) * vol;
      let newPrice = Math.round(this.stockPrices[stock.symbol] * (1 + deltaPercent));
      newPrice = Math.max(Math.round(stock.basePrice * 0.25), Math.min(newPrice, stock.basePrice * 5));
      this.stockPrices[stock.symbol] = newPrice;

      const history = this.stockHistories[stock.symbol];
      history.push(newPrice);
      if (history.length > 20) history.shift();
    });

    CRYPTO_CATALOG.forEach(coin => {
      const vol = coin.volatility * (forceLargeChange ? 2.5 : 1);
      const deltaPercent = (Math.random() - 0.49) * vol;
      let newPrice = Math.round(this.cryptoPrices[coin.symbol] * (1 + deltaPercent));
      newPrice = Math.max(Math.round(coin.basePrice * 0.1), Math.min(newPrice, coin.basePrice * 10));
      this.cryptoPrices[coin.symbol] = newPrice;

      const history = this.cryptoHistories[coin.symbol];
      history.push(newPrice);
      if (history.length > 20) history.shift();
    });

    if (typeof COMMODITIES_CATALOG !== 'undefined') {
      COMMODITIES_CATALOG.forEach(comm => {
        const vol = comm.volatility * (forceLargeChange ? 2.5 : 1);
        const deltaPercent = (Math.random() - 0.495) * vol;
        let newPrice = Math.round((this.commodityPrices[comm.symbol] || comm.basePrice) * (1 + deltaPercent));
        newPrice = Math.max(Math.round(comm.basePrice * 0.2), Math.min(newPrice, comm.basePrice * 6));
        this.commodityPrices[comm.symbol] = newPrice;

        if (!this.commodityHistories[comm.symbol]) {
          this.commodityHistories[comm.symbol] = [newPrice];
        } else {
          const history = this.commodityHistories[comm.symbol];
          history.push(newPrice);
          if (history.length > 20) history.shift();
        }
      });
    }

    // Cek Likuidasi Posisi Komoditas Aktif (-98% margin loss)
    if (Array.isArray(this.state.commodityPositions) && this.state.commodityPositions.length > 0) {
      let liquidated = 0;
      this.state.commodityPositions = this.state.commodityPositions.filter(pos => {
        const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
        const priceChange = (curPrice - pos.entryPrice) / pos.entryPrice;
        const pnlRate = (pos.type === 'LONG' ? priceChange : -priceChange) * (pos.leverage || 1);
        if (pnlRate <= -0.98) {
          liquidated++;
          return false;
        }
        return true;
      });
      if (liquidated > 0) {
        window.sound.playError();
        this.showToast(`🚨 PERINGATAN MARGIN CALL: ${liquidated} kontrak trading komoditas Anda terlikuidasi otomatis (rugi 100%) akibat pergerakan pasar tajam!`, 'error');
        this.saveGame();
        this.render();
      }
    }
  },

  // ------------------------------------------
  // TRADING SAHAM DENGAN INPUT CUSTOM
  // ------------------------------------------
  openStockModal(symbol) {
    this.stockDetailSymbol = symbol;
    const stock = STOCKS_CATALOG.find(x => x.symbol === symbol);
    const userHold = this.state.stocks[symbol] || { shares: 0, totalCost: 0 };
    const price = this.stockPrices[symbol];

    const modal = document.getElementById('stock-modal');
    if (!modal) return;

    document.getElementById('stock-modal-title').innerText = `${stock.icon} ${stock.name} (${stock.symbol})`;
    document.getElementById('stock-modal-price').innerText = this.formatMoney(price);
    document.getElementById('stock-modal-owned').innerText = `${userHold.shares.toLocaleString()} Lembar (${this.formatCompact(userHold.shares * price)})`;
    document.getElementById('stock-modal-dividend').innerText = `+${(stock.dividendYieldHourly * 100).toFixed(2)}%/jam`;

    // Maksimal lembar saham yang mampu dibeli dari saldo kas tunai
    const maxBuy = price > 0 ? Math.floor(this.state.cash / price) : 0;
    const maxBuyEl = document.getElementById('stock-modal-max-buy');
    if (maxBuyEl) maxBuyEl.innerText = `${maxBuy.toLocaleString()} Lembar (${this.formatCompact(maxBuy * price)})`;

    // Reset input form
    const buyInput = document.getElementById('stock-buy-input');
    if (buyInput) buyInput.value = '';
    const sellInput = document.getElementById('stock-sell-input');
    if (sellInput) sellInput.value = '';
    this.onStockBuyInputChange('');
    this.onStockSellInputChange('');

    modal.classList.remove('hidden');
  },

  closeStockModal() {
    const modal = document.getElementById('stock-modal');
    if (modal) modal.classList.add('hidden');
  },

  onStockBuyInputChange(val) {
    const shares = parseInt(val) || 0;
    const price = (this.stockPrices && this.stockPrices[this.stockDetailSymbol]) || 0;
    const cost = shares * price;
    const preview = document.getElementById('stock-buy-preview');
    if (preview) preview.innerText = `Estimasi: ${this.formatMoney(cost)}`;
  },

  setStockBuyInput(shares) {
    const price = (this.stockPrices && this.stockPrices[this.stockDetailSymbol]) || 1;
    if (shares === 'max') {
      shares = Math.floor(this.state.cash / price);
    }
    const input = document.getElementById('stock-buy-input');
    if (input) input.value = shares > 0 ? shares : '';
    this.onStockBuyInputChange(shares);
  },

  buyStockCustom() {
    const input = document.getElementById('stock-buy-input');
    const shares = parseInt(input ? input.value : 0) || 0;
    if (shares <= 0) {
      window.sound.playError();
      this.showToast('Ketik jumlah lembar saham yang ingin dibeli terlebih dahulu!', 'error');
      return;
    }
    this.buyStock(this.stockDetailSymbol, shares);
    this.openStockModal(this.stockDetailSymbol);
  },

  onStockSellInputChange(val) {
    const shares = parseInt(val) || 0;
    const price = (this.stockPrices && this.stockPrices[this.stockDetailSymbol]) || 0;
    const revenue = shares * price;
    const preview = document.getElementById('stock-sell-preview');
    if (preview) preview.innerText = `Estimasi: ${this.formatMoney(revenue)}`;
  },

  setStockSellInput(shares) {
    const userHold = this.state.stocks[this.stockDetailSymbol] || { shares: 0 };
    if (shares === 'all') {
      shares = userHold.shares;
    }
    const input = document.getElementById('stock-sell-input');
    if (input) input.value = shares > 0 ? shares : '';
    this.onStockSellInputChange(shares);
  },

  sellStockCustom() {
    const input = document.getElementById('stock-sell-input');
    const shares = parseInt(input ? input.value : 0) || 0;
    if (shares <= 0) {
      window.sound.playError();
      this.showToast('Ketik jumlah lembar saham yang ingin dijual terlebih dahulu!', 'error');
      return;
    }
    this.sellStock(this.stockDetailSymbol, shares);
    this.openStockModal(this.stockDetailSymbol);
  },

  buyStockQuick(shares) {
    if (shares === 'max') {
      const price = this.stockPrices[this.stockDetailSymbol];
      shares = Math.floor(this.state.cash / price);
    }
    this.buyStock(this.stockDetailSymbol, parseInt(shares));
    this.openStockModal(this.stockDetailSymbol);
  },

  sellStockQuick(shares) {
    const userHold = this.state.stocks[this.stockDetailSymbol] || { shares: 0 };
    if (shares === 'max') {
      shares = userHold.shares;
    }
    this.sellStock(this.stockDetailSymbol, parseInt(shares));
    this.openStockModal(this.stockDetailSymbol);
  },

  // ------------------------------------------
  // TRADING KRIPTO DENGAN INPUT CUSTOM
  // ------------------------------------------
  openCryptoModal(symbol) {
    this.cryptoDetailSymbol = symbol;
    const coin = CRYPTO_CATALOG.find(x => x.symbol === symbol);
    const userHold = this.state.crypto[symbol] || { amount: 0, totalCost: 0 };
    const price = this.cryptoPrices[symbol];

    const modal = document.getElementById('crypto-modal');
    if (!modal) return;

    document.getElementById('crypto-modal-title').innerText = `${coin.icon} ${coin.name} (${coin.symbol})`;
    document.getElementById('crypto-modal-price').innerText = this.formatMoney(price);
    const displayAmount = userHold.amount > 0.00001 ? userHold.amount : 0;
    document.getElementById('crypto-modal-owned').innerText = `${displayAmount.toFixed(4)} ${coin.symbol} (${this.formatCompact(displayAmount * price)})`;

    // Maksimal koin kripto yang mampu dibeli dari saldo kas tunai
    const maxBuy = price > 0 ? (this.state.cash / price) : 0;
    const maxBuyEl = document.getElementById('crypto-modal-max-buy');
    if (maxBuyEl) maxBuyEl.innerText = `${maxBuy.toFixed(4)} ${coin.symbol} (${this.formatCompact(this.state.cash)})`;

    // Reset input form
    const buyInput = document.getElementById('crypto-buy-input');
    if (buyInput) buyInput.value = '';
    const sellInput = document.getElementById('crypto-sell-input');
    if (sellInput) sellInput.value = '';
    this.onCryptoBuyInputChange('');
    this.onCryptoSellInputChange('');

    modal.classList.remove('hidden');
  },

  closeCryptoModal() {
    const modal = document.getElementById('crypto-modal');
    if (modal) modal.classList.add('hidden');
  },

  onCryptoBuyInputChange(val) {
    const amount = parseFloat(val) || 0;
    const price = (this.cryptoPrices && this.cryptoPrices[this.cryptoDetailSymbol]) || 0;
    const cost = Math.round(amount * price);
    const preview = document.getElementById('crypto-buy-preview');
    if (preview) preview.innerText = `Estimasi: ${this.formatMoney(cost)}`;
  },

  setCryptoBuyPercent(percent) {
    const price = (this.cryptoPrices && this.cryptoPrices[this.cryptoDetailSymbol]) || 1;
    const spend = this.state.cash * (percent / 100);
    const amount = spend / price;
    const input = document.getElementById('crypto-buy-input');
    if (input) input.value = amount > 0 ? (amount < 0.0001 ? Number(amount.toFixed(8)).toString() : Number(amount.toFixed(4)).toString()) : '';
    this.onCryptoBuyInputChange(input ? input.value : 0);
  },

  buyCryptoCustom() {
    const input = document.getElementById('crypto-buy-input');
    const amount = parseFloat(input ? input.value : 0) || 0;
    if (amount <= 0) {
      window.sound.playError();
      this.showToast('Ketik jumlah koin kripto yang ingin dibeli terlebih dahulu!', 'error');
      return;
    }
    const price = (this.cryptoPrices && this.cryptoPrices[this.cryptoDetailSymbol]) || 0;
    const spendCash = Math.round(amount * price);
    this.buyCrypto(this.cryptoDetailSymbol, spendCash);
    this.openCryptoModal(this.cryptoDetailSymbol);
  },

  onCryptoSellInputChange(val) {
    const amount = parseFloat(val) || 0;
    const price = (this.cryptoPrices && this.cryptoPrices[this.cryptoDetailSymbol]) || 0;
    const revenue = Math.round(amount * price);
    const preview = document.getElementById('crypto-sell-preview');
    if (preview) preview.innerText = `Estimasi: ${this.formatMoney(revenue)}`;
  },

  setCryptoSellPercent(percent) {
    const userHold = this.state.crypto[this.cryptoDetailSymbol] || { amount: 0 };
    if (userHold.amount <= 0.00001) return;
    const input = document.getElementById('crypto-sell-input');
    if (!input) return;
    if (percent >= 100) {
      input.value = Number(userHold.amount.toFixed(8)).toString();
    } else {
      const amount = userHold.amount * (percent / 100);
      input.value = amount > 0 ? Number(amount.toFixed(8)).toString() : '';
    }
    this.onCryptoSellInputChange(input.value);
  },

  sellCryptoCustom() {
    const input = document.getElementById('crypto-sell-input');
    const amount = parseFloat(input ? input.value : 0) || 0;
    const userHold = this.state.crypto[this.cryptoDetailSymbol] || { amount: 0 };
    if (amount <= 0 || userHold.amount <= 0.00001) {
      window.sound.playError();
      this.showToast('Ketik jumlah koin kripto yang ingin dijual terlebih dahulu!', 'error');
      return;
    }
    // Jika jumlah jual sama dengan atau melebihi saldo koin (atau selisih mikroskopis), jual 100%
    const isSellAll = amount >= userHold.amount || Math.abs(amount - userHold.amount) <= 0.00005;
    const fraction = isSellAll ? 1.0 : Math.min(1.0, amount / userHold.amount);
    this.sellCrypto(this.cryptoDetailSymbol, fraction);
    const rem = this.state.crypto[this.cryptoDetailSymbol];
    if (!rem || rem.amount <= 0.00001) {
      this.closeCryptoModal();
    } else {
      this.openCryptoModal(this.cryptoDetailSymbol);
    }
  },

  buyCryptoPercent(percent) {
    const spend = this.state.cash * (percent / 100);
    this.buyCrypto(this.cryptoDetailSymbol, spend);
    this.openCryptoModal(this.cryptoDetailSymbol);
  },

  sellCryptoPercent(percent) {
    this.sellCrypto(this.cryptoDetailSymbol, percent / 100);
    const rem = this.state.crypto[this.cryptoDetailSymbol];
    if (!rem || rem.amount <= 0.00001) {
      this.closeCryptoModal();
    } else {
      this.openCryptoModal(this.cryptoDetailSymbol);
    }
  },

  // ------------------------------------------
  // TRADING KOMODITAS (LONG / SHORT DENGAN LEVERAGE)
  // ------------------------------------------
  openCommodityModal(symbol, type = 'LONG') {
    this.commodityDetailSymbol = symbol;
    this.commodityOrderType = type;
    this.commodityOrderLeverage = this.commodityOrderLeverage || 5;

    const comm = (typeof COMMODITIES_CATALOG !== 'undefined' ? COMMODITIES_CATALOG : []).find(x => x.symbol === symbol);
    if (!comm) return;
    const price = (this.commodityPrices && this.commodityPrices[symbol]) || comm.basePrice;

    const modal = document.getElementById('commodity-modal');
    if (!modal) return;

    document.getElementById('commodity-modal-title').innerText = `${comm.icon} Kontrak ${comm.name} (${comm.symbol})`;
    document.getElementById('commodity-modal-price').innerText = `${this.formatMoney(price)} / ${comm.unit}`;

    // Set tombol arah dan leverage
    this.setCommodityOrderType(this.commodityOrderType, false);
    this.setCommodityOrderLeverage(this.commodityOrderLeverage, false);

    // Default margin input
    const defMargin = Math.min(this.state.cash, Math.max(10000000, Math.round(this.state.cash * 0.1)));
    const input = document.getElementById('commodity-margin-input');
    if (input) input.value = defMargin > 0 ? defMargin : '';

    const maxMarginEl = document.getElementById('commodity-max-margin-text');
    if (maxMarginEl) maxMarginEl.innerText = this.formatMoney(this.state.cash);

    this.updateCommodityOrderPreview();
    modal.classList.remove('hidden');
  },

  closeCommodityModal() {
    const modal = document.getElementById('commodity-modal');
    if (modal) modal.classList.add('hidden');
  },

  setCommodityOrderType(type, updatePreview = true) {
    this.commodityOrderType = type;
    const btnLong = document.getElementById('commodity-btn-type-long');
    const btnShort = document.getElementById('commodity-btn-type-short');
    if (btnLong && btnShort) {
      if (type === 'LONG') {
        btnLong.className = 'flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition';
        btnShort.className = 'flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition';
      } else {
        btnLong.className = 'flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition';
        btnShort.className = 'flex-1 py-2 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-600/20 transition';
      }
    }
    const orderBtn = document.getElementById('commodity-submit-order-btn');
    if (orderBtn) {
      if (type === 'LONG') {
        orderBtn.className = 'btn-press w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25';
        orderBtn.innerText = 'Buka Posisi Kontrak LONG (Beli)';
      } else {
        orderBtn.className = 'btn-press w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/25';
        orderBtn.innerText = 'Buka Posisi Kontrak SHORT (Jual)';
      }
    }
    if (updatePreview) this.updateCommodityOrderPreview();
  },

  setCommodityOrderLeverage(lev, updatePreview = true) {
    this.commodityOrderLeverage = lev;
    [1, 2, 5, 10, 20].forEach(l => {
      const btn = document.getElementById(`commodity-lev-btn-${l}`);
      if (btn) {
        if (l === lev) {
          btn.className = 'btn-press py-1.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow transition';
        } else {
          btn.className = 'btn-press py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition';
        }
      }
    });
    if (updatePreview) this.updateCommodityOrderPreview();
  },

  onCommodityMarginInputChange(val) {
    this.updateCommodityOrderPreview();
  },

  setCommodityMarginQuick(val) {
    const input = document.getElementById('commodity-margin-input');
    if (!input) return;
    if (val === 'max') {
      input.value = this.state.cash;
    } else if (typeof val === 'number') {
      input.value = Math.min(this.state.cash, val);
    }
    this.updateCommodityOrderPreview();
  },

  updateCommodityOrderPreview() {
    const input = document.getElementById('commodity-margin-input');
    const margin = parseInt(input ? input.value : 0) || 0;
    const lev = this.commodityOrderLeverage || 1;
    const posValue = margin * lev;
    const sym = this.commodityDetailSymbol;
    const curPrice = (this.commodityPrices && this.commodityPrices[sym]) || 1;

    const valEl = document.getElementById('commodity-preview-position-value');
    if (valEl) valEl.innerText = this.formatMoney(posValue);

    const liqPrice = this.commodityOrderType === 'LONG'
      ? Math.max(0, Math.round(curPrice * (1 - 0.98 / lev)))
      : Math.round(curPrice * (1 + 0.98 / lev));

    const liqEl = document.getElementById('commodity-preview-liq-price');
    if (liqEl) liqEl.innerText = this.formatMoney(liqPrice);
  },

  confirmOpenCommodityPosition() {
    const input = document.getElementById('commodity-margin-input');
    const margin = parseInt(input ? input.value : 0) || 0;

    if (margin <= 0) {
      window.sound.playError();
      this.showToast('Masukkan jumlah modal margin jaminan yang valid!', 'error');
      return;
    }

    if (this.state.cash < margin) {
      window.sound.playError();
      this.showToast('Uang kas tunai tidak mencukupi untuk membuka posisi kontrak ini!', 'error');
      return;
    }

    const sym = this.commodityDetailSymbol;
    const curPrice = (this.commodityPrices && this.commodityPrices[sym]) || 100000;
    const comm = (typeof COMMODITIES_CATALOG !== 'undefined' ? COMMODITIES_CATALOG : []).find(x => x.symbol === sym);
    const commName = comm ? comm.name : sym;

    this.state.cash -= margin;
    if (!Array.isArray(this.state.commodityPositions)) {
      this.state.commodityPositions = [];
    }

    const newPos = {
      id: 'cpos_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      symbol: sym,
      type: this.commodityOrderType,
      entryPrice: curPrice,
      margin: margin,
      leverage: this.commodityOrderLeverage,
      openedAt: this.state.gameHours
    };

    this.state.commodityPositions.push(newPos);
    this.closeCommodityModal();
    window.sound.playCash();
    this.showToast(`Berhasil membuka posisi ${newPos.type} ${commName} (${newPos.leverage}x Leverage) senilai ${this.formatCompact(margin * newPos.leverage)}!`, 'success');
    this.saveGame();
    this.render();
  },

  closeCommodityPosition(posId) {
    if (!Array.isArray(this.state.commodityPositions)) return;
    const idx = this.state.commodityPositions.findIndex(x => x.id === posId);
    if (idx === -1) return;

    const pos = this.state.commodityPositions[idx];
    const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
    const priceChange = (curPrice - pos.entryPrice) / pos.entryPrice;
    const pnlRate = (pos.type === 'LONG' ? priceChange : -priceChange) * (pos.leverage || 1);
    const pnl = Math.round(pos.margin * pnlRate);
    const returnCash = Math.max(0, pos.margin + pnl);

    this.state.cash += returnCash;
    if (!this.state.stats) {
      this.state.stats = { stockTradingProfit: 0, cryptoTradingProfit: 0, commodityTradingProfit: 0, dividendsEarned: 0, businessEarnings: 0, rentalEarnings: 0 };
    }
    this.state.stats.commodityTradingProfit = (this.state.stats.commodityTradingProfit || 0) + pnl;

    this.state.commodityPositions.splice(idx, 1);
    window.sound.playCash();
    const sign = pnl >= 0 ? '+' : '-';
    this.showToast(`Posisi ${pos.type} ${pos.symbol} ditutup! PnL: ${sign}${this.formatMoney(Math.abs(pnl))} (${(pnlRate * 100).toFixed(1)}%). Kas cair: ${this.formatCompact(returnCash)}`, pnl >= 0 ? 'success' : 'warning');
    this.saveGame();
    this.render();
  }
});

// --- END js/modules/invest.js ---

// --- BEGIN js/modules/ui.js ---
// Business Empire: RichMan - UI Render & Template Module
Object.assign(GameEngine.prototype, {
  render() {
    this.renderHeader();
    if (this.activeTab === 'home') this.renderHomeTab();
    if (this.activeTab === 'business') {
      if (this.businessView === 'owned') this.renderOwnedBusinesses();
      else if (this.businessView === 'catalog') this.renderBusinessCatalog();
      else if (this.businessView === 'detail') this.renderBusinessDetail(this.selectedBizId);
    }
    if (this.activeTab === 'invest') this.renderInvestments();
    if (this.activeTab === 'luxury') this.renderLuxury();
    if (this.activeTab === 'bank') this.renderStatsAndSettings();
  },

  renderHomeTab() {
    const netWorth = this.calculateNetWorth();
    const rank = this.getCurrentRank();
    const hourly = this.calculateHourlyIncome();

    // 1. Hitung Komposisi Finansial
    let bizVal = 0;
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(b => {
        bizVal += this.calculateBusinessValuation(b);
      });
    }

    let stocksVal = 0;
    for (const [sym, st] of Object.entries(this.state.stocks)) {
      if (st.shares > 0 && this.stockPrices[sym]) {
        stocksVal += st.shares * this.stockPrices[sym];
      }
    }

    let cryptoVal = 0;
    for (const [sym, cr] of Object.entries(this.state.crypto)) {
      if (cr.amount > 0.00001 && this.cryptoPrices[sym]) {
        cryptoVal += cr.amount * this.cryptoPrices[sym];
      }
    }

    let propVal = 0;
    for (const [id, val] of Object.entries(this.state.properties)) {
      const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
      const count = typeof val === 'number' ? val : (val ? val.count : 0);
      if (prop && count > 0) {
        let singleVal = prop.price;
        if (typeof val === 'object') {
          if (val.furnished) singleVal += prop.furnitureCost;
          if (val.internet) singleVal += prop.internetCost;
        }
        propVal += singleVal * count;
      }
    }

    let luxVal = 0;
    for (const id of this.state.luxury) {
      const lux = LUXURY_CATALOG.find(x => x.id === id);
      if (lux) luxVal += lux.price;
    }

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    setEl('home-val-cash', this.formatMoney(this.state.cash));
    setEl('home-val-biz', this.formatMoney(bizVal));
    setEl('home-val-stocks', this.formatMoney(stocksVal));
    setEl('home-val-crypto', this.formatMoney(cryptoVal));
    setEl('home-val-property', this.formatMoney(propVal));
    setEl('home-val-luxury', this.formatMoney(luxVal));

    // 2. Kartu Target Pangkat
    const rankCard = document.getElementById('home-rank-card');
    if (rankCard) {
      const curIndex = NET_WORTH_RANKS.findIndex(r => r.id === rank.id);
      const nextRank = curIndex < NET_WORTH_RANKS.length - 1 ? NET_WORTH_RANKS[curIndex + 1] : null;

      if (nextRank) {
        const span = nextRank.min - rank.min;
        const currentProgress = Math.max(0, netWorth - rank.min);
        const percent = Math.min(100, Math.floor((currentProgress / span) * 100));
        const needed = Math.max(0, nextRank.min - netWorth);

        rankCard.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl">${rank.badge}</span>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Gelar Saat Ini</span>
                <h4 class="font-black text-white text-sm">${rank.title}</h4>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Berikutnya</span>
              <div class="text-xs font-bold text-emerald-400">${nextRank.badge} ${nextRank.title}</div>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-[11px]">
              <span class="text-slate-400">Progres Kenaikan Pangkat:</span>
              <span class="font-bold text-white">${percent}% (Butuh ${this.formatCompact(needed)} lagi)</span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
            </div>
          </div>
        `;
      } else {
        rankCard.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-3xl">👑</span>
            <div>
              <h4 class="font-black text-amber-300 text-sm">Gelar Tertinggi: ${rank.title}</h4>
              <p class="text-[11px] text-slate-400">Selamat! Anda telah menduduki puncak tertinggi oligarki keuangan dunia!</p>
            </div>
          </div>
        `;
      }
    }

    // 3. Render Widget Pajak (KPP & DJP)
    this.renderTaxWidget();
  },

  renderHeader() {
    const netWorth = this.calculateNetWorth();
    const hourly = this.calculateHourlyIncome();
    const rank = this.getCurrentRank();

    const nwEl = document.getElementById('header-networth');
    if (nwEl) nwEl.innerText = this.formatMoney(netWorth);

    const cashEl = document.getElementById('header-cash');
    if (cashEl) cashEl.innerText = this.formatMoney(this.state.cash);

    const hourlyEl = document.getElementById('header-hourly');
    if (hourlyEl) {
      const sign = hourly >= 0 ? '+' : '';
      hourlyEl.innerText = `${sign}${this.formatMoney(hourly)}/jam`;
      hourlyEl.className = `font-bold text-sm ${hourly >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }

    const rankBadge = document.getElementById('header-rank-badge');
    const rankTitle = document.getElementById('header-rank-title');
    if (rankBadge) rankBadge.innerText = rank.badge;
    if (rankTitle) rankTitle.innerText = rank.title;

    const timeEl = document.getElementById('header-game-time');
    if (timeEl) {
      const totalHours = Math.max(0, this.state.gameHours || 0);
      const days = Math.floor(totalHours / 24) + 1;
      const currentHour = Math.floor(totalHours % 24);
      const currentMinute = Math.floor((totalHours * 60) % 60);
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      timeEl.innerText = `Hari ${days}, ${timeStr}`;
    }

    ['1', '5', '60'].forEach(s => {
      const btn = document.getElementById(`speed-btn-${s}`);
      if (btn) {
        if (this.speed === parseInt(s)) {
          btn.className = 'px-2 py-0.5 text-xs font-bold rounded bg-emerald-500 text-slate-950 shadow-sm';
        } else {
          btn.className = 'px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 hover:bg-slate-700';
        }
      }
    });

    const clickValEl = document.getElementById('click-reward-val');
    if (clickValEl) {
      const reward = Math.round(GAME_CONFIG.STARTING_CLICK_REWARD * Math.pow(1.3, this.state.clickLevel - 1));
      clickValEl.innerText = `+${this.formatCompact(reward)} / klik`;
    }
  },

  renderOwnedBusinesses() {
    const container = document.getElementById('business-owned-list');
    const countEl = document.getElementById('biz-owned-count');
    const bizBanner = document.getElementById('biz-tax-banner');
    if (!container) return;

    const list = this.state.businesses || [];
    if (countEl) countEl.innerText = `${list.length} Bisnis Beroperasi`;

    // Render Tax Banner di Tab Bisnis
    if (bizBanner && this.state.businesses) {
      let totalUnpaid = 0;
      let suspendedCount = 0;
      let earliestDeadline = null;
      list.forEach(b => {
        const t = this.getBusinessTax(b);
        if (t.unpaid > 0) {
          totalUnpaid += t.unpaid;
          if (t.suspended) suspendedCount++;
          if (t.deadline && (!earliestDeadline || t.deadline < earliestDeadline)) {
            earliestDeadline = t.deadline;
          }
        }
      });

      if (suspendedCount > 0) {
        bizBanner.className = 'mb-3.5 p-3.5 rounded-2xl bg-rose-500/10 border tax-suspended-glow border-rose-500 text-xs shadow-lg space-y-2';
        bizBanner.innerHTML = `
          <div class="flex items-center justify-between text-rose-400 font-black">
            <span class="flex items-center gap-1.5">🚨 ${suspendedCount} BISNIS DIBEKUKAN OLEH KANTOR PAJAK (DJP)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black">SANKSI DJP</span>
          </div>
          <p class="text-[11px] text-slate-300">
            Anda memiliki tunggakan pajak bisnis sebesar <strong class="text-rose-400">${this.formatMoney(totalUnpaid)}</strong> yang telah melewati batas 72 jam dunia nyata. Seluruh arus kas masuk bisnis yang menunggak dihentikan sampai dilunasi!
          </p>
          <button onclick="game.payTax('business')" class="btn-press w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5">
            <span>💳 Lunasi Seluruh Pajak Bisnis (${this.formatMoney(totalUnpaid)})</span>
          </button>
        `;
        bizBanner.classList.remove('hidden');
      } else if (totalUnpaid > 0) {
        const remSec = earliestDeadline ? Math.max(0, Math.ceil((earliestDeadline - Date.now()) / 1000)) : 0;
        const hours = Math.floor(remSec / 3600);
        const mins = Math.floor((remSec % 3600) / 60);
        const secs = remSec % 60;
        const timeStr = hours > 0 ? `${hours}j ${mins}m` : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        bizBanner.className = 'mb-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs shadow-md space-y-2';
        bizBanner.innerHTML = `
          <div class="flex items-center justify-between text-amber-300 font-bold">
            <span class="flex items-center gap-1.5">⏳ Tagihan SPT Pajak Mandiri Bisnis Berjalan</span>
            <span class="font-mono text-amber-400 font-bold" data-tax-timer="${earliestDeadline || 0}">${timeStr}</span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-300">Total Pajak Bisnis Terhutang (5%): <strong class="text-amber-300">${this.formatMoney(totalUnpaid)}</strong></span>
            <button onclick="game.payTax('business')" class="btn-press px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
              Bayar Semua Pajak
            </button>
          </div>
        `;
        bizBanner.classList.remove('hidden');
      } else {
        bizBanner.className = 'hidden mb-3';
        bizBanner.innerHTML = '';
      }
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
          <div class="text-4xl">🏢</div>
          <h3 class="font-bold text-white text-sm">Belum Ada Bisnis yang Dibuka</h3>
          <p class="text-xs text-slate-400">Anda belum mendirikan perusahaan apa pun. Klik tombol di bawah untuk memilih sektor usaha pertama Anda!</p>
          <button onclick="game.showBusinessCatalog()" class="btn-press px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
            + Buka Bisnis Pertama Anda
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    list.forEach(biz => {
      const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
      const rawRev = this.calculateSingleBusinessRevenue(biz);
      const isTech = sector.isTech || biz.sectorId === 'tech';
      const isAirline = sector.isAirline || biz.sectorId === 'airline';
      const isOil = sector.isOil || biz.sectorId === 'oil';
      const isMining = sector.isMining || biz.sectorId === 'mining';
      const bizTax = this.getBusinessTax(biz);
      const isBizSuspended = !!bizTax.suspended;
      const bizValuation = this.calculateBusinessValuation(biz);
      const allTimeEarn = biz.allTimeEarnings || 0;
      let airlineStats = null;
      if (isAirline) {
        airlineStats = this.getAirlineOperatingStats(biz);
      }

      let revText = '';
      if (isBizSuspended) {
        revText = 'Rp 0/jam (Disuspend)';
      } else if (isTech) {
        revText = rawRev < 0 ? `-${this.formatCompact(Math.abs(rawRev))}/j (Gaji)` : 'Honor Proyek';
      } else if (isAirline && airlineStats) {
        if (airlineStats.operatingRoutesCount === 0 || airlineStats.operatingPlanesCount === 0) {
          revText = '<span class="text-rose-400 font-bold">0/j (Grounded)</span>';
        } else {
          revText = `+${this.formatCompact(airlineStats.grossRevenue)}/j (Tiket)`;
        }
      } else {
        revText = `${rawRev >= 0 ? '+' : ''}${this.formatCompact(rawRev)}/jam`;
      }

      let statusInfo = '';
      if (sector.isFleet) {
        const totalVeh = (biz.vehicles || []).length;
        statusInfo = `Armada: ${totalVeh}/${biz.parkingCapacity || 10} Kendaraan`;
      } else if (sector.isLogistics) {
        const totalTrucks = (biz.trucks || []).length;
        const totalTenants = (biz.tenants || []).length;
        const maxWare = Math.min(10, Math.max(1, biz.warehouseCapacity || biz.warehouseLevel || 1));
        statusInfo = `${totalTrucks} Truk • ${totalTenants}/${maxWare} Mitra Gudang (Lvl ${biz.warehouseLevel || 1})`;
      } else if (isTech) {
        const totalEmpl = this.getTechTotalEmployees(biz);
        const salaries = this.getTechHourlySalaries(biz);
        statusInfo = `${totalEmpl}/${biz.workstations || 15} Karyawan • Gaji: -${this.formatCompact(salaries)}/j`;
      } else if (isAirline && airlineStats) {
        statusInfo = `${airlineStats.operatingPlanesCount}/${airlineStats.totalPlanes} Pesawat Terbang • ${airlineStats.openRoutesCount} Rute Internasional`;
      } else if (isOil) {
        const oilStats = this.getOilProductionStats(biz);
        const signedContracts = (biz.contracts || []).length;
        statusInfo = `Produksi: ${this.formatCompact(oilStats.totalOilBblPerHour)} Bbl • ${this.formatCompact(oilStats.totalGasBoePerHour)} BOE • ${signedContracts} Kontrak`;
      } else if (isMining) {
        const miningStats = this.getMiningProductionStats(biz);
        const signedContracts = (biz.contracts || []).length;
        statusInfo = `Produksi: ${this.formatCompact(miningStats.totalNickelTonPerHour)} Ton • ${this.formatCompact(miningStats.totalGoldKgPerHour)} Kg • ${signedContracts} Kontrak`;
      } else if (sector.isBank) {
        const custDep = this.getBankCustomerDeposits(biz);
        const growthRate = this.getBankDepositGrowthRate(biz);
        statusInfo = `Brankas: ${this.formatCompact(biz.vault || 0)} • DPK: ${this.formatCompact(custDep)} (+${this.formatCompact(growthRate)}/j)`;
      } else if (biz.sectorId === 'fashion') {
        const stage = FASHION_STAGES[Math.min(biz.level, FASHION_STAGES.length) - 1];
        statusInfo = `Tahap: ${stage.title}`;
      } else {
        statusInfo = `Tingkat Level ${biz.level}`;
      }

      const upCost = this.getBusinessUpgradeCost(biz);
      const isBank = biz.sectorId === 'bank';
      let bankReqMet = true;
      if (isBank) {
        const custDep = this.getBankCustomerDeposits(biz);
        const reqDep = this.getBankRequiredCustomerDeposits(biz.level);
        bankReqMet = custDep >= reqDep;
      }

      html += `
        <div class="glass-panel rounded-2xl border ${isBizSuspended ? 'tax-suspended-glow border-rose-500/80 bg-rose-950/10' : 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 to-transparent'} overflow-hidden card-transition mb-3.5 shadow-lg">
          <div class="relative h-28 w-full bg-slate-800 overflow-hidden">
            <img src="${sector.image}" alt="${biz.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.style.display='none'">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            <div class="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-slate-300">
              <span class="text-sm">${sector.icon}</span>
              <span>${sector.name}</span>
            </div>

            <div class="absolute top-2 right-2">
              ${isBizSuspended ? `
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20 text-[11px] tax-warning-pulse">
                  ⚠️ Dibekukan DJP
                </span>
              ` : `
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 text-[11px]">
                  Aktif Beroperasi
                </span>
              `}
            </div>

            <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between">
              <div>
                <h3 class="font-black text-white text-base leading-tight drop-shadow-md">${biz.name}</h3>
                <span class="text-[11px] text-slate-300 font-medium">${statusInfo}</span>
              </div>
              <span class="text-xs font-black ${isBizSuspended ? 'text-rose-400 border-rose-500/50' : (rawRev < 0 ? 'text-rose-400 border-slate-800' : 'text-emerald-400 border-slate-800')} bg-slate-950/90 px-2 py-0.5 rounded-lg border">
                ${revText}
              </span>
            </div>
          </div>

          <!-- Valuasi & Laba Bersih All-Time -->
          <div class="px-3 pt-2.5 pb-1 grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400 flex items-center gap-1 font-medium">🏛️ Valuasi Bisnis</span>
              <span class="text-xs font-black text-amber-300 font-mono mt-0.5">${this.formatMoney(bizValuation)}</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400 flex items-center gap-1 font-medium">📊 Laba All-Time</span>
              <span class="text-xs font-black ${allTimeEarn >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono mt-0.5">
                ${allTimeEarn >= 0 ? '+' : ''}${this.formatMoney(allTimeEarn)}
              </span>
            </div>
          </div>

          <!-- Per-Business Tax Alert jika ada tagihan -->
          ${bizTax.unpaid > 0 ? `
            <div class="mx-3 my-1.5 p-2 rounded-xl ${bizTax.suspended ? 'bg-rose-500/10 border border-rose-500/40 text-rose-300' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'} flex items-center justify-between text-[11px]">
              <div class="min-w-0 pr-2">
                <span class="font-bold flex items-center gap-1">
                  ${bizTax.suspended ? '🚨 Operasional Dibekukan' : '⏳ SPT Pajak Mandiri (5%)'}
                </span>
                <span class="text-[10px] text-slate-300 block truncate">
                  Terhutang: <strong class="${bizTax.suspended ? 'text-rose-400' : 'text-amber-300'}">${this.formatMoney(bizTax.unpaid)}</strong>
                  ${!bizTax.suspended && bizTax.deadline ? ` • Sisa: <span class="font-mono text-amber-400" data-tax-timer="${bizTax.deadline}">...</span>` : ''}
                </span>
              </div>
              <button onclick="game.payBusinessTax('${biz.instanceId}')" class="btn-press px-2.5 py-1 rounded-lg ${bizTax.suspended ? 'bg-rose-500 text-slate-950 font-black' : 'bg-amber-500 text-slate-950 font-bold'} text-[11px] shrink-0">
                Bayar Pajak
              </button>
            </div>
          ` : ''}

          ${biz.upgradeInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-amber-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🏗️</span> Sedang Ekspansi ke Lvl ${biz.upgradeTargetLevel}
                </span>
                <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.upgradeEndTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.upgradeStartTime}" data-biz-end="${biz.upgradeEndTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.garageUpgradeInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-amber-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🏗️</span> Perluasan Garasi (+${biz.garageUpgradeAddedSlots || 5} Slot ke ${biz.garageUpgradeTargetCapacity})
                </span>
                <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.warehouseUpgradeInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-blue-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🏗️</span> Ekspansi Gudang ke Lvl ${biz.warehouseUpgradeTargetLevel} (+1 Slot Mitra)
                </span>
                <span class="font-mono font-bold text-blue-400" data-biz-timer="${biz.warehouseUpgradeEndTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-blue-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.warehouseUpgradeStartTime}" data-biz-end="${biz.warehouseUpgradeEndTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.officeUpgradeInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-blue-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🏗️</span> Renovasi Kantor (+${biz.officeUpgradeAddedWorkstations || 15} Workstation)
                </span>
                <span class="font-mono font-bold text-blue-400" data-biz-timer="${biz.officeUpgradeEndTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-blue-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.officeUpgradeStartTime}" data-biz-end="${biz.officeUpgradeEndTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.activeProject ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl ${biz.activeProject.completed ? 'bg-emerald-500/10 border border-emerald-500/40' : 'bg-purple-500/10 border border-purple-500/30'} flex items-center justify-between text-[11px] mb-1">
                <span class="${biz.activeProject.completed ? 'text-emerald-300 font-bold' : 'text-purple-300 font-semibold'} flex items-center gap-1">
                  <span>${biz.activeProject.completed ? '🎉' : '⏱️'}</span>
                  <span class="truncate max-w-[190px]">${this.getProjectName(biz.activeProject.projectId)}</span>
                </span>
                ${biz.activeProject.completed ? `
                  <span class="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px]">Siap Diklaim</span>
                ` : `
                  <span class="font-mono font-bold text-purple-400" data-biz-timer="${biz.activeProject.endTime}">...</span>
                `}
              </div>
              ${!biz.activeProject.completed ? `
                <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div class="h-full bg-purple-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.activeProject.startTime}" data-biz-end="${biz.activeProject.endTime}"></div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${biz.routeUnlockInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-blue-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🛫</span> Izin Rute: ${biz.routeUnlockInProgress.destination}
                </span>
                <span class="font-mono font-bold text-blue-400" data-biz-timer="${biz.routeUnlockInProgress.endTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.routeUnlockInProgress.startTime}" data-biz-end="${biz.routeUnlockInProgress.endTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.contractSigningInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-amber-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">📜</span> Negosiasi Kontrak Pasokan...
                </span>
                <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.contractSigningInProgress.endTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.contractSigningInProgress.startTime}" data-biz-end="${biz.contractSigningInProgress.endTime}"></div>
              </div>
            </div>
          ` : ''}

          <div class="p-3 pt-2.5 flex items-center justify-between gap-2">
            <button onclick="game.showBusinessDetail('${biz.instanceId}')" class="btn-press flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
              <span>⚙️ Detail & Kelola</span>
            </button>
            ${biz.upgradeInProgress ? `
              <button disabled class="px-3.5 py-2 rounded-xl bg-slate-800/60 text-slate-500 border border-slate-800 text-xs font-bold cursor-not-allowed">
                ⏳ Pengerjaan
              </button>
            ` : (biz.sectorId === 'taxi' || biz.sectorId === 'logistics' || biz.sectorId === 'tech' || biz.sectorId === 'airline' || isOil || isMining ? `
              <div class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium flex items-center gap-1">
                <span>${
                  biz.sectorId === 'taxi' ? '🚖 ' + (biz.vehicles ? biz.vehicles.length : 0) + ' Armada' :
                  (biz.sectorId === 'logistics' ? '🚚 ' + (biz.trucks ? biz.trucks.length : 0) + ' Truk' :
                  (biz.sectorId === 'tech' ? '💻 ' + (biz.activeProject ? (biz.activeProject.completed ? '🎉 Klaim Proyek' : '⏱️ Pengerjaan') : 'Proyek & Tim') :
                  (biz.sectorId === 'airline' ? '✈️ ' + (airlineStats ? `${airlineStats.operatingPlanesCount}/${airlineStats.totalPlanes} Pesawat` : 'Rute & Armada') :
                  (isOil ? '🛢️ ' + ((biz.contracts || []).length) + ' Kontrak Migas' :
                  '⛏️ ' + ((biz.contracts || []).length) + ' Kontrak Tambang'))))
                }</span>
              </div>
            ` : (biz.sectorId === 'fashion' && biz.level >= FASHION_STAGES.length ? `
              <button disabled class="px-3.5 py-2 rounded-xl bg-slate-800/60 text-amber-300/80 border border-slate-800 text-xs font-bold cursor-default">
                👑 Max Lvl
              </button>
            ` : `
              <button onclick="game.upgradeBusinessLevel('${biz.instanceId}')" class="btn-press px-3.5 py-2 rounded-xl ${
                isBank && !bankReqMet
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              } font-bold text-xs flex items-center gap-1 shadow-sm">
                <span>${isBank && !bankReqMet ? '🔒 ' : ''}Upgrade (${this.formatCompact(upCost)})</span>
              </button>
            `))}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderBusinessCatalog() {
    const container = document.getElementById('business-catalog-list');
    if (!container) return;

    let html = '';
    BUSINESS_SECTORS.forEach(sec => {
      let priceText = '';
      if (sec.hasSubtypes) {
        priceText = `Mulai ${this.formatCompact(sec.subtypes[0].cost)}`;
      } else {
        priceText = this.formatCompact(sec.baseCost || 0);
      }

      const canAfford = this.state.cash >= (sec.hasSubtypes ? sec.subtypes[0].cost : (sec.baseCost || 0));

      html += `
        <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden card-transition mb-3.5 shadow-lg">
          <div class="relative h-28 w-full bg-slate-800 overflow-hidden">
            <img src="${sec.image}" alt="${sec.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.style.display='none'">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            <div class="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-slate-300">
              <span class="text-sm">${sec.icon}</span>
              <span>Sektor Baru</span>
            </div>

            <div class="absolute bottom-2 left-3 right-3">
              <h3 class="font-black text-white text-base leading-tight drop-shadow-md">${sec.name}</h3>
            </div>
          </div>

          <div class="p-3">
            <p class="text-xs text-slate-400 leading-relaxed mb-3">${sec.desc}</p>

            <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-slate-400 text-[11px] block">Biaya Modal Awal:</span>
                <span class="font-extrabold text-white text-xs">${priceText}</span>
              </div>

              <button onclick="game.openFoundBusinessModal('${sec.sectorId}')" class="btn-press px-4 py-2 rounded-xl text-xs font-black transition ${
                canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }">
                Pilih Sektor Ini →
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderBusinessDetail(instanceId) {
    const container = document.getElementById('biz-view-detail');
    if (!container) return;

    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) {
      this.showOwnedBusinesses();
      return;
    }

    const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
    const hourlyRev = this.calculateSingleBusinessRevenue(biz);
    const bizTax = this.getBusinessTax(biz);
    const bizValuation = this.calculateBusinessValuation(biz);
    const allTimeEarn = biz.allTimeEarnings || 0;

    let specificSectionHtml = '';

    // DETAIL: TAKSI & OJOL FLEET
    if (sector.isFleet) {
      if (!['active', 'buy'].includes(this.detailSubTab)) {
        this.detailSubTab = 'active';
      }

      const vehicles = biz.vehicles || [];
      const currentPark = vehicles.length;
      const maxPark = biz.parkingCapacity || 10;
      const isParkFull = currentPark >= maxPark;
      const isGarageUpgrading = !!biz.garageUpgradeInProgress;
      const garageDurationSec = this.getGarageUpgradeDuration(biz);

      const vehicleCards = vehicles.map(v => {
        const cat = TAXI_FLEET_VEHICLES.find(x => x.id === v.modelId);
        if (!cat) return '';
        const kmPercent = Math.min(100, Math.round((v.km / cat.maxKm) * 100));
        const scrapVal = Math.round(cat.cost * 0.35 * Math.max(0.2, 1 - (v.km / cat.maxKm)));

        return `
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-2.5">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-14 h-12 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60 relative">
                  <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                  <span class="absolute bottom-0.5 right-0.5 text-xs">${cat.icon}</span>
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-white text-xs truncate">${cat.name}</div>
                  <div class="text-[10px] text-slate-400">${cat.type}</div>
                  <div class="text-[11px] text-emerald-400 font-semibold">
                    +${this.formatCompact(cat.revenue)}/jam
                  </div>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span class="text-xs font-mono font-bold text-slate-300">
                  ${v.km.toLocaleString()} / ${cat.maxKm.toLocaleString()} KM
                </span>
                <div class="text-[10px] text-slate-400">Sisa Umur: ${Math.max(0, 100 - kmPercent)}%</div>
              </div>
            </div>

            <!-- KM Progress Bar -->
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="h-full ${kmPercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'} transition-all" style="width: ${kmPercent}%"></div>
            </div>

            <div class="flex justify-between items-center pt-1 border-t border-slate-800/60 text-xs">
              <span class="text-[10px] text-slate-400">⚠️ Otomatis pensiun saat mencapai ${cat.maxKm.toLocaleString()} KM</span>
              <button onclick="game.sellTaxiVehicle('${biz.instanceId}', '${v.id}')" class="btn-press px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-[11px] font-bold">
                Jual Bekas (${this.formatCompact(scrapVal)})
              </button>
            </div>
          </div>
        `;
      }).join('');

      const showroomCards = TAXI_FLEET_VEHICLES.map(cat => {
        const canBuy = this.state.cash >= cat.cost && !isParkFull;
        return `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-2.5 gap-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-16 h-14 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60 relative">
                <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                <span class="absolute bottom-0.5 right-0.5 text-xs">${cat.icon}</span>
              </div>
              <div class="min-w-0">
                <div class="font-bold text-white text-xs truncate">${cat.name}</div>
                <div class="text-[10px] text-slate-400">${cat.type}</div>
                <div class="text-[11px] text-emerald-400 font-semibold">+${this.formatCompact(cat.revenue)}/jam • Max ${cat.maxKm.toLocaleString()} KM</div>
              </div>
            </div>

            <button onclick="game.buyTaxiVehicle('${biz.instanceId}', '${cat.id}')" class="btn-press px-3.5 py-1.5 rounded-xl font-black text-xs shrink-0 ${
              canBuy
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }">
              Beli (${this.formatCompact(cat.cost)})
            </button>
          </div>
        `;
      }).join('');

      let fleetTabContent = '';
      if (this.detailSubTab === 'active') {
        fleetTabContent = `
          <!-- Parking Space Status with Real-World Timer -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isGarageUpgrading ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'} mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] text-slate-400">Kapasitas Lahan Parkiran Armada:</div>
                <div class="font-bold text-white text-sm">${currentPark} / ${maxPark} Kendaraan Terisi</div>
              </div>
              ${isGarageUpgrading ? `
                <button disabled class="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-not-allowed">
                  ⏳ Sedang Diperluas...
                </button>
              ` : `
                <button onclick="game.upgradeParkingCapacity('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span>+ Perluas Parkir (5 Slot) - Rp 35 Jt [⏱️ ${this.formatDuration(garageDurationSec)}]</span>
                </button>
              `}
            </div>
            ${isGarageUpgrading ? `
              <div class="pt-1.5 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-amber-300 font-bold flex items-center gap-1">
                    <span class="upgrade-pulsing-badge">🏗️</span> Konstruksi ke ${biz.garageUpgradeTargetCapacity} Slot
                  </span>
                  <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Active Fleet List -->
          <div>
            ${vehicles.length > 0 ? vehicleCards : `
              <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2.5">
                <div class="text-3xl">🚖</div>
                <div class="font-bold text-white text-xs">Belum Ada Armada yang Beroperasi</div>
                <p class="text-[11px] text-slate-400">Armada Anda kosong. Buka tab Pembelian Armada untuk memilih jenis mobil atau motor favorit Anda!</p>
                <button onclick="game.setDetailSubTab('buy')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                  🛒 Ke Showroom Armada
                </button>
              </div>
            `}
          </div>
        `;
      } else {
        fleetTabContent = `
          <!-- Parking Alert / Status -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isGarageUpgrading ? 'border-amber-500/50 bg-amber-500/5' : (isParkFull ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800')} mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] ${isParkFull ? 'text-amber-400 font-bold' : 'text-slate-400'}">
                  ${isParkFull ? '⚠️ Kapasitas Parkir Penuh' : 'Status Slot Parkir:'}
                </div>
                <div class="font-bold text-white text-xs">
                  ${isParkFull ? 'Harus perluas parkir agar bisa membeli armada baru' : `Tersedia ${maxPark - currentPark} slot parkir kosong (${currentPark}/${maxPark})`}
                </div>
              </div>
              ${isGarageUpgrading ? `
                <button disabled class="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-not-allowed">
                  ⏳ Sedang Diperluas...
                </button>
              ` : `
                <button onclick="game.upgradeParkingCapacity('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold">
                  + Perluas Parkir (5 Slot) - Rp 35 Jt [⏱️ ${this.formatDuration(garageDurationSec)}]
                </button>
              `}
            </div>
            ${isGarageUpgrading ? `
              <div class="pt-1.5 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-amber-300 font-bold flex items-center gap-1">
                    <span class="upgrade-pulsing-badge">🏗️</span> Konstruksi ke ${biz.garageUpgradeTargetCapacity} Slot
                  </span>
                  <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Showroom List -->
          <div>
            ${showroomCards}
          </div>
        `;
      }

      specificSectionHtml = `
        <!-- Sub-tabs: Armada Beroperasi vs Pembelian Armada -->
        <div class="flex items-center justify-between mb-3 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button onclick="game.setDetailSubTab('active')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            this.detailSubTab === 'active' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🚗 Armada Beroperasi</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
              this.detailSubTab === 'active' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-400'
            }">${vehicles.length}</span>
          </button>
          <button onclick="game.setDetailSubTab('buy')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            this.detailSubTab === 'buy' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🛒 Showroom Armada</span>
          </button>
        </div>

        ${fleetTabContent}
      `;
    }

    // DETAIL: LOGISTIK & PERGUDANGAN
    else if (sector.isLogistics) {
      if (!['active', 'buy', 'warehouse'].includes(this.detailSubTab)) {
        this.detailSubTab = 'active';
      }

      const trucks = biz.trucks || [];
      const tenants = biz.tenants || [];
      const currentPark = trucks.length;
      const maxPark = biz.parkingCapacity || 8;
      const isParkFull = currentPark >= maxPark;
      const isGarageUpgrading = !!biz.garageUpgradeInProgress;
      const garageDurationSec = this.getGarageUpgradeDuration(biz);

      biz.warehouseLevel = Math.min(10, Math.max(1, biz.warehouseLevel || biz.warehouseCapacity || 1));
      biz.warehouseCapacity = biz.warehouseLevel;
      const maxWare = biz.warehouseCapacity;
      const usedSlots = tenants.length;
      const isWarehouseUpgrading = !!biz.warehouseUpgradeInProgress;

      const truckCards = trucks.map(t => {
        const cat = LOGISTICS_FLEET_VEHICLES.find(x => x.id === t.modelId);
        if (!cat) return '';
        const kmPercent = Math.min(100, Math.round((t.km / cat.maxKm) * 100));
        const scrapVal = Math.round(cat.cost * 0.35 * Math.max(0.2, 1 - (t.km / cat.maxKm)));

        return `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mb-2.5">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-14 h-12 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60 relative">
                  <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                  <span class="absolute bottom-0.5 right-0.5 text-xs">${cat.icon}</span>
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-white text-xs truncate">${cat.name}</div>
                  <div class="text-[10px] text-slate-400">${cat.type}</div>
                  <div class="text-[11px] text-emerald-400 font-semibold">+${this.formatCompact(cat.revenue)}/jam</div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <span class="text-xs font-mono font-bold text-slate-300">${t.km.toLocaleString()} / ${cat.maxKm.toLocaleString()} KM</span>
                <div class="text-[10px] text-slate-400">Sisa Umur: ${Math.max(0, 100 - kmPercent)}%</div>
              </div>
            </div>

            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="h-full ${kmPercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'} transition-all" style="width: ${kmPercent}%"></div>
            </div>

            <div class="flex justify-between items-center pt-1 border-t border-slate-800/60 text-xs">
              <span class="text-[10px] text-slate-400">⚠️ Pensiun otomatis pada ${cat.maxKm.toLocaleString()} KM</span>
              <button onclick="game.sellLogisticsTruck('${biz.instanceId}', '${t.id}')" class="btn-press px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-[11px] font-bold">
                Jual Truk Bekas (${this.formatCompact(scrapVal)})
              </button>
            </div>
          </div>
        `;
      }).join('');

      const tenantPartnersCards = LOGISTICS_TENANTS_CATALOG.map(t => {
        const isPartner = tenants.includes(t.id);
        const isLevelMet = (biz.warehouseLevel || 1) >= t.requiredWarehouseLevel;
        const isSlotAvailable = usedSlots < maxWare;
        const canAfford = this.state.cash >= t.contractFee;

        return `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-2">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${t.icon}</span>
              <div>
                <div class="font-bold text-white text-xs">${t.name}</div>
                <div class="text-[11px] text-emerald-400 font-semibold">Sewa: +${this.formatCompact(t.hourlyRent)}/jam • Butuh 1 Slot</div>
                <div class="text-[10px] ${isLevelMet ? 'text-slate-400' : 'text-amber-400 font-bold'}">Syarat: Fasilitas Gudang Min. Level ${t.requiredWarehouseLevel}</div>
              </div>
            </div>

            <div>
              ${isPartner ? `
                <button onclick="game.terminateTenantContract('${biz.instanceId}', '${t.id}')" class="btn-press px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                  Putus Kontrak
                </button>
              ` : (
                !isLevelMet ? `
                  <button onclick="game.upgradeWarehouse('${biz.instanceId}')" class="btn-press px-2.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 border border-amber-500/40 text-[11px] font-bold" title="Tingkatkan fasilitas gudang untuk membuka kemitraan ini">
                    🔒 Butuh Lvl ${t.requiredWarehouseLevel}
                  </button>
                ` : (
                  !isSlotAvailable ? `
                    <button disabled class="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-700 text-[11px] font-bold cursor-not-allowed">
                      ⚠️ Slot Penuh (${usedSlots}/${maxWare})
                    </button>
                  ` : `
                    <button onclick="game.signTenantContract('${biz.instanceId}', '${t.id}')" class="btn-press px-3 py-1.5 rounded-xl ${
                      canAfford
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    } font-black text-xs">
                      Bermitra (${this.formatCompact(t.contractFee)})
                    </button>
                  `
                )
              )}
            </div>
          </div>
        `;
      }).join('');

      const truckShowroom = LOGISTICS_FLEET_VEHICLES.map(cat => {
        const canBuy = this.state.cash >= cat.cost && !isParkFull;
        return `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-2.5 gap-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-16 h-14 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60 relative">
                <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                <span class="absolute bottom-0.5 right-0.5 text-xs">${cat.icon}</span>
              </div>
              <div class="min-w-0">
                <div class="font-bold text-white text-xs truncate">${cat.name}</div>
                <div class="text-[10px] text-slate-400">${cat.type}</div>
                <div class="text-[11px] text-emerald-400 font-semibold">+${this.formatCompact(cat.revenue)}/jam • Max ${cat.maxKm.toLocaleString()} KM</div>
              </div>
            </div>
            <button onclick="game.buyLogisticsTruck('${biz.instanceId}', '${cat.id}')" class="btn-press px-3.5 py-1.5 rounded-xl font-black text-xs shrink-0 ${
              canBuy
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }">
              Beli (${this.formatCompact(cat.cost)})
            </button>
          </div>
        `;
      }).join('');

      let logisticsTabContent = '';
      if (this.detailSubTab === 'active') {
        logisticsTabContent = `
          <!-- Garasi Truk Status with Real-World Timer -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isGarageUpgrading ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'} mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] text-slate-400">Kapasitas Garasi Truk:</div>
                <div class="font-bold text-white text-sm">${currentPark} / ${maxPark} Truk Terisi</div>
              </div>
              ${isGarageUpgrading ? `
                <button disabled class="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-not-allowed">
                  ⏳ Sedang Diperluas...
                </button>
              ` : `
                <button onclick="game.upgradeParkingCapacity('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span>+ Perluas Garasi (4 Slot) - Rp 95 Jt [⏱️ ${this.formatDuration(garageDurationSec)}]</span>
                </button>
              `}
            </div>
            ${isGarageUpgrading ? `
              <div class="pt-1.5 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-amber-300 font-bold flex items-center gap-1">
                    <span class="upgrade-pulsing-badge">🏗️</span> Konstruksi ke ${biz.garageUpgradeTargetCapacity} Slot
                  </span>
                  <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Active Trucks -->
          <div>
            ${trucks.length > 0 ? truckCards : `
              <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2.5">
                <div class="text-3xl">🚛</div>
                <div class="font-bold text-white text-xs">Belum Ada Truk Beroperasi</div>
                <p class="text-[11px] text-slate-400">Garasi Anda masih kosong. Buka tab Showroom Truk untuk memilih truk kargo Anda!</p>
                <button onclick="game.setDetailSubTab('buy')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                  🛒 Ke Showroom Truk
                </button>
              </div>
            `}
          </div>
        `;
      } else if (this.detailSubTab === 'buy') {
        logisticsTabContent = `
          <!-- Garasi Alert / Status -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isGarageUpgrading ? 'border-amber-500/50 bg-amber-500/5' : (isParkFull ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800')} mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] ${isParkFull ? 'text-amber-400 font-bold' : 'text-slate-400'}">
                  ${isParkFull ? '⚠️ Garasi Penuh' : 'Status Slot Garasi:'}
                </div>
                <div class="font-bold text-white text-xs">
                  ${isParkFull ? 'Harus perluas garasi agar bisa menambah truk' : `Tersedia ${maxPark - currentPark} slot garasi kosong (${currentPark}/${maxPark})`}
                </div>
              </div>
              ${isGarageUpgrading ? `
                <button disabled class="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-not-allowed">
                  ⏳ Sedang Diperluas...
                </button>
              ` : `
                <button onclick="game.upgradeParkingCapacity('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold">
                  + Perluas Garasi (4 Slot) - Rp 95 Jt [⏱️ ${this.formatDuration(garageDurationSec)}]
                </button>
              `}
            </div>
            ${isGarageUpgrading ? `
              <div class="pt-1.5 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-amber-300 font-bold flex items-center gap-1">
                    <span class="upgrade-pulsing-badge">🏗️</span> Konstruksi ke ${biz.garageUpgradeTargetCapacity} Slot
                  </span>
                  <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Truck Showroom -->
          <div>
            ${truckShowroom}
          </div>
        `;
      } else if (this.detailSubTab === 'warehouse') {
        const curTier = WAREHOUSE_TIERS.find(t => t.level === (biz.warehouseLevel || 1)) || WAREHOUSE_TIERS[0];
        const nextTier = WAREHOUSE_TIERS.find(t => t.level === (biz.warehouseLevel || 1) + 1);

        logisticsTabContent = `
          <!-- Fasilitas & Tingkat Pergudangan -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isWarehouseUpgrading ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800'} space-y-2 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Tingkat Fasilitas & Slot Gudang:</span>
                <span class="font-bold text-white text-xs ${isWarehouseUpgrading ? 'text-blue-400' : 'text-emerald-400'}">Level ${biz.warehouseLevel || 1} • ${curTier.name}</span>
              </div>
              <span class="text-xs font-mono text-slate-300 font-bold">${usedSlots} / ${maxWare} Slot Mitra Terisi</span>
            </div>
            <p class="text-[11px] text-slate-400">${curTier.desc}</p>

            <div class="pt-1 border-t border-slate-800/80">
              ${isWarehouseUpgrading ? `
                <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-blue-300 font-bold flex items-center gap-1">
                      <span class="upgrade-pulsing-badge">🏗️</span> Sedang Ekspansi ke Level ${biz.warehouseUpgradeTargetLevel} (+1 Slot Mitra)
                    </span>
                    <span class="font-mono font-bold text-blue-400" data-biz-timer="${biz.warehouseUpgradeEndTime}">...</span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div data-biz-progress data-biz-start="${biz.warehouseUpgradeStartTime}" data-biz-end="${biz.warehouseUpgradeEndTime}" class="h-full bg-gradient-to-r from-blue-500 to-emerald-400 progress-striped rounded-full"></div>
                  </div>
                </div>
              ` : (nextTier && (biz.warehouseLevel || 1) < 10 ? `
                <button onclick="game.upgradeWarehouse('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                  <span>⬆️ Perluas Slot & Fasilitas ke Level ${nextTier.level} (+1 Slot: ${nextTier.name}) - ${this.formatCompact(nextTier.upgradeCost)} [⏱️ ${this.formatDuration(nextTier.upgradeDuration)}]</span>
                </button>
              ` : `
                <div class="text-xs text-amber-300 font-bold text-center py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  👑 Fasilitas Gudang & 10 Slot Mitra Telah Mencapai Tingkat Maksimal (Level 10)
                </div>
              `)}
            </div>
          </div>

          <!-- Deskripsi Kemitraan -->
          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-1">Daftar 10 Mitra Penyewa Gudang</h4>
            <p class="text-[11px] text-slate-400 mb-2">Bermitra dengan perusahaan penyewa untuk mengisi slot gudang (1 slot per mitra). Setiap kenaikan level membuka 1 slot dan 1 mitra baru hingga maksimal 10 mitra.</p>
          </div>
          
          <div>
            ${tenantPartnersCards}
          </div>
        `;
      }

      specificSectionHtml = `
        <!-- Sub-tabs: Truk Beroperasi vs Pembelian Truk vs Mitra Gudang -->
        <div class="flex items-center justify-between mb-3 bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button onclick="game.setDetailSubTab('active')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            this.detailSubTab === 'active' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🚛 Truk Aktif</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
              this.detailSubTab === 'active' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-400'
            }">${trucks.length}</span>
          </button>
          <button onclick="game.setDetailSubTab('buy')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            this.detailSubTab === 'buy' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🛒 Showroom</span>
          </button>
          <button onclick="game.setDetailSubTab('warehouse')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            this.detailSubTab === 'warehouse' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🏢 Mitra Gudang</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
              this.detailSubTab === 'warehouse' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-400'
            }">${tenants.length}</span>
          </button>
        </div>

        ${logisticsTabContent}
      `;
    }

    // DETAIL: BRAND FASHION ROADMAP & TAHAPAN
    else if (biz.sectorId === 'fashion') {
      const curStageIdx = Math.min(biz.level, FASHION_STAGES.length) - 1;
      const curStage = FASHION_STAGES[curStageIdx] || FASHION_STAGES[0];
      const isMaxStage = biz.level >= FASHION_STAGES.length;
      const nextStage = !isMaxStage ? FASHION_STAGES[biz.level] : null;
      const upgradeCost = this.getBusinessUpgradeCost(biz);
      const isUpgrading = !!biz.upgradeInProgress;

      let upgradeActionHtml = '';
      if (isUpgrading) {
        const remSec = Math.max(0, Math.ceil((biz.upgradeEndTime - Date.now()) / 1000));
        const startTime = biz.upgradeStartTime || Date.now();
        const endTime = biz.upgradeEndTime || (Date.now() + 1000);
        const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

        upgradeActionHtml = `
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-amber-300 flex items-center gap-1.5">
                <span class="upgrade-pulsing-badge">🏗️</span>
                Ekspansi Menuju Level ${biz.upgradeTargetLevel} Sedang Berjalan
              </span>
              <span data-biz-timer="${biz.upgradeEndTime}" class="font-mono font-bold text-amber-400">
                ${this.formatDuration(remSec)}
              </span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 progress-striped" style="width: ${progress}%"></div>
            </div>
            <div class="text-[11px] text-slate-400 text-center">Desainer & tim produksi sedang mempersiapkan fasilitas baru...</div>
          </div>
        `;
      } else if (!isMaxStage && nextStage) {
        const canAfford = this.state.cash >= upgradeCost;
        upgradeActionHtml = `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div class="flex justify-between items-center text-xs">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Tingkatkan ke Tahap Berikutnya:</span>
                <span class="font-bold text-white">${nextStage.icon} Level ${nextStage.level}: ${nextStage.title}</span>
              </div>
              <span class="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold">
                ⏱️ ${this.formatDuration(nextStage.upgradeDuration)}
              </span>
            </div>
            <button onclick="game.upgradeBusinessLevel('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition ${
              canAfford
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }">
              Mulai Proyek Ekspansi (${this.formatCompact(upgradeCost)})
            </button>
          </div>
        `;
      } else {
        upgradeActionHtml = `
          <div class="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-400/30 text-center space-y-1">
            <div class="text-xl">👑</div>
            <div class="font-black text-amber-300 text-xs">Puncak Mahakarya Adibusana Dunia</div>
            <p class="text-[11px] text-slate-300">Brand Anda telah tampil di Paris Fashion Week dan menguasai pasar kemewahan global.</p>
          </div>
        `;
      }

      // Visual Stepper Roadmap
      const roadmapStepsHtml = FASHION_STAGES.map(s => {
        const isPast = biz.level > s.level;
        const isCurrent = biz.level === s.level;

        let badgeClass = 'border-slate-800 bg-slate-950 text-slate-500';
        let statusBadge = '<span class="text-[10px] text-slate-500">🔒 Belum Terbuka</span>';
        if (isPast) {
          badgeClass = 'border-emerald-500/40 bg-emerald-500/5 text-slate-200';
          statusBadge = '<span class="text-[10px] text-emerald-400 font-bold">✓ Selesai Dicapai</span>';
        } else if (isCurrent) {
          badgeClass = 'border-amber-400/60 bg-amber-400/10 text-white shadow-sm ring-1 ring-amber-400/30';
          statusBadge = '<span class="text-[10px] text-amber-300 font-black animate-pulse">🔥 Tahap Operasional Saat Ini</span>';
        }

        return `
          <div class="p-3 rounded-xl border ${badgeClass} space-y-1.5 transition">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">${s.icon}</span>
                <div>
                  <div class="font-bold text-xs ${isCurrent ? 'text-amber-300 font-black' : (isPast ? 'text-white' : 'text-slate-400')}">
                    Level ${s.level}: ${s.title}
                  </div>
                  <div class="text-[10px] text-slate-400">${s.marketScope}</div>
                </div>
              </div>
              <div class="text-right">
                ${statusBadge}
                <div class="text-[10px] font-mono font-bold ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}">${s.multiplier}x Multiplier Omzet</div>
              </div>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">${s.desc}</p>
          </div>
        `;
      }).join('');

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Status Banner Saat Ini -->
          <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-slate-400 font-semibold">Tahap Operasional Sekarang:</span>
              <span class="text-xs font-mono font-black text-amber-300">Level ${curStage.level} / ${FASHION_STAGES.length}</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${curStage.icon}</span>
              <div>
                <h4 class="font-bold text-white text-sm">${curStage.title}</h4>
                <div class="text-[11px] text-emerald-400 font-semibold">Cakupan Pasar: ${curStage.marketScope}</div>
              </div>
            </div>
            <div class="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              ${curStage.desc}
            </div>
          </div>

          <!-- Aksi Upgrade / Timer Proyek -->
          ${upgradeActionHtml}

          <!-- Roadmap Jenjang Level (1 - 6) -->
          <div class="space-y-2 pt-1">
            <div class="flex items-center justify-between">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Roadmap Tahapan Brand Fashion</h4>
              <span class="text-[10px] text-slate-500">6 Tingkatan</span>
            </div>
            <div class="space-y-2">
              ${roadmapStepsHtml}
            </div>
          </div>
        </div>
      `;
    }

    // DETAIL: BANK
    else if (sector.isBank) {
      const custDep = this.getBankCustomerDeposits(biz);
      const reqDep = this.getBankRequiredCustomerDeposits(biz.level);
      const growthRate = this.getBankDepositGrowthRate(biz);
      const isReqMet = custDep >= reqDep;
      const percentDep = Math.min(100, Math.floor((custDep / reqDep) * 100));
      const upgradeCost = this.getBusinessUpgradeCost(biz);
      const durationSec = this.getUpgradeDurationSeconds(biz);
      const isUpgrading = !!biz.upgradeInProgress;
      const canAfford = this.state.cash >= upgradeCost;

      let upgradeActionHtml = '';
      if (isUpgrading) {
        const remSec = Math.max(0, Math.ceil((biz.upgradeEndTime - Date.now()) / 1000));
        const startTime = biz.upgradeStartTime || Date.now();
        const endTime = biz.upgradeEndTime || (Date.now() + 1000);
        const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

        upgradeActionHtml = `
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-blue-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-blue-300 flex items-center gap-1.5">
                <span class="upgrade-pulsing-badge">🏗️</span>
                Ekspansi Akreditasi Level ${biz.upgradeTargetLevel} Sedang Berjalan
              </span>
              <span data-biz-timer="${biz.upgradeEndTime}" class="font-mono font-bold text-blue-400">
                ${this.formatDuration(remSec)}
              </span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-blue-400 progress-striped" style="width: ${progress}%"></div>
            </div>
            <div class="text-[11px] text-slate-400 text-center">Otoritas jasa keuangan & arsitek sedang meninjau gedung kantor cabang baru...</div>
          </div>
        `;
      } else {
        upgradeActionHtml = `
          <button onclick="game.upgradeBusinessLevel('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition ${
            canAfford && isReqMet
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }">
            ${!isReqMet ? `🔒 Butuh DPK ${this.formatCompact(reqDep)} • ` : ''}Tingkatkan Bank ke Level ${biz.level + 1} (${this.formatCompact(upgradeCost)}) • ⏱️ ${this.formatDuration(durationSec)}
          </button>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Status Modal & Simpanan Nasabah -->
          <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-slate-400">Akreditasi Bank:</span>
              <span class="font-extrabold text-blue-400 font-mono text-sm">Level ${biz.level}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Cadangan Kas Brankas:</span>
              <span class="font-bold text-emerald-400">${this.formatMoney(biz.vault || 0)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Total Simpanan Nasabah (DPK):</span>
              <span class="font-black text-white text-sm">${this.formatMoney(custDep)}</span>
            </div>
            <div class="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
              <span class="text-slate-400">Arus Masuk Nasabah Otomatis:</span>
              <span class="font-bold text-blue-400">+${this.formatCompact(growthRate)}/jam</span>
            </div>
          </div>

          <!-- Syarat Ekspansi Level Berikutnya -->
          <div class="glass-panel p-4 rounded-2xl border ${isReqMet ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'} space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold ${isReqMet ? 'text-emerald-400' : 'text-amber-300'} flex items-center gap-1.5">
                <span>${isReqMet ? '✅' : '📋'}</span>
                Syarat Ekspansi Akreditasi Level ${biz.level + 1}
              </span>
              <span class="font-mono font-bold ${isReqMet ? 'text-emerald-400' : 'text-amber-400'}">${percentDep}%</span>
            </div>
            
            <div class="flex items-center justify-between text-[11px] pt-1">
              <span class="text-slate-400">Target Simpanan Nasabah:</span>
              <span class="font-bold text-white">${this.formatMoney(reqDep)}</span>
            </div>

            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="h-full ${isReqMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${percentDep}%"></div>
            </div>

            <div class="text-[11px] ${isReqMet ? 'text-emerald-300 font-semibold' : 'text-slate-400'} pt-1">
              ${isReqMet 
                ? '✓ Syarat simpanan nasabah telah terpenuhi! Anda dapat memulai proyek ekspansi.' 
                : `💡 Butuh tambahan DPK nasabah senilai ${this.formatCompact(reqDep - custDep)} lagi. Simpanan bertambah sendiri seiring waktu & saat offline (+${this.formatCompact(growthRate)}/jam). Naikkan bunga simpanan di panel pengaturan untuk mempercepat arus masuk nasabah!`
              }
            </div>
          </div>

          <!-- Aksi Upgrade Level Bank -->
          ${upgradeActionHtml}

          <!-- Buka Panel Suku Bunga & Brankas -->
          <button onclick="game.openBankModal('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
            <span>⚙️ Atur Suku Bunga & Setor/Tarik Brankas Bank</span>
          </button>
        </div>
      `;
    }

    // DETAIL: SOFTWARE HOUSE / GAME STUDIO (TECH)
    else if (sector.isTech || biz.sectorId === 'tech') {
      if (!['projects', 'team', 'office'].includes(this.detailSubTab)) {
        this.detailSubTab = 'projects';
      }

      const totalEmployees = this.getTechTotalEmployees(biz);
      const workstations = biz.workstations || 15;
      const hourlySalary = this.getTechHourlySalaries(biz);
      const activeProject = biz.activeProject;
      const isProjectRunning = !!activeProject && !activeProject.completed;
      const isProjectReady = !!activeProject && activeProject.completed;
      const isOfficeUpgrading = !!biz.officeUpgradeInProgress;

      let techTabContent = '';

      // SUB-TAB 1: PROYEK SOFTWARE (11 PROYEK)
      if (this.detailSubTab === 'projects') {
        let activeProjectCardHtml = '';
        if (isProjectReady) {
          activeProjectCardHtml = `
            <div class="p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-xs shadow-lg space-y-2 mb-3">
              <div class="flex items-center justify-between">
                <span class="font-black text-emerald-400 flex items-center gap-1.5 text-sm">
                  <span>🎉</span> Pengerjaan Proyek Selesai!
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black uppercase tracking-wider">
                  Siap Klaim
                </span>
              </div>
              <div class="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div class="font-bold text-white text-xs">${activeProject.name}</div>
                  <div class="text-[11px] text-slate-400">Honor Proyek Selesai Divalidasi</div>
                </div>
                <div class="font-black text-emerald-400 font-mono text-sm">${this.formatMoney(activeProject.reward)}</div>
              </div>
              <p class="text-[11px] text-slate-300">
                Uang pembayaran proyek tidak akan masuk ke kas sebelum Anda menekan tombol klaim di bawah ini.
              </p>
              <button onclick="game.claimTechProject('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/30 flex items-center justify-center gap-1.5">
                <span>💰 Klaim Hasil Proyek (${this.formatMoney(activeProject.reward)})</span>
              </button>
            </div>
          `;
        } else if (isProjectRunning) {
          const remSec = Math.max(0, Math.ceil((activeProject.endTime - Date.now()) / 1000));
          const startTime = activeProject.startTime || Date.now();
          const endTime = activeProject.endTime || (Date.now() + 1000);
          const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

          activeProjectCardHtml = `
            <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/40 text-xs shadow-lg space-y-2 mb-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-purple-300 flex items-center gap-1.5">
                  <span class="upgrade-pulsing-badge">💻</span> Proyek Sedang Dikerjakan Tim
                </span>
                <span data-biz-timer="${activeProject.endTime}" class="font-mono font-bold text-purple-400">
                  ${this.formatDuration(remSec)}
                </span>
              </div>
              <div class="bg-slate-950/70 p-2.5 rounded-xl border border-purple-500/20 flex items-center justify-between">
                <div>
                  <div class="font-bold text-white text-xs">${activeProject.name}</div>
                  <div class="text-[11px] text-slate-400">Imbalan Kontrak Saat Selesai</div>
                </div>
                <div class="font-black text-purple-300 font-mono text-xs">${this.formatMoney(activeProject.reward)}</div>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-gradient-to-r from-purple-500 to-pink-500 progress-striped" style="width: ${progress}%"></div>
              </div>
              <div class="text-[10px] text-slate-400 flex items-center justify-between">
                <span>⏱️ Waktu Pengerjaan Real-Time</span>
                <span>Gaji Karyawan Tetap Dibayar: -${this.formatCompact(hourlySalary)}/jam</span>
              </div>
            </div>
          `;
        } else {
          activeProjectCardHtml = `
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">💤</span>
                <div>
                  <div class="font-bold text-slate-300">Belum Ada Proyek Aktif</div>
                  <div class="text-[11px] text-slate-500">Pilih salah satu kontrak proyek di katalog bawah untuk mulai menghasilkan uang.</div>
                </div>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">Idle</span>
            </div>
          `;
        }

        // Render Catalog of 11 Projects
        const projectsListHtml = TECH_PROJECTS_CATALOG.map((proj, idx) => {
          const reqDev = proj.req.dev || 0;
          const reqLead = proj.req.lead || 0;
          const reqDes = proj.req.designer || 0;
          const reqTest = proj.req.tester || 0;

          const curDev = biz.employees?.dev || 0;
          const curLead = biz.employees?.lead || 0;
          const curDes = biz.employees?.designer || 0;
          const curTest = biz.employees?.tester || 0;

          const hasDev = curDev >= reqDev;
          const hasLead = curLead >= reqLead;
          const hasDes = curDes >= reqDes;
          const hasTest = curTest >= reqTest;
          const isEligible = hasDev && hasLead && hasDes && hasTest;

          let btnHtml = '';
          if (activeProject) {
            btnHtml = `
              <button disabled class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700/50">
                Sedang Mengerjakan Proyek Lain
              </button>
            `;
          } else if (!isEligible) {
            btnHtml = `
              <button disabled class="w-full py-2 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs cursor-not-allowed border border-rose-500/20">
                ⚠️ Karyawan Belum Cukup (Cek Syarat Tim)
              </button>
            `;
          } else {
            btnHtml = `
              <button onclick="game.startTechProject('${biz.instanceId}', '${proj.id}')" class="btn-press w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5">
                <span>🚀 Ambil Kontrak Proyek • ⏱️ ${this.formatDuration(proj.durationSeconds)}</span>
              </button>
            `;
          }

          return `
            <div class="glass-panel p-3.5 rounded-2xl border ${isEligible ? 'border-slate-800 hover:border-emerald-500/40' : 'border-slate-800/80 opacity-90'} space-y-2.5 transition">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${proj.icon}</span>
                  <div>
                    <div class="font-black text-white text-xs">${idx + 1}. ${proj.name}</div>
                    <div class="text-[10px] text-slate-400">${proj.desc}</div>
                  </div>
                </div>
              </div>

              <!-- Reward & Durasi -->
              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 block">Nilai Honor Proyek:</span>
                  <span class="font-black text-emerald-400 font-mono">${this.formatMoney(proj.reward)}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">Waktu Pengerjaan:</span>
                  <span class="font-bold text-amber-400 font-mono">⏱️ ${this.formatDuration(proj.durationSeconds)}</span>
                </div>
              </div>

              <!-- Syarat Karyawan -->
              <div class="space-y-1">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syarat Tenaga Ahli:</div>
                <div class="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div class="p-1.5 rounded-lg border ${hasDev ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/5 border-rose-500/30 text-rose-300'} flex items-center justify-between">
                    <span>👨‍💻 Dev:</span>
                    <span class="font-mono font-bold">${curDev}/${reqDev} ${hasDev ? '✓' : '✗'}</span>
                  </div>
                  <div class="p-1.5 rounded-lg border ${hasLead ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/5 border-rose-500/30 text-rose-300'} flex items-center justify-between">
                    <span>👔 Lead:</span>
                    <span class="font-mono font-bold">${curLead}/${reqLead} ${hasLead ? '✓' : '✗'}</span>
                  </div>
                  <div class="p-1.5 rounded-lg border ${hasDes ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/5 border-rose-500/30 text-rose-300'} flex items-center justify-between">
                    <span>🎨 Desainer:</span>
                    <span class="font-mono font-bold">${curDes}/${reqDes} ${hasDes ? '✓' : '✗'}</span>
                  </div>
                  <div class="p-1.5 rounded-lg border ${hasTest ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/5 border-rose-500/30 text-rose-300'} flex items-center justify-between">
                    <span>🔍 Tester:</span>
                    <span class="font-mono font-bold">${curTest}/${reqTest} ${hasTest ? '✓' : '✗'}</span>
                  </div>
                </div>
              </div>

              <!-- Tombol Aksi -->
              ${btnHtml}
            </div>
          `;
        }).join('');

        techTabContent = `
          ${activeProjectCardHtml}

          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Katalog Kontrak Proyek Software (11 Proyek)</h4>
            <p class="text-[11px] text-slate-400">Pilih proyek sesuai kapasitas karyawan Anda. Semakin besar proyek, semakin besar imbalan dan waktu yang dibutuhkan.</p>
          </div>

          <div class="space-y-3">
            ${projectsListHtml}
          </div>
        `;
      }

      // SUB-TAB 2: TIM & KARYAWAN
      else if (this.detailSubTab === 'team') {
        const occPercent = Math.min(100, Math.round((totalEmployees / workstations) * 100));

        const rolesHtml = TECH_ROLES.map(role => {
          const count = biz.employees?.[role.id] || 0;
          const roleSalary = count * role.salary;
          const canHire1 = totalEmployees + 1 <= workstations && this.state.cash >= role.hireCost;
          const canHire5 = totalEmployees + 5 <= workstations && this.state.cash >= (role.hireCost * 5);
          const canFire1 = count > 0;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${role.icon}</span>
                  <div>
                    <h5 class="font-bold text-white text-xs">${role.name}</h5>
                    <div class="text-[10px] text-slate-400">${role.title} • ${role.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-mono font-black text-amber-300 text-sm">${count} Orang</div>
                  <div class="text-[10px] text-rose-400 font-mono">-${this.formatCompact(roleSalary)}/jam</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Gaji: <strong class="text-slate-200">${this.formatCompact(role.salary)}/org/jam</strong></span>
                <span class="text-slate-400">Biaya Rekrut: <strong class="text-emerald-400">${this.formatCompact(role.hireCost)}</strong></span>
              </div>

              <!-- Tombol Rekrut & PHK -->
              <div class="grid grid-cols-3 gap-1.5 pt-0.5">
                <button onclick="game.hireTechEmployee('${biz.instanceId}', '${role.id}', 1)" ${!canHire1 ? 'disabled' : ''} class="btn-press py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  canHire1 ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }">
                  <span>+1 Rekrut</span>
                </button>
                <button onclick="game.hireTechEmployee('${biz.instanceId}', '${role.id}', 5)" ${!canHire5 ? 'disabled' : ''} class="btn-press py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  canHire5 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }">
                  <span>+5 Rekrut</span>
                </button>
                <button onclick="game.fireTechEmployee('${biz.instanceId}', '${role.id}', 1)" ${!canFire1 ? 'disabled' : ''} class="btn-press py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  canFire1 ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-800'
                }">
                  <span>PHK -1</span>
                </button>
              </div>
            </div>
          `;
        }).join('');

        techTabContent = `
          <!-- Kapasitas Workstation & Total Gaji -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Penggunaan Workstation:</span>
                <span class="font-black text-white text-sm">${totalEmployees} / ${workstations} Meja Terisi</span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Total Beban Gaji Tim:</span>
                <span class="font-mono font-black text-rose-400 text-sm">-${this.formatMoney(hourlySalary)}/jam</span>
              </div>
            </div>

            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div class="h-full ${occPercent >= 100 ? 'bg-rose-500' : 'bg-emerald-400'} rounded-full transition-all" style="width: ${occPercent}%"></div>
            </div>

            <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
              <div class="font-bold flex items-center gap-1">
                <span>⚠️</span> Aturan Penggajian Software House:
              </div>
              <div class="text-slate-300 text-[10px] leading-relaxed">
                Gaji karyawan dipotong otomatis setiap jam game terlepas dari sedang ada proyek aktif atau selesai. Pastikan kas Anda terjaga dan rutin ambil proyek bernilai tinggi! Jika meja kerja penuh, perluas kantor di tab <strong>Kantor & Workstation</strong>.
              </div>
            </div>
          </div>

          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Daftar Divisi & Karyawan</h4>
            <p class="text-[11px] text-slate-400">Atur formasi tim ahli Anda untuk memenuhi persyaratan kontrak proyek bernilai besar.</p>
          </div>

          <div class="space-y-3">
            ${rolesHtml}
          </div>
        `;
      }

      // SUB-TAB 3: KANTOR & WORKSTATION (SMALL / STANDARD / BUSINESS CENTER)
      else if (this.detailSubTab === 'office') {
        let officeRenovationHtml = '';
        if (isOfficeUpgrading) {
          const remSec = Math.max(0, Math.ceil((biz.officeUpgradeEndTime - Date.now()) / 1000));
          const startTime = biz.officeUpgradeStartTime || Date.now();
          const endTime = biz.officeUpgradeEndTime || (Date.now() + 1000);
          const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

          officeRenovationHtml = `
            <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs shadow-lg space-y-2 mb-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-amber-300 flex items-center gap-1.5">
                  <span class="upgrade-pulsing-badge">🏗️</span> Renovasi Perluasan Kantor Berjalan
                </span>
                <span data-biz-timer="${biz.officeUpgradeEndTime}" class="font-mono font-bold text-amber-400">
                  ${this.formatDuration(remSec)}
                </span>
              </div>
              <div class="bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-white">Target: +${biz.officeUpgradeAddedWorkstations} Workstation</div>
                  <div class="text-[10px] text-slate-400">Total baru: ${biz.officeUpgradeTargetWorkstations} Workstation</div>
                </div>
                <span class="text-amber-400 font-bold text-[10px] uppercase">Pengerjaan Kontraktor</span>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-amber-400 progress-striped" style="width: ${progress}%"></div>
              </div>
              <div class="text-[10px] text-slate-400 text-center">Tukang bangunan sedang memasang cubicle meja kerja & instalasi LAN/Server...</div>
            </div>
          `;
        }

        const officeTypesHtml = TECH_OFFICE_TYPES.map(type => {
          const canAfford = this.state.cash >= type.cost;

          let btnHtml = '';
          if (isOfficeUpgrading) {
            btnHtml = `
              <button disabled class="w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700/50">
                Renovasi Lain Sedang Dikerjakan
              </button>
            `;
          } else if (!canAfford) {
            btnHtml = `
              <button disabled class="w-full py-2.5 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs cursor-not-allowed border border-rose-500/20">
                Dana Tidak Cukup (${this.formatCompact(type.cost)})
              </button>
            `;
          } else {
            btnHtml = `
              <button onclick="game.upgradeOffice('${biz.instanceId}', '${type.id}')" class="btn-press w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5">
                <span>🏢 Beli Perluasan (+${type.addedWorkstations} Meja) • ${this.formatCompact(type.cost)}</span>
              </button>
            `;
          }

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5 hover:border-blue-500/40 transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${type.icon}</span>
                  <div>
                    <h5 class="font-bold text-white text-xs">${type.name}</h5>
                    <div class="text-[10px] text-slate-400">${type.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${type.addedWorkstations} Meja</span>
                  <div class="text-[10px] text-amber-400 font-mono">⏱️ ${this.formatDuration(type.durationSeconds)}</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span class="text-slate-400">Biaya Investasi: <strong class="text-white">${this.formatMoney(type.cost)}</strong></span>
                <span class="text-slate-400">Total Baru: <strong class="text-emerald-300 font-mono">${workstations + type.addedWorkstations} Meja</strong></span>
              </div>

              ${btnHtml}
            </div>
          `;
        }).join('');

        techTabContent = `
          ${officeRenovationHtml}

          <!-- Info Kantor Saat Ini -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Total Workstation Saat Ini:</span>
                <span class="font-black text-white text-sm">${workstations} Workstations</span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Sisa Meja Kosong:</span>
                <span class="font-mono font-black text-emerald-400 text-sm">${Math.max(0, workstations - totalEmployees)} Meja</span>
              </div>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              Setiap upgrade kantor menambahkan kapasitas workstation secara permanen. Durasi pengerjaan dihitung berdasarkan waktu dunia nyata (minimal 14 menit).
            </p>
          </div>

          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Pilihan Upgrade Ruang Kantor</h4>
            <p class="text-[11px] text-slate-400">Pilih tipe kantor yang ingin Anda sewa dan renovasi untuk menampung lebih banyak developer.</p>
          </div>

          <div class="space-y-3">
            ${officeTypesHtml}
          </div>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button onclick="game.setDetailSubTab('projects')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'projects' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>📂 Proyek</span>
              ${isProjectReady ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-slate-950 font-black animate-pulse">Klaim</span>` : (isProjectRunning ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500 text-white font-bold">1</span>` : '')}
            </button>
            <button onclick="game.setDetailSubTab('team')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'team' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>👥 Tim (${totalEmployees}/${workstations})</span>
            </button>
            <button onclick="game.setDetailSubTab('office')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'office' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>🏢 Kantor</span>
              ${isOfficeUpgrading ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-black animate-pulse">Renov</span>` : ''}
            </button>
          </div>

          <!-- Konten Sub-Tab Aktif -->
          <div>
            ${techTabContent}
          </div>
        </div>
      `;
    }

    // DETAIL: MASKAPAI PENERBANGAN KOMERSIAL (AIRLINE)
    else if (sector.isAirline || biz.sectorId === 'airline') {
      if (!['routes', 'fleet', 'maintenance'].includes(this.detailSubTab)) {
        this.detailSubTab = 'routes';
      }

      const stats = this.getAirlineOperatingStats(biz);
      const isRouteUnlocking = !!biz.routeUnlockInProgress;

      let airlineTabContent = '';

      // SUB-TAB 1: RUTE PENERBANGAN INTERNASIONAL
      if (this.detailSubTab === 'routes') {
        let routeUnlockBannerHtml = '';
        if (isRouteUnlocking) {
          const remSec = Math.max(0, Math.ceil((biz.routeUnlockInProgress.endTime - Date.now()) / 1000));
          const startTime = biz.routeUnlockInProgress.startTime || Date.now();
          const endTime = biz.routeUnlockInProgress.endTime || (Date.now() + 1000);
          const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

          routeUnlockBannerHtml = `
            <div class="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/40 text-xs shadow-lg space-y-2 mb-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-blue-300 flex items-center gap-1.5">
                  <span class="upgrade-pulsing-badge">🛫</span> Negosiasi Hak Slot Terbang Sedang Berjalan
                </span>
                <span data-biz-timer="${biz.routeUnlockInProgress.endTime}" class="font-mono font-bold text-blue-400">
                  ${this.formatDuration(remSec)}
                </span>
              </div>
              <div class="bg-slate-950/70 p-2.5 rounded-xl border border-blue-500/20 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-white">${biz.routeUnlockInProgress.destination}</div>
                  <div class="text-[10px] text-slate-400">Verifikasi dokumen kelaikan & slot pendaratan bandara tujuan</div>
                </div>
                <span class="text-blue-400 font-bold text-[10px] uppercase">Otoritas Penerbangan</span>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 progress-striped rounded-full" style="width: ${progress}%"></div>
              </div>
            </div>
          `;
        }

        // Render Catalog of 10 Routes
        const routesListHtml = AIRLINE_ROUTES_CATALOG.map((route, idx) => {
          const isOpen = (biz.routes || []).includes(route.id);
          const catInfo = AIRCRAFT_CATEGORIES[route.requiredCategory] || { name: route.requiredCategory, shortName: route.requiredCategory, icon: '✈️' };

          // Detail for open route
          const rDetail = stats.routeDetails.find(rd => rd.route.id === route.id);

          // Planes matching category
          const planes = biz.planes || [];
          const matchingPlanes = planes.filter(p => {
            const m = AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId);
            return m && m.category === route.requiredCategory;
          });
          const usedMatchingCount = (biz.routes || []).filter(rId => {
            const r = AIRLINE_ROUTES_CATALOG.find(x => x.id === rId);
            return r && r.requiredCategory === route.requiredCategory;
          }).length;
          const hasAvailablePlane = matchingPlanes.length > usedMatchingCount;
          const canAffordUnlock = this.state.cash >= route.unlockCost;

          if (isOpen) {
            const plane = rDetail ? rDetail.plane : null;
            const planeModel = plane ? AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === plane.modelId) : null;
            const isOperating = rDetail && rDetail.isOperating;
            const isGrounded = rDetail && rDetail.reason === 'grounded';

            return `
              <div class="glass-panel p-3.5 rounded-2xl border ${isOperating ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'} space-y-2.5 transition">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <span class="text-3xl">${route.flag}</span>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <h5 class="font-black text-white text-xs">${idx + 1}. ${route.destination}</h5>
                        <span class="text-[9px] px-2 py-0.5 rounded-full font-black ${isOperating ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}">
                          ${isOperating ? '🟢 Mengudara' : (isGrounded ? '🔴 Grounded' : '⚠️ Tanpa Pesawat')}
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400">Jarak: ${route.distanceKm.toLocaleString('id-ID')} km • CGK ⇄ ${route.destination.split('(')[1]?.split(')')[0] || 'DEST'}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-mono font-black ${isOperating ? 'text-emerald-400' : 'text-rose-400'}">
                      ${isOperating ? '+' + this.formatMoney(route.hourlyRevenue) + '/jam' : 'Rp 0/jam'}
                    </div>
                    <div class="text-[10px] text-slate-400">${isOperating ? 'Omzet Tiket & Kargo' : 'Pesawat Tidak Terbang'}</div>
                  </div>
                </div>

                <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">${planeModel ? planeModel.icon : '❓'}</span>
                    <div>
                      <div class="font-bold text-white text-[11px]">${planeModel ? planeModel.name : 'Belum Ditugaskan'}</div>
                      <div class="text-[10px] text-slate-400">Kapasitas: ${planeModel ? planeModel.capacity + ' Kursi' : '-'} • Syarat: ${catInfo.name}</div>
                    </div>
                  </div>
                  ${isGrounded ? `
                    <button onclick="game.payAirlineMaintenance('${biz.instanceId}')" class="btn-press px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm">
                      🔧 Bayar Perawatan
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }

          // Rute Belum Dibuka
          let actionBtnHtml = '';
          if (isRouteUnlocking) {
            actionBtnHtml = `
              <button disabled class="w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700/50">
                Sedang Mengurus Izin Rute Lain
              </button>
            `;
          } else if (matchingPlanes.length === 0) {
            actionBtnHtml = `
              <button onclick="game.setDetailSubTab('fleet')" class="btn-press w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5">
                <span>⚠️ Butuh Pesawat ${catInfo.shortName} (Beli di Tab Armada →)</span>
              </button>
            `;
          } else if (!hasAvailablePlane) {
            actionBtnHtml = `
              <button onclick="game.setDetailSubTab('fleet')" class="btn-press w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5">
                <span>⚠️ Seluruh Pesawat ${catInfo.shortName} Terpakai (${matchingPlanes.length}/${usedMatchingCount}) (Beli Tambahan →)</span>
              </button>
            `;
          } else if (!canAffordUnlock) {
            actionBtnHtml = `
              <button disabled class="w-full py-2.5 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs cursor-not-allowed border border-rose-500/20">
                Dana Izin Tidak Cukup (${this.formatCompact(route.unlockCost)})
              </button>
            `;
          } else {
            actionBtnHtml = `
              <button onclick="game.unlockAirlineRoute('${biz.instanceId}', '${route.id}')" class="btn-press w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5">
                <span>🛫 Buka Izin Rute & Terbangkan (${this.formatCompact(route.unlockCost)}) • ⏱️ ${this.formatDuration(route.durationSeconds)}</span>
              </button>
            `;
          }

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5 opacity-95 hover:border-blue-500/40 transition">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${route.flag}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-black text-white text-xs">${idx + 1}. ${route.destination}</h5>
                      <span class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400">Terkunci</span>
                    </div>
                    <div class="text-[10px] text-slate-400">Jarak: ${route.distanceKm.toLocaleString('id-ID')} km • ${route.desc}</div>
                  </div>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 block">Syarat Jenis Pesawat:</span>
                  <span class="font-bold text-white text-[11px] flex items-center gap-1">
                    <span>${catInfo.icon}</span> ${catInfo.name}
                  </span>
                  <span class="text-[10px] ${hasAvailablePlane ? 'text-emerald-400 font-bold' : 'text-rose-400'}">
                    Armada Tersedia: ${matchingPlanes.length - usedMatchingCount} Unit
                  </span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">Potensi Omzet Tiket:</span>
                  <span class="font-black text-emerald-400 font-mono">+${this.formatMoney(route.hourlyRevenue)}/jam</span>
                  <span class="text-[10px] text-amber-400 font-mono block">Biaya Izin: ${this.formatCompact(route.unlockCost)}</span>
                </div>
              </div>

              ${actionBtnHtml}
            </div>
          `;
        }).join('');

        airlineTabContent = `
          ${routeUnlockBannerHtml}

          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Daftar Rute Penerbangan Internasional (10 Rute)</h4>
            <p class="text-[11px] text-slate-400">Buka slot penerbangan ke bandara negara lain. Setiap rute memerlukan armada pesawat yang sesuai dengan jarak tempuh & kapasitas penumpang.</p>
          </div>

          <div class="space-y-3">
            ${routesListHtml}
          </div>
        `;
      }

      // SUB-TAB 2: ARMADA PESAWAT & SHOWROOM
      else if (this.detailSubTab === 'fleet') {
        const ownedPlanes = biz.planes || [];

        const ownedPlanesHtml = ownedPlanes.map((plane, idx) => {
          const model = AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === plane.modelId);
          if (!model) return '';
          const catInfo = AIRCRAFT_CATEGORIES[model.category] || { name: model.category };
          const isGrounded = plane.isGrounded;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border ${isGrounded ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800'} space-y-2">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${model.icon}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">#${idx + 1} ${model.name}</h5>
                      <span class="text-[9px] px-2 py-0.5 rounded-full font-black ${isGrounded ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'}">
                        ${isGrounded ? '🔴 Grounded' : '🟢 Mengudara'}
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400">${catInfo.name} • ${model.manufacturer}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">Biaya Perawatan:</span>
                  <span class="text-xs font-mono font-bold text-rose-400">-${this.formatCompact(model.maintenanceCost)}/jam</span>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Kapasitas: <strong class="text-white">${model.capacity} Penumpang</strong></span>
                <span class="text-slate-400">Jangkauan: <strong class="text-white">${model.rangeKm.toLocaleString('id-ID')} km</strong></span>
                ${isGrounded ? `
                  <button onclick="game.payAirlineMaintenance('${biz.instanceId}')" class="btn-press px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                    Bayar Perawatan
                  </button>
                ` : `
                  <span class="text-emerald-400 font-bold">✓ Kelaikan Terpenuhi</span>
                `}
              </div>
            </div>
          `;
        }).join('');

        const showroomHtml = AIRLINE_AIRCRAFT_CATALOG.map(model => {
          const catInfo = AIRCRAFT_CATEGORIES[model.category] || { name: model.category };
          const canAfford = this.state.cash >= model.price;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5 hover:border-blue-500/40 transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${model.icon}</span>
                  <div>
                    <h5 class="font-bold text-white text-xs">${model.name}</h5>
                    <div class="text-[10px] text-slate-400">${catInfo.name} • ${model.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-white">${this.formatCompact(model.price)}</span>
                  <div class="text-[10px] text-rose-400 font-mono">Beban: -${this.formatCompact(model.maintenanceCost)}/j</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Kapasitas: <strong class="text-white">${model.capacity} Kursi</strong></span>
                <span class="text-slate-400">Jangkauan: <strong class="text-white">${model.rangeKm.toLocaleString('id-ID')} km</strong></span>
                <span class="text-slate-400">Pabrikan: <strong class="text-slate-300">${model.manufacturer}</strong></span>
              </div>

              <button onclick="game.buyAirlinePlane('${biz.instanceId}', '${model.id}')" ${!canAfford ? 'disabled' : ''} class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-rose-400 cursor-not-allowed border border-rose-500/20'
              }">
                <span>${canAfford ? `🛒 Beli Armada (${this.formatCompact(model.price)})` : `Dana Tidak Cukup (${this.formatCompact(model.price)})`}</span>
              </button>
            </div>
          `;
        }).join('');

        airlineTabContent = `
          <!-- Daftar Armada Pesawat Dimiliki -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Armada Pesawat Dimiliki (${ownedPlanes.length} Unit)</h4>
              <span class="text-[11px] font-mono text-emerald-400 font-bold">${stats.operatingPlanesCount} Terbang • ${stats.groundedPlanesCount} Grounded</span>
            </div>
            <div class="space-y-2.5">
              ${ownedPlanesHtml.length > 0 ? ownedPlanesHtml : '<div class="text-xs text-slate-400 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">Belum ada pesawat. Silakan beli armada di showroom bawah!</div>'}
            </div>
          </div>

          <!-- Showroom Pembelian Pesawat -->
          <div>
            <div class="mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Showroom Pembelian Pesawat Baru (8 Model)</h4>
              <p class="text-[11px] text-slate-400">Pilih armada sesuai kebutuhan rute (Jet Regional, Boeing Sedang, Wide-Body, atau Superjumbo Double Deck).</p>
            </div>
            <div class="space-y-3">
              ${showroomHtml}
            </div>
          </div>
        `;
      }

      // SUB-TAB 3: PEMELIHARAAN & KELAIKAN (MAINTENANCE)
      else if (this.detailSubTab === 'maintenance') {
        const isAllAirworthy = stats.groundedPlanesCount === 0;

        airlineTabContent = `
          <!-- Status Kelaikan Terbang (Airworthiness) -->
          <div class="p-3.5 rounded-2xl ${isAllAirworthy ? 'bg-emerald-500/10 border border-emerald-500/40' : 'bg-rose-500/10 border-2 border-rose-500'} space-y-2.5 mb-3">
            <div class="flex items-center justify-between">
              <span class="font-black text-sm flex items-center gap-1.5 ${isAllAirworthy ? 'text-emerald-400' : 'text-rose-400'}">
                <span>${isAllAirworthy ? '🛡️' : '🚨'}</span>
                ${isAllAirworthy ? 'Seluruh Armada Laik Terbang (100% Airworthy)' : `${stats.groundedPlanesCount} Pesawat Masuk Hangar (Grounded)!`}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded font-black uppercase ${isAllAirworthy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}">
                ${isAllAirworthy ? 'Operasional Normal' : 'Butuh Servis'}
              </span>
            </div>

            <p class="text-[11px] text-slate-300 leading-relaxed">
              ${isAllAirworthy
                ? 'Seluruh pesawat telah mendapatkan inspeksi kelaikan terbang berkala. Rute penerbangan beroperasi normal dan menghasilkan pendapatan penuh setiap jam.'
                : 'Pesawat yang menunggak biaya perawatan di-grounded oleh otoritas penerbangan demi keselamatan penumpang. Seluruh rute yang terdampak tidak akan menghasilkan uang sampai biaya perawatan dilunasi.'
              }
            </p>

            ${!isAllAirworthy ? `
              <button onclick="game.payAirlineMaintenance('${biz.instanceId}')" class="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                <span>💳 Bayar Lunas Perawatan Seluruh Armada (${this.formatMoney(stats.totalMaintenanceCost)})</span>
              </button>
            ` : ''}
          </div>

          <!-- Pengaturan Otomatis Bayar Perawatan -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-bold text-white text-xs">Sistem Auto-Debet Perawatan Armada</span>
                <div class="text-[10px] text-slate-400">Potong biaya perawatan otomatis setiap jam game agar pesawat tidak pernah grounded.</div>
              </div>
              <button onclick="game.toggleAirlineAutoMaintenance('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl font-black text-xs ${
                biz.autoMaintenance !== false
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }">
                ${biz.autoMaintenance !== false ? '✓ Aktif' : 'Nonaktif'}
              </button>
            </div>
          </div>

          <!-- Ringkasan Biaya Pemeliharaan -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Ringkasan Beban Pemeliharaan</h4>
            <div class="flex justify-between items-center text-xs pb-1.5 border-b border-slate-800/80">
              <span class="text-slate-400">Total Armada Pesawat:</span>
              <span class="font-bold text-white">${stats.totalPlanes} Unit Pesawat</span>
            </div>
            <div class="flex justify-between items-center text-xs pb-1.5 border-b border-slate-800/80">
              <span class="text-slate-400">Total Biaya Perawatan:</span>
              <span class="font-mono font-black text-rose-400">-${this.formatMoney(stats.totalMaintenanceCost)}/jam</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-400">Estimasi Laba Bersih Maskapai:</span>
              <span class="font-mono font-black text-emerald-400">+${this.formatMoney(stats.netRevenue)}/jam</span>
            </div>
          </div>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Overview Card -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Armada Pesawat:</span>
                <span class="font-black text-white text-sm">${stats.operatingPlanesCount} / ${stats.totalPlanes} Pesawat Mengudara</span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Laba Bersih Maskapai:</span>
                <span class="font-mono font-black ${stats.netRevenue > 0 ? 'text-emerald-400' : 'text-slate-400'} text-sm">
                  ${stats.netRevenue > 0 ? '+' + this.formatMoney(stats.netRevenue) + '/jam' : 'Rp 0/jam'}
                </span>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Omzet Tiket: +${this.formatCompact(stats.grossRevenue)}/j</span>
              <span class="text-rose-400">Beban Servis: -${this.formatCompact(stats.totalMaintenanceCost)}/j</span>
              <span class="text-blue-300">${stats.operatingRoutesCount} Rute Aktif</span>
            </div>
          </div>

          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button onclick="game.setDetailSubTab('routes')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'routes' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>🌐 Rute (${stats.openRoutesCount}/10)</span>
              ${isRouteUnlocking ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500 text-white font-bold animate-pulse">Izin</span>` : ''}
            </button>
            <button onclick="game.setDetailSubTab('fleet')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'fleet' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>✈️ Armada (${stats.totalPlanes})</span>
            </button>
            <button onclick="game.setDetailSubTab('maintenance')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'maintenance' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>🔧 Kelaikan</span>
              ${stats.groundedPlanesCount > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold animate-pulse">${stats.groundedPlanesCount} Grounded</span>` : ''}
            </button>
          </div>

          <!-- Konten Sub-Tab Aktif -->
          <div>
            ${airlineTabContent}
          </div>
        </div>
      `;
    }

    // DETAIL: INDUSTRI MINYAK & GAS (OIL & GAS)
    else if (sector.isOil || biz.sectorId === 'oil') {
      if (!['contracts', 'facilities'].includes(this.detailSubTab)) {
        this.detailSubTab = 'contracts';
      }

      const stats = this.getOilProductionStats(biz);
      const signedContracts = biz.contracts || [];
      const signedCount = signedContracts.length;
      const isSigning = !!biz.contractSigningInProgress;
      const nextContract = signedCount < OIL_CONTRACTS_CATALOG.length ? OIL_CONTRACTS_CATALOG[signedCount] : null;

      let oilTabContent = '';

      if (this.detailSubTab === 'contracts') {
        // 1. Signed Contracts List
        const signedContractsHtml = signedContracts.map((cId, idx) => {
          const cDef = OIL_CONTRACTS_CATALOG.find(c => c.id === cId);
          if (!cDef) return '';
          return `
            <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2 mb-2.5">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${cDef.badge || '🛢️'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">${cDef.title}</h5>
                      <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">#${idx + 1} Aktif</span>
                    </div>
                    <div class="text-[10px] text-slate-400">Mitra: <strong class="text-slate-300">${cDef.partner}</strong> (${cDef.country})</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${this.formatCompact(cDef.revenuePerHour)}/jam</span>
                  <div class="text-[10px] text-slate-400">Suplai Rutin</div>
                </div>
              </div>
              <div class="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                <span>Pasokan: <strong>${cDef.reqOilBbl.toLocaleString('id-ID')} Bbl/j</strong> & <strong>${cDef.reqGasBoe.toLocaleString('id-ID')} BOE/j</strong></span>
                <span class="text-emerald-400 font-bold">✓ Kontrak Sah</span>
              </div>
            </div>
          `;
        }).join('');

        // 2. Next Target Contract Card (HANYA SATU KONTRAK BERIKUTNYA, TIDAK DI-LIST SEMUANYA)
        let nextContractHtml = '';
        if (nextContract) {
          const reqOilMet = stats.totalOilBblPerHour >= nextContract.reqOilBbl;
          const reqGasMet = stats.totalGasBoePerHour >= nextContract.reqGasBoe;
          const oilPct = Math.min(100, Math.round((stats.totalOilBblPerHour / nextContract.reqOilBbl) * 100));
          const gasPct = Math.min(100, Math.round((stats.totalGasBoePerHour / nextContract.reqGasBoe) * 100));
          const canAffordFee = this.state.cash >= nextContract.tenderFee;
          const allReqsMet = reqOilMet && reqGasMet && canAffordFee;

          nextContractHtml = `
            <div class="glass-panel p-4 rounded-2xl border-2 ${allReqsMet ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10' : 'border-slate-800 bg-slate-950/80'} space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${nextContract.badge || '📑'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Target Kontrak #${signedCount + 1}</span>
                    </div>
                    <h5 class="font-extrabold text-white text-sm">${nextContract.title}</h5>
                    <div class="text-[11px] text-slate-300">Mitra: <strong class="text-white">${nextContract.partner}</strong> (${nextContract.country})</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${this.formatMoney(nextContract.revenuePerHour)}/jam</span>
                  <div class="text-[10px] text-slate-400">Tambahan Cuan</div>
                </div>
              </div>

              <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                ${nextContract.desc}
              </p>

              <!-- Syarat Kuota Pasokan -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">1. Kuota Minyak Bumi:</span>
                  <span class="font-mono font-bold ${reqOilMet ? 'text-emerald-400' : 'text-amber-400'}">
                    ${stats.totalOilBblPerHour.toLocaleString('id-ID')} / ${nextContract.reqOilBbl.toLocaleString('id-ID')} Bbl/jam ${reqOilMet ? '✓' : ''}
                  </span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full ${reqOilMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${oilPct}%"></div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <span class="text-slate-400">2. Kuota Gas Bumi:</span>
                  <span class="font-mono font-bold ${reqGasMet ? 'text-emerald-400' : 'text-amber-400'}">
                    ${stats.totalGasBoePerHour.toLocaleString('id-ID')} / ${nextContract.reqGasBoe.toLocaleString('id-ID')} BOE/jam ${reqGasMet ? '✓' : ''}
                  </span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full ${reqGasMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${gasPct}%"></div>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">Biaya Administrasi & Tender:</span>
                  <span class="font-mono font-bold ${canAffordFee ? 'text-white' : 'text-rose-400'}">${this.formatMoney(nextContract.tenderFee)}</span>
                </div>
                <div class="flex justify-between items-center text-[11px]">
                  <span class="text-slate-400">Durasi Negosiasi & Legalisasi:</span>
                  <span class="font-mono font-bold text-amber-400">⏱️ ${this.formatDuration(nextContract.durationSeconds)}</span>
                </div>
              </div>

              ${isSigning ? `
                <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-amber-300 font-bold flex items-center gap-1.5">
                      <span class="upgrade-pulsing-badge">📜</span>
                      Proses Tender & Negosiasi Sedang Berjalan...
                    </span>
                    <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.contractSigningInProgress.endTime}">
                      ${this.formatDuration(Math.max(0, Math.ceil((biz.contractSigningInProgress.endTime - Date.now()) / 1000)))}
                    </span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.contractSigningInProgress.startTime}" data-biz-end="${biz.contractSigningInProgress.endTime}"></div>
                  </div>
                  <div class="text-[10px] text-slate-400 text-center">Tim legal dan perwakilan mitra sedang memfinalisasi kontrak kerja sama pasokan...</div>
                </div>
              ` : `
                <button onclick="game.signOilContract('${biz.instanceId}')" ${!allReqsMet ? 'disabled' : ''} class="btn-press w-full py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  allReqsMet
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                }">
                  <span>${
                    !reqOilMet || !reqGasMet
                      ? '⚠️ Kuota Produksi Belum Cukup (Beli Fasilitas di Tab Fasilitas)'
                      : (!canAffordFee ? '⚠️ Saldo Kas Tidak Cukup untuk Biaya Tender' : `📑 Ajukan Tender & Teken Kontrak (${this.formatDuration(nextContract.durationSeconds)})`)
                  }</span>
                </button>
              `}
            </div>
          `;
        } else {
          nextContractHtml = `
            <div class="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-center space-y-2 shadow-lg shadow-emerald-500/10">
              <div class="text-3xl">👑</div>
              <h4 class="font-black text-white text-sm">Seluruh Kontrak Migas Strategis Diteken!</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Selamat! Perusahaan minyak & gas Anda telah mengamankan seluruh 8 kontrak pasokan energi dengan konglomerat multinasional terkemuka di dunia.
              </p>
            </div>
          `;
        }

        oilTabContent = `
          <!-- Kontrak Berikutnya yang Harus Dicapai -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Target Kontrak Baru (${signedCount}/${OIL_CONTRACTS_CATALOG.length})</h4>
              <span class="text-[11px] text-slate-400">1 Kontrak Muncul Bertahap</span>
            </div>
            ${nextContractHtml}
          </div>

          <!-- Daftar Kontrak Aktif -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Kontrak Pasokan Aktif (${signedCount})</h4>
              <span class="text-[11px] font-mono text-emerald-400 font-bold">+${this.formatCompact(stats.totalContractRevenue)}/jam</span>
            </div>
            ${signedContracts.length > 0 ? signedContractsHtml : '<div class="text-xs text-slate-400 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">Belum ada kontrak aktif. Penuhi kuota target di atas dan ajukan tender pertama Anda!</div>'}
          </div>
        `;
      } else if (this.detailSubTab === 'facilities') {
        const totalUnits = (biz.facilities || []).reduce((acc, f) => acc + (f.count || 0), 0);

        const facilitiesHtml = OIL_FACILITIES_CATALOG.map(fac => {
          const owned = (biz.facilities || []).find(f => f.id === fac.id);
          const count = owned ? (owned.count || 0) : 0;
          const canAfford = this.state.cash >= fac.cost;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5 hover:border-amber-500/40 transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${fac.icon}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">${fac.name}</h5>
                      <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${count > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}">${count} Unit</span>
                    </div>
                    <div class="text-[10px] text-slate-400">${fac.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-white">${this.formatCompact(fac.cost)}</span>
                  <div class="text-[10px] text-slate-400">Biaya Bangun</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Output: <strong class="text-amber-400">+${fac.oilBblPerHour.toLocaleString('id-ID')} Bbl/j</strong></span>
                <span class="text-slate-400">Gas: <strong class="text-blue-400">+${fac.gasBoePerHour.toLocaleString('id-ID')} BOE/j</strong></span>
                <span class="text-slate-400">Total Dimiliki: <strong class="text-white">${count}x</strong></span>
              </div>

              <button onclick="game.buyOilFacility('${biz.instanceId}', '${fac.id}')" ${!canAfford ? 'disabled' : ''} class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                canAfford
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              }">
                <span>${canAfford ? `🏗️ Bangun Fasilitas (${this.formatCompact(fac.cost)})` : `Dana Tidak Cukup (${this.formatCompact(fac.cost)})`}</span>
              </button>
            </div>
          `;
        }).join('');

        oilTabContent = `
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Katalog Fasilitas Hulu Migas (${OIL_FACILITIES_CATALOG.length} Fasilitas)</h4>
              <span class="text-[11px] text-amber-400 font-bold">${totalUnits} Fasilitas Aktif</span>
            </div>
            <p class="text-[11px] text-slate-400">Bangun fasilitas produksi untuk memperbesar kuota barel minyak dan BOE gas per jam agar lolos tender kontrak pasokan berikutnya.</p>
          </div>
          <div class="space-y-3">
            ${facilitiesHtml}
          </div>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Overview Card -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Total Kapasitas Produksi:</span>
                <span class="font-black text-white text-sm">
                  🛢️ ${stats.totalOilBblPerHour.toLocaleString('id-ID')} Bbl/j • 💨 ${stats.totalGasBoePerHour.toLocaleString('id-ID')} BOE/j
                </span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Total Pendapatan:</span>
                <span class="font-mono font-black text-emerald-400 text-sm">
                  +${this.formatMoney(stats.totalHourlyRevenue)}/jam
                </span>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Dasar Bisnis: +${this.formatCompact(BUSINESS_SECTORS.find(s => s.sectorId === 'oil')?.baseRevenue || 1200000000)}/j</span>
              <span class="text-emerald-400">Kontrak Pasokan: +${this.formatCompact(stats.totalContractRevenue)}/j</span>
              <span class="text-amber-300 font-bold">${signedCount}/${OIL_CONTRACTS_CATALOG.length} Kontrak</span>
            </div>
          </div>

          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button onclick="game.setDetailSubTab('contracts')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'contracts' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>📜 Kontrak Suplai (${signedCount}/${OIL_CONTRACTS_CATALOG.length})</span>
              ${isSigning ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-bold animate-pulse">Tender</span>` : ''}
            </button>
            <button onclick="game.setDetailSubTab('facilities')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'facilities' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>🏭 Fasilitas Produksi</span>
            </button>
          </div>

          <!-- Konten Sub-Tab Aktif -->
          <div>
            ${oilTabContent}
          </div>
        </div>
      `;
    }

    // DETAIL: PERUSAHAAN TAMBANG MINERAL (MINING)
    else if (sector.isMining || biz.sectorId === 'mining') {
      if (!['contracts', 'facilities'].includes(this.detailSubTab)) {
        this.detailSubTab = 'contracts';
      }

      const stats = this.getMiningProductionStats(biz);
      const signedContracts = biz.contracts || [];
      const signedCount = signedContracts.length;
      const isSigning = !!biz.contractSigningInProgress;
      const nextContract = signedCount < MINING_CONTRACTS_CATALOG.length ? MINING_CONTRACTS_CATALOG[signedCount] : null;

      let miningTabContent = '';

      if (this.detailSubTab === 'contracts') {
        // 1. Signed Contracts List
        const signedContractsHtml = signedContracts.map((cId, idx) => {
          const cDef = MINING_CONTRACTS_CATALOG.find(c => c.id === cId);
          if (!cDef) return '';
          return `
            <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2 mb-2.5">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${cDef.badge || '⛏️'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">${cDef.title}</h5>
                      <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">#${idx + 1} Aktif</span>
                    </div>
                    <div class="text-[10px] text-slate-400">Mitra: <strong class="text-slate-300">${cDef.partner}</strong> (${cDef.country})</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${this.formatCompact(cDef.revenuePerHour)}/jam</span>
                  <div class="text-[10px] text-slate-400">Suplai Rutin</div>
                </div>
              </div>
              <div class="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                <span>Pasokan: <strong>${cDef.reqNickelTon.toLocaleString('id-ID')} Ton/j</strong> & <strong>${cDef.reqGoldKg.toLocaleString('id-ID')} Kg/j</strong></span>
                <span class="text-emerald-400 font-bold">✓ Kontrak Sah</span>
              </div>
            </div>
          `;
        }).join('');

        // 2. Next Target Contract Card (HANYA SATU KONTRAK BERIKUTNYA, TIDAK DI-LIST SEMUANYA)
        let nextContractHtml = '';
        if (nextContract) {
          const reqNickelMet = stats.totalNickelTonPerHour >= nextContract.reqNickelTon;
          const reqGoldMet = stats.totalGoldKgPerHour >= nextContract.reqGoldKg;
          const nickelPct = Math.min(100, Math.round((stats.totalNickelTonPerHour / nextContract.reqNickelTon) * 100));
          const goldPct = Math.min(100, Math.round((stats.totalGoldKgPerHour / nextContract.reqGoldKg) * 100));
          const canAffordFee = this.state.cash >= nextContract.tenderFee;
          const allReqsMet = reqNickelMet && reqGoldMet && canAffordFee;

          nextContractHtml = `
            <div class="glass-panel p-4 rounded-2xl border-2 ${allReqsMet ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10' : 'border-slate-800 bg-slate-950/80'} space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${nextContract.badge || '📑'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Target Kontrak #${signedCount + 1}</span>
                    </div>
                    <h5 class="font-extrabold text-white text-sm">${nextContract.title}</h5>
                    <div class="text-[11px] text-slate-300">Mitra: <strong class="text-white">${nextContract.partner}</strong> (${nextContract.country})</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${this.formatMoney(nextContract.revenuePerHour)}/jam</span>
                  <div class="text-[10px] text-slate-400">Tambahan Cuan</div>
                </div>
              </div>

              <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                ${nextContract.desc}
              </p>

              <!-- Syarat Kuota Pasokan Mineral -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">1. Kuota Konsentrat Nikel:</span>
                  <span class="font-mono font-bold ${reqNickelMet ? 'text-emerald-400' : 'text-amber-400'}">
                    ${stats.totalNickelTonPerHour.toLocaleString('id-ID')} / ${nextContract.reqNickelTon.toLocaleString('id-ID')} Ton/jam ${reqNickelMet ? '✓' : ''}
                  </span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full ${reqNickelMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${nickelPct}%"></div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <span class="text-slate-400">2. Kuota Emas Murni:</span>
                  <span class="font-mono font-bold ${reqGoldMet ? 'text-emerald-400' : 'text-amber-400'}">
                    ${stats.totalGoldKgPerHour.toLocaleString('id-ID')} / ${nextContract.reqGoldKg.toLocaleString('id-ID')} Kg/jam ${reqGoldMet ? '✓' : ''}
                  </span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full ${reqGoldMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${goldPct}%"></div>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">Biaya Administrasi & Tender:</span>
                  <span class="font-mono font-bold ${canAffordFee ? 'text-white' : 'text-rose-400'}">${this.formatMoney(nextContract.tenderFee)}</span>
                </div>
                <div class="flex justify-between items-center text-[11px]">
                  <span class="text-slate-400">Durasi Negosiasi & Legalisasi:</span>
                  <span class="font-mono font-bold text-amber-400">⏱️ ${this.formatDuration(nextContract.durationSeconds)}</span>
                </div>
              </div>

              ${isSigning ? `
                <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-amber-300 font-bold flex items-center gap-1.5">
                      <span class="upgrade-pulsing-badge">📜</span>
                      Proses Tender & Negosiasi Sedang Berjalan...
                    </span>
                    <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.contractSigningInProgress.endTime}">
                      ${this.formatDuration(Math.max(0, Math.ceil((biz.contractSigningInProgress.endTime - Date.now()) / 1000)))}
                    </span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.contractSigningInProgress.startTime}" data-biz-end="${biz.contractSigningInProgress.endTime}"></div>
                  </div>
                  <div class="text-[10px] text-slate-400 text-center">Pihak auditor dan mitra industri sedang memverifikasi kapasitas tambang...</div>
                </div>
              ` : `
                <button onclick="game.signMiningContract('${biz.instanceId}')" ${!allReqsMet ? 'disabled' : ''} class="btn-press w-full py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  allReqsMet
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                }">
                  <span>${
                    !reqNickelMet || !reqGoldMet
                      ? '⚠️ Kuota Produksi Belum Cukup (Beli Fasilitas di Tab Fasilitas)'
                      : (!canAffordFee ? '⚠️ Saldo Kas Tidak Cukup untuk Biaya Tender' : `📑 Ajukan Tender & Teken Kontrak (${this.formatDuration(nextContract.durationSeconds)})`)
                  }</span>
                </button>
              `}
            </div>
          `;
        } else {
          nextContractHtml = `
            <div class="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-center space-y-2 shadow-lg shadow-emerald-500/10">
              <div class="text-3xl">👑</div>
              <h4 class="font-black text-white text-sm">Seluruh Kontrak Tambang Mineral Diteken!</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Selamat! Perusahaan tambang Anda telah mengamankan seluruh 8 kontrak pasokan komoditas strategis dengan raksasa manufaktur dan perbankan sentral dunia.
              </p>
            </div>
          `;
        }

        miningTabContent = `
          <!-- Kontrak Berikutnya yang Harus Dicapai -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Target Kontrak Baru (${signedCount}/${MINING_CONTRACTS_CATALOG.length})</h4>
              <span class="text-[11px] text-slate-400">1 Kontrak Muncul Bertahap</span>
            </div>
            ${nextContractHtml}
          </div>

          <!-- Daftar Kontrak Aktif -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Kontrak Pasokan Aktif (${signedCount})</h4>
              <span class="text-[11px] font-mono text-emerald-400 font-bold">+${this.formatCompact(stats.totalContractRevenue)}/jam</span>
            </div>
            ${signedContracts.length > 0 ? signedContractsHtml : '<div class="text-xs text-slate-400 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">Belum ada kontrak aktif. Penuhi kuota target di atas dan ajukan tender pertama Anda!</div>'}
          </div>
        `;
      } else if (this.detailSubTab === 'facilities') {
        const totalUnits = (biz.facilities || []).reduce((acc, f) => acc + (f.count || 0), 0);

        const facilitiesHtml = MINING_FACILITIES_CATALOG.map(fac => {
          const owned = (biz.facilities || []).find(f => f.id === fac.id);
          const count = owned ? (owned.count || 0) : 0;
          const canAfford = this.state.cash >= fac.cost;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5 hover:border-amber-500/40 transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${fac.icon}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">${fac.name}</h5>
                      <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${count > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}">${count} Unit</span>
                    </div>
                    <div class="text-[10px] text-slate-400">${fac.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-white">${this.formatCompact(fac.cost)}</span>
                  <div class="text-[10px] text-slate-400">Biaya Pengadaan</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Nikel: <strong class="text-amber-400">+${fac.nickelTonPerHour.toLocaleString('id-ID')} Ton/j</strong></span>
                <span class="text-slate-400">Emas: <strong class="text-yellow-400">+${fac.goldKgPerHour.toLocaleString('id-ID')} Kg/j</strong></span>
                <span class="text-slate-400">Total Dimiliki: <strong class="text-white">${count}x</strong></span>
              </div>

              <button onclick="game.buyMiningFacility('${biz.instanceId}', '${fac.id}')" ${!canAfford ? 'disabled' : ''} class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                canAfford
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              }">
                <span>${canAfford ? `⛏️ Bangun Fasilitas (${this.formatCompact(fac.cost)})` : `Dana Tidak Cukup (${this.formatCompact(fac.cost)})`}</span>
              </button>
            </div>
          `;
        }).join('');

        miningTabContent = `
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Katalog Fasilitas Tambang & Pemurnian (${MINING_FACILITIES_CATALOG.length} Fasilitas)</h4>
              <span class="text-[11px] text-amber-400 font-bold">${totalUnits} Fasilitas Aktif</span>
            </div>
            <p class="text-[11px] text-slate-400">Pengadaan armada ekskavator, shaft drilling, dan smelter pemurnian untuk melipatgandakan output nikel & emas per jam demi memenuhi kontrak suplai.</p>
          </div>
          <div class="space-y-3">
            ${facilitiesHtml}
          </div>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Overview Card -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Total Kapasitas Produksi:</span>
                <span class="font-black text-white text-sm">
                  ⛏️ ${stats.totalNickelTonPerHour.toLocaleString('id-ID')} Ton/j • 🪙 ${stats.totalGoldKgPerHour.toLocaleString('id-ID')} Kg/j
                </span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Total Pendapatan:</span>
                <span class="font-mono font-black text-emerald-400 text-sm">
                  +${this.formatMoney(stats.totalHourlyRevenue)}/jam
                </span>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Dasar Bisnis: +${this.formatCompact(BUSINESS_SECTORS.find(s => s.sectorId === 'mining')?.baseRevenue || 2500000000)}/j</span>
              <span class="text-emerald-400">Kontrak Pasokan: +${this.formatCompact(stats.totalContractRevenue)}/j</span>
              <span class="text-amber-300 font-bold">${signedCount}/${MINING_CONTRACTS_CATALOG.length} Kontrak</span>
            </div>
          </div>

          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button onclick="game.setDetailSubTab('contracts')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'contracts' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>📜 Kontrak Suplai (${signedCount}/${MINING_CONTRACTS_CATALOG.length})</span>
              ${isSigning ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-bold animate-pulse">Tender</span>` : ''}
            </button>
            <button onclick="game.setDetailSubTab('facilities')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'facilities' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>⛏️ Fasilitas Tambang</span>
            </button>
          </div>

          <!-- Konten Sub-Tab Aktif -->
          <div>
            ${miningTabContent}
          </div>
        </div>
      `;
    }
    else {
      const upgradeCost = this.getBusinessUpgradeCost(biz);
      const isUpgrading = !!biz.upgradeInProgress;
      const durationSec = this.getUpgradeDurationSeconds(biz);
      const canAfford = this.state.cash >= upgradeCost;

      let upgradeActionHtml = '';
      if (isUpgrading) {
        const remSec = Math.max(0, Math.ceil((biz.upgradeEndTime - Date.now()) / 1000));
        const startTime = biz.upgradeStartTime || Date.now();
        const endTime = biz.upgradeEndTime || (Date.now() + 1000);
        const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

        upgradeActionHtml = `
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-emerald-300 flex items-center gap-1.5">
                <span class="upgrade-pulsing-badge">🏗️</span>
                Pembangunan Level ${biz.upgradeTargetLevel} Sedang Dikerjakan
              </span>
              <span data-biz-timer="${biz.upgradeEndTime}" class="font-mono font-bold text-emerald-400">
                ${this.formatDuration(remSec)}
              </span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-emerald-400 progress-striped" style="width: ${progress}%"></div>
            </div>
            <div class="text-[11px] text-slate-400 text-center">Fasilitas sedang diperluas oleh tim kontraktor...</div>
          </div>
        `;
      } else {
        upgradeActionHtml = `
          <button onclick="game.upgradeBusinessLevel('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition ${
            canAfford
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }">
            Tingkatkan ke Level ${biz.level + 1} (${this.formatCompact(upgradeCost)}) • ⏱️ ${this.formatDuration(durationSec)}
          </button>
        `;
      }

      specificSectionHtml = `
        <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div class="flex justify-between items-center pb-2 border-b border-slate-800">
            <span class="text-slate-400">Nama Perusahaan:</span>
            <span class="font-bold text-white">${biz.name}</span>
          </div>
          <div class="flex justify-between items-center pb-2 border-b border-slate-800">
            <span class="text-slate-400">Sektor Industri:</span>
            <span class="font-bold text-emerald-400">${sector.name}</span>
          </div>
          <div class="flex justify-between items-center pb-2 border-b border-slate-800">
            <span class="text-slate-400">Tingkat Operasional:</span>
            <span class="font-bold text-white">Level ${biz.level}</span>
          </div>
          ${upgradeActionHtml}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="mb-3 flex items-center justify-between pb-2 border-b border-slate-800">
        <button onclick="game.showOwnedBusinesses()" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1">
          <span>← Kembali ke Bisnis Saya</span>
        </button>
        ${bizTax.suspended ? `<span class="text-xs font-black text-rose-400">Rp 0/jam (Dibekukan DJP)</span>` : (biz.sectorId === 'airline'
          ? (hourlyRev > 0 ? `<span class="text-xs font-black text-emerald-400">+${this.formatCompact(hourlyRev)}/jam (Tiket)</span>` : `<span class="text-xs font-black text-rose-400">Rp 0/jam (Armada Grounded)</span>`)
          : (hourlyRev >= 0 
            ? `<span class="text-xs font-black text-emerald-400">+${this.formatCompact(hourlyRev)}/jam</span>` 
            : `<span class="text-xs font-black text-rose-400">${this.formatCompact(hourlyRev)}/jam (Beban Gaji)</span>`))}
      </div>

      <div class="glass-panel rounded-2xl border ${bizTax.suspended ? 'tax-suspended-glow border-rose-500/80 bg-rose-950/10' : 'border-slate-800'} overflow-hidden mb-3">
        <div class="relative h-28 w-full bg-slate-800 overflow-hidden">
          <img src="${sector.image}" alt="${biz.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <div>
              <div class="text-[11px] text-emerald-400 font-bold uppercase">${sector.name}</div>
              <h3 class="font-black text-white text-lg leading-tight drop-shadow-md">${biz.name}</h3>
            </div>
            ${bizTax.suspended ? `
              <span class="text-[10px] px-2.5 py-1 rounded-full bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20 tax-warning-pulse">
                ⚠️ DIBEKUKAN DJP
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Valuasi & Laba Bersih All-Time -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">🏛️ Valuasi Aset Bisnis</span>
          <div class="text-sm font-black text-amber-300 font-mono mt-0.5">${this.formatMoney(bizValuation)}</div>
          <span class="text-[9px] text-slate-500">Estimasi total nilai aset & fasilitas</span>
        </div>
        <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">📊 Laba Bersih All-Time</span>
          <div class="text-sm font-black ${allTimeEarn >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono mt-0.5">
            ${allTimeEarn >= 0 ? '+' : ''}${this.formatMoney(allTimeEarn)}
          </div>
          <span class="text-[9px] text-slate-500">Total akumulasi keuntungan bersih</span>
        </div>
      </div>

      <!-- Pajak Status Bisnis jika ada tunggakan -->
      ${bizTax.unpaid > 0 ? `
        <div class="p-3 rounded-2xl ${bizTax.suspended ? 'bg-rose-500/10 border border-rose-500 text-rose-300' : 'bg-amber-500/10 border border-amber-500/40 text-amber-300'} mb-3 space-y-2 shadow-md">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="flex items-center gap-1.5">
              ${bizTax.suspended ? '🚨 Operasional Dibekukan DJP' : '⏳ SPT Pajak Mandiri Perusahaan'}
            </span>
            ${!bizTax.suspended && bizTax.deadline ? `<span class="font-mono font-bold text-amber-400 text-xs" data-tax-timer="${bizTax.deadline}">...</span>` : `<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black">SANKSI DJP</span>`}
          </div>
          <p class="text-[11px] text-slate-300">
            Tunggakan Pajak (5%): <strong class="${bizTax.suspended ? 'text-rose-400' : 'text-amber-300'}">${this.formatMoney(bizTax.unpaid)}</strong>
            ${bizTax.suspended ? ' — Operasional perusahaan ini dihentikan oleh DJP sampai tunggakan dilunasi.' : ' — Wajib dibayarkan sebelum batas waktu 72 jam real-time berakhir.'}
          </p>
          <button onclick="game.payBusinessTax('${biz.instanceId}')" class="btn-press w-full py-2 rounded-xl ${bizTax.suspended ? 'bg-rose-500 text-slate-950 hover:bg-rose-400' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'} font-black text-xs shadow-md">
            💳 Lunasi Pajak Bisnis Ini (${this.formatMoney(bizTax.unpaid)})
          </button>
        </div>
      ` : ''}

      ${specificSectionHtml}
    `;
  },

  renderInvestments() {
    this.renderStockList();
    this.renderCryptoList();
    this.renderCommodities();
    this.renderRealEstate();
  },

  renderStockList() {
    const portView = document.getElementById('stocks-view-portfolio');
    const mktView = document.getElementById('stocks-view-market');
    const portCont = document.getElementById('stock-portfolio-container');
    const summaryCard = document.getElementById('stocks-summary-card');
    const mktCont = document.getElementById('stock-list-container');
    const countEl = document.getElementById('stocks-portfolio-count');
    const stockBanner = document.getElementById('stocks-tax-banner');

    // 1. RENDER PORTFOLIO VIEW (Default View)
    if (this.stockView === 'portfolio') {
      if (portView) portView.classList.remove('hidden');
      if (mktView) mktView.classList.add('hidden');

      // Render Tax Banner di Portofolio Saham
      if (stockBanner && this.state.taxes) {
        const taxStock = this.state.taxes.stocks;
        if (taxStock && taxStock.suspended) {
          stockBanner.className = 'mb-3.5 p-3.5 rounded-2xl bg-rose-500/10 border tax-suspended-glow border-rose-500 text-xs shadow-lg space-y-2';
          stockBanner.innerHTML = `
            <div class="flex items-center justify-between text-rose-400 font-black">
              <span class="flex items-center gap-1.5">🚨 DIVIDEN SAHAM DIBEKUKAN OLEH KANTOR PAJAK (DJP)</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black">SANKSI DJP</span>
            </div>
            <p class="text-[11px] text-slate-300">
              Anda memiliki tunggakan pajak dividen saham sebesar <strong class="text-rose-400">${this.formatMoney(taxStock.unpaid)}</strong> yang telah melewati batas 1 jam dunia nyata. Seluruh pencairan dividen saham dibekukan (Rp 0/jam) sampai pajak dilunasi!
            </p>
            <button onclick="game.payTax('stocks')" class="btn-press w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5">
              <span>💳 Lunasi Pajak Dividen Saham Sekarang (${this.formatMoney(taxStock.unpaid)})</span>
            </button>
          `;
          stockBanner.classList.remove('hidden');
        } else if (taxStock && taxStock.unpaid > 0) {
          const remSec = Math.max(0, Math.ceil((taxStock.deadline - Date.now()) / 1000));
          const mins = Math.floor(remSec / 60);
          const secs = remSec % 60;
          stockBanner.className = 'mb-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs shadow-md space-y-2';
          stockBanner.innerHTML = `
            <div class="flex items-center justify-between text-amber-300 font-bold">
              <span class="flex items-center gap-1.5">⏳ Tagihan Pajak Dividen Saham Berjalan</span>
              <span class="font-mono text-amber-400 font-bold" data-tax-timer="${taxStock.deadline}">${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-300">Pajak Terhutang (5%): <strong class="text-amber-300">${this.formatMoney(taxStock.unpaid)}</strong></span>
              <button onclick="game.payTax('stocks')" class="btn-press px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                Bayar Pajak
              </button>
            </div>
          `;
          stockBanner.classList.remove('hidden');
        } else {
          stockBanner.className = 'hidden mb-3';
          stockBanner.innerHTML = '';
        }
      }

      let totalShares = 0;
      let totalMarketVal = 0;
      let totalCostVal = 0;
      let totalHourlyDiv = 0;
      let ownedCount = 0;

      const isStocksSuspended = this.state.taxes && this.state.taxes.stocks && this.state.taxes.stocks.suspended;

      const ownedStocks = [];
      STOCKS_CATALOG.forEach(stock => {
        const userHold = this.state.stocks[stock.symbol] || { shares: 0, totalCost: 0 };
        if (userHold.shares > 0) {
          const price = this.stockPrices[stock.symbol] || stock.basePrice;
          const marketVal = userHold.shares * price;
          const pnl = marketVal - userHold.totalCost;
          const hourlyDiv = Math.round(marketVal * (stock.dividendYieldHourly || 0));

          totalShares += userHold.shares;
          totalMarketVal += marketVal;
          totalCostVal += userHold.totalCost;
          totalHourlyDiv += hourlyDiv;
          ownedCount += 1;

          ownedStocks.push({ stock, userHold, price, marketVal, pnl, hourlyDiv });
        }
      });

      if (countEl) countEl.innerText = `${ownedCount} Saham Dimiliki`;

      const totalPnL = totalMarketVal - totalCostVal;
      const pnlPercent = totalCostVal > 0 ? (totalPnL / totalCostVal) * 100 : 0;

      if (summaryCard) {
        summaryCard.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Nilai Saham:</span>
              <div class="text-base font-black text-white">${this.formatMoney(totalMarketVal)}</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400">Hasil Dividen:</span>
              <div class="text-xs font-black ${isStocksSuspended ? 'text-rose-400' : 'text-emerald-400'}">
                ${isStocksSuspended ? 'Rp 0/jam (Disuspend DJP)' : `+${this.formatCompact(totalHourlyDiv)}/jam`}
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs pt-0.5">
            <span class="text-slate-400">Total Untung / Rugi (P&L):</span>
            <span class="font-extrabold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
              ${totalPnL >= 0 ? '+' : ''}${this.formatMoney(totalPnL)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)
            </span>
          </div>
        `;
      }

      if (portCont) {
        if (ownedStocks.length === 0) {
          portCont.innerHTML = `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
              <div class="text-4xl">📈</div>
              <h4 class="font-bold text-white text-sm">Belum Ada Saham di Portofolio</h4>
              <p class="text-xs text-slate-400">Beli saham dari 16 emiten perusahaan terbuka untuk mendapatkan dividen per jam dan potensi keuntungan modal (capital gain).</p>
              <button onclick="game.setStockView('market')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                + Beli Saham Baru di Bursa
              </button>
            </div>
          `;
        } else {
          portCont.innerHTML = ownedStocks.map(({ stock, userHold, price, marketVal, pnl, hourlyDiv }) => {
            const pnlP = userHold.totalCost > 0 ? (pnl / userHold.totalCost) * 100 : 0;
            const history = this.stockHistories[stock.symbol];
            const prevPrice = history && history.length >= 2 ? history[history.length - 2] : price;
            const changePercent = ((price - prevPrice) / prevPrice) * 100;
            const isUp = changePercent >= 0;
            const sparklineSvg = this.generateSparkline(history, isUp ? '#00e676' : '#ff3366');

            return `
              <div class="glass-panel p-3.5 rounded-2xl border ${isStocksSuspended ? 'tax-suspended-glow border-rose-500/80 bg-rose-950/10' : 'border-slate-800/80'} mb-3 card-transition shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                      ${stock.icon}
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-white text-sm">${stock.symbol}</span>
                        <span class="text-[11px] text-slate-400 font-medium">(${stock.category})</span>
                      </div>
                      <div class="text-xs text-slate-400 font-medium">${stock.name}</div>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="font-bold text-white text-sm">${this.formatMoney(price)}</div>
                    <div class="text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}">
                      ${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div class="my-2 h-6 w-full overflow-hidden flex items-center justify-center">
                  ${sparklineSvg}
                </div>

                <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs mb-2.5">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Lembar Dimiliki:</span>
                    <span class="font-bold text-white">${userHold.shares.toLocaleString()} Lembar (${this.formatMoney(marketVal)})</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Keuntungan / Kerugian:</span>
                    <span class="font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                      ${pnl >= 0 ? '+' : ''}${this.formatMoney(pnl)} (${pnlP >= 0 ? '+' : ''}${pnlP.toFixed(2)}%)
                    </span>
                  </div>
                  <div class="flex justify-between border-t border-slate-800/60 pt-1">
                    <span class="text-slate-400">Dividen Rutin:</span>
                    <span class="font-bold ${isStocksSuspended ? 'text-rose-400' : 'text-emerald-400'}">
                      ${isStocksSuspended ? 'Rp 0/jam (Dibekukan DJP)' : `+${this.formatMoney(hourlyDiv)}/jam (+${(stock.dividendYieldHourly * 100).toFixed(2)}%)`}
                    </span>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button onclick="game.sellStock('${stock.symbol}', Math.max(1, Math.floor(${userHold.shares} * 0.25)))" class="btn-press flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold">
                    Jual 25%
                  </button>
                  <button onclick="game.openStockModal('${stock.symbol}')" class="btn-press flex-1 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1">
                    <span>Trading 📊</span>
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }

    // 2. RENDER MARKET VIEW
    else {
      if (portView) portView.classList.add('hidden');
      if (mktView) mktView.classList.remove('hidden');

      if (mktCont) {
        let html = '';
        STOCKS_CATALOG.forEach(stock => {
          const price = this.stockPrices[stock.symbol];
          const history = this.stockHistories[stock.symbol];
          const prevPrice = history && history.length >= 2 ? history[history.length - 2] : price;
          const changePercent = ((price - prevPrice) / prevPrice) * 100;
          const isUp = changePercent >= 0;

          const userHold = this.state.stocks[stock.symbol] || { shares: 0, totalCost: 0 };
          const holdValue = userHold.shares * price;
          const profitLoss = holdValue - userHold.totalCost;
          const sparklineSvg = this.generateSparkline(history, isUp ? '#00e676' : '#ff3366');

          html += `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800/80 mb-3 card-transition">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                    ${stock.icon}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-white text-sm">${stock.symbol}</span>
                      <span class="text-[11px] text-slate-400 font-medium">(${stock.category})</span>
                    </div>
                    <div class="text-xs text-slate-400 font-medium">${stock.name}</div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="font-bold text-white text-sm">${this.formatMoney(price)}</div>
                  <div class="text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'} flex items-center justify-end gap-0.5">
                    <span>${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div class="my-2 h-7 w-full overflow-hidden flex items-center justify-center">
                ${sparklineSvg}
              </div>

              <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span class="text-slate-400">Dimiliki: </span>
                  <span class="font-bold text-white">${userHold.shares.toLocaleString()} lembar</span>
                  ${userHold.shares > 0 ? `
                    <span class="text-[11px] ml-1.5 ${profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                      (${profitLoss >= 0 ? '+' : ''}${this.formatCompact(profitLoss)})
                    </span>
                  ` : ''}
                  <div class="text-[11px] text-emerald-400/80 mt-0.5">Dividen: +${(stock.dividendYieldHourly * 100).toFixed(2)}%/jam</div>
                </div>

                <button onclick="game.openStockModal('${stock.symbol}')" class="btn-press px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs">
                  Beli / Jual 📊
                </button>
              </div>
            </div>
          `;
        });
        mktCont.innerHTML = html;
      }
    }
  },

  renderCryptoList() {
    const portView = document.getElementById('crypto-view-portfolio');
    const mktView = document.getElementById('crypto-view-market');
    const portCont = document.getElementById('crypto-portfolio-container');
    const summaryCard = document.getElementById('crypto-summary-card');
    const mktCont = document.getElementById('crypto-list-container');
    const countEl = document.getElementById('crypto-portfolio-count');

    // 1. RENDER PORTFOLIO VIEW (Default View)
    if (this.cryptoView === 'portfolio') {
      if (portView) portView.classList.remove('hidden');
      if (mktView) mktView.classList.add('hidden');

      let totalMarketVal = 0;
      let totalCostVal = 0;
      let ownedCount = 0;

      const ownedCrypto = [];
      CRYPTO_CATALOG.forEach(coin => {
        const userHold = this.state.crypto[coin.symbol] || { amount: 0, totalCost: 0 };
        if (userHold.amount > 0.00001) {
          const price = this.cryptoPrices[coin.symbol] || coin.basePrice;
          const marketVal = userHold.amount * price;
          const pnl = marketVal - userHold.totalCost;

          totalMarketVal += marketVal;
          totalCostVal += userHold.totalCost;
          ownedCount += 1;

          ownedCrypto.push({ coin, userHold, price, marketVal, pnl });
        } else if (userHold.amount > 0) {
          userHold.amount = 0;
          userHold.totalCost = 0;
        }
      });

      if (countEl) countEl.innerText = `${ownedCount} Aset Kripto Dimiliki`;

      const totalPnL = totalMarketVal - totalCostVal;
      const pnlPercent = totalCostVal > 0 ? (totalPnL / totalCostVal) * 100 : 0;

      if (summaryCard) {
        summaryCard.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Nilai Dompet Kripto:</span>
              <div class="text-base font-black text-amber-400">${this.formatMoney(totalMarketVal)}</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Modal:</span>
              <div class="text-xs font-bold text-white">${this.formatCompact(totalCostVal)}</div>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs pt-0.5">
            <span class="text-slate-400">Total Untung / Rugi (P&L):</span>
            <span class="font-extrabold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
              ${totalPnL >= 0 ? '+' : ''}${this.formatMoney(totalPnL)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)
            </span>
          </div>
        `;
      }

      if (portCont) {
        if (ownedCrypto.length === 0) {
          portCont.innerHTML = `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
              <div class="text-4xl">🪙</div>
              <h4 class="font-bold text-white text-sm">Dompet Kripto Masih Kosong</h4>
              <p class="text-xs text-slate-400">Investasi pada mata uang kripto global untuk meraih keuntungan dari pergerakan harga yang dinamis.</p>
              <button onclick="game.setCryptoView('market')" class="btn-press px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20">
                + Beli Kripto Baru di Pasar
              </button>
            </div>
          `;
        } else {
          portCont.innerHTML = ownedCrypto.map(({ coin, userHold, price, marketVal, pnl }) => {
            const pnlP = userHold.totalCost > 0 ? (pnl / userHold.totalCost) * 100 : 0;
            const history = this.cryptoHistories[coin.symbol];
            const prevPrice = history && history.length >= 2 ? history[history.length - 2] : price;
            const changePercent = ((price - prevPrice) / prevPrice) * 100;
            const isUp = changePercent >= 0;
            const sparklineSvg = this.generateSparkline(history, isUp ? '#00e676' : '#ff3366');

            return `
              <div class="glass-panel p-3.5 rounded-2xl border border-slate-800/80 mb-3 card-transition shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold" style="color: ${coin.color}">
                      ${coin.icon}
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-white text-sm">${coin.name}</span>
                        <span class="text-xs text-slate-400 font-semibold">(${coin.symbol})</span>
                      </div>
                      <div class="text-xs text-slate-400 font-medium">Volatilitas Tinggi</div>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="font-bold text-white text-sm">${this.formatMoney(price)}</div>
                    <div class="text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}">
                      ${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div class="my-2 h-6 w-full overflow-hidden flex items-center justify-center">
                  ${sparklineSvg}
                </div>

                <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs mb-2.5">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Saldo Koin:</span>
                    <span class="font-bold text-white">${userHold.amount.toFixed(4)} ${coin.symbol}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Nilai Pasar Saat Ini:</span>
                    <span class="font-bold text-amber-400">${this.formatMoney(marketVal)}</span>
                  </div>
                  <div class="flex justify-between border-t border-slate-800/60 pt-1">
                    <span class="text-slate-400">Untung / Rugi (P&L):</span>
                    <span class="font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                      ${pnl >= 0 ? '+' : ''}${this.formatMoney(pnl)} (${pnlP >= 0 ? '+' : ''}${pnlP.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button onclick="game.sellCrypto('${coin.symbol}', 0.5)" class="btn-press flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold">
                    Jual 50%
                  </button>
                  <button onclick="game.sellCrypto('${coin.symbol}', 1.0)" class="btn-press flex-1 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold">
                    Jual 100%
                  </button>
                  <button onclick="game.openCryptoModal('${coin.symbol}')" class="btn-press flex-1 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center justify-center gap-1">
                    <span>Trading ⚡</span>
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }

    // 2. RENDER MARKET VIEW
    else {
      if (portView) portView.classList.add('hidden');
      if (mktView) mktView.classList.remove('hidden');

      if (mktCont) {
        let html = '';
        CRYPTO_CATALOG.forEach(coin => {
          const price = this.cryptoPrices[coin.symbol];
          const history = this.cryptoHistories[coin.symbol];
          const prevPrice = history && history.length >= 2 ? history[history.length - 2] : price;
          const changePercent = ((price - prevPrice) / prevPrice) * 100;
          const isUp = changePercent >= 0;

          const userHold = this.state.crypto[coin.symbol] || { amount: 0, totalCost: 0 };
          const holdValue = userHold.amount * price;
          const profitLoss = holdValue - userHold.totalCost;
          const sparklineSvg = this.generateSparkline(history, isUp ? '#00e676' : '#ff3366');

          html += `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800/80 mb-3 card-transition">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold" style="color: ${coin.color}">
                    ${coin.icon}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-white text-sm">${coin.name}</span>
                      <span class="text-xs text-slate-400 font-semibold">(${coin.symbol})</span>
                    </div>
                    <div class="text-xs text-slate-400 font-medium">Volatilitas Tinggi</div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="font-bold text-white text-sm">${this.formatMoney(price)}</div>
                  <div class="text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}">
                    ${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div class="my-2 h-7 w-full overflow-hidden flex items-center justify-center">
                ${sparklineSvg}
              </div>

              <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span class="text-slate-400">Saldo: </span>
                  <span class="font-bold text-white">${(userHold.amount > 0.00001 ? userHold.amount : 0).toFixed(4)} ${coin.symbol}</span>
                  ${userHold.amount > 0.00001 ? `
                    <div class="text-[11px] ${profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                      ${profitLoss >= 0 ? '+' : ''}${this.formatCompact(profitLoss)}
                    </div>
                  ` : ''}
                </div>

                <button onclick="game.openCryptoModal('${coin.symbol}')" class="btn-press px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs">
                  Beli / Jual ⚡
                </button>
              </div>
            </div>
          `;
        });
        mktCont.innerHTML = html;
      }
    }
  },

  renderCommodities() {
    const sec = document.getElementById('invest-commodity-sec');
    if (!sec) return;

    const commList = typeof COMMODITIES_CATALOG !== 'undefined' ? COMMODITIES_CATALOG : [];
    const positions = Array.isArray(this.state.commodityPositions) ? this.state.commodityPositions : [];

    // Calculate Position Stats
    let totalMargin = 0;
    let totalPnl = 0;
    positions.forEach(pos => {
      totalMargin += pos.margin;
      const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
      const priceChange = (curPrice - pos.entryPrice) / pos.entryPrice;
      const pnlRate = (pos.type === 'LONG' ? priceChange : -priceChange) * (pos.leverage || 1);
      totalPnl += Math.round(pos.margin * pnlRate);
    });

    const realizedProfit = (this.state.stats && this.state.stats.commodityTradingProfit) || 0;
    const pnlSign = totalPnl >= 0 ? '+' : '';
    const pnlColor = totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400';

    let html = `
      <!-- SUMMARY CARD TRADING KOMODITAS -->
      <div class="glass-panel p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div class="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div>
            <h3 class="font-black text-white text-sm flex items-center gap-1.5">
              <span>🛢️</span> Bursa Trading Komoditas Berjangka
            </h3>
            <p class="text-[11px] text-slate-400">Trading posisi LONG (Prediksi Naik) atau SHORT (Prediksi Turun) dengan leverage hingga 20x</p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
            ${positions.length} Kontrak Aktif
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Jaminan Terpasang</span>
            <span class="font-black text-white text-sm">${this.formatMoney(totalMargin)}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Floating PnL</span>
            <span class="font-black ${pnlColor} text-sm">${pnlSign}${this.formatMoney(totalPnl)}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Total Laba Terealisasi</span>
            <span class="font-black ${realizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} text-sm">
              ${realizedProfit >= 0 ? '+' : ''}${this.formatMoney(realizedProfit)}
            </span>
          </div>
        </div>
      </div>

      <!-- DAFTAR POSISI TERBUKA (OPEN POSITIONS) -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>📋</span> Posisi Kontrak Terbuka (${positions.length})
          </h4>
        </div>
    `;

    if (positions.length === 0) {
      html += `
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2">
          <div class="text-3xl">📭</div>
          <div class="font-bold text-slate-300 text-xs">Belum Ada Posisi Kontrak Terbuka</div>
          <div class="text-[11px] text-slate-500 max-w-xs mx-auto">
            Buka posisi LONG atau SHORT pada komoditas di bawah untuk mulai berspekulasi dan meraih keuntungan!
          </div>
        </div>
      `;
    } else {
      html += `<div class="space-y-2.5">`;
      positions.forEach(pos => {
        const comm = commList.find(c => c.symbol === pos.symbol) || { name: pos.symbol, icon: '📦', unit: 'unit' };
        const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
        const priceDiff = curPrice - pos.entryPrice;
        const priceDiffPct = (priceDiff / pos.entryPrice);
        const pnlRate = (pos.type === 'LONG' ? priceDiffPct : -priceDiffPct) * (pos.leverage || 1);
        const posPnl = Math.round(pos.margin * pnlRate);
        const posPnlSign = posPnl >= 0 ? '+' : '';
        const posPnlColor = posPnl >= 0 ? 'text-emerald-400' : 'text-rose-400';
        const isLong = pos.type === 'LONG';
        const posTotalVal = pos.margin * (pos.leverage || 1);

        html += `
          <div class="glass-panel p-3.5 rounded-2xl border ${isLong ? 'border-emerald-500/30' : 'border-rose-500/30'} bg-slate-950/60 shadow-md">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="text-lg">${comm.icon}</span>
                <div>
                  <div class="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <span>${comm.name}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${isLong ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
                      ${isLong ? '🟢 LONG' : '🔴 SHORT'}
                    </span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ${pos.leverage || 1}x
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400">Modal Jaminan: ${this.formatMoney(pos.margin)} (Nilai: ${this.formatCompact(posTotalVal)})</div>
                </div>
              </div>
              <button onclick="game.closeCommodityPosition('${pos.id}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold shadow-sm">
                Tutup Posisi
              </button>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-2 text-[11px]">
              <div>
                <span class="text-slate-500 block text-[10px]">Harga Masuk:</span>
                <span class="font-mono font-bold text-slate-300">${this.formatMoney(pos.entryPrice)}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Harga Saat Ini:</span>
                <span class="font-mono font-bold text-white">${this.formatMoney(curPrice)}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-500 block text-[10px]">Floating PnL:</span>
                <span class="font-mono font-black ${posPnlColor}">
                  ${posPnlSign}${this.formatMoney(posPnl)} (${posPnlSign}${(pnlRate * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `
      </div>

      <!-- KATALOG PASAR KOMODITAS -->
      <div class="pt-2">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>🌐</span> Pasar Komoditas Berjangka Global
          </h4>
          <span class="text-[10px] text-slate-400">Harga update live</span>
        </div>

        <div class="space-y-2.5">
    `;

    commList.forEach(comm => {
      const curPrice = (this.commodityPrices && this.commodityPrices[comm.symbol]) || comm.basePrice;
      const history = (this.commodityHistories && this.commodityHistories[comm.symbol]) || [comm.basePrice];
      const prevPrice = history.length > 1 ? history[0] : comm.basePrice;
      const changePct = ((curPrice - prevPrice) / prevPrice) * 100;
      const isUp = changePct >= 0;
      const changeColor = isUp ? 'text-emerald-400' : 'text-rose-400';
      const sparklineSvg = this.generateSparkline(history, isUp ? '#34d399' : '#f87171');

      html += `
        <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 shadow-md card-transition">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${comm.icon}</span>
              <div>
                <div class="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>${comm.name}</span>
                  <span class="font-mono text-[10px] text-slate-400">(${comm.symbol})</span>
                </div>
                <div class="text-[10px] text-slate-400">${comm.desc}</div>
              </div>
            </div>
            <div class="w-16 h-8 flex-shrink-0">
              ${sparklineSvg}
            </div>
          </div>

          <div class="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80">
            <div>
              <div class="font-black text-white text-sm">${this.formatMoney(curPrice)} <span class="text-[10px] font-normal text-slate-400">/ ${comm.unit}</span></div>
              <div class="text-[10px] font-bold ${changeColor}">
                ${isUp ? '▲ +' : '▼ '}${changePct.toFixed(2)}%
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button onclick="game.openCommodityModal('${comm.symbol}', 'LONG')" class="btn-press px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1 shadow-sm">
                <span>🟢</span> LONG
              </button>
              <button onclick="game.openCommodityModal('${comm.symbol}', 'SHORT')" class="btn-press px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1 shadow-sm">
                <span>🔴</span> SHORT
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    sec.innerHTML = html;
  },

  renderRealEstate() {
    const portView = document.getElementById('property-view-portfolio');
    const catView = document.getElementById('property-view-catalog');
    const portCont = document.getElementById('property-portfolio-container');
    const summaryCard = document.getElementById('property-summary-card');
    const catCont = document.getElementById('realestate-list-container');
    const countEl = document.getElementById('property-portfolio-count');
    const propBanner = document.getElementById('property-tax-banner');

    // 1. RENDER PORTFOLIO VIEW (Default View)
    if (this.propertyView === 'portfolio') {
      if (portView) portView.classList.remove('hidden');
      if (catView) catView.classList.add('hidden');

      // Render Tax Banner di Portofolio Properti
      if (propBanner && this.state.taxes) {
        const taxProp = this.state.taxes.property;
        if (taxProp && taxProp.suspended) {
          propBanner.className = 'mb-3.5 p-3.5 rounded-2xl bg-rose-500/10 border tax-suspended-glow border-rose-500 text-xs shadow-lg space-y-2';
          propBanner.innerHTML = `
            <div class="flex items-center justify-between text-rose-400 font-black">
              <span class="flex items-center gap-1.5">🚨 SEWA PROPERTI DIBEKUKAN OLEH KANTOR PAJAK (DJP)</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black">SANKSI DJP</span>
            </div>
            <p class="text-[11px] text-slate-300">
              Anda memiliki tunggakan pajak sewa properti sebesar <strong class="text-rose-400">${this.formatMoney(taxProp.unpaid)}</strong> yang telah melewati batas 1 jam dunia nyata. Seluruh pendapatan sewa dibekukan (Rp 0/jam) sampai pajak dilunasi!
            </p>
            <button onclick="game.payTax('property')" class="btn-press w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5">
              <span>💳 Lunasi Pajak Sewa Properti Sekarang (${this.formatMoney(taxProp.unpaid)})</span>
            </button>
          `;
          propBanner.classList.remove('hidden');
        } else if (taxProp && taxProp.unpaid > 0) {
          const remSec = Math.max(0, Math.ceil((taxProp.deadline - Date.now()) / 1000));
          const mins = Math.floor(remSec / 60);
          const secs = remSec % 60;
          propBanner.className = 'mb-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs shadow-md space-y-2';
          propBanner.innerHTML = `
            <div class="flex items-center justify-between text-amber-300 font-bold">
              <span class="flex items-center gap-1.5">⏳ Tagihan Pajak Sewa Properti Berjalan</span>
              <span class="font-mono text-amber-400 font-bold" data-tax-timer="${taxProp.deadline}">${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-300">Pajak Terhutang (5%): <strong class="text-amber-300">${this.formatMoney(taxProp.unpaid)}</strong></span>
              <button onclick="game.payTax('property')" class="btn-press px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                Bayar Pajak
              </button>
            </div>
          `;
          propBanner.classList.remove('hidden');
        } else {
          propBanner.className = 'hidden mb-3';
          propBanner.innerHTML = '';
        }
      }

      let totalUnits = 0;
      let totalGrossRent = 0;
      let totalMaintenance = 0;
      let totalValuation = 0;

      const isPropSuspended = this.state.taxes && this.state.taxes.property && this.state.taxes.property.suspended;

      const ownedProps = [];
      REAL_ESTATE_CATALOG.forEach(prop => {
        const pData = this.getPropertyData(prop.id);
        if (pData.count > 0) {
          let multiplier = 1.0;
          if (pData.furnished) multiplier += 0.25;
          if (pData.internet) multiplier += 0.15;
          const condMultiplier = Math.max(0.4, (pData.condition !== undefined ? pData.condition : 100) / 100);

          const gross = Math.round(prop.hourlyRent * multiplier * condMultiplier * pData.count);
          const maint = Math.round((prop.hourlyMaintenance || (prop.hourlyRent * 0.12)) * pData.count);
          const net = gross - maint;

          let unitVal = prop.price;
          if (pData.furnished) unitVal += prop.furnitureCost;
          if (pData.internet) unitVal += prop.internetCost;
          const val = unitVal * pData.count;

          totalUnits += pData.count;
          totalGrossRent += gross;
          totalMaintenance += maint;
          totalValuation += val;

          ownedProps.push({ prop, pData, gross, maint, net, val });
        }
      });

      if (countEl) countEl.innerText = `${totalUnits} Unit Dimiliki`;

      const totalNetRent = totalGrossRent - totalMaintenance;

      if (summaryCard) {
        summaryCard.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Valuasi Properti:</span>
              <div class="text-base font-black text-blue-400">${this.formatMoney(totalValuation)}</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400">Arus Bersih (Net Rent):</span>
              <div class="text-xs font-black ${isPropSuspended ? 'text-rose-400' : (totalNetRent >= 0 ? 'text-emerald-400' : 'text-rose-400')}">
                ${isPropSuspended ? 'Rp 0/jam (Disuspend DJP)' : `${totalNetRent >= 0 ? '+' : ''}${this.formatMoney(totalNetRent)}/jam`}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs pt-0.5">
            <div>
              <span class="text-slate-400 block text-[11px]">Sewa Kotor Diterima:</span>
              <span class="font-bold ${isPropSuspended ? 'text-slate-500' : 'text-emerald-400'}">${isPropSuspended ? 'Rp 0' : '+' + this.formatCompact(totalGrossRent)}/jam</span>
            </div>
            <div class="text-right">
              <span class="text-slate-400 block text-[11px]">Biaya Perawatan Rutin:</span>
              <span class="font-bold text-rose-400">-${this.formatCompact(totalMaintenance)}/jam</span>
            </div>
          </div>
        `;
      }

      if (portCont) {
        if (ownedProps.length === 0) {
          portCont.innerHTML = `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
              <div class="text-4xl">🏠</div>
              <h4 class="font-bold text-white text-sm">Belum Ada Properti di Portofolio</h4>
              <p class="text-xs text-slate-400">Miliki real estate dan apartemen mewah untuk disewakan, pasang tempat tidur dan internet untuk meningkatkan pendapatan sewa berkali lipat!</p>
              <button onclick="game.setPropertyView('catalog')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                + Beli Properti Baru di Katalog
              </button>
            </div>
          `;
        } else {
          portCont.innerHTML = ownedProps.map(({ prop, pData, gross, maint, net, val }) => {
            const cond = pData.condition !== undefined ? pData.condition : 100;
            const condPercent = Math.round(cond);
            const furnCost = prop.furnitureCost * pData.count;
            const netCost = prop.internetCost * pData.count;
            const serviceCost = Math.round(prop.price * 0.03 * pData.count * ((100 - cond) / 100)) + 500000;

            return `
              <div class="glass-panel rounded-2xl border ${isPropSuspended ? 'tax-suspended-glow border-rose-500/80 bg-rose-950/10' : 'border-blue-500/30'} overflow-hidden mb-3.5 card-transition shadow-lg">
                <div class="relative h-32 w-full bg-slate-800 overflow-hidden">
                  <img src="${prop.image}" alt="${prop.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.style.display='none'">
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  
                  <div class="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-slate-300">
                    <span>${prop.icon}</span>
                    <span>📍 ${prop.location}</span>
                  </div>

                  <div class="absolute top-2 right-2">
                    ${isPropSuspended ? `
                      <span class="text-xs px-2.5 py-1 rounded-full bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20 text-[11px] tax-warning-pulse">
                        ⚠️ Dibekukan DJP
                      </span>
                    ` : `
                      <span class="text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 text-[11px]">
                        ✓ Milik Anda (1 Unit)
                      </span>
                    `}
                  </div>

                  <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h4 class="font-extrabold text-white text-base leading-tight drop-shadow-md">${prop.name}</h4>
                      <div class="text-[11px] text-slate-300 font-medium">Valuasi: ${this.formatCompact(val)}</div>
                    </div>
                    <span class="text-xs font-black ${isPropSuspended ? 'text-rose-400 border-rose-500/50' : (net >= 0 ? 'text-emerald-400 border-slate-800' : 'text-rose-400 border-slate-800')} bg-slate-950/90 px-2 py-0.5 rounded-lg border">
                      ${isPropSuspended ? 'Rp 0/jam (Disuspend)' : `${net >= 0 ? '+' : ''}${this.formatCompact(net)}/jam`}
                    </span>
                  </div>
                </div>

                <div class="p-3.5 space-y-3">
                  <!-- Breakdown Sewa & Biaya Perawatan -->
                  <div class="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span class="text-slate-400 text-[11px] block">Sewa Kotor:</span>
                      <span class="font-bold text-emerald-400">+${this.formatCompact(gross)}/jam</span>
                    </div>
                    <div class="text-right">
                      <span class="text-slate-400 text-[11px] block">Biaya Perawatan:</span>
                      <span class="font-bold text-rose-400">-${this.formatCompact(maint)}/jam</span>
                    </div>
                  </div>

                  <!-- Kondisi Properti & Servis -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-slate-400">Kondisi Fisik Properti:</span>
                      <span class="font-bold ${condPercent > 70 ? 'text-emerald-400' : (condPercent > 40 ? 'text-amber-400' : 'text-rose-400')}">
                        ${condPercent}% ${condPercent === 100 ? 'Prima' : (condPercent > 70 ? 'Baik' : 'Butuh Renovasi')}
                      </span>
                    </div>
                    <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div class="h-full ${condPercent > 70 ? 'bg-emerald-400' : (condPercent > 40 ? 'bg-amber-400' : 'bg-rose-500')} transition-all" style="width: ${condPercent}%"></div>
                    </div>
                  </div>

                  <!-- Upgrade Fasilitas: Furnitur & Internet -->
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    ${pData.furnished ? `
                      <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                        <span class="text-xs text-emerald-400 font-bold block">✓ Tempat Tidur</span>
                        <span class="text-[10px] text-slate-400">+25% Sewa</span>
                      </div>
                    ` : `
                      <button onclick="game.buyPropertyFurniture('${prop.id}')" class="btn-press p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center">
                        <span class="text-xs font-bold block">+ Tempat Tidur</span>
                        <span class="text-[10px] text-emerald-400 font-semibold">${this.formatCompact(furnCost)}</span>
                      </button>
                    `}

                    ${pData.internet ? `
                      <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                        <span class="text-xs text-emerald-400 font-bold block">✓ Internet Cepat</span>
                        <span class="text-[10px] text-slate-400">+15% Sewa</span>
                      </div>
                    ` : `
                      <button onclick="game.buyPropertyInternet('${prop.id}')" class="btn-press p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center">
                        <span class="text-xs font-bold block">+ Pasang Internet</span>
                        <span class="text-[10px] text-emerald-400 font-semibold">${this.formatCompact(netCost)}</span>
                      </button>
                    `}
                  </div>

                  <!-- Action Buttons: Servis & Jual -->
                  <div class="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <button onclick="game.serviceProperty('${prop.id}')" class="btn-press flex-1 py-1.5 rounded-xl ${condPercent < 100 ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40' : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'} text-xs font-bold">
                      🔧 Servis Perbaikan (${this.formatCompact(serviceCost)})
                    </button>
                    <button onclick="game.sellProperty('${prop.id}')" class="btn-press px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold">
                      Jual Properti (${this.formatCompact(Math.round(prop.price * 0.9))})
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }

    // 2. RENDER CATALOG VIEW
    else {
      if (portView) portView.classList.add('hidden');
      if (catView) catView.classList.remove('hidden');

      if (catCont) {
        // Ambil hanya properti yang belum dimiliki (count === 0), properti yang sudah dibeli langsung dihilangkan dari katalog
        const unownedProps = REAL_ESTATE_CATALOG.filter(prop => {
          const pData = this.getPropertyData(prop.id);
          return (pData.count || 0) === 0;
        });

        const totalUnownedAll = unownedProps.length;
        const totalUnownedDom = unownedProps.filter(p => p.group === 'domestik').length;
        const totalUnownedGlob = unownedProps.filter(p => p.group === 'global').length;

        const filtered = unownedProps.filter(prop => {
          if (this.realEstateFilter === 'domestik') return prop.group === 'domestik';
          if (this.realEstateFilter === 'global') return prop.group === 'global';
          return true;
        });

        let html = `
          <div class="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            <button onclick="game.setRealEstateFilter('all')" class="px-3 py-1 rounded-xl text-xs font-bold transition ${this.realEstateFilter === 'all' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
              Semua (${totalUnownedAll})
            </button>
            <button onclick="game.setRealEstateFilter('domestik')" class="px-3 py-1 rounded-xl text-xs font-bold transition ${this.realEstateFilter === 'domestik' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
              🇮🇩 Domestik (${totalUnownedDom})
            </button>
            <button onclick="game.setRealEstateFilter('global')" class="px-3 py-1 rounded-xl text-xs font-bold transition ${this.realEstateFilter === 'global' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
              🌍 Internasional (${totalUnownedGlob})
            </button>
          </div>
        `;

        if (filtered.length === 0) {
          html += `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
              <div class="text-4xl">🏆</div>
              <h4 class="font-bold text-white text-sm">Semua Properti Telah Terjual!</h4>
              <p class="text-xs text-slate-400">Seluruh unit properti pada kategori ini telah Anda miliki. Cek dan kelola properti Anda di portofolio!</p>
              <button onclick="game.setPropertyView('portfolio')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                ← Kembali ke Portofolio Properti
              </button>
            </div>
          `;
        } else {
          filtered.forEach(prop => {
            const canAfford = this.state.cash >= prop.price;

            html += `
              <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden mb-3.5 card-transition shadow-lg">
                <div class="relative h-32 w-full bg-slate-800 overflow-hidden">
                  <img src="${prop.image}" alt="${prop.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.style.display='none'">
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
                  
                  <div class="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-slate-300">
                    <span>${prop.icon}</span>
                    <span>📍 ${prop.location}</span>
                  </div>

                  <div class="absolute top-2 right-2">
                    <span class="text-xs px-2.5 py-1 rounded-full bg-slate-900/80 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                      Tersedia 1 Unit Eksklusif
                    </span>
                  </div>

                  <div class="absolute bottom-2 left-3 right-3">
                    <h4 class="font-extrabold text-white text-base leading-tight drop-shadow-md">${prop.name}</h4>
                  </div>
                </div>

                <div class="p-3 pt-2">
                  <div class="grid grid-cols-2 gap-2 text-xs mb-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div>
                      <span class="text-slate-400 text-[10px] block">Sewa Kotor Dasar:</span>
                      <span class="font-bold text-emerald-400">+${this.formatCompact(prop.hourlyRent)}/jam</span>
                    </div>
                    <div class="text-right">
                      <span class="text-slate-400 text-[10px] block">Biaya Perawatan:</span>
                      <span class="font-bold text-rose-400">-${this.formatCompact(prop.hourlyMaintenance || (prop.hourlyRent * 0.12))}/jam</span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs mb-2.5">
                    <span class="text-slate-400 text-[11px]">Harga Properti:</span>
                    <span class="font-black text-white text-sm">${this.formatMoney(prop.price)}</span>
                  </div>

                  <button onclick="game.buyProperty('${prop.id}')" class="btn-press w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                    canAfford
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-emerald-500/20'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }">
                    <span>Beli Properti Ini</span>
                    <span class="opacity-80">(${this.formatCompact(prop.price)})</span>
                  </button>
                </div>
              </div>
            `;
          });
        }

        catCont.innerHTML = html;
      }
    }
  },

  renderLuxury() {
    const ownedContainer = document.getElementById('luxury-owned-container');
    const catalogContainer = document.getElementById('luxury-catalog-container');
    const summaryCard = document.getElementById('luxury-summary-card');
    const countBadge = document.getElementById('luxury-owned-count');

    // Filter categories buttons helper
    const renderFilterButtons = (currentFilter, isCatalog = false) => `
      <div class="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1.5">
        <button onclick="game.setLuxuryFilter('all')" class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentFilter === 'all' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
          Semua
        </button>
        <button onclick="game.setLuxuryFilter('moto')" class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentFilter === 'moto' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
          🛵 Motor
        </button>
        <button onclick="game.setLuxuryFilter('car')" class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentFilter === 'car' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
          🚗 Mobil
        </button>
        <button onclick="game.setLuxuryFilter('watch')" class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentFilter === 'watch' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
          ⌚ Jam Tangan
        </button>
        <button onclick="game.setLuxuryFilter('mansion')" class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentFilter === 'mansion' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
          🏰 Mansion
        </button>
        <button onclick="game.setLuxuryFilter('flight')" class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentFilter === 'flight' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
          ✈️ Jet & Heli
        </button>
        <button onclick="game.setLuxuryFilter('yacht')" class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentFilter === 'yacht' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
          🛥️ Yacht
        </button>
        <button onclick="game.setLuxuryFilter('island')" class="px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${currentFilter === 'island' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
          🏝️ Pulau Pribadi
        </button>
      </div>
    `;

    // 1. Calculate Owned Totals
    let totalValuation = 0;
    let totalPrestige = 0;
    const ownedItems = [];
    (this.state.luxury || []).forEach(id => {
      const item = LUXURY_CATALOG.find(x => x.id === id);
      if (item) {
        totalValuation += item.price;
        totalPrestige += item.prestige;
        ownedItems.push(item);
      }
    });

    if (countBadge) {
      countBadge.innerText = `${ownedItems.length} Aset Dimiliki`;
    }

    if (summaryCard) {
      summaryCard.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Total Valuasi Koleksi</div>
            <div class="text-lg font-black text-white">${this.formatMoney(totalValuation)}</div>
          </div>
          <div class="text-right">
            <div class="text-[11px] text-amber-400 font-bold">Poin Prestise</div>
            <div class="text-base font-black text-amber-300">⭐ +${totalPrestige.toLocaleString()}</div>
          </div>
        </div>
      `;
    }

    // 2. Render Owned View
    if (ownedContainer) {
      const filteredOwned = ownedItems.filter(lux => {
        if (this.luxuryFilter === 'all') return true;
        return lux.type === this.luxuryFilter;
      });

      let ownedHtml = renderFilterButtons(this.luxuryFilter, false);

      if (ownedItems.length === 0) {
        ownedHtml += `
          <div class="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
            <div class="text-4xl">🏎️</div>
            <h3 class="font-bold text-white text-sm">Garasi & Brankas Kemewahan Masih Kosong</h3>
            <p class="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Anda belum mengoleksi motor, supercar, jam tangan mewah, ataupun mansion pribadi. Buka showroom untuk mulai berbelanja aset prestisius!
            </p>
            <button onclick="game.setLuxuryView('catalog')" class="btn-press px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20">
              🛒 Buka Showroom Kemewahan
            </button>
          </div>
        `;
      } else if (filteredOwned.length === 0) {
        ownedHtml += `
          <div class="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <div class="text-slate-400 text-xs">Tidak ada aset dalam kategori ini di koleksi Anda.</div>
            <button onclick="game.setLuxuryView('catalog')" class="btn-press px-3.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 text-xs font-bold">
              + Cari di Showroom
            </button>
          </div>
        `;
      } else {
        filteredOwned.forEach(lux => {
          const sellVal = Math.round(lux.price * 0.75);
          ownedHtml += `
            <div class="glass-panel rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-transparent overflow-hidden mb-3.5 shadow-lg card-transition">
              <div class="relative h-36 w-full bg-slate-800 overflow-hidden">
                <img src="${lux.image}" alt="${lux.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                
                <div class="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-[11px] font-bold text-amber-300">
                  <span>⭐</span>
                  <span>+${lux.prestige.toLocaleString()} Prestise</span>
                </div>

                <div class="absolute top-2 right-2">
                  <span class="w-8 h-8 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-sm shadow">
                    ${lux.icon}
                  </span>
                </div>

                <div class="absolute bottom-2 left-3 right-3">
                  <div class="text-[11px] text-amber-300 font-semibold uppercase">${lux.category}</div>
                  <h4 class="font-black text-white text-base leading-tight drop-shadow-md">${lux.name}</h4>
                </div>
              </div>

              <div class="p-3 pt-2.5 flex items-center justify-between gap-3">
                <div>
                  <div class="text-[11px] text-slate-400">Nilai Perolehan</div>
                  <div class="font-extrabold text-white text-sm">${this.formatMoney(lux.price)}</div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    ✓ Dimiliki
                  </span>
                  <button onclick="game.sellLuxury('${lux.id}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold" title="Jual kembali seharga 75% nilai perolehan">
                    Jual (${this.formatCompact(sellVal)})
                  </button>
                </div>
              </div>
            </div>
          `;
        });
      }
      ownedContainer.innerHTML = ownedHtml;
    }

    // 3. Render Catalog View
    if (catalogContainer) {
      const filteredCatalog = LUXURY_CATALOG.filter(lux => {
        if (this.luxuryFilter === 'all') return true;
        return lux.type === this.luxuryFilter;
      });

      let catalogHtml = renderFilterButtons(this.luxuryFilter, true);

      filteredCatalog.forEach(lux => {
        const isOwned = this.state.luxury.includes(lux.id);
        const canAfford = this.state.cash >= lux.price;

        catalogHtml += `
          <div class="glass-panel rounded-2xl border ${isOwned ? 'border-amber-400/40 bg-gradient-to-b from-amber-500/5 to-transparent' : 'border-slate-800'} overflow-hidden mb-3.5 shadow-lg card-transition">
            <div class="relative h-36 w-full bg-slate-800 overflow-hidden">
              <img src="${lux.image}" alt="${lux.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              
              <div class="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-[11px] font-bold text-amber-300">
                <span>⭐</span>
                <span>+${lux.prestige.toLocaleString()} Prestise</span>
              </div>

              <div class="absolute top-2 right-2">
                <span class="w-8 h-8 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-sm shadow">
                  ${lux.icon}
                </span>
              </div>

              <div class="absolute bottom-2 left-3 right-3">
                <div class="text-[11px] text-amber-300 font-semibold uppercase">${lux.category}</div>
                <h4 class="font-black text-white text-base leading-tight drop-shadow-md">${lux.name}</h4>
              </div>
            </div>

            <div class="p-3 pt-2.5 flex items-center justify-between gap-3">
              <div>
                <div class="text-[11px] text-slate-400">Harga Beli Baru</div>
                <div class="font-extrabold text-white text-sm">${this.formatMoney(lux.price)}</div>
              </div>

              <div>
                ${isOwned ? `
                  <span class="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 shadow-sm">
                    <span>✓</span> Sudah Dikoleksi
                  </span>
                ` : `
                  <button onclick="game.buyLuxury('${lux.id}')" class="btn-press px-4 py-2 rounded-xl text-xs font-black transition ${
                    canAfford
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }">
                    Beli (${this.formatCompact(lux.price)})
                  </button>
                `}
              </div>
            </div>
          </div>
        `;
      });
      catalogContainer.innerHTML = catalogHtml;
    }
  },

  renderStatsAndSettings() {
    const nw = this.calculateNetWorth();
    const rank = this.getCurrentRank();
    const hourly = this.calculateHourlyIncome();

    // Rincian Arus Kas Bersih per Jam
    const { rawBiz, rawStocks, rawProp } = this.getSectorRevenueBreakdown();
    const threshold = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.MANDATORY_THRESHOLD) || 25000000;
    const rate = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.RATE) || 0.05;

    let bizHourly = 0;
    if (!this.state.taxes?.business?.suspended) {
      bizHourly = rawBiz < threshold ? Math.round(rawBiz * (1 - rate)) : rawBiz;
    }
    let stocksHourly = 0;
    if (!this.state.taxes?.stocks?.suspended) {
      stocksHourly = rawStocks < threshold ? Math.round(rawStocks * (1 - rate)) : rawStocks;
    }
    let propHourly = 0;
    if (!this.state.taxes?.property?.suspended) {
      propHourly = rawProp < threshold ? Math.round(rawProp * (1 - rate)) : rawProp;
    }

    const stats = this.state.stats || {
      stockTradingProfit: 0,
      cryptoTradingProfit: 0,
      commodityTradingProfit: 0,
      dividendsEarned: 0,
      businessEarnings: 0,
      rentalEarnings: 0
    };

    const stockProfit = stats.stockTradingProfit || 0;
    const cryptoProfit = stats.cryptoTradingProfit || 0;
    const commodityProfit = stats.commodityTradingProfit || 0;
    const stockProfitClass = stockProfit > 0 ? 'text-emerald-400' : (stockProfit < 0 ? 'text-rose-400' : 'text-slate-400');
    const cryptoProfitClass = cryptoProfit > 0 ? 'text-emerald-400' : (cryptoProfit < 0 ? 'text-rose-400' : 'text-slate-400');
    const commodityProfitClass = commodityProfit > 0 ? 'text-emerald-400' : (commodityProfit < 0 ? 'text-rose-400' : 'text-slate-400');

    // Total Pajak yang dibayar
    let totalTaxPaid = 0;
    let anySuspended = false;
    if (this.state.taxes) {
      ['business', 'property', 'stocks'].forEach(sec => {
        const t = this.state.taxes[sec];
        if (t) {
          totalTaxPaid += (t.totalPaidLifetime || 0) + (t.totalAutoPaidLifetime || 0);
          if (t.suspended) anySuspended = true;
        }
      });
    }

    const totalPlayHours = Math.max(0, this.state.gameHours || 0);
    const playDays = Math.floor(totalPlayHours / 24);
    const playHours = Math.floor(totalPlayHours % 24);
    const playMins = Math.floor((totalPlayHours * 60) % 60);
    const leadTimeText = playDays > 0 
      ? `${playDays}h ${playHours}j ${playMins}m` 
      : (playHours > 0 ? `${playHours} Jam ${playMins} Menit` : `${playMins} Menit`);

    const statsContainer = document.getElementById('stats-summary-card');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="space-y-3 text-xs">
          
          <!-- 1. KARTU PROFIL UTAMA -->
          <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span class="text-slate-400 block text-[11px]">Gelar Konglomerat</span>
                <span class="text-base font-black text-white flex items-center gap-1.5 mt-0.5">${rank.badge} ${rank.title}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-400 block text-[11px]">Waktu Memimpin</span>
                <span class="text-xs font-bold text-slate-300 font-mono">${leadTimeText}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400 block text-[11px]">Total Kekayaan Bersih:</span>
                <span class="font-extrabold text-emerald-400 text-sm">${this.formatCompact(nw)}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400 block text-[11px]">Kas Tunai Likuid:</span>
                <span class="font-bold text-white text-sm">${this.formatCompact(this.state.cash)}</span>
              </div>
            </div>
          </div>

          <!-- 2. KARTU RINCIAN TERPISAH: SUMBER PENDAPATAN & KEUNTUNGAN -->
          <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 class="text-xs uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-1.5">
                <span>💰</span> Rincian Keuntungan & Pendapatan
              </h3>
              <span class="text-[10px] text-slate-400 font-semibold">Sepanjang Masa</span>
            </div>

            <div class="space-y-2">
              <!-- A. Pendapatan dari Bisnis -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-base">
                    🏢
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Pendapatan dari Bisnis</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Arus Kas:</span>
                      <span class="${bizHourly > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}">+${this.formatCompact(bizHourly)}/jam</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold text-emerald-400">${this.formatMoney(stats.businessEarnings || 0)}</div>
                  <span class="text-[10px] text-slate-500">${(this.state.businesses || []).length} unit usaha</span>
                </div>
              </div>

              <!-- B. Pendapatan dari Sewa Properti -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-base">
                    🏠
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Pendapatan Sewa Properti</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Arus Kas:</span>
                      <span class="${propHourly > 0 ? 'text-blue-400 font-semibold' : 'text-slate-500'}">+${this.formatCompact(propHourly)}/jam</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold text-blue-400">${this.formatMoney(stats.rentalEarnings || 0)}</div>
                  <span class="text-[10px] text-slate-500">Real estate sewa</span>
                </div>
              </div>

              <!-- C. Pendapatan Dividen Saham -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-base">
                    📊
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Pendapatan Dividen Saham</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Arus Kas:</span>
                      <span class="${stocksHourly > 0 ? 'text-teal-400 font-semibold' : 'text-slate-500'}">+${this.formatCompact(stocksHourly)}/jam</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold text-teal-400">${this.formatMoney(stats.dividendsEarned || 0)}</div>
                  <span class="text-[10px] text-slate-500">Bagi hasil emiten</span>
                </div>
              </div>

              <!-- D. Keuntungan Trading Saham (Capital Gain) -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-base">
                    📈
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Keuntungan Trading Saham</div>
                    <div class="text-[10px] text-slate-400">Capital Gain Realized</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold ${stockProfitClass}">${this.formatMoney(stockProfit)}</div>
                  <span class="text-[10px] text-slate-500">Jual-beli bursa saham</span>
                </div>
              </div>

              <!-- E. Keuntungan Trading Kripto (Capital Gain) -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-base">
                    🪙
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Keuntungan Trading Kripto</div>
                    <div class="text-[10px] text-slate-400">Capital Gain Realized</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold ${cryptoProfitClass}">${this.formatMoney(cryptoProfit)}</div>
                  <span class="text-[10px] text-slate-500">Jual-beli pasar kripto</span>
                </div>
              </div>

              <!-- F. Keuntungan Trading Komoditas (Long / Short) -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-base">
                    🛢️
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Keuntungan Trading Komoditas</div>
                    <div class="text-[10px] text-slate-400">Kontrak Derivatif Long/Short</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold ${commodityProfitClass}">${this.formatMoney(commodityProfit)}</div>
                  <span class="text-[10px] text-slate-500">Bursa Komoditas Berjangka</span>
                </div>
              </div>
            </div>

            <!-- Total Penghasilan Bersih Sepanjang Masa -->
            <div class="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span class="text-slate-400">Total Penghasilan Sepanjang Masa:</span>
              <span class="font-black text-amber-300 text-sm">${this.formatMoney(this.state.totalEarnedLifetime)}</span>
            </div>
          </div>

          <!-- 3. KARTU KEPATUHAN PAJAK (DJP) -->
          <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Total Pajak Disetor ke Negara:</span>
              <span class="font-bold text-slate-200">${this.formatMoney(totalTaxPaid)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Status Kepatuhan Pajak:</span>
              <span class="font-bold ${anySuspended ? 'text-rose-400' : 'text-emerald-400'}">
                ${anySuspended ? '🚨 Ada Sanksi Suspensi' : '✅ Tertib Bebas Sanksi'}
              </span>
            </div>
          </div>

        </div>
      `;
    }
  }
});

// --- END js/modules/ui.js ---

// --- BEGIN js/app.js ---
// Business Empire: RichMan - Application Entry Point

// Global Engine Instance
window.game = new GameEngine();

// Auto-initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game.init();
});

// --- END js/app.js ---