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
